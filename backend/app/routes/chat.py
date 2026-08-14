import logging
import re
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.database import supabase
from app.services.ai import ai_service
from app.services.parser import parser_service
from app.services.rag import rag_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/repositories",
)


# ---------------------------------------------------------
# Off-topic / chatter filter  (defence-in-depth)
# ---------------------------------------------------------
# Mirrors the frontend CHATTER_PHRASES set so that obviously
# non-repository questions are rejected before any embedding
# or LLM call is made, even if the client skips its own filter.

_CHATTER_PHRASES: frozenset[str] = frozenset({
    # greetings
    "hi", "hello", "hey", "hii", "heyy", "yo", "sup", "hiya",
    "howdy", "hola", "namaste", "bonjour", "hey there",
    "hello there", "hi there", "good morning", "good afternoon",
    "good evening", "greetings",
    # gratitude
    "thanks", "thank you", "ty", "thx", "thanks a lot",
    "thanks so much", "thanks a bunch", "thank you so much",
    "you're welcome", "your welcome", "no problem", "no worries",
    # filler
    "sure", "ok", "okay", "cool", "nice", "wow", "great",
    "awesome", "amazing", "lol", "omg", "nice to meet you",
    # farewells
    "bye", "goodbye", "good night", "see you", "see you later",
    "see ya", "catch you later", "talk to you later", "talk later",
    # generic help (no repo context)
    "help", "help me", "can you help me", "can you help",
    "i need help", "help please", "please help",
    # small talk
    "how are you", "how's it going", "hows it going",
    "how do you do", "whats up", "what's up", "wassup", "watsup",
    "what are you doing", "how was your day", "how is your day",
    "long time no see",
    # creative / off-topic requests
    "joke", "tell me a joke", "tell a joke", "story",
    "tell me a story", "tell a story", "poem", "tell me a poem",
    "write me a poem", "write a poem", "write a song",
    "write me a song", "sing a song", "sing me a song",
    # trivia / world knowledge
    "weather", "what is the weather", "whats the weather",
    "what's the weather", "how is the weather", "what time is it",
    "whats the time", "what's the time", "what is the date today",
    "what day is it today", "what is the capital of france",
    "who is the president",
    # identity
    "what is your name", "what's your name", "whats your name",
    "who are you", "what are you", "what can you do",
    "what do you do", "are you human", "are you real",
    "are you ai", "are you an ai", "are you a robot",
    "are you a bot", "do you have feelings", "do you have a name",
    "where are you from", "where do you live", "how old are you",
    "who made you", "who created you", "who is your creator",
    "what is the meaning of life", "meaning of life",
    "why do you exist", "tell me about yourself",
    "introduce yourself",
    # noise
    "test", "testing", "random", "whatever", "nevermind",
    "never mind", "skip", "stop", "thats all", "that's all",
    "no", "yes",
})

_OFFTOPIC_RESPONSE = (
    "I can only answer questions related to this repository. "
    "Please ask about its code, structure, or features."
)


