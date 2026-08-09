from __future__ import annotations

from pathlib import Path
import re

import networkx as nx


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

        return {
            "nodes": nodes,
            "edges": edges,
        }

    # ---------------------------------------------------------

    def analyze(
        self,
        repository: Path,
    ) -> dict:

        graph = self.build_graph(
            repository
        )

        return self.to_react_flow(
            graph
        )


graph_service = GraphService()