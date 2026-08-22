"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY } from "d3-force";
import { getRepositoryGraph, type RepositoryGraphNode } from "@/lib/api";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useNodesState,
  useEdgesState,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  buildAdjacency,
  getSubgraphNodeIds,
} from "@/lib/graph-algorithms";
import { colorForGroup } from "@/lib/graph-types";
import type {
  EnhancedNodeData,
} from "@/lib/graph-types";

// ---------------------------------------------------------
// Data model
// ---------------------------------------------------------

export interface GraphNodeData extends Record<string, unknown> {
  label: string;
  filePath: string;
  group: string;
  fileType: string;
  inDegree: number;
  outDegree: number;
  score: number;
  isAffected?: boolean;
  isBlastActive?: boolean;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  data?: { edgeType?: string };
}

export interface RepoGraphProps {
  repositoryId: string;
  nodes: (GraphNodeData & { id: string; position?: { x: number; y: number } })[];
  edges: GraphEdgeData[];
  stats?: {
    totalNodes: number;
    totalEdges: number;
    groups: string[];
    fileTypes: string[];
  };
  truncated?: boolean;
  totalNodes?: number;
  /** Callback when the user clicks a node to explore subgraph server-side. */
  onExploreNode?: (nodeId: string) => void;
}

// ---------------------------------------------------------
// Custom node
// ---------------------------------------------------------

