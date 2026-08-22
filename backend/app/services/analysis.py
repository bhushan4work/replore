from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from git import GitCommandError
from github.GithubException import GithubException, UnknownObjectException
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import settings
from app.database import supabase
from app.services.github import github_service
from app.services.parser import parser_service

logger = logging.getLogger(__name__)

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_error_message(exc: Exception) -> str:
    """
    Builds a user-facing error message without leaking internal
    implementation details, secrets, or stack traces.
    """

    if isinstance(exc, ValueError):
        return str(exc)

    if isinstance(exc, UnknownObjectException):
        return "Repository not found or no longer accessible."

    if isinstance(exc, GithubException):
        return (
            exc.data.get("message")
            or "GitHub request failed during analysis."
        )

    if isinstance(exc, GitCommandError):
        return (
            "Failed to clone the repository. "
            "It may be too large or temporarily unavailable."
        )

    return "Analysis failed unexpectedly. Please try again."


def _update_job(
    job_id: str,
    *,
    status: str | None = None,
    stage: str | None = None,
    repository_id: str | None = None,
    error_message: str | None = None,
    commit_sha: str | None = None,
) -> None:
    """
    Persists a status update for an analysis job.

    Failures here are logged but never raised, so a job is still marked
    failed even if the final status write itself fails.
    """

    updates: dict[str, Any] = {
        "updated_at": _now(),
    }

    if status is not None:
        updates["status"] = status

        if status == "cloning":
            updates["started_at"] = _now()
        elif status == "completed":
            updates["completed_at"] = _now()
        elif status == "failed":
            updates["failed_at"] = _now()

    if stage is not None:
        updates["current_stage"] = stage

    if repository_id is not None:
        updates["repository_id"] = repository_id

    if error_message is not None:
        updates["error_message"] = error_message

    if commit_sha is not None:
        updates["commit_sha"] = commit_sha

    try:

        (
            supabase.table("analysis_jobs")
            .update(updates)
            .eq("id", job_id)
            .execute()
        )

    except Exception:

        logger.exception(
            "Failed to persist status update for job %s.",
            job_id,
        )


def _cleanup_repository(path: Path) -> None:
    """
    Best-effort removal of a cloned repository. Logs instead of
    raising so cleanup failures never mask the original error.
    """

    try:

        if path.exists():
            github_service.delete_local_repository(path)

    except Exception:

        logger.exception(
            "Failed to clean up repository at %s.",
            path,
        )


def reset_repository_status(repository_id: str | None) -> None:
    """
    Restores a repository's status after a failed analysis so it is never
    stuck in "processing": 'completed' when a completed analysis for it
    still exists, otherwise 'failed'. Never raises.
    """

    if not repository_id:
        return

    try:

        completed = (
            supabase.table("analysis_jobs")
            .select("id")
            .eq("repository_id", repository_id)
            .eq("status", "completed")
            .limit(1)
            .execute()
        )

        (
            supabase.table("repositories")
            .update(
                {
                    "status": (
                        "completed"
                        if completed.data
                        else "failed"
                    ),
                }
            )
            .eq("id", repository_id)
            .execute()
        )

    except Exception:

        logger.exception(
            "Failed to reset repository status for %s.",
            repository_id,
        )


@retry(
    retry=retry_if_exception_type(Exception),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    stop=stop_after_attempt(3),
    reraise=True,
)
def _mark_repository_completed(
    repository_id: str,
    commit_sha: str | None,
) -> None:
    """
    Marks a repository as completed. Retried so a transient write failure
    after the clone was promoted does not discard a fully computed
    analysis.
    """

    (
        supabase.table("repositories")
        .update(
            {
                "status": "completed",
                "commit_sha": commit_sha,
            }
        )
        .eq("id", repository_id)
        .execute()
    )


def _find_cached_analysis(
    github_url: str,
    commit_sha: str,
) -> str | None:
    """
    Returns the id of a completed analysis for the same repository
    version, or None when this version has not been analyzed yet.
    """

    try:

        result = (
            supabase.table("analysis_jobs")
            .select("id")
            .eq("github_url", github_url)
            .eq("commit_sha", commit_sha)
            .eq("status", "completed")
            .limit(1)
            .execute()
        )

    except Exception:

        logger.exception(
            "Failed to query cached analysis for %s @ %s.",
            github_url,
            commit_sha,
        )

        return None

    if result.data:
        return result.data[0]["id"]

    return None


