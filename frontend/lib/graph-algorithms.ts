// ---------------------------------------------------------------------------
// Client-side graph algorithms for the dependency-graph feature.
//
// Ported from devlensOSS's graphAlgo.ts and adapted to replore's data model
// (React Flow edges with `source`/`target` instead of `from`/`to`).
// ---------------------------------------------------------------------------

// Minimal edge shape – works with React Flow edges and plain objects.
interface GraphEdge {
  source: string;
  target: string;
}

// ---------------------------------------------------------------------------
// Adjacency maps
// ---------------------------------------------------------------------------

export interface AdjacencyMap {
  /** Forward: source → targets (this file imports …) */
  adj: Map<string, string[]>;
  /** Reverse: target → sources (… is imported by) */
  radj: Map<string, string[]>;
}

export function buildAdjacency(edges: GraphEdge[]): AdjacencyMap {
  const adj = new Map<string, string[]>();
  const radj = new Map<string, string[]>();

  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    if (!radj.has(edge.target)) radj.set(edge.target, []);
    adj.get(edge.source)!.push(edge.target);
    radj.get(edge.target)!.push(edge.source);
  }

  return { adj, radj };
}

// ---------------------------------------------------------------------------
// BFS – reachable nodes within k hops
// ---------------------------------------------------------------------------

export interface BfsHit {
  nodeId: string;
  distance: number;
}

/**
 * BFS from `startId` following the given adjacency map up to `maxHops`.
 * Returns all reachable nodes **excluding** the start node itself.
 */
export function bfsReachable(
  startId: string,
  adj: Map<string, string[]>,
  maxHops: number,
): Set<BfsHit> {
  const visited = new Set<string>();
  const queue: BfsHit[] = [{ nodeId: startId, distance: 0 }];
  const result = new Set<BfsHit>();
  visited.add(startId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.distance >= maxHops) continue;

    for (const neighbor of adj.get(current.nodeId) ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      const entry: BfsHit = { nodeId: neighbor, distance: current.distance + 1 };
      result.add(entry);
      queue.push(entry);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Blast radius – reverse BFS (who depends on this node?)
// ---------------------------------------------------------------------------

/**
 * Find all nodes that (transitively) depend on `nodeId`.
 * Uses the **reverse** adjacency map.
 */
export function blastRadius(
  nodeId: string,
  radj: Map<string, string[]>,
  maxHops: number = Infinity,
): Set<string> {
  const visited = new Set<string>();
  const queue: { id: string; depth: number }[] = [{ id: nodeId, depth: 0 }];
  const result = new Set<string>();
  visited.add(nodeId);

  while (queue.length > 0) {
    const { id: current, depth } = queue.shift()!;
    if (depth >= maxHops) continue;

    for (const neighbor of radj.get(current) ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      result.add(neighbor);
      queue.push({ id: neighbor, depth: depth + 1 });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Shortest path (BFS)
// ---------------------------------------------------------------------------

/**
 * BFS shortest path from `fromId` to `toId`.
 * Returns the path as an ordered array of node IDs, or `[]` if unreachable.
 */
export function shortestPath(
  fromId: string,
  toId: string,
  adj: Map<string, string[]>,
): string[] {
  if (fromId === toId) return [fromId];

  const visited = new Set<string>();
  const prev = new Map<string, string>();
  const queue = [fromId];
  visited.add(fromId);

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const neighbor of adj.get(current) ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      prev.set(neighbor, current);

      if (neighbor === toId) {
        // Reconstruct path
        const path: string[] = [];
        let node: string | undefined = toId;
        while (node !== undefined) {
          path.unshift(node);
          node = prev.get(node);
        }
        return path;
      }

      queue.push(neighbor);
    }
  }

  return [];
}

// ---------------------------------------------------------------------------
// Subgraph extraction
// ---------------------------------------------------------------------------

/**
 * Collect node IDs for a subgraph centred on `rootId`.
 *
 * - `full`    → merge forward + reverse BFS
 * - `forward` → only forward BFS (what this node depends on)
 * - `reverse` → only reverse BFS (what depends on this node)
 *
 * Always includes `rootId`.
 */
export function getSubgraphNodeIds(
  rootId: string,
  adj: Map<string, string[]>,
  radj: Map<string, string[]>,
  depth: number,
  mode: "full" | "forward" | "reverse",
): Set<string> {
  const ids = new Set<string>([rootId]);

  if (mode === "forward" || mode === "full") {
    for (const hit of bfsReachable(rootId, adj, depth)) {
      ids.add(hit.nodeId);
    }
  }

  if (mode === "reverse" || mode === "full") {
    for (const hit of bfsReachable(rootId, radj, depth)) {
      ids.add(hit.nodeId);
    }
  }

  return ids;
}