function GraphNode({ data, selected }: NodeProps<Node<GraphNodeData>>) {
  const color = colorForGroup(data.group);
  const isHighDegree = data.score >= 5;

  let borderClass = "border-[#2a2a2a]";
  if (selected) {
    borderClass = "border-white/40 ring-1 ring-white/20";
  } else if (data.isBlastActive && data.isAffected) {
    borderClass = "border-red-500/60 ring-1 ring-red-500/20";
  }

  return (
    <div
      className={`relative rounded-xl border px-4 py-3 shadow-lg shadow-black/40 transition-all ${borderClass}`}
      style={{ background: "#161616" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="whitespace-nowrap text-sm font-medium text-white max-w-[180px] truncate">
          {data.label}
        </span>
        {isHighDegree && (
          <span
            className="ml-auto text-[10px] font-mono tabular-nums"
            style={{ color: color, opacity: 0.7 }}
          >
            {data.score}
          </span>
        )}
      </div>

      {/* File type badge */}
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-gray-500 truncate max-w-[140px]">
          {data.group}/
        </span>
        {data.fileType && (
          <span
            className="text-[9px] font-mono px-1 py-0.5 rounded"
            style={{
              background: `${color}18`,
              color: color,
              border: `1px solid ${color}30`,
            }}
          >
            .{data.fileType}
          </span>
        )}
      </div>

      {/* Degree indicators */}
      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-gray-500 font-mono">
        <span title="Incoming dependencies">↓{data.inDegree}</span>
        <span title="Outgoing dependencies">↑{data.outDegree}</span>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!h-0 !w-0 !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-0 !w-0 !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0"
      />
    </div>
  );
}

const nodeTypes: NodeTypes = { graph: GraphNode };

// ---------------------------------------------------------
// Filter bar
// ---------------------------------------------------------

function GraphFilterBar({
  groups,
  fileTypes,
  activeGroups,
  activeFileTypes,
  onGroupToggle,
  onFileTypeToggle,
  onResetFilters,
  nodeCount,
  edgeCount,
}: {
  groups: string[];
  fileTypes: string[];
  activeGroups: Set<string>;
  activeFileTypes: Set<string>;
  onGroupToggle: (g: string) => void;
  onFileTypeToggle: (t: string) => void;
  onResetFilters: () => void;
  nodeCount: number;
  edgeCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      {/* Toggle + stats row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-white/20 hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h10M4 18h6" />
          </svg>
          Filters
          <span className="font-mono text-[10px] text-gray-500">
            {nodeCount}n · {edgeCount}e
          </span>
        </button>
      </div>

      {/* Filter panel */}
      {open && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-4 shadow-2xl shadow-black/60 max-w-[320px]">
          {/* Groups */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Directories
              </span>
              <span className="text-[10px] font-mono text-gray-600">
                {activeGroups.size}/{groups.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {groups.map((g) => {
                const active = activeGroups.has(g);
                const c = colorForGroup(g);
                return (
                  <button
                    key={g}
                    onClick={() => onGroupToggle(g)}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-mono transition-colors"
                    style={{
                      background: active ? `${c}18` : "transparent",
                      color: active ? c : "#6b7280",
                      border: `1px solid ${active ? `${c}40` : "#2a2a2a"}`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: active ? c : "#4b5563" }}
                    />
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* File types */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                File Types
              </span>
              <span className="text-[10px] font-mono text-gray-600">
                {activeFileTypes.size}/{fileTypes.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {fileTypes.map((t) => {
                const active = activeFileTypes.has(t);
                return (
                  <button
                    key={t}
                    onClick={() => onFileTypeToggle(t)}
                    className="rounded-md px-2 py-1 text-[11px] font-mono transition-colors"
                    style={{
                      background: active ? "#3b82f618" : "transparent",
                      color: active ? "#60a5fa" : "#6b7280",
                      border: `1px solid ${active ? "#3b82f640" : "#2a2a2a"}`,
                    }}
                  >
                    .{t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 rounded-md border border-[#2a2a2a] px-2.5 py-1 text-[11px] text-gray-500 transition-colors hover:border-white/20 hover:text-white"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// Overlay toolbar (subgraph exploration)
// ---------------------------------------------------------

function OverlayToolbar({
  rootLabel,
  mode,
  hopDepth,
  onModeChange,
  onHopDepthChange,
  onClose,
  nodeCount,
  edgeCount,
}: {
  rootLabel: string;
  mode: "full" | "forward" | "reverse";
  hopDepth: number;
  onModeChange: (m: "full" | "forward" | "reverse") => void;
  onHopDepthChange: (d: number) => void;
  onClose: () => void;
  nodeCount: number;
  edgeCount: number;
}) {
  return (
    <div
      className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 h-12"
      style={{ borderBottom: "1px solid #2a2a2a", background: "#0a0a0a" }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Close
      </button>

      {/* Label */}
      <div className="flex items-center gap-1 text-xs overflow-hidden">
        <span className="text-gray-400">Exploring:</span>
        <span className="text-white font-semibold truncate max-w-[200px]">
          {rootLabel}
        </span>
      </div>

      {/* Mode selector */}
      <div className="flex items-center gap-1 ml-4">
        {(["full", "forward", "reverse"] as const).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className="rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors"
            style={{
              background: mode === m ? "#3b82f618" : "transparent",
              color: mode === m ? "#60a5fa" : "#6b7280",
              border: `1px solid ${mode === m ? "#3b82f640" : "transparent"}`,
            }}
          >
            {m === "full" ? "Both" : m === "forward" ? "Deps" : "Dependents"}
          </button>
        ))}
      </div>

      {/* Hop depth */}
      <div className="flex items-center gap-1.5 ml-2">
        <span className="text-[10px] text-gray-500">Hops:</span>
        <select
          value={hopDepth}
          onChange={(e) => onHopDepthChange(Number(e.target.value))}
          className="rounded-md bg-[#161616] border border-[#2a2a2a] px-1.5 py-0.5 text-[10px] text-gray-300 font-mono"
        >
          {[1, 2, 3, 4, 5, 6, 8, 10].map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1" />

      {/* Stats */}
      <span className="text-[10px] font-mono text-gray-600 shrink-0">
        {nodeCount} nodes · {edgeCount} edges
      </span>
    </div>
  );
}

// ---------------------------------------------------------
// Main graph component
// ---------------------------------------------------------

export default function RepoGraph({
  repositoryId,
  nodes: inputNodes,
  edges: inputEdges,
  stats,
  truncated,
  totalNodes,
  onExploreNode,
}: RepoGraphProps) {
  // Cache computed positions to prevent full graph layout jumps
  const nodePositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Current overlay state (single exploration view)
  const [currentOverlay, setCurrentOverlay] = useState<{
    rootNodeId: string;
    rootLabel: string;
    mode: "full" | "forward" | "reverse";
    hopDepth: number;
  } | null>(null);

  // Fetched overlay graph state
  const [overlayGraph, setOverlayGraph] = useState<{
    nodes: RepoGraphProps["nodes"];
    edges: RepoGraphProps["edges"];
  } | null>(null);

  // Filter state
  const allGroups = useMemo(
    () => stats?.groups ?? [...new Set(inputNodes.map((n) => n.group))].sort(),
    [stats, inputNodes],
  );
  const allFileTypes = useMemo(
    () =>
      stats?.fileTypes ??
      [...new Set(inputNodes.map((n) => n.fileType).filter(Boolean))].sort(),
    [stats, inputNodes],
  );
  const [activeGroups, setActiveGroups] = useState<Set<string>>(
    () => new Set(allGroups),
  );
  const [activeFileTypes, setActiveFileTypes] = useState<Set<string>>(
    () => new Set(allFileTypes),
  );

  // Edge hover state
  const [hoveredEdges, setHoveredEdges] = useState<Set<string>>(
    () => new Set(),
  );
  // Selected node
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Blast radius state
  const [blastRadiusResult, setBlastRadiusResult] = useState<{
    rootId: string;
    affectedNodes: RepoGraphProps["nodes"];
    affectedEdges: RepoGraphProps["edges"];
    affectedIds: Set<string>;
  } | null>(null);
  const [isBlastLoading, setIsBlastLoading] = useState(false);

  const isOverlay = currentOverlay !== null;

  // Clear position cache if repository changes
  useEffect(() => {
    nodePositions.current.clear();
  }, [repositoryId]);

  // Fetch overlay data from API
  useEffect(() => {
    if (!currentOverlay) {
      setOverlayGraph(null);
      return;
    }

    let ignore = false;

    getRepositoryGraph(repositoryId, {
      seed: currentOverlay.rootNodeId,
      k: currentOverlay.hopDepth,
      direction: currentOverlay.mode === "full" ? "both" : currentOverlay.mode,
    })
      .then((data) => {
        if (!ignore) {
          setOverlayGraph({
            nodes: data.graph.nodes.map(n => ({
              id: n.id,
              label: n.data.label ?? n.id,
              filePath: n.data.filePath ?? n.id,
              group: n.data.group ?? "root",
              fileType: n.data.fileType ?? "",
              inDegree: n.data.inDegree ?? 0,
              outDegree: n.data.outDegree ?? 0,
              score: n.data.score ?? 0,
              position: n.position,
            })),
            edges: data.graph.edges as any,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch overlay graph", err);
      });

    return () => {
      ignore = true;
    };
  }, [repositoryId, currentOverlay]);

  // Compute visible nodes and edges
  const { visibleNodes, visibleEdges } = useMemo(() => {
    let baseNodes = currentOverlay && overlayGraph ? overlayGraph.nodes : inputNodes;
    let baseEdges = currentOverlay && overlayGraph ? overlayGraph.edges : inputEdges;

    // Apply group/fileType filters
    baseNodes = baseNodes.filter(
      (n) => activeGroups.has(n.group) && (activeFileTypes.has(n.fileType) || !n.fileType),
    );

    const baseNodeIdSet = new Set(baseNodes.map((n) => n.id));
    baseEdges = baseEdges.filter(
      (e) => baseNodeIdSet.has(e.source) && baseNodeIdSet.has(e.target),
    );

    if (blastRadiusResult) {
      const mergedNodesMap = new Map(baseNodes.map(n => [n.id, n]));
      blastRadiusResult.affectedNodes.forEach(n => mergedNodesMap.set(n.id, n));
      
      const mergedEdgesMap = new Map(baseEdges.map(e => [e.id, e]));
      blastRadiusResult.affectedEdges.forEach(e => mergedEdgesMap.set(e.id, e));

      return {
        visibleNodes: Array.from(mergedNodesMap.values()),
        visibleEdges: Array.from(mergedEdgesMap.values()),
      };
    }

    return { visibleNodes: baseNodes, visibleEdges: baseEdges };
  }, [inputNodes, inputEdges, activeGroups, activeFileTypes, currentOverlay, overlayGraph, blastRadiusResult]);

  // Convert to React Flow format
  const flowNodes: Node<GraphNodeData>[] = useMemo(() => {
    const nodeWidth = 280;
    const nodeHeight = 100;

    // Create a mutable copy of nodes.
    const d3Nodes = visibleNodes.map((n) => {
      const cached = nodePositions.current.get(n.id);
      if (cached) {
        // Lock previously computed nodes in place so the graph never reshuffles
        return { ...n, x: cached.x, y: cached.y, fx: cached.x, fy: cached.y };
      }
      return {
        ...n,
        x: Math.random() * 50 - 25,
        y: Math.random() * 50 - 25,
      };
    });
    // Create a mutable copy of edges
    const d3Edges = visibleEdges.map((e) => ({ ...e, source: e.source, target: e.target }));

    // Run a static force-directed simulation to achieve an organic, centralized layout
    const simulation = forceSimulation(d3Nodes as any)
      .force(
        "link",
        forceLink(d3Edges as any)
          .id((d: any) => d.id)
          .distance(300) // Optimal distance for connected nodes
      )
      .force("charge", forceManyBody().strength(-3500).distanceMax(1200)) // Repel nodes strongly but drop off at a distance so isolated components aren't pushed infinitely away
      .force("center", forceCenter(0, 0)) // Keep graph centered
      .force("collide", forceCollide().radius(180).iterations(3)) // Prevent physical overlap of node bounding boxes
      .force("x", forceX(0).strength(0.06)) // Stronger gravity to pull isolated components closer
      .force("y", forceY(0).strength(0.06)) // Stronger gravity to pull isolated components closer
      .stop();

    // Fast-forward the simulation to its settled state
    simulation.tick(300);

    // Cache the newly settled positions
    d3Nodes.forEach((n) => {
      if (!nodePositions.current.has(n.id) && n.x != null && n.y != null) {
        nodePositions.current.set(n.id, { x: n.x, y: n.y });
      }
    });

    return d3Nodes.map((n) => {
      const isBlastActive = blastRadiusResult !== null;
      const isAffected = isBlastActive && blastRadiusResult.affectedIds.has(n.id);
      const opacity = isBlastActive && !isAffected ? 0.2 : 1;

      // Extract the settled coordinates, offsetting by half width/height to center the node card
      const x = n.x - nodeWidth / 2;
      const y = n.y - nodeHeight / 2;

      return {
        id: n.id,
        type: "graph",
        selected: n.id === selectedNode,
        zIndex: n.id === selectedNode ? 51 : 50,
        position: { x, y }, // Ignore backend grid position
        data: {
          label: n.label,
          filePath: n.filePath,
          group: n.group,
          fileType: n.fileType,
          inDegree: n.inDegree,
          outDegree: n.outDegree,
          score: n.score,
          isAffected,
          isBlastActive,
        },
        style: { opacity, transition: "all 300ms ease" },
      };
    });
  }, [visibleNodes, visibleEdges, selectedNode, blastRadiusResult]);

  const flowEdges: Edge[] = useMemo(
    () =>
      visibleEdges.map((e) => {
        const isHighlighted = hoveredEdges.has(e.id);
        const isSelectedEdge =
          selectedNode !== null &&
          (e.source === selectedNode || e.target === selectedNode);

        const isBlastActive = blastRadiusResult !== null;
        const isAffectedEdge =
          isBlastActive &&
          blastRadiusResult.affectedIds.has(e.source) &&
          blastRadiusResult.affectedIds.has(e.target);

        let stroke = "#444";
        let strokeWidth = 1.5;
        let opacity = isBlastActive ? 0.1 : 1;
        let zIndex = 0;

        if (isAffectedEdge) {
          stroke = "#ef4444"; // red
          strokeWidth = 2;
          opacity = 1;
          zIndex = 10;
        } else if (isSelectedEdge) {
          stroke = "#60a5fa"; // blue
          strokeWidth = 2;
          opacity = 1;
          zIndex = 10;
        }

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          animated: isHighlighted || isSelectedEdge || isAffectedEdge,
          style: {
            stroke,
            strokeWidth,
            opacity,
            transition: "all 300ms ease",
          },
          zIndex,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: stroke,
          },
        };
      }),
    [visibleEdges, hoveredEdges, selectedNode, blastRadiusResult],
  );

  // Event handlers
  const onEdgeMouseEnter = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setHoveredEdges((prev) => new Set(prev).add(edge.id));
    },
    [],
  );

  const onEdgeMouseLeave = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setHoveredEdges((prev) => {
        const next = new Set(prev);
        next.delete(edge.id);
        return next;
      });
    },
    [],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode((prev) => (prev === node.id ? null : node.id));
      setBlastRadiusResult(null); // Clear previous analysis
    },
    [],
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const label =
        (node.data as GraphNodeData).label ?? node.id;
      setCurrentOverlay({
        rootNodeId: node.id,
        rootLabel: label,
        mode: "full" as const,
        hopDepth: 6,
      });
      setSelectedNode(node.id);
      onExploreNode?.(node.id);
    },
    [onExploreNode],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setBlastRadiusResult(null);
  }, []);

  // Filter handlers
  const toggleGroup = useCallback((g: string) => {
    setActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) {
        if (next.size > 1) next.delete(g);
      } else {
        next.add(g);
      }
      return next;
    });
  }, []);

  const toggleFileType = useCallback((t: string) => {
    setActiveFileTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) {
        if (next.size > 1) next.delete(t);
      } else {
        next.add(t);
      }
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setActiveGroups(new Set(allGroups));
    setActiveFileTypes(new Set(allFileTypes));
  }, [allGroups, allFileTypes]);

  // Overlay handlers
  const overlayClose = useCallback(() => {
    setCurrentOverlay(null);
    setSelectedNode(null);
  }, []);

  const overlayModeChange = useCallback(
    (m: "full" | "forward" | "reverse") => {
      setCurrentOverlay((prev) => {
        if (!prev) return null;
        return { ...prev, mode: m };
      });
    },
    [],
  );

  const overlayHopChange = useCallback((d: number) => {
    setCurrentOverlay((prev) => {
      if (!prev) return null;
      return { ...prev, hopDepth: d };
    });
  }, []);

  return (
    <div className="relative h-screen w-full bg-[#0a0a0a]">
      {/* Filter bar (hidden during overlay) */}
      {!isOverlay && (
        <GraphFilterBar
          groups={allGroups}
          fileTypes={allFileTypes}
          activeGroups={activeGroups}
          activeFileTypes={activeFileTypes}
          onGroupToggle={toggleGroup}
          onFileTypeToggle={toggleFileType}
          onResetFilters={resetFilters}
          nodeCount={visibleNodes.length}
          edgeCount={visibleEdges.length}
        />
      )}

      {/* Overlay toolbar */}
      {isOverlay && currentOverlay && (
        <OverlayToolbar
          rootLabel={currentOverlay.rootLabel}
          mode={currentOverlay.mode}
          hopDepth={currentOverlay.hopDepth}
          onModeChange={overlayModeChange}
          onHopDepthChange={overlayHopChange}
          onClose={overlayClose}
          nodeCount={visibleNodes.length}
          edgeCount={visibleEdges.length}
        />
      )}

      {/* Truncation warning */}
      {truncated && !isOverlay && !selectedNode && (
        <div className="absolute top-4 right-4 z-10 rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 py-2 text-[11px] text-gray-400">
          Showing top {visibleNodes.length} of {totalNodes} nodes
          <span className="ml-1 text-gray-600">(by connectivity)</span>
        </div>
      )}

      {/* Node Detail / Blast Radius Panel */}
      {!isOverlay && selectedNode && (
        <div className="absolute top-4 right-4 z-10 w-[300px] rounded-xl border border-[#2a2a2a] bg-[#161616] shadow-2xl shadow-black/60 flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="p-4 border-b border-[#2a2a2a]">
            <h3 className="text-sm font-semibold text-white truncate">
              {visibleNodes.find(n => n.id === selectedNode)?.label ?? selectedNode}
            </h3>
            <p className="text-[11px] text-gray-500 truncate mt-1">
              {visibleNodes.find(n => n.id === selectedNode)?.filePath}
            </p>
          </div>

          {/* Body */}
          <div className="p-4 flex-1 overflow-y-auto">
            {blastRadiusResult?.rootId === selectedNode ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-400 font-semibold flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    Blast Radius Impact
                  </span>
                  <span className="text-[10px] font-mono bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                    {blastRadiusResult.affectedNodes.length - 1} affected
                  </span>
                </div>
                
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  These downstream modules (transitively) import this file. Changing this file may break them.
                </p>

                <div className="flex flex-col gap-1 mt-2">
                  {blastRadiusResult.affectedNodes
                    .filter(n => n.id !== selectedNode)
                    .map(n => (
                      <div key={n.id} className="flex items-center gap-2 bg-[#0a0a0a] rounded border border-[#2a2a2a] p-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colorForGroup(n.group) }} />
                        <span className="text-[11px] text-gray-300 truncate flex-1">{n.label}</span>
                        {n.fileType && (
                          <span className="text-[9px] text-gray-600 font-mono">.{n.fileType}</span>
                        )}
                      </div>
                  ))}
                  {blastRadiusResult.affectedNodes.length <= 1 && (
                    <span className="text-[11px] text-gray-500 italic">No downstream dependents.</span>
                  )}
                </div>

                <button
                  onClick={() => setBlastRadiusResult(null)}
                  className="mt-3 w-full py-1.5 rounded bg-[#2a2a2a] hover:bg-[#333] text-gray-300 text-[11px] font-medium transition-colors"
                >
                  Clear Analysis
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Select an action for this node.
                </p>
                <button
                  onClick={() => {
                    const label = visibleNodes.find(n => n.id === selectedNode)?.label ?? selectedNode;
                    setCurrentOverlay({
                      rootNodeId: selectedNode,
                      rootLabel: label,
                      mode: "full",
                      hopDepth: 6,
                    });
                  }}
                  className="w-full py-2 rounded bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Explore Subgraph
                </button>
                <button
                  onClick={() => {
                    setIsBlastLoading(true);
                    getRepositoryGraph(repositoryId, {
                      seed: selectedNode,
                      k: 20,
                      direction: "reverse",
                    })
                      .then((data) => {
                        const affectedIds = new Set(data.graph.nodes.map((n: any) => n.id));
                        setBlastRadiusResult({
                          rootId: selectedNode,
                          affectedNodes: data.graph.nodes.map((n: any) => ({
                            id: n.id,
                            label: n.data.label ?? n.id,
                            filePath: n.data.filePath ?? n.id,
                            group: n.data.group ?? "root",
                            fileType: n.data.fileType ?? "",
                            inDegree: n.data.inDegree ?? 0,
                            outDegree: n.data.outDegree ?? 0,
                            score: n.data.score ?? 0,
                            position: n.position,
                          })),
                          affectedEdges: data.graph.edges as any,
                          affectedIds,
                        });
                      })
                      .catch(console.error)
                      .finally(() => setIsBlastLoading(false));
                  }}
                  disabled={isBlastLoading}
                  className="w-full py-2 rounded border border-[#f8514940] text-[#f85149] hover:bg-[#f8514910] text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBlastLoading ? "Analyzing..." : "Analyze Blast Radius"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        defaultEdgeOptions={{ type: "default" }}
        minZoom={0.05}
        maxZoom={4}
        style={{ paddingTop: isOverlay ? 48 : 0 }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#2a2a2a"
        />

        <Controls
          position="bottom-left"
          className="!border-[#2a2a2a] !bg-[#161616] [&_button]:!border-[#2a2a2a] [&_button]:!text-gray-300 [&_button]:hover:!bg-white/5"
          showInteractive={false}
        />

        <MiniMap
          position="bottom-right"
          className="!bg-[#161616] [&>svg]:!border-[#2a2a2a]"
          maskColor="rgba(10,10,10,0.7)"
          nodeColor={(n) =>
            colorForGroup((n.data as GraphNodeData).group)
          }
        />
      </ReactFlow>
    </div>
  );
}
