from typing import Any

from fastapi import APIRouter, HTTPException
from github.GithubException import GithubException, UnknownObjectException
from pydantic import BaseModel

from app.jobs import analysis_job
from app.services.github import github_service

router = APIRouter(
    prefix="/api/analyze",
    tags=["Analyze"],
)


class AnalyzeRequest(BaseModel):
    github_url: str


@router.post("", status_code=202)
async def analyze_repository(request: AnalyzeRequest):
    """
    Validates the GitHub repository and creates an analysis job.

    Returns a job_id immediately. The heavy pipeline (clone, parse,
    index, etc.) runs in the background.
    """

    validate_repository(request.github_url)

    job = await analysis_job.create_and_schedule_analysis(
        request.github_url
    )

    return {
        "job_id": job["id"],
        "github_url": job["github_url"],
        "status": job["status"],
    }


@router.get("/{job_id}/status")
async def get_analysis_status(job_id: str):
    """
    Returns the current state of an analysis job, including the stage,
    timestamps, and a sanitized error message when the job failed.
    """

    try:

        job = analysis_job.get_analysis_job(job_id)

    except Exception:

        job = None

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis job not found.",
        )

    return build_job_response(job)


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------


def validate_repository(github_url: str) -> None:
    """
    Ensures the URL is a valid, accessible public GitHub repository.
    """

    try:

        github_service.get_repository_metadata(github_url)

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except UnknownObjectException:

        raise HTTPException(
            status_code=404,
            detail="Repository not found or no longer accessible.",
        )

    except GithubException:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unable to access the repository. "
                "It may be private, missing, or rate-limited."
            ),
        )

    except Exception:

        raise HTTPException(
            status_code=500,
            detail="Unable to validate the repository. Please try again.",
        )


def build_job_response(job: dict[str, Any]) -> dict[str, Any]:
    """
    Maps a raw analysis_jobs row to a clean, consistent response shape.
    """

    return {
        "job_id": job.get("id"),
        "github_url": job.get("github_url"),
        "status": job.get("status"),
        "current_stage": job.get("current_stage"),
        "repository_id": job.get("repository_id"),
        "commit_sha": job.get("commit_sha"),
        "progress": job.get("progress"),
        "created_at": job.get("created_at"),
        "started_at": job.get("started_at"),
        "updated_at": job.get("updated_at"),
        "completed_at": job.get("completed_at"),
        "failed_at": job.get("failed_at"),
        "error": job.get("error_message"),
    }
