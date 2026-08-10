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
import { X } from "@phosphor-icons/react";
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
      style={{ borderLeft: `3px solid ${color}` }}
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
// Slide-in detail panel
// ---------------------------------------------------------

function DetailPanel({
  node,
  onClose,
}: {
  node: GraphNodeData | null;
  onClose: () => void;
}) {
  const open = node !== null;

  return (
    <div
      className={`absolute bottom-0 right-0 top-0 z-10 w-[320px] border-l border-[#2a2a2a] bg-[#161616] transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      } ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {node && (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between border-b border-[#2a2a2a] px-5 py-4">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-white">
                {node.label}
              </h3>
              <p className="mt-1 truncate font-mono text-xs text-gray-400">
                {node.filePath}
              </p>
            </div>

            <button
              onClick={onClose}
              className="ml-3 shrink-0 rounded-md p-1.5 text-gray-400 transition hover:bg-white/5 hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Imports
              </h4>

              {node.imports.length > 0 ? (
                <ul className="mt-2.5 space-y-1.5">
                  {node.imports.map((item) => (
                    <li
                      key={item}
                      className="font-mono text-sm text-gray-300"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2.5 text-sm text-gray-500">
                  No imports.
                </p>
              )}
            </section>

            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Exports
              </h4>

              {node.exports.length > 0 ? (
                <ul className="mt-2.5 space-y-1.5">
                  {node.exports.map((item) => (
                    <li
                      key={item}
                      className="font-mono text-sm text-gray-300"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2.5 text-sm text-gray-500">
                  No exports.
                </p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// Graph
// ---------------------------------------------------------

export default function RepoGraph({ nodes, edges }: RepoGraphProps) {
  const [selected, setSelected] = useState<GraphNodeData | null>(null);
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

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelected(node.data as GraphNodeData);
    },
    []
  );

  const onPaneClick = useCallback(() => setSelected(null), []);

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
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
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

      <DetailPanel
        node={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
