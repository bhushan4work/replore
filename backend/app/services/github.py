from __future__ import annotations

import shutil
from pathlib import Path
from urllib.parse import urlparse

from git import Repo
from github import Github, Auth
from github.Repository import Repository

from app.config import settings


class GitHubService:
    """
    Handles GitHub repository operations.
    """

    def __init__(self) -> None:
        auth = Auth.Token(settings.GITHUB_TOKEN)
        self.client = Github(auth=auth)

    # ---------------------------------------------------------
    # URL Helpers
    # ---------------------------------------------------------

    @staticmethod
    def parse_repository_url(repo_url: str) -> tuple[str, str]:
        """
        Example:
        https://github.com/vercel/next.js

        Returns:
        ("vercel", "next.js")
        """

        parsed = urlparse(repo_url)

        if parsed.netloc != "github.com":
            raise ValueError("Invalid GitHub repository URL.")

        parts = parsed.path.strip("/").split("/")

        if len(parts) < 2:
            raise ValueError("Invalid GitHub repository URL.")

        owner = parts[0]
        repo = parts[1].replace(".git", "")

        return owner, repo

    # ---------------------------------------------------------
    # Metadata
    # ---------------------------------------------------------

    def get_repository(self, repo_url: str) -> Repository:
        owner, repo = self.parse_repository_url(repo_url)
        return self.client.get_repo(f"{owner}/{repo}")

    def get_repository_metadata(self, repo_url: str) -> dict:
        repo = self.get_repository(repo_url)

        return {
            "id": repo.id,
            "name": repo.name,
            "full_name": repo.full_name,
            "description": repo.description,
            "owner": repo.owner.login,
            "default_branch": repo.default_branch,
            "language": repo.language,
            "stars": repo.stargazers_count,
            "forks": repo.forks_count,
            "open_issues": repo.open_issues_count,
            "clone_url": repo.clone_url,
        }

    # ---------------------------------------------------------
    # Clone
    # ---------------------------------------------------------

    def clone_repository(
        self,
        repo_url: str,
        overwrite: bool = True,
    ) -> Path:
        """
        Clone repository into repositories/<owner_repo>
        """

        owner, repo = self.parse_repository_url(repo_url)

        destination = settings.REPOS_DIR / f"{owner}_{repo}"

        if destination.exists():

            if overwrite:
                shutil.rmtree(destination)
            else:
                return destination

        Repo.clone_from(repo_url, destination)

        return destination

    # ---------------------------------------------------------
    # Utilities
    # ---------------------------------------------------------

    @staticmethod
    def delete_local_repository(path: Path) -> None:
        if path.exists():
            shutil.rmtree(path)

    @staticmethod
    def repository_exists(path: Path) -> bool:
        return path.exists()


github_service = GitHubService()