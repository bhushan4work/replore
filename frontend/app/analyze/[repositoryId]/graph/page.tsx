import RepoGraph from "@/components/repo-graph";

export default function GraphPage() {
  return (
    <RepoGraph
      nodes={[
        {
          id: "page",
          label: "page.tsx",
          filePath: "src/app/page.tsx",
          group: "src",
          imports: ["createAnalysisJob", "GITHUB_REPO_REGEX"],
          exports: ["Home"],
          position: { x: 0, y: 240 },
        },
        {
          id: "layout",
          label: "layout.tsx",
          filePath: "src/app/analyze/[repositoryId]/layout.tsx",
          group: "src",
          imports: ["Sidebar", "useState"],
          exports: ["AnalyzeLayout"],
          position: { x: 0, y: 0 },
        },
        {
          id: "progress",
          label: "analysis-progress.tsx",
          filePath: "src/components/analysis-progress.tsx",
          group: "components",
          imports: ["createAnalysisJob", "getAnalysisJobStatus"],
          exports: ["AnalysisProgress"],
          position: { x: 520, y: 0 },
        },
        {
          id: "overview",
          label: "repo-overview.tsx",
          filePath: "src/components/repo-overview.tsx",
          group: "components",
          imports: [],
          exports: ["RepoOverview", "RepoOverviewProps"],
          position: { x: 520, y: 180 },
        },
        {
          id: "architecture",
          label: "repo-architecture.tsx",
          filePath: "src/components/repo-architecture.tsx",
          group: "components",
          imports: [],
          exports: ["RepoArchitecture", "ArchitectureModule"],
          position: { x: 520, y: 360 },
        },
        {
          id: "docs",
          label: "repo-docs.tsx",
          filePath: "src/components/repo-docs.tsx",
          group: "components",
          imports: ["ReactMarkdown"],
          exports: ["RepoDocs"],
          position: { x: 520, y: 540 },
        },
        {
          id: "sidebar",
          label: "sidebar.tsx",
          filePath: "src/components/sidebar.tsx",
          group: "components",
          imports: ["usePathname"],
          exports: ["Sidebar"],
          position: { x: 1040, y: 120 },
        },
        {
          id: "api",
          label: "api.ts",
          filePath: "src/lib/api.ts",
          group: "lib",
          imports: [],
          exports: [
            "createAnalysisJob",
            "getAnalysisJobStatus",
            "AnalysisJob",
            "ApiError",
          ],
          position: { x: 1040, y: 300 },
        },
      ]}
      edges={[
        { id: "e-layout-sidebar", source: "layout", target: "sidebar" },
        { id: "e-page-progress", source: "page", target: "progress" },
        { id: "e-page-overview", source: "page", target: "overview" },
        { id: "e-page-architecture", source: "page", target: "architecture" },
        { id: "e-page-docs", source: "page", target: "docs" },
        { id: "e-progress-api", source: "progress", target: "api" },
        { id: "e-page-api", source: "page", target: "api" },
      ]}
    />
  );
}