def _reuse_cached_analysis(
    job_id: str,
    cached_id: str,
    github_url: str,
    commit_sha: str,
) -> bool:
    """
    Reuses an existing completed analysis instead of reprocessing the
    repository. Marks the current job as completed (stage "cached") and
    links it to the same repository.

    Returns False when the canonical clone is missing, so the caller
    falls back to a full re-analysis.
    """

    owner, repo = github_service.parse_repository_url(github_url)

    if not (settings.REPOS_DIR / f"{owner}_{repo}").exists():
        logger.info(
            "Cached analysis %s found but clone is missing for %s; "
            "re-analyzing.",
            cached_id,
            github_url,
        )
        return False

    cached = (
        supabase.table("analysis_jobs")
        .select("repository_id")
        .eq("id", cached_id)
        .single()
        .execute()
    )

    repository_id = (
        cached.data.get("repository_id")
        if cached.data
        else None
    )

    if repository_id:

        _mark_repository_completed(
            repository_id,
            commit_sha,
        )

    logger.info(
        "Reusing cached analysis %s for %s @ %s.",
        cached_id,
        github_url,
        commit_sha,
    )

    _update_job(
        job_id,
        status="completed",
        stage="cached",
        repository_id=repository_id,
        commit_sha=commit_sha,
    )

    return True


def _upsert_repository(
    github_url: str,
    metadata: dict[str, Any],
) -> str:
    """
    Returns the id of the repositories row for this GitHub URL, reusing
    the existing row so a new commit creates a new analysis linked to
    the same repository.
    """

    fields = {
        "github_url": github_url,
        "owner": metadata["owner"],
        "repo_name": metadata["name"],
        "default_branch": metadata["default_branch"],
        "language": metadata["language"],
        "status": "processing",
    }

    existing = (
        supabase.table("repositories")
        .select("id")
        .eq("github_url", github_url)
        .limit(1)
        .execute()
    )

    if existing.data:

        repository_id = existing.data[0]["id"]

        (
            supabase.table("repositories")
            .update(fields)
            .eq("id", repository_id)
            .execute()
        )

        return repository_id

    result = (
        supabase.table("repositories")
        .insert(fields)
        .execute()
    )

    return result.data[0]["id"]


def run_repository_analysis(
    job_id: str,
    github_url: str,
) -> None:
    """
    Runs the full repository analysis pipeline in the background.

    Stages: cloning, scanning, parsing, analyzing, completed.

    The repository's HEAD commit identifies the version being analyzed.
    If that exact version was already analyzed successfully, the job
    short-circuits to "cached" and reuses the existing results instead
    of regenerating embeddings, documentation, or graph data. A new
    commit produces a new analysis linked to the same repository, while
    previous analysis records are preserved.

    The clone is kept on disk after success because the existing
    overview/architecture/graph/docs routes read it from disk on demand.
    It is removed when the job fails.
    """

    # Clone into a per-job temporary workspace and only promote it to the
    # canonical REPOS_DIR/<owner>_<repo> location once analysis succeeds.
    local_repo = github_service.analysis_workspace(job_id)

    repository_id: str | None = None

    try:

        # -------------------------------------------------
        # Version check (cache lookup)
        # -------------------------------------------------

        commit_sha = github_service.get_head_commit_sha(github_url)

        if commit_sha:

            cached_id = _find_cached_analysis(
                github_url,
                commit_sha,
            )

            if cached_id and _reuse_cached_analysis(
                job_id,
                cached_id,
                github_url,
                commit_sha,
            ):
                return

        # -------------------------------------------------
        # Cloning
        # -------------------------------------------------

        _update_job(
            job_id,
            status="cloning",
            stage="cloning",
            commit_sha=commit_sha,
        )

        github_service.clone_repository(github_url, destination=local_repo)

        metadata = github_service.get_repository_metadata(github_url)

        # -------------------------------------------------
        # Scanning
        # -------------------------------------------------

        _update_job(job_id, status="scanning", stage="scanning")

        repository_id = _upsert_repository(github_url, metadata)

        _update_job(job_id, repository_id=repository_id)

        # -------------------------------------------------
        # Parsing
        # -------------------------------------------------

        _update_job(job_id, status="parsing", stage="parsing")

        # -------------------------------------------------
        # Analyzing
        # -------------------------------------------------

        _update_job(job_id, status="analyzing", stage="analyzing")

        parser_service.repository_statistics(local_repo)

        # Promote the temporary clone to the canonical location so the
        # on-demand overview/architecture/graph/docs routes can read it.
        github_service.promote_clone(local_repo, github_url)

        _mark_repository_completed(
            repository_id,
            commit_sha,
        )

        # -------------------------------------------------
        # Completed
        # -------------------------------------------------

        _update_job(
            job_id,
            status="completed",
            stage="completed",
            commit_sha=commit_sha,
        )

    except Exception as exc:

        logger.exception(
            "Analysis job %s failed.",
            job_id,
        )

        _cleanup_repository(local_repo)

        reset_repository_status(repository_id)

        _update_job(
            job_id,
            status="failed",
            stage="failed",
            error_message=_safe_error_message(exc),
        )
