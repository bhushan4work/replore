from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import supabase
from app.services.embeddings import embedding_service
from app.services.github import github_service
from app.services.parser import parser_service

router = APIRouter()


class AnalyzeRequest(BaseModel):
    github_url: str


@router.post("/")
async def analyze_repository(request: AnalyzeRequest):
    """
    Pipeline:

    1. Clone repository
    2. Extract metadata
    3. Store repository
    4. Parse source code
    5. Chunk source code
    6. Generate embeddings
    7. Store chunks
    """

    try:

        metadata = github_service.get_repository_metadata(
            request.github_url
        )

        local_repo: Path = github_service.clone_repository(
            request.github_url
        )

        repository = (
            supabase.table("repositories")
            .insert(
                {
                    "github_url": request.github_url,
                    "owner": metadata["owner"],
                    "repo_name": metadata["name"],
                    "default_branch": metadata["default_branch"],
                    "language": metadata["language"],
                    "status": "processing",
                }
            )
            .execute()
        )

        repository_id = repository.data[0]["id"]

        chunks = parser_service.chunk_repository(
            local_repo
        )

        embedded_chunks = embedding_service.embed_chunks(
            chunks
        )

        batch = []

        for chunk in embedded_chunks:

            batch.append(
                {
                    "repository_id": repository_id,
                    "file_path": chunk["file_path"],
                    "chunk_index": chunk["chunk_index"],
                    "language": chunk["language"],
                    "content": chunk["content"],
                    "embedding": chunk["embedding"],
                }
            )

            if len(batch) >= 100:

                (
                    supabase.table("code_chunks")
                    .insert(batch)
                    .execute()
                )

                batch.clear()

        if batch:

            (
                supabase.table("code_chunks")
                .insert(batch)
                .execute()
            )

        (
            supabase.table("repositories")
            .update(
                {
                    "status": "completed",
                }
            )
            .eq("id", repository_id)
            .execute()
        )

        stats = parser_service.repository_statistics(
            local_repo
        )

        return {
            "success": True,
            "repository_id": repository_id,
            "repository": metadata,
            "statistics": stats,
        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )