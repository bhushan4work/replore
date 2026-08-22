export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface AnalysisJob {
  job_id: string;
  github_url: string;
  status: string;
}

export type AnalysisStage =
  | "queued"
  | "cloning"
  | "scanning"
  | "parsing"
  | "analyzing"
  | "cached"
  | "completed"
  | "failed";

export interface AnalysisJobStatus {
  job_id: string;
  github_url: string | null;
  status: AnalysisStage;
  current_stage: AnalysisStage | null;
  repository_id: string | null;
  progress: string | null;
  created_at: string | null;
  started_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  error: string | null;
}

async function parseError(res: Response): Promise<ApiError> {
  let detail = "Something went wrong. Please try again.";

  try {
    const data = await res.json();

    if (typeof data.detail === "string" && data.detail) {
      detail = data.detail;
    }
  } catch {
    // Response was not JSON; keep the generic message.
  }

  return new ApiError(res.status, detail);
}

export async function createAnalysisJob(
  githubUrl: string
): Promise<AnalysisJob> {
  const res = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ github_url: githubUrl }),
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  return res.json();
}
export async function getAnalysisJobStatus(
  jobId: string
): Promise<AnalysisJobStatus> {
  const res = await fetch(
    `${API_BASE_URL}/api/analyze/${encodeURIComponent(jobId)}/status`
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  return res.json();
}

export interface OverviewDirectoryNode {
  name: string;
  type: "directory" | "file";
  children?: OverviewDirectoryNode[];
}

export interface HeadCommit {
  sha: string;
  short_sha: string;
  message: string;
  author: string;
  date: string | null;
}

export interface ContributorStat {
  name: string;
  commits: number;
}

export interface RepositoryGitInfo {
  default_branch: string | null;
  head_commit: HeadCommit | null;
  total_commits: number;
  top_contributors: ContributorStat[];
}

export interface RepositoryOverview {
  repository: {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    owner: string;
    default_branch: string;
    language: string | null;
    stars: number;
    forks: number;
    open_issues: number;
    watchers: number;
    clone_url: string;
    homepage: string | null;
    topics: string[];
    license: string | null;
    size: number | null;
    archived: boolean;
    is_fork: boolean;
    created_at: string | null;
    pushed_at: string | null;
    updated_at: string | null;
  };
  statistics: {
    files: number;
    lines: number;
    blank_lines: number;
    directories: number;
    languages: Record<string, number>;
    contributors: number;
  };
  git: RepositoryGitInfo;
}

export async function getRepositoryOverview(
  repositoryId: string
): Promise<RepositoryOverview> {
  const res = await fetch(
    `${API_BASE_URL}/api/repositories/${encodeURIComponent(repositoryId)}/overview`
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  return res.json();
}

export interface ArchitectureLanguage {
  name: string;
  files: number;
  lines: number;
  percent: number;
}

export interface ArchitectureDirectoryStat {
  path: string;
  files: number;
  lines: number;
}

export interface ArchitectureEntryPoint {
  path: string;
  kind: string;
}

export interface ArchitectureDependency {
  name: string;
  language: string;
}

export interface ArchitectureKeyFile {
  path: string;
  lines: number;
  language: string;
}

export interface RepositoryArchitecture {
  repository_id: string;
  architecture: string;
  tree: OverviewDirectoryNode[];
  languages: ArchitectureLanguage[];
  directories: ArchitectureDirectoryStat[];
  entry_points: ArchitectureEntryPoint[];
  technologies: string[];
  dependencies: ArchitectureDependency[];
  key_files: ArchitectureKeyFile[];
}

export async function getRepositoryArchitecture(
  repositoryId: string
): Promise<RepositoryArchitecture> {
  const res = await fetch(
    `${API_BASE_URL}/api/repositories/${encodeURIComponent(repositoryId)}/architecture`
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  return res.json();
}

export interface RepositoryGraphNodeData {
  label: string;
  filePath: string;
  group: string;
  fileType: string;
  inDegree: number;
  outDegree: number;
  score: number;
}

export interface RepositoryGraphNode {
  id: string;
  data: RepositoryGraphNodeData;
  position: { x: number; y: number };
  type?: string;
}

export interface RepositoryGraphEdge {
  id: string;
  source: string;
  target: string;
  data?: { edgeType?: string };
}

export interface RepositoryGraphStats {
  totalNodes: number;
  totalEdges: number;
  groups: string[];
  fileTypes: string[];
}

export interface RepositoryGraph {
  repository_id: string;
  graph: {
    nodes: RepositoryGraphNode[];
    edges: RepositoryGraphEdge[];
    truncated?: boolean;
    total_nodes?: number;
    stats?: RepositoryGraphStats;
  };
}

export interface GraphQueryParams {
  seed?: string;
  k?: number;
  direction?: "forward" | "reverse" | "both";
  groups?: string[];
  fileTypes?: string[];
  minScore?: number;
}

export async function getRepositoryGraph(
  repositoryId: string,
  params?: GraphQueryParams,
): Promise<RepositoryGraph> {
  const url = new URL(
    `${API_BASE_URL}/api/repositories/${encodeURIComponent(repositoryId)}/graph`,
  );

  if (params?.seed) url.searchParams.set("seed", params.seed);
  if (params?.k !== undefined) url.searchParams.set("k", String(params.k));
  if (params?.direction) url.searchParams.set("direction", params.direction);
  if (params?.groups?.length)
    url.searchParams.set("groups", params.groups.join(","));
  if (params?.fileTypes?.length)
    url.searchParams.set("file_types", params.fileTypes.join(","));
  if (params?.minScore !== undefined)
    url.searchParams.set("min_score", String(params.minScore));

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw await parseError(res);
  }

  return res.json();
}

export interface RepositoryDocs {
  repository_id: string;
  title?: string;
  documentation: string;
}

export async function getRepositoryDocs(
  repositoryId: string
): Promise<RepositoryDocs> {
  const res = await fetch(
    `${API_BASE_URL}/api/repositories/${encodeURIComponent(repositoryId)}/docs`
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  return res.json();
}


