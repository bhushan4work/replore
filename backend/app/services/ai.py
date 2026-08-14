from __future__ import annotations

import logging

from groq import Groq
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from app.config import settings

logger = logging.getLogger(__name__)

_TRANSIENT_HTTP_CODES = (429, 500, 502, 503, 504)


def _is_transient_groq_error(exc: BaseException) -> bool:
    """
    Retries connection/timeout errors and transient HTTP statuses
    (rate limits, internal errors), but not permanent failures such
    as invalid requests.
    """

    if isinstance(exc, (ConnectionError, TimeoutError)):
        return True

    if getattr(exc, "status_code", None) in _TRANSIENT_HTTP_CODES:
        return True

    try:

        from groq import APIConnectionError, APITimeoutError

        if isinstance(exc, (APIConnectionError, APITimeoutError)):
            return True

    except Exception:
        pass

    return False


SYSTEM_PROMPT = """\
You are replore AI.

You help developers understand GitHub repositories.

Rules:

- Answer ONLY from the repository context provided below — specifically the \
FILE-prefixed code chunks and the repository metadata/statistics summary.
- NEVER supplement your answer with general knowledge of any programming \
language, framework, library, or tool. If the provided context does not \
contain the information needed, you must say so.
- Base every statement on the code in the context. When referencing code, \
always cite the specific file path(s) it came from (e.g. "In `src/utils.py`…").
- Do not invent files, symbols, or behavior that are not in the context.
- If the retrieved context does not cover the question, say so plainly \
(e.g. "The retrieved context does not contain information about …") instead \
of guessing or filling gaps.
- Explain architecture, functions, classes and files clearly.
- Keep responses concise but technically accurate.
"""

_REWRITE_SYSTEM_PROMPT = """\
Rewrite the follow-up question into a standalone search query that can be \
used to search a code repository. Incorporate the necessary context from \
the previous message so the query is self-contained. Output only the \
rewritten query, nothing else.\
"""


class AIService:

    def __init__(self) -> None:

        self.client = Groq(
            api_key=settings.GROQ_API_KEY,
        )

    # ---------------------------------------------------------

    @retry(
        retry=retry_if_exception(_is_transient_groq_error),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        stop=stop_after_attempt(settings.LLM_RETRY_ATTEMPTS),
        reraise=True,
    )
    def chat(
        self,
        question: str,
        context: str,
        history: list[dict[str, str]] | None = None,
        model: str | None = None,
    ) -> str:

        model = model or settings.LLM_MODEL

        messages: list[dict[str, str]] = [
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
        ]

        # Inject prior conversation turns (already budget-trimmed by
        # the caller) between the system prompt and the new question.
        if history:
            messages.extend(history)

        messages.append(
            {
                "role": "user",
                "content": f"""
Repository Context:

{context}

-------------------------

Question:

{question}
""",
            },
        )

        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.2,
        )

        return response.choices[0].message.content

    # ---------------------------------------------------------

    def rewrite_query(
        self,
        previous_user_message: str,
        new_question: str,
    ) -> str:
        """
        Rewrites a follow-up question into a standalone search query
        by incorporating context from the previous user message.

        Degrades gracefully: on any failure the raw question is returned
        (or a simple concatenation with the prior message) so that a
        rewrite failure never breaks the /chat request.
        """

        try:

            response = self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": _REWRITE_SYSTEM_PROMPT,
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Previous question: {previous_user_message}\n\n"
                            f"Follow-up question: {new_question}"
                        ),
                    },
                ],
                temperature=0,
                max_tokens=150,
            )

            rewritten = (response.choices[0].message.content or "").strip()

            if rewritten:
                return rewritten

        except Exception:

            logger.warning(
                "Query rewrite failed; falling back to concatenation.",
                exc_info=True,
            )

        # Fallback: simple concatenation so the embedding still
        # captures some context from the prior turn.
        return f"{previous_user_message} {new_question}"


ai_service = AIService()