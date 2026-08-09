from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.database import supabase
from app.config import settings
from app.services.github import github_service
from app.services.parser import parser_service

router = APIRouter(
    prefix="/api/repositories",
)

@router.get("/{repository_id}/overview")
async def get_repository_overview(repository_id: str):
    """
    Returns:
    - Repository metadata
    - Statistics
    - Folder structure
    - Dependency files
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

    statistics = parser_service.repository_statistics(
        repository_path
    )

    dependency_files = [
        str(file.relative_to(repository_path))
        for file in parser_service.dependency_files(
            repository_path
        )
    ]

    tree = build_directory_tree(repository_path)

    metadata = github_service.get_repository_metadata(
        repo["github_url"]
    )

    return {
        "repository": metadata,
        "statistics": statistics,
        "dependency_files": dependency_files,
        "directory_tree": tree,
    }


def build_directory_tree(path: Path):

    children = []

    for item in sorted(
        path.iterdir(),
        key=lambda x: (x.is_file(), x.name.lower()),
    ):

        if item.name.startswith(".git"):
            continue

        if item.is_dir():

            children.append(
                {
                    "name": item.name,
                    "type": "directory",
                    "children": build_directory_tree(item),
                }
            )

        else:

            children.append(
                {
                    "name": item.name,
                    "type": "file",
                }
            )

    return children