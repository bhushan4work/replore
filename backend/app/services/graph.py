from __future__ import annotations

from pathlib import Path
import re

import networkx as nx

from app.config import settings
from app.services.parser import IGNORE_DIRECTORIES


class GraphService:
    """
    Generates a dependency graph from repository imports.
    """

    IMPORT_PATTERNS = [
        r"^import\s+([a-zA-Z0-9_\.]+)",
        r"^from\s+([a-zA-Z0-9_\.]+)\s+import",
        r'require\(["\'](.+?)["\']\)',
        r'import\s+.*?\s+from\s+["\'](.+?)["\']',
    ]

    # ---------------------------------------------------------

    def _extract_imports(
        self,
        source: str,
    ) -> list[str]:

        imports: list[str] = []

        for pattern in self.IMPORT_PATTERNS:

            matches = re.findall(
                pattern,
                source,
                re.MULTILINE,
            )

            imports.extend(matches)

        return imports

    # ---------------------------------------------------------

    def build_graph(
        self,
        repository: Path,
    ) -> nx.DiGraph:

        graph = nx.DiGraph()

        for file in repository.rglob("*"):

            if not file.is_file():
                continue

            if any(
                part in IGNORE_DIRECTORIES
                for part in file.parts
            ):
                continue

            suffix = file.suffix.lower()

            if suffix not in {
                ".py",
                ".js",
                ".jsx",
                ".ts",
                ".tsx",
            }:
                continue

            try:

                if file.stat().st_size > settings.MAX_FILE_SIZE_KB * 1024:
                    continue

            except OSError:
                continue

            try:
                content = file.read_text(
                    encoding="utf-8",
                    errors="ignore",
                )
            except Exception:
                continue

            current = str(
                file.relative_to(repository)
            )

            graph.add_node(current)

            imports = self._extract_imports(
                content
            )

            for imported in imports:

                graph.add_edge(
                    current,
                    imported,
                )

        return graph

    # ---------------------------------------------------------

    @staticmethod
    def to_react_flow(
        graph: nx.DiGraph,
        *,
        truncated: bool = False,
        original_node_count: int | None = None,
    ) -> dict:

        nodes = []
        edges = []

        for index, node in enumerate(graph.nodes):

            nodes.append(
                {
                    "id": node,
                    "data": {
                        "label": node,
                    },
                    "position": {
                        "x": (index % 5) * 250,
                        "y": (index // 5) * 150,
                    },
                }
            )

        for source, target in graph.edges:

            edges.append(
                {
                    "id": f"{source}-{target}",
                    "source": source,
                    "target": target,
                }
            )

        result: dict = {
            "nodes": nodes,
            "edges": edges,
        }

        if truncated:
            result["truncated"] = True
            result["total_nodes"] = original_node_count

        return result

    # ---------------------------------------------------------

    def analyze(
        self,
        repository: Path,
    ) -> dict:

        graph = self.build_graph(
            repository
        )

        max_nodes = settings.MAX_GRAPH_NODES
        original_count = graph.number_of_nodes()
        truncated = False

        if original_count > max_nodes:
            # Keep the most-connected nodes (highest total degree).
            ranked = sorted(
                graph.nodes,
                key=lambda n: graph.degree(n),
                reverse=True,
            )

            keep = set(ranked[:max_nodes])
            graph = graph.subgraph(keep).copy()
            truncated = True

        return self.to_react_flow(
            graph,
            truncated=truncated,
            original_node_count=original_count if truncated else None,
        )


graph_service = GraphService()