from __future__ import annotations

from typing import Any

from app.config import settings
from app.database import supabase
from app.services.embeddings import embedding_service


class RAGService:
    """
    Retrieves the most relevant code chunks
    for repository-aware AI chat.
    """

    def __init__(self) -> None:
        self.top_k = settings.RAG_TOP_K

    # ---------------------------------------------------------

    def retrieve(
        self,
        repository_id: str,
        question: str,
    ) -> list[dict[str, Any]]:

        query_embedding = embedding_service.embed_query(
            question
        )

        response = (
            supabase.rpc(
                "match_code_chunks",
                {
                    "query_embedding": query_embedding,
                    "match_repository": repository_id,
                    "match_count": self.top_k,
                },
            )
            .execute()
        )

        if response.data is None:
            return []

        return response.data

    # ---------------------------------------------------------

    @staticmethod
    def _format_chunk(
        chunk: dict[str, Any],
    ) -> str:
        """
        Formats a single chunk with source metadata (file path,
        symbol and line range when available) so the model can
        ground its answer in repository evidence.
        """

        header = f'FILE: {chunk.get("file_path", "unknown")}'

        details: list[str] = []

        symbol = chunk.get("symbol")

        if symbol:

            label = chunk.get("symbol_type") or "symbol"
            start = chunk.get("start_line")
            end = chunk.get("end_line")

            if start is not None and end is not None:
                details.append(f"{label}: {symbol} (lines {start}-{end})")
            else:
                details.append(f"{label}: {symbol}")

        language = chunk.get("language")

        if language:
            details.append(f"language: {language}")

        if details:
            header += "\n" + "\n".join(details)

        return (
            f"==========================\n"
            f"{header}\n"
            f"==========================\n\n"
            f"{chunk.get('content', '')}"
        )

    # ---------------------------------------------------------

    @staticmethod
    def build_context(
        chunks: list[dict[str, Any]],
    ) -> str:
        """
        Formats retrieved chunks with source metadata and keeps the
        combined context within MAX_CONTEXT_CHARS so the prompt stays
        within practical LLM limits.
        """

        if not chunks:
            return ""

        parts: list[str] = []
        total = 0

        for chunk in chunks:

            block = RAGService._format_chunk(chunk)

            if not block.strip():
                continue

            remaining = settings.MAX_CONTEXT_CHARS - total

            if remaining <= 0:
                break

            if len(block) > remaining:
                parts.append(block[:remaining])
                break

            parts.append(block)
            total += len(block)

        return "\n".join(parts)


rag_service = RAGService()