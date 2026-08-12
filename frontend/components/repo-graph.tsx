"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ---------------------------------------------------------
// Data model (swap in real data from /api/repositories/{id}/graph)
// ---------------------------------------------------------

export interface GraphNodeData extends Record<string, unknown> {
  label: string;
  filePath: string;
  group: string;
  imports: string[];
  exports: string[];
  position?: { x: number; y: number };
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
}

export interface RepoGraphProps {
  nodes: (GraphNodeData & { id: string })[];
  edges: GraphEdgeData[];
}

// ---------------------------------------------------------
// Group colors (at least 4 distinct, deterministic per group)
// ---------------------------------------------------------

const PALETTE = [
  "#22c55e", // green
  "#f97316", // orange
  "#3b82f6", // blue
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
];

function colorForGroup(group: string): string {
  let hash = 0;
  for (let i = 0; i < group.length; i++) {
    hash = (hash * 31 + group.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

// ---------------------------------------------------------
// Custom node
// ---------------------------------------------------------

function GraphNode({ data }: NodeProps<Node<GraphNodeData>>) {
  const color = colorForGroup(data.group);

  return (
    <div
      className="relative rounded-xl border border-[#2a2a2a] bg-[#161616] px-4 py-3 shadow-lg shadow-black/40"
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="whitespace-nowrap text-sm font-medium text-white">
          {data.label}
        </span>
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
// Graph
// ---------------------------------------------------------

export default function RepoGraph({ nodes, edges }: RepoGraphProps) {
  const [hoveredEdges, setHoveredEdges] = useState<Set<string>>(
    () => new Set()
  );

  const flowNodes: Node<GraphNodeData>[] = useMemo(
    () =>
      nodes.map((n, index) => ({
        id: n.id,
        type: "graph",
        position: n.position ?? {
          x: (index % 4) * 260,
          y: Math.floor(index / 4) * 160,
        },
        data: {
          label: n.label,
          filePath: n.filePath,
          group: n.group,
          imports: n.imports,
          exports: n.exports,
        },
      })),
    [nodes]
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: hoveredEdges.has(e.id),
        style: {
          stroke: "#444",
          strokeWidth: 1.5,
          transition: "stroke 150ms ease",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#444",
        },
      })),
    [edges, hoveredEdges]
  );

  const onEdgeMouseEnter = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setHoveredEdges((prev) => new Set(prev).add(edge.id));
    },
    []
  );

  const onEdgeMouseLeave = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setHoveredEdges((prev) => {
        const next = new Set(prev);
        next.delete(edge.id);
        return next;
      });
    },
    []
  );

  return (
    <div className="relative h-screen w-full bg-[#0a0a0a]">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
        defaultEdgeOptions={{ type: "default" }}
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
