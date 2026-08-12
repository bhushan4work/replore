from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Iterator

from tree_sitter import Parser, Tree
from tree_sitter_language_pack import get_language

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

# Maps tree-sitter node-type substrings to a symbol kind. Used to turn
# functions/classes/... into their own chunks regardless of the exact
# node type a grammar uses (function_definition, class_declaration,
# func_declaration, struct_item, ...). Order matters: more specific
# prefixes come first.
SYMBOL_TYPE_PREFIXES = (
    ("method_", "method"),
    ("function_", "function"),
    ("func_", "function"),
    ("class_", "class"),
    ("object_", "class"),
    ("interface_", "interface"),
    ("protocol_", "interface"),
    ("struct_", "struct"),
    ("enum_", "enum"),
    ("trait_", "trait"),
    ("namespace_", "namespace"),
    ("module_", "module"),
    ("mod_", "module"),
)


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
    symbol: str | None = None
    symbol_type: str | None = None
    start_line: int | None = None
    end_line: int | None = None


@dataclass
class ScanReport:
    """
    Summary of a Tree-sitter parsing pass over a repository.

    `skipped` contains files that were excluded before parsing
    (unsupported language, too large, unreadable, ...) as
    (path, reason) pairs. `failed` contains files that were read but
    could not be parsed.
    """

    scanned: int = 0
    parsed: int = 0
    skipped: list[tuple[str, str]] = field(default_factory=list)
    failed: list[tuple[str, str]] = field(default_factory=list)


# ---------------------------------------------------------
# Parser Service
# ---------------------------------------------------------

# Memoized availability of each tree-sitter grammar (calling
# get_language() is expensive and raises for missing grammars).
_LANGUAGE_SUPPORT_CACHE: dict[str, bool] = {}


