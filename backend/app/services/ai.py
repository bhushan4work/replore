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


SYSTEM_PROMPT = """
You are replore AI.

You help developers understand GitHub repositories.

Rules:

- Answer ONLY from the repository context provided below.
- Base every statement on the code in the context; cite the FILE path when you can.
- Do not invent files, symbols, or behavior that are not in the context.
- If the context does not provide enough information to answer, say the repository does not provide enough information, rather than guessing.
- Explain architecture, functions, classes and files clearly.
- Keep responses concise but technically accurate.
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
        model: str | None = None,
    ) -> str:

        model = model or settings.LLM_MODEL

        messages = [
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
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
        ]

        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.2,
        )

        return response.choices[0].message.content


ai_service = AIService()