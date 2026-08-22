from __future__ import annotations

from collections import deque
from pathlib import Path
import re
from typing import Literal

import networkx as nx

from app.config import settings
from app.services.parser import IGNORE_DIRECTORIES


class GraphService:
    """
    Generates a dependency graph from repository imports with support for
    filtering, k-hop traversal, and subgraph extraction.
    """

    IMPORT_PATTERNS = [
        r"^import\s+([a-zA-Z0-9_\.]+)",
        r"^from\s+([a-zA-Z0-9_\.]+)\s+import",
        r'require\(["\'"](.+?)["\']\)',
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

            # Compute metadata stored as node attributes.
            parts = current.replace("\\", "/").split("/")
            label = parts[-1] if parts else current
            group = parts[0] if len(parts) > 1 else "root"
            file_type = suffix.lstrip(".")

            graph.add_node(
                current,
                label=label,
                group=group,
                file_type=file_type,
            )

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
    # Node metadata
    # ---------------------------------------------------------

    @staticmethod
    def node_metadata(
        graph: nx.DiGraph,
    ) -> dict[str, dict]:
        """Return per-node metadata including degree-based score."""

        metadata: dict[str, dict] = {}

        for node in graph.nodes:
            attrs = graph.nodes[node]
            parts = node.replace("\\", "/").split("/")

            in_deg = graph.in_degree(node)
            out_deg = graph.out_degree(node)

            metadata[node] = {
                "label": attrs.get("label", parts[-1] if parts else node),
                "group": attrs.get("group", parts[0] if len(parts) > 1 else "root"),
                "file_type": attrs.get("file_type", ""),
                "in_degree": in_deg,
                "out_degree": out_deg,
                "score": in_deg + out_deg,
            }

        return metadata

    # ---------------------------------------------------------
    # k-hop subgraph
    # ---------------------------------------------------------

    @staticmethod
    def k_hop_subgraph(
        graph: nx.DiGraph,
        seed: str,
        k: int = 6,
        direction: Literal["forward", "reverse", "both"] = "both",
    ) -> set[str]:
        """
        BFS from *seed* up to *k* hops. Returns the set of reachable node
        IDs (always includes the seed itself).
        """

        if seed not in graph:
            return set()

        visited: set[str] = {seed}
        queue: deque[tuple[str, int]] = deque([(seed, 0)])

        while queue:
            current, depth = queue.popleft()
            if depth >= k:
                continue

            neighbors: list[str] = []
            if direction in ("forward", "both"):
                neighbors.extend(graph.successors(current))
            if direction in ("reverse", "both"):
                neighbors.extend(graph.predecessors(current))

            for neighbor in neighbors:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, depth + 1))

        return visited

    # ---------------------------------------------------------
    # Filtering
    # ---------------------------------------------------------

    @staticmethod
    def filter_graph(
        graph: nx.DiGraph,
        *,
        groups: list[str] | None = None,
        file_types: list[str] | None = None,
        min_score: int = 0,
    ) -> nx.DiGraph:
        """Return a copy of *graph* keeping only nodes that pass filters."""

        group_set = set(groups) if groups else None
        type_set = set(file_types) if file_types else None

        keep: set[str] = set()

        for node in graph.nodes:
            attrs = graph.nodes[node]
            parts = node.replace("\\", "/").split("/")
            grp = attrs.get("group", parts[0] if len(parts) > 1 else "root")
            ft = attrs.get("file_type", "")
            score = graph.in_degree(node) + graph.out_degree(node)

            if group_set and grp not in group_set:
                continue
            if type_set and ft not in type_set:
                continue
            if score < min_score:
                continue

            keep.add(node)

        return graph.subgraph(keep).copy()

    # ---------------------------------------------------------
    # Serialization
    # ---------------------------------------------------------

    @staticmethod
    def to_react_flow(
        graph: nx.DiGraph,
        *,
        truncated: bool = False,
        original_node_count: int | None = None,
        meta: dict[str, dict] | None = None,
    ) -> dict:

        if meta is None:
            meta = GraphService.node_metadata(graph)

        nodes = []
        edges = []

        for index, node in enumerate(graph.nodes):

            m = meta.get(node, {})

            nodes.append(
                {
                    "id": node,
                    "type": "graph",
                    "data": {
                        "label": m.get("label", node),
                        "filePath": node,
                        "group": m.get("group", "root"),
                        "fileType": m.get("file_type", ""),
                        "inDegree": m.get("in_degree", 0),
                        "outDegree": m.get("out_degree", 0),
                        "score": m.get("score", 0),
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
                    "id": f"{source}->{target}",
                    "source": source,
                    "target": target,
                    "data": {"edgeType": "IMPORTS"},
                }
            )

        # Collect stats.
        groups_seen: set[str] = set()
        types_seen: set[str] = set()
        for m in meta.values():
            groups_seen.add(m.get("group", "root"))
            types_seen.add(m.get("file_type", ""))
        types_seen.discard("")

        result: dict = {
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "totalNodes": original_node_count or len(nodes),
                "totalEdges": len(edges),
                "groups": sorted(groups_seen),
                "fileTypes": sorted(types_seen),
            },
        }

        if truncated:
            result["truncated"] = True
            result["total_nodes"] = original_node_count

        return result

    # ---------------------------------------------------------
    # Main entry point
    # ---------------------------------------------------------

    def analyze(
        self,
        repository: Path,
        *,
        seed: str | None = None,
        k: int = 6,
        direction: str = "both",
        groups: list[str] | None = None,
        file_types: list[str] | None = None,
        min_score: int = 0,
    ) -> dict:

        graph = self.build_graph(
            repository
        )

        original_count = graph.number_of_nodes()

        # k-hop subgraph when a seed node is specified.
        if seed and seed in graph:
            dir_literal: Literal["forward", "reverse", "both"] = (
                "both" if direction not in ("forward", "reverse") else direction  # type: ignore[assignment]
            )
            keep_ids = self.k_hop_subgraph(
                graph, seed, k, dir_literal
            )
            graph = graph.subgraph(keep_ids).copy()

        # Apply node-level filters.
        if groups or file_types or min_score > 0:
            graph = self.filter_graph(
                graph,
                groups=groups,
                file_types=file_types,
                min_score=min_score,
            )

        # Truncation safety cap.
        max_nodes = settings.MAX_GRAPH_NODES
        truncated = False

        if graph.number_of_nodes() > max_nodes:
            ranked = sorted(
                graph.nodes,
                key=lambda n: graph.degree(n),
                reverse=True,
            )
            keep = set(ranked[:max_nodes])
            graph = graph.subgraph(keep).copy()
            truncated = True

        meta = self.node_metadata(graph)

        return self.to_react_flow(
            graph,
            truncated=truncated,
            original_node_count=original_count if truncated else None,
            meta=meta,
        )


graph_service = GraphService()