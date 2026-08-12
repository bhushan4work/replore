import RepoArchitecture from "@/components/dashboard/repo-architecture";
import {
  ApiError,
  getRepositoryArchitecture,
  type OverviewDirectoryNode,
} from "@/lib/api";

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

function mapTree(
  nodes: OverviewDirectoryNode[],
  counter = { n: 0 }
): FileNode[] {
  return nodes.map((node) => ({
    id: String(counter.n++),
    name: node.name,
    type: node.type === "directory" ? "folder" : "file",
    children: node.children ? mapTree(node.children, counter) : undefined,
  }));
}

function ArchitectureError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white">
      <div className="mx-auto max-w-7xl rounded-2xl border border-[#2a2a2a] bg-[#161616] p-8">
        <h1 className="text-xl font-semibold">Unable to load architecture</h1>
        <p className="mt-2 text-sm text-gray-400">{message}</p>
      </div>
    </div>
  );
}

export default async function ArchitecturePage({
  params,
}: {
  params: Promise<{ repositoryId: string }>;
}) {
  const { repositoryId } = await params;

  let data;

  try {
    data = await getRepositoryArchitecture(repositoryId);
  } catch (err) {
    return (
      <ArchitectureError
        message={
          err instanceof ApiError
            ? err.message
            : "The backend could not be reached. Make sure it is running."
        }
      />
    );
  }

  return (
    <RepoArchitecture
      markdown={data.architecture}
      tree={mapTree(data.tree)}
      languages={data.languages}
      directories={data.directories}
      entryPoints={data.entry_points}
      technologies={data.technologies}
      dependencies={data.dependencies}
      keyFiles={data.key_files}
    />
  );
}