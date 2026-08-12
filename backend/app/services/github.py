from __future__ import annotations

import logging
import os
import shutil
import time
from pathlib import Path
from urllib.parse import urlparse

from git import Repo
from git.exc import GitCommandError
from github import Github, Auth
from github.Repository import Repository
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from app.config import settings

logger = logging.getLogger(__name__)

TRANSIENT_CLONE_ERROR_MARKERS = (
    "unable to access",
    "could not resolve host",
    "timed out",
    "operation timed out",
    "connection",
    "rpc failed",
    "early eof",
    "reset by peer",
    "proxy",
    "ssl",
    "network is unreachable",
    "getaddrinfo",
)


def _is_transient_clone_error(exc: BaseException) -> bool:
    """Retries only recoverable clone failures, not auth/404/config errors."""
    if isinstance(exc, (ConnectionError, TimeoutError, OSError)):
        return True

    if isinstance(exc, GitCommandError):
        stderr = exc.stderr or ""
        if isinstance(stderr, (list, tuple)):
            stderr = "\n".join(str(line) for line in stderr)
        message = f"{exc} {stderr}".lower()
        return any(marker in message for marker in TRANSIENT_CLONE_ERROR_MARKERS)

    return False


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
            "pushed_at": (
                repo.pushed_at.isoformat()
                if repo.pushed_at
                else None
            ),
        }

    def get_head_commit_sha(self, repo_url: str) -> str | None:
        """
        Returns the default branch HEAD commit sha for a repository, or
        None when it cannot be resolved (e.g. rate-limited).
        """

        try:

            repo = self.get_repository(repo_url)

            branch = repo.get_branch(repo.default_branch)

            return branch.commit.sha

        except Exception:

            logger.warning(
                "Could not resolve HEAD commit sha for %s.",
                repo_url,
            )

            return None

    # ---------------------------------------------------------
    # Clone
    # ---------------------------------------------------------

    @staticmethod
    def _clone_environment() -> dict[str, str]:
        """Injects git low-speed timeout config via env (no unsafe CLI options)."""
        env = os.environ.copy()
        env.update(
            {
                "GIT_CONFIG_COUNT": "3",
                "GIT_CONFIG_KEY_0": "http.lowSpeedLimit",
                "GIT_CONFIG_VALUE_0": str(settings.CLONE_LOW_SPEED_LIMIT_BPS),
                "GIT_CONFIG_KEY_1": "http.lowSpeedTime",
                "GIT_CONFIG_VALUE_1": str(settings.CLONE_LOW_SPEED_TIME_SECONDS),
                "GIT_CONFIG_KEY_2": "http.postBuffer",
                "GIT_CONFIG_VALUE_2": "524288000",
            }
        )
        return env

    def clone_repository(
        self,
        repo_url: str,
        destination: Path | None = None,
    ) -> Path:
        """
        Validate that the repository exists and is accessible before cloning,
        then clone into a unique destination directory.

        A hung or stalled clone is aborted by git's low-speed timeout, and
        transient network failures are retried.
        """

        owner, repo = self.parse_repository_url(repo_url)

        # Validate the repository before attempting the clone.
        self.get_repository_metadata(repo_url)

        if destination is None:
            destination = settings.REPOS_DIR / f"{owner}_{repo}"

        self._clone_with_retry(repo_url, destination)

        return destination

    @retry(
        retry=retry_if_exception(_is_transient_clone_error),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        stop=stop_after_attempt(settings.CLONE_RETRY_ATTEMPTS),
        reraise=True,
    )
    def _clone_with_retry(self, repo_url: str, destination: Path) -> None:
        if destination.exists():
            shutil.rmtree(destination)

        destination.parent.mkdir(parents=True, exist_ok=True)

        Repo.clone_from(
            repo_url,
            destination,
            env=self._clone_environment(),
        )

    def promote_clone(self, temp_path: Path, repo_url: str) -> Path:
        """
        Move a completed clone from its temporary analysis workspace to the
        canonical REPOS_DIR/<owner>_<repo> path used by the on-demand routes.
        """

        owner, repo = self.parse_repository_url(repo_url)
        destination = settings.REPOS_DIR / f"{owner}_{repo}"

        if destination.exists():
            shutil.rmtree(destination)

        destination.parent.mkdir(parents=True, exist_ok=True)

        shutil.move(str(temp_path), str(destination))

        return destination

    # ---------------------------------------------------------
    # Utilities
    # ---------------------------------------------------------

    @staticmethod
    def analysis_workspace(job_id: str) -> Path:
        """Unique temporary clone directory for an analysis job."""
        return settings.REPOS_DIR / ".tmp" / job_id

    @staticmethod
    def cleanup_stale_temp_dirs(max_age_hours: int = 24) -> None:
        """Remove abandoned analysis workspaces older than max_age_hours."""
        temp_root = settings.REPOS_DIR / ".tmp"

        if not temp_root.exists():
            return

        cutoff = time.time() - max_age_hours * 3600

        for entry in temp_root.iterdir():
            try:
                if entry.stat().st_mtime < cutoff:
                    shutil.rmtree(entry, ignore_errors=True)
            except OSError:
                continue

    @staticmethod
    def delete_local_repository(path: Path) -> None:
        if path.exists():
            shutil.rmtree(path)

    @staticmethod
    def repository_exists(path: Path) -> bool:
        return path.exists()

    @staticmethod
    def count_contributors(path: Path) -> int:
        """Number of unique committers in the local clone's history."""
        try:
            return len(
                Repo(path)
                .git.shortlog("-sn", "--all")
                .splitlines()
            )
        except Exception:
            return 0


github_service = GitHubService()
