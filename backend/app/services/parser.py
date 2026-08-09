from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from tree_sitter import Parser
from tree_sitter_language_pack import get_language

from app.config import settings


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
    "node_modules",
    "dist",
    "build",
    "__pycache__",
    ".venv",
    "venv",
    "coverage",
    ".pytest_cache",
}


# ---------------------------------------------------------
# Models
# ---------------------------------------------------------

@dataclass
class ParsedFile:
    path: str
    language: str
    content: str


@dataclass
class CodeChunk:
    file_path: str
    language: str
    chunk_index: int
    content: str


# ---------------------------------------------------------
# Parser Service
# ---------------------------------------------------------

class ParserService:

    def __init__(self):

        self.chunk_size = settings.CHUNK_SIZE
        self.chunk_overlap = settings.CHUNK_OVERLAP

    # ---------------------------------------------------------

    @staticmethod
    def detect_language(file: Path) -> str | None:

        return LANGUAGE_MAP.get(file.suffix.lower())

    # ---------------------------------------------------------

    def get_parser(self, language_name: str) -> Parser:

        language = get_language(language_name)

        parser = Parser(language)

        return parser

    # ---------------------------------------------------------

    def should_skip(self, path: Path) -> bool:

        for part in path.parts:
            if part in IGNORE_DIRECTORIES:
                return True

        return False

    # ---------------------------------------------------------

    def read_file(self, file: Path) -> ParsedFile | None:

        language = self.detect_language(file)

        if language is None:
            return None

        try:

            content = file.read_text(
                encoding="utf-8",
                errors="ignore",
            )

        except Exception:
            return None

        return ParsedFile(
            path=str(file),
            language=language,
            content=content,
        )

    # ---------------------------------------------------------

    def collect_files(
        self,
        repository: Path,
    ) -> list[ParsedFile]:

        parsed_files: list[ParsedFile] = []

        for file in repository.rglob("*"):

            if not file.is_file():
                continue

            if self.should_skip(file):
                continue

            parsed = self.read_file(file)

            if parsed:
                parsed_files.append(parsed)

        return parsed_files

            # ---------------------------------------------------------

    def parse_ast(
        self,
        parsed_file: ParsedFile,
    ):
        """
        Returns the Tree-sitter syntax tree.
        """

        parser = self.get_parser(parsed_file.language)

        tree = parser.parse(
            bytes(parsed_file.content, "utf-8")
        )

        return tree

    # ---------------------------------------------------------

    def chunk_text(
        self,
        text: str,
    ) -> list[str]:
        """
        Splits source code into overlapping chunks.
        """

        if len(text) <= self.chunk_size:
            return [text]

        chunks: list[str] = []

        start = 0

        while start < len(text):

            end = start + self.chunk_size

            chunks.append(text[start:end])

            start += (
                self.chunk_size
                - self.chunk_overlap
            )

        return chunks

    # ---------------------------------------------------------

    def chunk_file(
        self,
        parsed_file: ParsedFile,
    ) -> list[CodeChunk]:

        chunks = self.chunk_text(
            parsed_file.content
        )

        output: list[CodeChunk] = []

        for index, chunk in enumerate(chunks):

            output.append(
                CodeChunk(
                    file_path=parsed_file.path,
                    language=parsed_file.language,
                    chunk_index=index,
                    content=chunk,
                )
            )

        return output

    # ---------------------------------------------------------

    def chunk_repository(
        self,
        repository: Path,
    ) -> list[CodeChunk]:

        parsed_files = self.collect_files(
            repository
        )

        all_chunks: list[CodeChunk] = []

        for parsed in parsed_files:

            all_chunks.extend(
                self.chunk_file(parsed)
            )

        return all_chunks

            # ---------------------------------------------------------

    def repository_statistics(
        self,
        repository: Path,
    ) -> dict:

        parsed_files = self.collect_files(
            repository
        )

        language_count: dict[str, int] = {}

        total_lines = 0

        for file in parsed_files:

            language_count[file.language] = (
                language_count.get(
                    file.language,
                    0,
                )
                + 1
            )

            total_lines += len(
                file.content.splitlines()
            )

        return {
            "files": len(parsed_files),
            "lines": total_lines,
            "languages": language_count,
        }

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