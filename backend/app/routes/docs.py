from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.database import supabase
from app.routes.architecture import (
    analyze_sources,
    build_tree,
    detect_technologies,
    find_entry_points,
    parse_dependencies,
)
from app.services.github import github_service

router = APIRouter(
    prefix="/api/repositories",
)

README_CANDIDATES = (
    "readme.md",
    "readme.markdown",
    "readme.rst",
    "readme.txt",
    "readme",
)

MAX_README_CHARS = 4000

# Manifest/config files whose real contents are included in the context
# so "dependencies and configuration" and "development" sections are
# grounded in actual configuration. Secret-bearing files (env, secrets,
# credentials) are deliberately never read.
MANIFEST_FILES = (
    "package.json",
    "pyproject.toml",
    "requirements.txt",
    "requirements-dev.txt",
    "Cargo.toml",
    "go.mod",
    "Pipfile",
    "Gemfile",
    "composer.json",
    "setup.py",
    "Dockerfile",
    "docker-compose.yml",
    "Makefile",
    "Procfile",
    "Vagrantfile",
    "justfile",
)

MAX_CONFIG_CHARS = 2000

TREE_DEPTH_LIMIT = 4


@router.get("/{repository_id}/docs")
async def generate_documentation(repository_id: str):
    """
    Returns README-style repository documentation grounded in the
    repository's actual metadata, structure, languages, technologies,
    and dependencies.
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

    metadata = _safe_metadata(repo)

    title = (
        metadata.get("full_name")
        or f"{repo['owner']}/{repo['repo_name']}"
    )

    tree = build_tree(repository_path)

    analysis = analyze_sources(repository_path)

    entry_points = find_entry_points(repository_path)

    dependencies = parse_dependencies(repository_path)

    technologies = detect_technologies(
        repository_path,
        analysis["languages"],
        dependencies,
    )

    context = build_docs_context(
        metadata=metadata,
        tree=tree,
        analysis=analysis,
        entry_points=entry_points,
        dependencies=dependencies,
        technologies=technologies,
        readme=_read_repository_readme(repository_path),
        config_files=_read_manifest_files(repository_path),
    )

    documentation = (
        f"# {title}\n\n{context}"
    )

    return {
        "repository_id": repository_id,
        "title": title,
        "documentation": documentation,
    }


def _safe_metadata(repo: dict) -> dict:
    """
    Returns GitHub metadata for the repository, falling back to the
    locally stored repository row so docs never fail on a transient
    GitHub API error.
    """

    try:
        return github_service.get_repository_metadata(
            repo["github_url"]
        )
    except Exception:
        return {
            "name": repo.get("repo_name"),
            "full_name": (
                f"{repo.get('owner')}/{repo.get('repo_name')}"
            ),
            "description": None,
            "default_branch": repo.get("default_branch"),
            "language": repo.get("language"),
            "topics": [],
            "license": None,
            "homepage": None,
            "stars": None,
            "forks": None,
        }


def _read_repository_readme(root: Path) -> str | None:
    """
    Reads the repository's existing README (truncated) so the generated
    documentation can reuse real intro and usage information.
    """

    for candidate in root.iterdir():

        if (
            candidate.is_file()
            and candidate.name.lower() in README_CANDIDATES
        ):

            try:

                content = candidate.read_text(
                    encoding="utf-8",
                    errors="ignore",
                )

            except OSError:
                return None

            if content.strip():
                return content[:MAX_README_CHARS]

    return None


def _read_manifest_files(root: Path) -> list[tuple[str, str]]:
    """
    Reads well-known manifest/config files (each truncated) so the
    generated documentation reflects the repository's real configuration
    and available commands. Secret-bearing files are never read.
    """

    found: list[tuple[str, str]] = []

    for name in MANIFEST_FILES:

        candidate = root / name

        if not candidate.is_file():
            continue

        try:

            content = candidate.read_text(
                encoding="utf-8",
                errors="ignore",
            )

        except OSError:
            continue

        if content.strip():
            found.append((name, content[:MAX_CONFIG_CHARS]))

    return found


def render_tree(tree: list[dict], depth: int = 0) -> list[str]:
    """Flattens a tree into indented text lines, capped by depth."""

    lines: list[str] = []

    for item in tree:

        lines.append("    " * depth + item["name"])

        children = item.get("children")

        if children and depth < TREE_DEPTH_LIMIT:

            lines.extend(render_tree(children, depth + 1))

    return lines


def build_docs_context(
    *,
    metadata: dict,
    tree: list[dict],
    analysis: dict,
    entry_points: list[dict],
    dependencies: list[dict],
    technologies: list[str],
    readme: str | None,
    config_files: list[tuple[str, str]],
) -> str:
    """
    Builds repository documentation from local metadata and files.
    """

    parts: list[str] = []

    metadata_fields = {
        "Name": metadata.get("name"),
        "Full name": metadata.get("full_name"),
        "Description": metadata.get("description"),
        "Primary language": metadata.get("language"),
        "Default branch": metadata.get("default_branch"),
        "Topics": (
            ", ".join(metadata.get("topics") or [])
        ),
        "License": metadata.get("license"),
        "Homepage": metadata.get("homepage"),
        "Stars": metadata.get("stars"),
        "Forks": metadata.get("forks"),
    }

    metadata_lines = "\n".join(
        f"- {key}: {value}"
        for key, value in metadata_fields.items()
        if value not in (None, "", [])
    )

    if metadata_lines:
        parts.append(f"Repository metadata:\n{metadata_lines}")

    if readme:
        parts.append(f"Existing README:\n{readme}")

    parts.append(
        "Project structure:\n"
        + "\n".join(render_tree(tree))
    )

    if config_files:

        config_text = "\n\n".join(
            f"--- {name} ---\n{content}"
            for name, content in config_files
        )

        parts.append(
            "Configuration / manifest files:\n"
            f"{config_text}"
        )

    if analysis["languages"]:

        languages_text = "\n".join(
            f"- {item['name']}: {item['files']} files, "
            f"{item['lines']} lines"
            for item in analysis["languages"]
        )

        parts.append(f"Languages:\n{languages_text}")

    if analysis["directories"]:

        directories_text = "\n".join(
            f"- {item['path']}: {item['files']} files, "
            f"{item['lines']} lines"
            for item in analysis["directories"]
        )

        parts.append(
            f"Directory breakdown:\n{directories_text}"
        )

    if entry_points:

        entry_points_text = "\n".join(
            f"- {item['path']} ({item['kind']})"
            for item in entry_points
        )

        parts.append(f"Entry points:\n{entry_points_text}")

    if technologies:

        parts.append(
            "Technologies:\n"
            + ", ".join(technologies)
            + "."
        )

    if dependencies:

        dependencies_text = ", ".join(
            item["name"] for item in dependencies[:40]
        )

        parts.append(
            f"Declared dependencies:\n{dependencies_text}."
        )

    if analysis["key_files"]:

        key_files_text = "\n".join(
            f"- {item['path']} ({item['lines']} lines, "
            f"{item['language']})"
            for item in analysis["key_files"]
        )

        parts.append(f"Key files:\n{key_files_text}")

    return "\n\n".join(parts)



