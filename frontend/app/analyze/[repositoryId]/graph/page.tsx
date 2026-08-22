import RepoGraph from "@/components/dashboard/repo-graph";
import {
  ApiError,
  getRepositoryGraph,
  type RepositoryGraphNode,
} from "@/lib/api";

function GraphError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white">
      <div className="mx-auto max-w-7xl rounded-2xl border border-[#2a2a2a] bg-[#161616] p-8">
        <h1 className="text-xl font-semibold">Unable to load dependency graph</h1>
        <p className="mt-2 text-sm text-gray-400">{message}</p>
      </div>
    </div>
  );
}

function toRepoGraphNode(node: RepositoryGraphNode) {
  // The enhanced backend now provides all metadata in node.data.
  const d = node.data;
  return {
    id: node.id,
    label: d.label ?? node.id,
    filePath: d.filePath ?? node.id,
    group: d.group ?? "root",
    fileType: d.fileType ?? "",
    inDegree: d.inDegree ?? 0,
    outDegree: d.outDegree ?? 0,
    score: d.score ?? 0,
    position: node.position,
  };
}

export default async function GraphPage({
  params,
}: {
  params: Promise<{ repositoryId: string }>;
}) {
  const { repositoryId } = await params;

  let graph;

  try {
    graph = await getRepositoryGraph(repositoryId);
  } catch (err) {
    return (
      <GraphError
        message={
          err instanceof ApiError
            ? err.message
            : "The backend could not be reached. Make sure it is running."
        }
      />
    );
  }

  return (
    <RepoGraph
      repositoryId={repositoryId}
      nodes={graph.graph.nodes.map(toRepoGraphNode)}
      edges={graph.graph.edges}
      stats={graph.graph.stats}
      truncated={graph.graph.truncated}
      totalNodes={graph.graph.total_nodes}
    />
  );
}