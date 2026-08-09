from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.database import supabase
from app.services.ai import ai_service

router = APIRouter(
    prefix="/api/repositories",
)

@router.get("/{repository_id}/docs")
async def generate_documentation(repository_id: str):
    """
    Generate repository documentation using AI.
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

    structure = build_repository_structure(
        repository_path
    )

    prompt = f"""
Generate professional project documentation.

Include:

# Project Overview

# Folder Structure

# Technologies Used

# Important Modules

# Installation

# Development Workflow

# Notes

Repository Structure:

{structure}
"""

    documentation = ai_service.chat(
        question=prompt,
        context=structure,
    )

    return {
        "repository_id": repository_id,
        "documentation": documentation,
    }


def build_repository_structure(
    root: Path,
) -> str:

    output: list[str] = []

    def walk(
        directory: Path,
        depth: int = 0,
    ):

        items = sorted(
            directory.iterdir(),
            key=lambda x: (
                x.is_file(),
                x.name.lower(),
            ),
        )

        for item in items:

            if item.name.startswith(".git"):
                continue

            output.append(
                "    " * depth + item.name
            )

            if item.is_dir():

                walk(
                    item,
                    depth + 1,
                )

    walk(root)

    return "\n".join(output)