def _normalize_question(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace."""
    return re.sub(r"[^a-z0-9\s]", " ", text.lower()).strip()


def _is_offtopic_question(text: str) -> bool:
    """Returns True if the question matches a known chatter phrase."""
    return _normalize_question(text) in _CHATTER_PHRASES


# ---------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------


class ChatRequest(BaseModel):
    question: str
    session_id: str | None = None


class SourceRef(BaseModel):
    file_path: str
    symbol: str | None = None
    start_line: int | None = None
    end_line: int | None = None


class ChatResponse(BaseModel):
    repository_id: str
    session_id: str
    question: str
    answer: str
    sources: list[SourceRef] = []


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------


def _repository_context(repo: dict) -> str:
    """
    Builds a small grounded summary of the repository (name, owner,
    default branch, primary language, and on-disk file/line statistics)
    so the assistant can answer repository-level questions even when
    vector search returns no code context.
    """

    lines = [
        f"Repository name: {repo.get('repo_name') or 'unknown'}"
    ]

    if repo.get("owner"):
        lines.append(f"Owner: {repo['owner']}")

    if repo.get("default_branch"):
        lines.append(f"Default branch: {repo['default_branch']}")

    if repo.get("language"):
        lines.append(f"Primary language: {repo['language']}")

    repo_path = (
        settings.REPOS_DIR
        / f"{repo.get('owner') or '_'}_{repo.get('repo_name') or ''}"
    )

    try:

        if repo_path.exists():

            statistics = parser_service.repository_statistics(repo_path)

            lines.append(
                f"Files: {statistics.get('files') or 0}. "
                f"Lines of code: {statistics.get('lines') or 0}."
            )

            languages = statistics.get("languages") or {}

            if languages:

                ranking = sorted(
                    languages,
                    key=languages.get,
                    reverse=True,
                )[:10]

                lines.append(
                    "Languages: "
                    + ", ".join(
                        f"{name} ({languages[name]})"
                        for name in ranking
                    )
                    + "."
                )

    except Exception:

        logger.exception(
            "Failed to build repository statistics for metadata context.",
        )

    return "\n".join(lines)


def _load_history(
    session_id: str,
) -> list[dict[str, str]]:
    """
    Fetches the last N chat messages for a session, ordered
    chronologically, and returns them as role/content dicts
    suitable for the groq messages array.

    Applies MAX_HISTORY_CHARS to truncate oldest turns first.
    """

    response = (
        supabase.table("chat_messages")
        .select("role, content")
        .eq("session_id", session_id)
        .order("created_at", desc=True)
        .limit(settings.CHAT_HISTORY_TURNS)
        .execute()
    )

    if not response.data:
        return []

    # DB returns newest-first; reverse for chronological order.
    rows = list(reversed(response.data))

    # Enforce char budget, dropping oldest turns first.
    trimmed: list[dict[str, str]] = []
    total = 0

    for row in reversed(rows):
        entry_len = len(row["content"])
        if total + entry_len > settings.MAX_HISTORY_CHARS:
            break
        trimmed.append({"role": row["role"], "content": row["content"]})
        total += entry_len

    # trimmed was built newest-first; reverse to chronological.
    trimmed.reverse()

    return trimmed


def _persist_message(
    repository_id: str,
    session_id: str,
    role: str,
    content: str,
) -> None:
    """Inserts a single chat message into the chat_messages table."""

    try:

        supabase.table("chat_messages").insert(
            {
                "repository_id": repository_id,
                "session_id": session_id,
                "role": role,
                "content": content,
            }
        ).execute()

    except Exception:

        logger.exception(
            "Failed to persist %s message for session %s.",
            role,
            session_id,
        )


# ---------------------------------------------------------
# Route
# ---------------------------------------------------------


@router.post("/{repository_id}/chat", response_model=ChatResponse)
async def repository_chat(
    repository_id: str,
    request: ChatRequest,
):
    """
    Repository-aware AI chat using RAG with multi-turn
    conversation support.
    """

    repository = (
        supabase.table("repositories")
        .select("*")
        .eq("id", repository_id)
        .single()
        .execute()
    )

    if repository.data is None:
        raise HTTPException(
            status_code=404,
            detail="Repository not found.",
        )

    # Session management: reuse or create.
    session_id = request.session_id or str(uuid4())

    # ── Off-topic short-circuit ────────────────────────────
    if _is_offtopic_question(request.question):

        _persist_message(
            repository_id, session_id, "user", request.question,
        )
        _persist_message(
            repository_id, session_id, "assistant", _OFFTOPIC_RESPONSE,
        )

        return ChatResponse(
            repository_id=repository_id,
            session_id=session_id,
            question=request.question,
            answer=_OFFTOPIC_RESPONSE,
            sources=[],
        )

    # ── Load conversation history ──────────────────────────
    history = _load_history(session_id)

    # ── Rewrite query for better retrieval on follow-ups ───
    standalone_query: str | None = None

    if history:
        # Find the last user message in history for context.
        last_user_msg = None

        for msg in reversed(history):
            if msg["role"] == "user":
                last_user_msg = msg["content"]
                break

        if last_user_msg:
            standalone_query = ai_service.rewrite_query(
                previous_user_message=last_user_msg,
                new_question=request.question,
            )

    # ── RAG retrieval ──────────────────────────────────────
    context_parts: list[str] = []
    sources: list[SourceRef] = []

    try:

        chunks = rag_service.retrieve(
            repository_id,
            request.question,
            standalone_query=standalone_query,
        )

        rag_context, used_chunks = rag_service.build_context(chunks)

    except Exception:

        logger.exception(
            "RAG retrieval failed for repository %s.",
            repository_id,
        )

        rag_context = ""
        used_chunks = []

    if rag_context.strip():
        context_parts.append(rag_context)

    # Extract structured source references from used chunks.
    if used_chunks:
        raw_sources = rag_service.extract_sources(used_chunks)
        sources = [SourceRef(**s) for s in raw_sources]

    metadata_context = _repository_context(repository.data)

    if metadata_context.strip():
        context_parts.append(metadata_context)

    combined_context = "\n\n".join(context_parts)

    if not combined_context.strip():

        # Persist the user question even when we short-circuit.
        _persist_message(
            repository_id, session_id, "user", request.question,
        )

        no_info_answer = (
            "I couldn't find relevant information in this repository "
            "to answer that. Try asking about a specific file, module, "
            "or feature."
        )

        _persist_message(
            repository_id, session_id, "assistant", no_info_answer,
        )

        return ChatResponse(
            repository_id=repository_id,
            session_id=session_id,
            question=request.question,
            answer=no_info_answer,
            sources=[],
        )

    # ── LLM call ───────────────────────────────────────────

    try:

        answer = ai_service.chat(
            question=request.question,
            context=combined_context,
            history=history if history else None,
        )

    except Exception:

        logger.exception(
            "LLM chat failed for repository %s.",
            repository_id,
        )

        return ChatResponse(
            repository_id=repository_id,
            session_id=session_id,
            question=request.question,
            answer=(
                "I'm having trouble reaching the language model right now. "
                "Please try again."
            ),
            sources=[],
        )

    # ── Persist both turns ─────────────────────────────────
    _persist_message(
        repository_id, session_id, "user", request.question,
    )
    _persist_message(
        repository_id, session_id, "assistant", answer,
    )

    return ChatResponse(
        repository_id=repository_id,
        session_id=session_id,
        question=request.question,
        answer=answer,
        sources=sources,
    )