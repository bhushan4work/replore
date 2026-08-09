from __future__ import annotations

from typing import Any

from app.database import supabase
from app.services.embeddings import embedding_service


class RAGService:
    """
    Retrieves the most relevant code chunks
    for repository-aware AI chat.
    """

    def __init__(self) -> None:
        self.top_k = 8

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
    def build_context(
        chunks: list[dict[str, Any]],
    ) -> str:

        if not chunks:
            return ""

        context: list[str] = []

        for chunk in chunks:

            context.append(
                f"""
==========================
FILE: {chunk["file_path"]}
==========================

{chunk["content"]}
"""
            )

        return "\n".join(context)

    # ---------------------------------------------------------

    def search(
        self,
        repository_id: str,
        question: str,
    ) -> str:

        chunks = self.retrieve(
            repository_id,
            question,
        )

        return self.build_context(
            chunks
        )


rag_service = RAGService()