import json
import os
import re
import tomllib
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.database import supabase
from app.services.parser import parser_service

router = APIRouter(
    prefix="/api/repositories",
)

ENTRY_POINT_CANDIDATES = {
    "package.json": "web application",
    "manage.py": "Django application",
    "app.py": "application entry",
    "main.py": "python entry",
    "server.py": "server entry",
    "wsgi.py": "WSGI server",
    "asgi.py": "ASGI server",
    "__main__.py": "python module entry",
    "main.ts": "typescript entry",
    "main.js": "javascript entry",
    "index.ts": "javascript entry",
    "index.js": "javascript entry",
    "main.go": "go entry",
    "main.rs": "rust entry",
    "setup.py": "package setup",
    "pyproject.toml": "package metadata",
    "Cargo.toml": "cargo manifest",
    "go.mod": "go module",
    "Dockerfile": "container entry",
    "docker-compose.yml": "container orchestration",
    "Makefile": "build automation",
}


@router.get("/{repository_id}/architecture")
async def repository_architecture(repository_id: str):
    """
    Returns a structured architecture summary plus a structured,
    data-driven breakdown of the repository (project tree, languages,
    directory statistics, entry points, technologies, dependencies,
    and key files).
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

    tree = build_tree(repository_path)

    analysis = analyze_sources(repository_path)

    entry_points = find_entry_points(repository_path)

    dependencies = parse_dependencies(repository_path)

    technologies = detect_technologies(
        repository_path,
        analysis["languages"],
        dependencies,
    )

    summary = build_architecture_summary(
        tree=tree,
        analysis=analysis,
        entry_points=entry_points,
        dependencies=dependencies,
        technologies=technologies,
    )

    return {
        "repository_id": repository_id,
        "architecture": summary,
        "tree": tree,
        "languages": analysis["languages"],
        "directories": analysis["directories"],
        "entry_points": entry_points,
        "technologies": technologies,
        "dependencies": dependencies,
        "key_files": analysis["key_files"],
    }


def build_tree(root: Path) -> list[dict]:
    """Directory tree of the repository, skipping generated content."""

    children = []

    for item in sorted(
        root.iterdir(),
        key=lambda x: (x.is_file(), x.name.lower()),
    ):

        if item.name == ".git":
            continue

        if parser_service.should_skip(item):
            continue

        if item.is_dir():

            children.append(
                {
                    "name": item.name,
                    "type": "directory",
                    "children": build_tree(item),
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


def analyze_sources(root: Path) -> dict:
    """
    Single source-file pass producing per-language and per-top-level
    directory statistics, plus the largest source files.
    """

    languages: dict[str, dict] = {}

    directories: dict[str, dict] = {}

    key_files: list[dict] = []

    total_files = 0

    for parsed in parser_service.iter_source_files(root):

        total_files += 1

        rel = os.path.relpath(parsed.path, root)

        parts = rel.split(os.sep)

        top = parts[0] if len(parts) > 1 else "(root)"

        language = parsed.language

        language_entry = languages.setdefault(
            language,
            {"files": 0, "lines": 0},
        )

        lines = len(parsed.content.splitlines())

        language_entry["files"] += 1
        language_entry["lines"] += lines

        directory_entry = directories.setdefault(
            top,
            {"files": 0, "lines": 0},
        )

        directory_entry["files"] += 1
        directory_entry["lines"] += lines

        key_files.append(
            {
                "path": rel,
                "lines": lines,
                "language": language,
            }
        )

    for entry in languages.values():

        entry["percent"] = (
            round(entry["files"] / total_files * 100)
            if total_files
            else 0
        )

    key_files.sort(
        key=lambda item: item["lines"],
        reverse=True,
    )

    return {
        "languages": [
            {"name": name, **stats}
            for name, stats in sorted(
                languages.items(),
                key=lambda item: -item[1]["files"],
            )
        ],
        "directories": [
            {"path": name, **stats}
            for name, stats in sorted(
                directories.items(),
                key=lambda item: -item[1]["lines"],
            )
        ],
        "key_files": key_files[:8],
    }


def find_entry_points(root: Path) -> list[dict]:
    """Entry points detected from common entry/manifest filenames in the repo."""

    found: list[dict] = []

    for file in root.rglob("*"):

        if not file.is_file():
            continue

        if parser_service.should_skip(file):
            continue

        if file.name not in ENTRY_POINT_CANDIDATES:
            continue

        rel = os.path.relpath(file, root)

        if rel.count(os.sep) > 3:
            continue

        found.append(
            {
                "path": rel,
                "kind": ENTRY_POINT_CANDIDATES[file.name],
            }
        )

    found.sort(
        key=lambda item: (
            item["path"].count(os.sep),
            item["path"],
        )
    )

    return found[:10]


def parse_dependencies(root: Path) -> list[dict]:
    """Extracts declared dependencies from common manifest files."""

    dependencies: list[dict] = []

    def add(name: str, language: str) -> None:

        name = name.strip()

        if not name:
            return

        if any(
            dependency["name"] == name
            and dependency["language"] == language
            for dependency in dependencies
        ):
            return

        dependencies.append(
            {
                "name": name,
                "language": language,
            }
        )

    # -------------------------------------------------
    # Python
    # -------------------------------------------------

    requirements_file = root / "requirements.txt"

    if requirements_file.exists():

        for line in requirements_file.read_text().splitlines():

            line = line.strip()

            if not line or line.startswith(("#", "-e", "-r", "--")):
                continue

            name = re.split(r"[<>=~!;]", line)[0].strip()

            add(name, "python")

    pyproject_file = root / "pyproject.toml"

    if pyproject_file.exists():

        try:

            data = tomllib.loads(
                pyproject_file.read_text()
            )

            for dependency in data.get("project", {}).get(
                "dependencies",
                [],
            ):

                dependency = str(dependency).split("[")[0].strip()

                name = re.split(r"[<>=~!;]", dependency)[0].strip()

                add(name, "python")

        except Exception:
            pass

    # -------------------------------------------------
    # JavaScript / TypeScript
    # -------------------------------------------------

    package_file = root / "package.json"

    if package_file.exists():

        try:

            package_data = json.loads(
                package_file.read_text()
            )

            for section in (
                "dependencies",
                "peerDependencies",
            ):

                for name in (package_data.get(section) or {}):
                    add(name, "javascript")

        except Exception:
            pass

    # -------------------------------------------------
    # Go
    # -------------------------------------------------

    go_mod = root / "go.mod"

    if go_mod.exists():

        in_block = False

        for line in go_mod.read_text().splitlines():

            line = line.strip()

            if line.startswith("require ("):

                in_block = True
                continue

            if in_block and line.startswith(")"):

                in_block = False
                continue

            if in_block or line.startswith("require "):

                parts = line.replace("require ", "", 1).split()

                if parts:
                    add(parts[0], "go")

    # -------------------------------------------------
    # Rust
    # -------------------------------------------------

    cargo_file = root / "Cargo.toml"

    if cargo_file.exists():

        in_deps = False

        for line in cargo_file.read_text().splitlines():

            line = line.strip()

            if line.startswith("[dependencies]"):

                in_deps = True
                continue

            if in_deps and line.startswith("["):
                break

            if in_deps and "=" in line:

                add(line.split("=")[0].strip().strip('"'), "rust")

    return dependencies


def detect_technologies(
    root: Path,
    languages: list[dict],
    dependencies: list[dict],
) -> list[str]:
    """
    Builds a technology list from detected languages, declared
    dependencies, and repository-level signals (CI, containers).
    """

    known_frameworks = {
        "fastapi",
        "django",
        "flask",
        "react",
        "next",
        "express",
        "vue",
        "svelte",
        "tailwindcss",
        "pytorch",
        "tensorflow",
    }

    technologies = [
        language["name"] for language in languages
    ]

    for dependency in dependencies:

        name = dependency["name"].lower()

        if name in known_frameworks and name not in technologies:

            technologies.append(name)

    if (root / ".github" / "workflows").is_dir():
        technologies.append("GitHub Actions")

    if (
        (root / "Dockerfile").exists()
        or (root / "docker-compose.yml").exists()
    ):
        technologies.append("Docker")

    return technologies


def render_tree(tree: list[dict], depth: int = 0) -> list[str]:
    """Flattens a tree into indented text lines, capped at depth 3."""

    lines: list[str] = []

    for item in tree:

        lines.append("    " * depth + item["name"])

        children = item.get("children")

        if children and depth < 3:

            lines.extend(render_tree(children, depth + 1))

    return lines


def build_architecture_summary(
    *,
    tree: list[dict],
    analysis: dict,
    entry_points: list[dict],
    dependencies: list[dict],
    technologies: list[str],
) -> str:
    """
    Builds a deterministic architecture summary from repository data.
    """

    parts: list[str] = []

    parts.append(
        "Project structure:\n"
        + "\n".join(render_tree(tree))
    )

    if analysis["languages"]:

        languages_text = ", ".join(
            f"{item['name']} ({item['files']} files, "
            f"{item['lines']} lines)"
            for item in analysis["languages"]
        )

        parts.append(
            f"Languages:\n{languages_text}."
        )

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

        parts.append(
            f"Entry points:\n{entry_points_text}"
        )

    if technologies:

        parts.append(
            "Technologies:\n" + ", ".join(technologies) + "."
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

        parts.append(
            f"Key files:\n{key_files_text}"
        )

    return "\n\n".join(parts)