from __future__ import annotations

import logging

from google import genai
from google.genai.types import EmbedContentConfig, HttpOptions
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from app.config import settings

logger = logging.getLogger(__name__)

_TRANSIENT_HTTP_CODES = (429, 500, 502, 503, 504)


def _is_transient_embed_error(exc: BaseException) -> bool:
    """
    Retries connection/timeout errors and transient HTTP statuses
    (quota, internal errors, rate limits), but not permanent failures
    such as invalid requests.
    """

    if isinstance(exc, (ConnectionError, TimeoutError)):
        return True

    if getattr(exc, "code", None) in _TRANSIENT_HTTP_CODES:
        return True

    try:

        from google.api_core.exceptions import GoogleAPICallError

        if (
            isinstance(exc, GoogleAPICallError)
            and getattr(exc, "code", None) in _TRANSIENT_HTTP_CODES
        ):
            return True

    except Exception:
        pass

    return False


class EmbeddingService:
    """
    Handles generation of Gemini embeddings.
    """

    def __init__(self) -> None:

        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=HttpOptions(
                timeout=settings.EMBED_TIMEOUT_SECONDS,
            ),
        )

        self.model = settings.EMBEDDING_MODEL

    # ---------------------------------------------------------

    @retry(
        retry=retry_if_exception(_is_transient_embed_error),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        stop=stop_after_attempt(settings.EMBED_RETRY_ATTEMPTS),
        reraise=True,
    )
    def _embed_batch(
        self,
        texts: list[str],
    ) -> list[list[float]]:

        response = self.client.models.embed_content(
            model=self.model,
            contents=texts,
            config=EmbedContentConfig(
                task_type="RETRIEVAL_DOCUMENT",
            ),
        )

        return [
            embedding.values
            for embedding in response.embeddings
        ]

    # ---------------------------------------------------------

    @retry(
        retry=retry_if_exception(_is_transient_embed_error),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        stop=stop_after_attempt(settings.EMBED_RETRY_ATTEMPTS),
        reraise=True,
    )
    def _embed_single(
        self,
        text: str,
    ) -> list[float]:

        response = self.client.models.embed_content(
            model=self.model,
            contents=[text],
            config=EmbedContentConfig(
                task_type="RETRIEVAL_DOCUMENT",
            ),
        )

        return response.embeddings[0].values

    # ---------------------------------------------------------

    def embed_texts(
        self,
        texts: list[str],
    ) -> list[list[float] | None]:
        """
        Embeds texts in batches of EMBED_BATCH_SIZE.

        Returns one embedding per input text, aligned by index, or None
        for texts that could not be embedded. Never raises: a temporary
        failure only drops the affected items, so successful batches are
        never lost.
        """

        output: list[list[float] | None] = [None] * len(texts)

        for start in range(0, len(texts), settings.EMBED_BATCH_SIZE):

            batch = texts[start:start + settings.EMBED_BATCH_SIZE]

            try:

                embeddings = self._embed_batch(batch)

            except Exception as exc:

                logger.warning(
                    "Batch embedding failed (%s); retrying items "
                    "individually.",
                    exc,
                )

                embeddings = []

                for text in batch:

                    try:

                        embeddings.append(self._embed_single(text))

                    except Exception as item_exc:

                        logger.error(
                            "Failed to embed item: %s.",
                            item_exc,
                        )

                        embeddings.append(None)

            for offset, embedding in enumerate(embeddings):

                if embedding is None:
                    continue

                output[start + offset] = embedding

        return output

    # ---------------------------------------------------------

    def embed_text(
        self,
        text: str,
    ) -> list[float] | None:

        return self.embed_texts([text])[0]

    # ---------------------------------------------------------

    @retry(
        retry=retry_if_exception(_is_transient_embed_error),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        stop=stop_after_attempt(settings.EMBED_RETRY_ATTEMPTS),
        reraise=True,
    )
    def embed_query(
        self,
        query: str,
    ) -> list[float]:

        response = self.client.models.embed_content(
            model=self.model,
            contents=query,
            config=EmbedContentConfig(
                task_type="RETRIEVAL_QUERY",
            ),
        )

        return response.embeddings[0].values


embedding_service = EmbeddingService()
