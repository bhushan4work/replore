from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.database import supabase
from app.services.graph import graph_service

router = APIRouter(
    prefix="/api/repositories",
)

@router.get("/{repository_id}/graph")
async def dependency_graph(
    repository_id: str,
    seed: str | None = Query(None, description="Node ID for k-hop exploration"),
    k: int = Query(6, ge=1, le=20, description="Number of hops"),
    direction: str = Query("both", description="forward, reverse, or both"),
    groups: str | None = Query(None, description="Comma-separated group filter"),
    file_types: str | None = Query(None, description="Comma-separated file-type filter"),
    min_score: int = Query(0, ge=0, description="Minimum degree score"),
):
    """
    Returns a React Flow compatible dependency graph with optional
    filtering, k-hop traversal, and subgraph extraction.
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

    # Parse comma-separated filter strings into lists.
    group_list = (
        [g.strip() for g in groups.split(",") if g.strip()]
        if groups
        else None
    )
    type_list = (
        [t.strip() for t in file_types.split(",") if t.strip()]
        if file_types
        else None
    )

    graph = graph_service.analyze(
        repository_path,
        seed=seed,
        k=k,
        direction=direction,
        groups=group_list,
        file_types=type_list,
        min_score=min_score,
    )

    return {
        "repository_id": repository_id,
        "graph": graph,
    }