from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterator

from app.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# Supported Languages
# ---------------------------------------------------------

LANGUAGE_MAP = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "tsx",
    ".java": "java",
    ".go": "go",
    ".rs": "rust",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".c": "c",
    ".cs": "c_sharp",
    ".php": "php",
    ".rb": "ruby",
    ".swift": "swift",
    ".kt": "kotlin",
    ".kts": "kotlin",
}


IGNORE_DIRECTORIES = {
    ".git",
    ".next",
    ".turbo",
    ".idea",
    ".vscode",
    ".cache",
    ".gradle",
    ".eggs",
    ".mypy_cache",
    ".ruff_cache",
    ".tox",
    "node_modules",
    "dist",
    "build",
    "out",
    "target",
    "__pycache__",
    ".venv",
    "venv",
    "coverage",
    ".pytest_cache",
}

# Non-source files that provide no useful code information.
IGNORE_EXTENSIONS = {
    # Media
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".svg",
    ".bmp",
    ".tiff",
    # Video / audio
    ".mp4",
    ".mov",
    ".avi",
    ".mkv",
    ".webm",
    ".mp3",
    ".wav",
    ".ogg",
    ".flac",
    ".m4a",
    # Archives
    ".zip",
    ".tar",
    ".gz",
    ".bz2",
    ".xz",
    ".7z",
    ".rar",
    # Fonts
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".eot",
    # Documents
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    # Binaries / build artifacts
    ".class",
    ".jar",
    ".war",
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".o",
    ".a",
    ".obj",
    ".wasm",
    # Databases / caches
    ".db",
    ".sqlite",
    ".sqlite3",
    ".pyc",
    ".pyo",
    ".pkl",
    ".log",
}

# Generated files that usually duplicate source information.
GENERATED_FILES = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "Cargo.lock",
    "poetry.lock",
    "Pipfile.lock",
    "Gemfile.lock",
    "composer.lock",
    "go.sum",
}

# ---------------------------------------------------------
# Models
# ---------------------------------------------------------

@dataclass
class ParsedFile:
    path: str
    language: str
    content: str


# ---------------------------------------------------------
# Parser Service
# ---------------------------------------------------------

