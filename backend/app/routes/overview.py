from fastapi import APIRouter, HTTPException

from app.config import settings
from app.database import supabase
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
    - Git activity
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

    statistics["contributors"] = (
        github_service.count_contributors(repository_path)
    )

    git_info = github_service.get_git_info(repository_path)

    metadata = github_service.get_repository_metadata(
        repo["github_url"]
    )

    return {
        "repository": metadata,
        "statistics": {
            key: statistics[key]
            for key in (
                "files",
                "lines",
                "blank_lines",
                "directories",
                "languages",
                "contributors",
            )
        },
        "git": {
            "default_branch": repo.get("default_branch"),
            "head_commit": git_info.get("head_commit"),
            "total_commits": git_info.get("total_commits", 0),
            "top_contributors": git_info.get(
                "top_contributors",
                [],
            ),
        },
    }