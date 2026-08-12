import RepoOverview from "@/components/repo-overview";
import {
  ApiError,
  getRepositoryOverview,
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

function primaryLanguagePercent(languages: Record<string, number>): string {
  const entries = Object.entries(languages);

  if (entries.length === 0) return "—";

  const [, topCount] = entries.reduce((max, entry) =>
    entry[1] > max[1] ? entry : max
  );

  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return `${Math.round((topCount / total) * 100)}%`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "unknown";

  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;

  return new Date(iso).toLocaleDateString();
}

function OverviewError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white">
      <div className="mx-auto max-w-7xl rounded-2xl border border-[#2a2a2a] bg-[#161616] p-8">
        <h1 className="text-xl font-semibold">Unable to load overview</h1>
        <p className="mt-2 text-sm text-gray-400">{message}</p>
      </div>
    </div>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ repositoryId: string }>;
}) {
  const { repositoryId } = await params;

  let overview;

  try {
    overview = await getRepositoryOverview(repositoryId);
  } catch (err) {
    return (
      <OverviewError
        message={
          err instanceof ApiError
            ? err.message
            : "The backend could not be reached. Make sure it is running."
        }
      />
    );
  }

  const { repository, statistics } = overview;

  return (
    <RepoOverview
      repoName={repository.full_name}
      stars={repository.stars}
      languages={Object.keys(statistics.languages)}
      lastUpdated={timeAgo(repository.pushed_at)}
      stats={{
        totalFiles: statistics.files,
        linesOfCode: statistics.lines,
        primaryLanguagePercent: primaryLanguagePercent(statistics.languages),
        contributors: statistics.contributors,
      }}
      fileTree={mapTree(overview.directory_tree)}
    />
  );
}
