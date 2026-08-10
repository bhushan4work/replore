from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from app.database import supabase
from app.services import analysis as analysis_service

logger = logging.getLogger(__name__)

TERMINAL_STATUSES = {"completed", "failed"}

# In-process registry of running jobs. Used to prevent a job_id
# from being scheduled twice while it is still active.
_running_jobs: dict[str, asyncio.Task] = {}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------
# Persistence helpers
# ---------------------------------------------------------


def create_analysis_job(github_url: str) -> dict[str, Any]:
    """
    Creates a queued analysis job and returns the created row.
    """

    result = (
        supabase.table("analysis_jobs")
        .insert(
            {
                "github_url": github_url,
                "status": "queued",
                "current_stage": "queued",
            }
        )
        .execute()
    )

    return result.data[0]


def get_analysis_job(job_id: str) -> dict[str, Any] | None:
    """
    Returns a single analysis job, or None when it does not exist.
    """

    result = (
        supabase.table("analysis_jobs")
        .select("*")
        .eq("id", job_id)
        .single()
        .execute()
    )

    return result.data


def _mark_failed(job_id: str, message: str) -> None:
    """
    Persists a failed terminal state for a job. Failures here are logged
    but never raised, so a job is still marked failed even if the status
    write itself fails.
    """

    try:

        (
            supabase.table("analysis_jobs")
            .update(
                {
                    "status": "failed",
                    "current_stage": "failed",
                    "failed_at": _now(),
                    "updated_at": _now(),
                    "error_message": message,
                }
            )
            .eq("id", job_id)
            .execute()
        )

    except Exception:

        logger.exception(
            "Failed to mark analysis job %s as failed.",
            job_id,
        )


def fail_stale_jobs() -> None:
    """
    Marks jobs left in a non-terminal state (for example after a server
    restart) as failed so they never appear stuck forever. Repositories
    those jobs left in "processing" are also restored to a consistent
    status.
    """

    try:

        result = (
            supabase.table("analysis_jobs")
            .select("id, repository_id")
            .not_.in_("status", list(TERMINAL_STATUSES))
            .execute()
        )

    except Exception:

        logger.exception(
            "Failed to query stale analysis jobs."
        )

        return

    if not result.data:
        return

    for job in result.data:

        try:

            (
                supabase.table("analysis_jobs")
                .update(
                    {
                        "status": "failed",
                        "current_stage": "failed",
                        "failed_at": _now(),
                        "error_message": (
                            "Job interrupted by server restart."
                        ),
                    }
                )
                .eq("id", job["id"])
                .execute()
            )

            analysis_service.reset_repository_status(
                job.get("repository_id")
            )

        except Exception:

            logger.exception(
                "Failed to mark stale analysis job %s as failed.",
                job["id"],
            )


# ---------------------------------------------------------
# Scheduling
# ---------------------------------------------------------


async def create_and_schedule_analysis(github_url: str) -> dict[str, Any]:
    """
    Creates a queued job and schedules it for background execution.
    Returns the created job row.
    """

    job = create_analysis_job(github_url)

    await schedule_analysis_job(job["id"], github_url)

    return job


async def schedule_analysis_job(
    job_id: str,
    github_url: str,
) -> None:
    """
    Schedules a job to run in the background.

    A job that is already running (or that has already reached a
    terminal state) is never scheduled twice.
    """

    running = _running_jobs.get(job_id)

    if running is not None and not running.done():
        return

    try:

        job = get_analysis_job(job_id)

    except Exception:

        logger.exception(
            "Failed to load analysis job %s before scheduling.",
            job_id,
        )

        job = None

    if job is not None and job.get("status") in TERMINAL_STATUSES:
        return

    task = asyncio.create_task(
        _run_analysis_job(job_id, github_url)
    )

    _running_jobs[job_id] = task


async def _run_analysis_job(
    job_id: str,
    github_url: str,
) -> None:
    """
    Runs the blocking analysis pipeline in a worker thread so the
    event loop stays responsive while the repository is processed.

    The pipeline marks its own failures, so reaching this exception
    handler means the job would otherwise be left in a non-terminal
    state forever; it is marked failed explicitly.
    """

    try:

        await asyncio.to_thread(
            analysis_service.run_repository_analysis,
            job_id,
            github_url,
        )

    except asyncio.CancelledError:

        logger.warning(
            "Analysis job %s was cancelled before completing.",
            job_id,
        )

        _mark_failed(
            job_id,
            "Analysis job was interrupted.",
        )

        raise

    except Exception:

        logger.exception(
            "Analysis job %s raised an unexpected error.",
            job_id,
        )

        _mark_failed(
            job_id,
            "Analysis failed unexpectedly. Please try again.",
        )

    finally:

        _running_jobs.pop(job_id, None)
