import RepoDocs from "@/components/repo-docs";

const DOCS_MARKDOWN = `# Replore

Replore turns repository data into actionable engineering insights. It
clones a GitHub repository, parses the source, indexes it for
search, and generates overview, architecture, dependency, and
documentation views.

## Project Overview

Replore is a full-stack application that analyzes public GitHub
repositories. A background job pipeline clones the repository, runs
Tree-sitter based parsing, embeds code chunks, and exposes the results
through an API consumed by a Next.js dashboard.

## Folder Structure

\`\`\`text
backend/
  app/
    jobs/         background analysis pipeline
    routes/       FastAPI endpoints
    services/     parser, embeddings, graph, github
  supabase/
    migrations/   schema changes
frontend/
  app/            Next.js App Router pages
  components/     dashboard components
  lib/            API client and helpers
\`\`\`

## Technologies Used

- **Backend**: Python, FastAPI, Supabase (Postgres + pgvector),
  Tree-sitter, Google Gemini embeddings, Groq LLM
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS,
  React Flow, React Markdown

## How Analysis Works

### Job Creation

A POST to \`/api/analyze\` validates the repository URL and creates a
queued analysis job, returning a \`job_id\` immediately.

### Background Pipeline

The job runs in the background through distinct stages:

1. **Cloning** — the repository is cloned into a per-job workspace
   with a low-speed timeout.
2. **Scanning** — the repository row is upserted and files are
   enumerated.
3. **Parsing** — supported source files are parsed with Tree-sitter
   and chunked by symbol.
4. **Indexing** — chunks are embedded in batches and upserted with
   metadata.
5. **Generating docs** — the clone is promoted to the canonical
   location and the repository is marked completed.

### Version Caching

The HEAD commit identifies each analysis. If the same repository and
commit were already analyzed, the job short-circuits to a cached
result instead of reprocessing.

## Architecture

- **Overview** — metadata, statistics, file tree, and dependency files.
- **Architecture** — an AI-generated module-level summary.
- **Dependency Graph** — an interactive React Flow diagram of imports.
- **Docs** — AI-generated markdown documentation.
- **Chat** — repository-aware Q&A using retrieved code chunks.

## Installation

\`\`\`bash
git clone https://github.com/example/replore
cd replore/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
\`\`\`

## Development Workflow

Start the backend with \`uvicorn app.main:app --reload\` and the
frontend with \`npm run dev\`. The frontend polls job status at
\`/api/analyze/{job_id}/status\` and redirects to the repository
dashboard once analysis completes.

## Notes

The clone is kept on disk after success because the
overview/architecture/graph/docs routes read it on demand. Failed jobs
clean up their temporary workspace and restore the repository status.
`;

export default function DocsPage() {
  return (
    <RepoDocs
      title="replore"
      markdown={DOCS_MARKDOWN}
    />
  );
}
