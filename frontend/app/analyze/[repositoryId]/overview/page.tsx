import RepoOverview from "@/components/dashboard/repo-overview";
import { ApiError, getRepositoryOverview } from "@/lib/api";

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

function formatDate(iso: string | null): string | null {
  if (!iso) return null;

  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatSize(sizeKb: number | null): string | null {
  if (sizeKb == null || sizeKb <= 0) return null;

  const units = ["KB", "MB", "GB"];
  let value = sizeKb;
  let unit = "KB";

  for (let i = 1; i < units.length && value >= 1024; i++) {
    value /= 1024;
    unit = units[i];
  }

  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${unit}`;
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

  const { repository, statistics, git } = overview;

  return (
    <RepoOverview
      repoName={repository.full_name}
      repoOwner={repository.owner}
      description={repository.description}
      stars={repository.stars}
      forks={repository.forks}
      openIssues={repository.open_issues}
      watchers={repository.watchers}
      defaultBranch={repository.default_branch}
      homepage={repository.homepage}
      license={repository.license}
      topics={repository.topics}
      createdLabel={formatDate(repository.created_at)}
      sizeLabel={formatSize(repository.size)}
      archived={repository.archived}
      isFork={repository.is_fork}
      lastUpdated={timeAgo(repository.pushed_at)}
      stats={{
        totalFiles: statistics.files,
        linesOfCode: statistics.lines,
        blankLines: statistics.blank_lines,
        directories: statistics.directories,
        primaryLanguagePercent: primaryLanguagePercent(
          statistics.languages
        ),
        contributors: statistics.contributors,
        totalCommits: git.total_commits,
      }}
      headCommit={git.head_commit}
      topContributors={git.top_contributors}
    />
  );
}