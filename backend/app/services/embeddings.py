from __future__ import annotations

from typing import Iterable

from google import genai
from google.genai.types import EmbedContentConfig

from app.config import settings
from app.services.parser import CodeChunk


class EmbeddingService:
    """
    Handles generation of Gemini embeddings.
    """

    def __init__(self) -> None:

        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

        self.model = settings.EMBEDDING_MODEL

    # ---------------------------------------------------------

    def embed_text(
        self,
        text: str,
    ) -> list[float]:

        response = self.client.models.embed_content(
            model=self.model,
            contents=text,
            config=EmbedContentConfig(
                task_type="RETRIEVAL_DOCUMENT",
            ),
        )

        return response.embeddings[0].values

    # ---------------------------------------------------------

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

    # ---------------------------------------------------------

    def embed_chunks(
        self,
        chunks: Iterable[CodeChunk],
    ) -> list[dict]:

        output: list[dict] = []

        for chunk in chunks:

            embedding = self.embed_text(
                chunk.content
            )

            output.append(
                {
                    "file_path": chunk.file_path,
                    "language": chunk.language,
                    "chunk_index": chunk.chunk_index,
                    "content": chunk.content,
                    "embedding": embedding,
                }
            )

        return output

    # ---------------------------------------------------------

    @staticmethod
    def embedding_dimension(
        embedding: list[float],
    ) -> int:

        return len(embedding)


embedding_service = EmbeddingService()