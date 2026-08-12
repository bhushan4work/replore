import logging

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

class ChatRequest(BaseModel):
    question: str


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


@router.post("/{repository_id}/chat")
async def repository_chat(
    repository_id: str,
    request: ChatRequest,
):
    """
    Repository-aware AI chat using RAG.
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

    context_parts: list[str] = []

    try:

        chunks = rag_service.retrieve(
            repository_id,
            request.question,
        )

        rag_context = rag_service.build_context(chunks)

    except Exception:

        logger.exception(
            "RAG retrieval failed for repository %s.",
            repository_id,
        )

        rag_context = ""

    if rag_context.strip():
        context_parts.append(rag_context)

    metadata_context = _repository_context(repository.data)

    if metadata_context.strip():
        context_parts.append(metadata_context)

    combined_context = "\n\n".join(context_parts)

    if not combined_context.strip():

        return {
            "repository_id": repository_id,
            "question": request.question,
            "answer": (
                "I couldn't find relevant information in this repository "
                "to answer that. Try asking about a specific file, module, "
                "or feature."
            ),
        }

    try:

        answer = ai_service.chat(
            question=request.question,
            context=combined_context,
        )

    except Exception as exc:

        logger.exception(
            "LLM chat failed for repository %s.",
            repository_id,
        )

        return {
            "repository_id": repository_id,
            "question": request.question,
            "answer": (
                "I'm having trouble reaching the language model right now. "
                "Please try again."
            ),
        }

    return {
        "repository_id": repository_id,
        "question": request.question,
        "answer": answer,
    }