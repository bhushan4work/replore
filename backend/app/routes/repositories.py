from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.jobs import analysis_job

router = APIRouter()


class AnalyzeRequest(BaseModel):
    github_url: str


@router.post("/", status_code=202)
async def analyze_repository(request: AnalyzeRequest):
    """
    Creates an analysis job for a repository.

    Returns a job_id immediately. The heavy pipeline (clone, parse,
    index, etc.) runs in the background; track progress via
    GET /api/analyze/{job_id}/status.
    """

    try:

        job = await analysis_job.create_and_schedule_analysis(
            request.github_url
        )

    except Exception:

        raise HTTPException(
            status_code=500,
            detail="Unable to create the analysis job.",
        )

    return {
        "job_id": job["id"],
        "github_url": job["github_url"],
        "status": job["status"],
    }
