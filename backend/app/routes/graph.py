from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.database import supabase
from app.services.graph import graph_service

router = APIRouter(
    prefix="/api/repositories",
)

@router.get("/{repository_id}/graph")
async def dependency_graph(repository_id: str):
    """
    Returns a React Flow compatible dependency graph.
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

    repo = repository.data

    repository_path = (
        settings.REPOS_DIR
        / f"{repo['owner']}_{repo['repo_name']}"
    )

    if not repository_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Repository directory not found.",
        )

    graph = graph_service.analyze(
        repository_path
    )

    return {
        "repository_id": repository_id,
        "graph": graph,
    }