class ParserService:

    @staticmethod
    def detect_language(file: Path) -> str | None:

        return LANGUAGE_MAP.get(file.suffix.lower())

    # ---------------------------------------------------------

    def should_skip(self, path: Path) -> bool:

        for part in path.parts:
            if part in IGNORE_DIRECTORIES:
                return True

        if path.suffix.lower() in IGNORE_EXTENSIONS:
            return True

        if path.name in GENERATED_FILES:
            return True

        if ".min." in path.name:
            return True

        return False

    # ---------------------------------------------------------

    def file_size(self, file: Path) -> int | None:

        try:
            return file.stat().st_size
        except OSError:
            return None

    # ---------------------------------------------------------

    def read_file(self, file: Path) -> ParsedFile | None:

        language = self.detect_language(file)

        if language is None:
            return None

        size = self.file_size(file)

        if size is None:
            return None

        if size > settings.MAX_FILE_SIZE_KB * 1024:
            return None

        try:

            content = file.read_text(
                encoding="utf-8",
                errors="ignore",
            )

        except Exception:
            return None

        # Binary content (e.g. a file with a source-like extension).
        if "\x00" in content:
            return None

        return ParsedFile(
            path=str(file),
            language=language,
            content=content,
        )

    # ---------------------------------------------------------

    @staticmethod
    def _record_skip(
        on_skip: Callable[[str, str], None] | None,
        file: Path,
        reason: str,
    ) -> None:
        """
        Logs a skipped file and, when a collector is provided, records
        it so callers can surface skip reasons (e.g. a ScanReport).
        """

        logger.debug("Skipped %s: %s.", file, reason)

        if on_skip is not None:
            on_skip(str(file), reason)

    # ---------------------------------------------------------

    def iter_source_files(
        self,
        repository: Path,
        *,
        on_skip: Callable[[str, str], None] | None = None,
    ) -> Iterator[ParsedFile]:
        """
        Yields valid source files one at a time so callers never hold
        the whole repository in memory.

        Skips irrelevant files and gracefully stops once the
        configured file-count or repository-size limit is reached.

        """

        max_file_size = settings.MAX_FILE_SIZE_KB * 1024
        max_repo_size = settings.MAX_REPOSITORY_SIZE_MB * 1024 * 1024

        file_count = 0
        total_size = 0

        for file in repository.rglob("*"):

            if not file.is_file():
                continue

            if self.should_skip(file):
                self._record_skip(
                    on_skip,
                    file,
                    "ignored file or directory",
                )
                continue

            size = self.file_size(file)

            if size is None:
                self._record_skip(
                    on_skip,
                    file,
                    "could not stat file",
                )
                continue

            if size > max_file_size:
                self._record_skip(
                    on_skip,
                    file,
                    "file exceeds MAX_FILE_SIZE_KB",
                )
                continue

            if size == 0:
                self._record_skip(
                    on_skip,
                    file,
                    "empty file",
                )
                continue

            if file_count >= settings.MAX_FILE_COUNT:
                logger.info(
                    "Reached MAX_FILE_COUNT (%s) while scanning %s.",
                    settings.MAX_FILE_COUNT,
                    repository,
                )
                break

            if total_size + size > max_repo_size:
                logger.info(
                    "Reached MAX_REPOSITORY_SIZE_MB (%s) while scanning %s.",
                    settings.MAX_REPOSITORY_SIZE_MB,
                    repository,
                )
                break

            parsed = self.read_file(file)

            if parsed is None:
                self._record_skip(
                    on_skip,
                    file,
                    "unreadable or binary content",
                )
                continue

            file_count += 1
            total_size += size

            yield parsed

    # ---------------------------------------------------------

    def collect_files(
        self,
        repository: Path,
    ) -> list[ParsedFile]:

        return list(self.iter_source_files(repository))

    def repository_statistics(
        self,
        repository: Path,
    ) -> dict:

        language_count: dict[str, int] = {}

        file_type_count: dict[str, int] = {}

        total_lines = 0

        blank_lines = 0

        file_count = 0

        largest_files: list[dict] = []

        for file in self.iter_source_files(repository):

            file_count += 1

            language_count[file.language] = (
                language_count.get(
                    file.language,
                    0,
                )
                + 1
            )

            extension = (
                Path(file.path).suffix.lower()
                or "no extension"
            )

            file_type_count[extension] = (
                file_type_count.get(
                    extension,
                    0,
                )
                + 1
            )

            lines = file.content.splitlines()

            total_lines += len(lines)

            blank_lines += sum(
                1 for line in lines if not line.strip()
            )

            largest_files.append(
                {
                    "path": os.path.relpath(
                        file.path,
                        repository,
                    ),
                    "lines": len(lines),
                    "language": file.language,
                }
            )

        largest_files.sort(
            key=lambda item: item["lines"],
            reverse=True,
        )

        return {
            "files": file_count,
            "lines": total_lines,
            "blank_lines": blank_lines,
            "directories": self.count_directories(repository),
            "languages": language_count,
            "file_types": file_type_count,
            "largest_files": largest_files[:5],
        }

    # ---------------------------------------------------------

    def count_directories(self, repository: Path) -> int:
        """Number of directories in a repository, ignoring generated ones."""

        count = 0

        for path in repository.rglob("*"):

            if not path.is_dir():
                continue

            if self.should_skip(path):
                continue

            count += 1

        return count

    # ---------------------------------------------------------

    def dependency_files(
        self,
        repository: Path,
    ) -> list[Path]:

        files: list[Path] = []

        dependency_files = {
            "package.json",
            "requirements.txt",
            "pyproject.toml",
            "Cargo.toml",
            "go.mod",
            "pom.xml",
        }

        for file in repository.rglob("*"):

            if file.name in dependency_files:
                files.append(file)

        return files


parser_service = ParserService()