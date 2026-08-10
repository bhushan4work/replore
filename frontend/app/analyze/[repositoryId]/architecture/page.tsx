import RepoArchitecture from "@/components/repo-architecture";

export default function ArchitecturePage() {
  return (
    <RepoArchitecture
      modules={[
        {
          id: "core",
          name: "core",
          description:
            "Shared runtime primitives, logging, and configuration used across the application.",
          color: "#8b5cf6",
          keyFiles: [
            { name: "config.ts", purpose: "Loads and validates environment settings." },
            { name: "logger.ts", purpose: "Structured logging with request tracing." },
            { name: "errors.ts", purpose: "Centralized error types and handlers." },
          ],
          dependsOn: [],
        },
        {
          id: "auth",
          name: "auth",
          description:
            "Authentication and session management backed by Supabase.",
          color: "#22d3ee",
          keyFiles: [
            { name: "session.ts", purpose: "Creates and refreshes user sessions." },
            { name: "guards.ts", purpose: "Route-level auth guards for protected pages." },
            { name: "providers.ts", purpose: "Third-party OAuth provider wiring." },
          ],
          dependsOn: ["core", "database"],
        },
        {
          id: "database",
          name: "database",
          description:
            "Data-access layer wrapping the Supabase client and schema helpers.",
          color: "#34d399",
          keyFiles: [
            { name: "client.ts", purpose: "Singleton Supabase client factory." },
            { name: "repositories.ts", purpose: "Repository table query helpers." },
            { name: "migrations.ts", purpose: "Schema version tracking." },
          ],
          dependsOn: ["core"],
        },
        {
          id: "analysis",
          name: "analysis",
          description:
            "Background pipeline that clones, parses, and indexes repositories.",
          color: "#f59e0b",
          keyFiles: [
            { name: "job.ts", purpose: "Background job scheduling and lifecycle." },
            { name: "parser.ts", purpose: "Tree-sitter based source parsing." },
            { name: "embeddings.ts", purpose: "Chunk embedding and vector storage." },
          ],
          dependsOn: ["core", "database", "github"],
        },
        {
          id: "github",
          name: "github",
          description:
            "GitHub API client for metadata, cloning, and commit resolution.",
          color: "#f87171",
          keyFiles: [
            { name: "client.ts", purpose: "Authenticated GitHub API wrapper." },
            { name: "clone.ts", purpose: "Clone with low-speed timeout and retries." },
            { name: "meta.ts", purpose: "Repository metadata and HEAD commit lookup." },
          ],
          dependsOn: ["core"],
        },
      ]}
    />
  );
}
