// ---------------------------------------------------------------------------
// Shared types for the enhanced dependency-graph feature.
// ---------------------------------------------------------------------------

/** Overlay / subgraph exploration state pushed onto a navigation stack. */
export interface OverlayState {
  rootNodeId: string;
  mode: "full" | "forward" | "reverse";
  hopDepth: number;
  activeGroups: string[];
  activeFileTypes: string[];
}

/** Node data returned by the enhanced backend. */
export interface EnhancedNodeData extends Record<string, unknown> {
  label: string;
  filePath: string;
  group: string;
  fileType: string;
  inDegree: number;
  outDegree: number;
  score: number;
}

/** Edge metadata returned by the enhanced backend. */
export interface EnhancedEdgeData {
  edgeType: string;
}

/** Aggregate stats returned alongside the graph payload. */
export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  groups: string[];
  fileTypes: string[];
}

/** Full graph payload from GET /api/repositories/{id}/graph. */
export interface EnhancedGraphResponse {
  repository_id: string;
  graph: {
    nodes: {
      id: string;
      data: EnhancedNodeData;
      position: { x: number; y: number };
      type?: string;
    }[];
    edges: {
      id: string;
      source: string;
      target: string;
      data?: EnhancedEdgeData;
    }[];
    truncated?: boolean;
    total_nodes?: number;
    stats?: GraphStats;
  };
}

// ---------------------------------------------------------------------------
// Palette helpers (shared across graph components)
// ---------------------------------------------------------------------------

export const GROUP_PALETTE = [
  "#22c55e", // green
  "#f97316", // orange
  "#3b82f6", // blue
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
];

export function colorForGroup(group: string): string {
  let hash = 0;
  for (let i = 0; i < group.length; i++) {
    hash = (hash * 31 + group.charCodeAt(i)) >>> 0;
  }
  return GROUP_PALETTE[hash % GROUP_PALETTE.length];
}