class ParserService:

    def __init__(self):

        self.chunk_size = settings.CHUNK_SIZE
        self.chunk_overlap = settings.CHUNK_OVERLAP

    # ---------------------------------------------------------

    @staticmethod
    def detect_language(file: Path) -> str | None:

        return LANGUAGE_MAP.get(file.suffix.lower())

    # ---------------------------------------------------------

    @staticmethod
    def is_language_supported(language_name: str) -> bool:
        """
        Whether a Tree-sitter grammar is available for a language.
        Never raises; results are cached.
        """

        supported = _LANGUAGE_SUPPORT_CACHE.get(language_name)

        if supported is None:

            try:
                get_language(language_name)
                supported = True
            except Exception:
                supported = False

            _LANGUAGE_SUPPORT_CACHE[language_name] = supported

        return supported

    # ---------------------------------------------------------

    def get_parser(self, language_name: str) -> Parser | None:

        if not self.is_language_supported(language_name):
            return None

        language = get_language(language_name)

        parser = Parser(language)

        return parser

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
        require_parseable: bool = False,
        on_skip: Callable[[str, str], None] | None = None,
    ) -> Iterator[ParsedFile]:
        """
        Yields valid source files one at a time so callers never hold
        the whole repository in memory.

        Skips irrelevant files and gracefully stops once the
        configured file-count or repository-size limit is reached.

        When `require_parseable` is True, only files whose language has
        a Tree-sitter grammar are read, so unparseable files are never
        loaded into memory.
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

            if require_parseable:

                language = self.detect_language(file)

                if language is None:
                    self._record_skip(
                        on_skip,
                        file,
                        "unsupported source extension",
                    )
                    continue

                if not self.is_language_supported(language):
                    self._record_skip(
                        on_skip,
                        file,
                        f"no tree-sitter grammar for '{language}'",
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

            # ---------------------------------------------------------

    def _parse_tree(
        self,
        parsed_file: ParsedFile,
    ) -> tuple[Tree | None, str | None]:
        """
        Parses a file with Tree-sitter, returning (tree, error).
        Never raises: an unsupported language or a parse failure is
        reported as an error so the caller can skip the file and
        continue with the remaining files.
        """

        parser = self.get_parser(parsed_file.language)

        if parser is None:
            return (
                None,
                f"no tree-sitter grammar available for "
                f"'{parsed_file.language}'",
            )

        try:

            tree = parser.parse(
                bytes(parsed_file.content, "utf-8")
            )

        except Exception as exc:

            return (
                None,
                f"{type(exc).__name__}: {exc}",
            )

        return tree, None

    # ---------------------------------------------------------

    def parse_ast(
        self,
        parsed_file: ParsedFile,
    ) -> Tree | None:
        """
        Returns the Tree-sitter syntax tree, or None when the file
        cannot be parsed.

        File-level failures are logged and never raised, so a single
        malformed or unparseable file cannot fail the whole analysis.
        """

        tree, error = self._parse_tree(parsed_file)

        if error is not None:

            logger.warning(
                "Skipped parsing %s: %s.",
                parsed_file.path,
                error,
            )

        return tree

    # ---------------------------------------------------------

    def scan_repository(
        self,
        repository: Path,
    ) -> ScanReport:
        """
        Parses every parseable source file with Tree-sitter and returns
        a ScanReport of skipped and failed files for debugging.

        Only supported source files are read, and per-file failures are
        contained: they never abort the scan.
        """

        report = ScanReport()

        def record_skip(
            path: str,
            reason: str,
        ) -> None:

            report.skipped.append((path, reason))

        for parsed in self.iter_source_files(
            repository,
            require_parseable=True,
            on_skip=record_skip,
        ):

            report.scanned += 1

            tree, error = self._parse_tree(parsed)

            if error is not None:

                logger.warning(
                    "Skipped parsing %s: %s.",
                    parsed.path,
                    error,
                )

                report.failed.append((parsed.path, error))

            else:

                report.parsed += 1

        return report

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

    @staticmethod
    def _symbol_type(node_type: str) -> str | None:
        """Classifies a tree-sitter node type into a symbol kind."""

        for prefix, symbol_type in SYMBOL_TYPE_PREFIXES:
            if prefix in node_type:
                return symbol_type

        return None

    # ---------------------------------------------------------

    @staticmethod
    def _symbol_name(node) -> str | None:
        """Best-effort extraction of a symbol's name from a node."""

        name_node = node.child_by_field_name("name")

        if name_node is not None:
            try:
                return name_node.text.decode("utf-8", "ignore")
            except Exception:
                pass

        for child in node.named_children:
            if child.type in (
                "identifier",
                "property_identifier",
                "field_identifier",
                "type_identifier",
            ):
                try:
                    return child.text.decode("utf-8", "ignore")
                except Exception:
                    pass

        return None

    # ---------------------------------------------------------

    @staticmethod
    def _node_text(content: str, node) -> str:
        """Returns a node's source text, falling back to byte slicing."""

        try:
            return node.text.decode("utf-8", "ignore")
        except Exception:
            return content[node.start_byte:node.end_byte]

    # ---------------------------------------------------------

    def _make_chunk(
        self,
        parsed_file: ParsedFile,
        content: str,
        *,
        symbol: str | None = None,
        symbol_type: str | None = None,
        start_line: int | None = None,
        end_line: int | None = None,
    ) -> CodeChunk:

        return CodeChunk(
            file_path=parsed_file.path,
            language=parsed_file.language,
            chunk_index=0,
            content=content,
            symbol=symbol,
            symbol_type=symbol_type,
            start_line=start_line,
            end_line=end_line,
        )

    # ---------------------------------------------------------

    def _split_to_chunks(
        self,
        parsed_file: ParsedFile,
        content: str,
        *,
        symbol: str | None = None,
        symbol_type: str | None = None,
        start_line: int | None = None,
        end_line: int | None = None,
    ) -> list[CodeChunk]:
        """
        Creates one chunk per part, splitting oversized symbols or
        module blocks so no chunk ever exceeds the configured size.
        """

        parts = self.chunk_text(content)

        return [
            self._make_chunk(
                parsed_file,
                part,
                symbol=symbol,
                symbol_type=symbol_type,
                start_line=start_line,
                end_line=end_line,
            )
            for part in parts
        ]

    # ---------------------------------------------------------

    def _chunk_by_symbols(
        self,
        parsed_file: ParsedFile,
    ) -> list[CodeChunk]:
        """
        Chunks a file by its tree-sitter symbols: functions, classes,
        and similar declarations become their own chunks (with symbol
        metadata), while the remaining module-level code is grouped into
        module chunks. Falls back to empty when the file cannot be
        parsed.
        """

        tree = self.parse_ast(parsed_file)

        if tree is None:
            return []

        root = tree.root_node

        chunks: list[CodeChunk] = []

        module_parts: list[str] = []
        module_len = 0

        def flush_module() -> None:

            nonlocal module_parts, module_len

            if module_parts:

                chunks.extend(
                    self._split_to_chunks(
                        parsed_file,
                        "".join(module_parts),
                        symbol=None,
                        symbol_type="module",
                    )
                )

                module_parts = []
                module_len = 0

        for node in root.named_children:

            symbol_type = self._symbol_type(node.type)

            if symbol_type is None:

                text = self._node_text(parsed_file.content, node)

                if text:
                    module_parts.append(text)
                    module_len += len(text)

                    if module_len >= self.chunk_size:
                        flush_module()

                continue

            flush_module()

            text = self._node_text(parsed_file.content, node)

            if not text:
                continue

            chunks.extend(
                self._split_to_chunks(
                    parsed_file,
                    text,
                    symbol=self._symbol_name(node),
                    symbol_type=symbol_type,
                    start_line=node.start_point[0] + 1,
                    end_line=node.end_point[0] + 1,
                )
            )

        flush_module()

        return chunks

    # ---------------------------------------------------------

    def _chunk_by_text(
        self,
        parsed_file: ParsedFile,
    ) -> list[CodeChunk]:
        """
        Fallback chunking used when a file cannot be parsed with
        tree-sitter (unsupported language, unparseable content, ...).
        """

        return self._split_to_chunks(
            parsed_file,
            parsed_file.content,
            symbol=None,
            symbol_type=None,
        )

    # ---------------------------------------------------------

    def chunk_file(
        self,
        parsed_file: ParsedFile,
    ) -> list[CodeChunk]:
        """
        Chunks a file into meaningful pieces: functions, classes, and
        modules where tree-sitter can parse it, otherwise plain text
        splitting. Every chunk is bounded by CHUNK_SIZE.
        """

        chunks = self._chunk_by_symbols(parsed_file)

        if not chunks:
            chunks = self._chunk_by_text(parsed_file)

        for index, chunk in enumerate(chunks):
            chunk.chunk_index = index

        return chunks

    # ---------------------------------------------------------

    def chunk_repository(
        self,
        repository: Path,
    ) -> Iterator[CodeChunk]:
        """
        Yields code chunks one file at a time, so callers can embed and
        persist them incrementally without holding the repository in
        memory.
        """

        for parsed in self.iter_source_files(repository):

            yield from self.chunk_file(parsed)

            # ---------------------------------------------------------

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