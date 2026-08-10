"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Circle, CircleAlert, Loader2 } from "lucide-react";

import {
  ApiError,
  createAnalysisJob,
  getAnalysisJobStatus,
  type AnalysisJobStatus,
} from "@/lib/api";

const PROCESSING_STAGES = [
  "queued",
  "cloning",
  "scanning",
  "parsing",
  "analyzing",
  "indexing",
  "generating_docs",
] as const;

const POLL_INTERVAL_MS = 2500;

const isTerminal = (status: string | null | undefined) =>
  status === "completed" || status === "failed";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        {children}
      </div>
    </main>
  );
}

export default function AnalysisProgress({
  jobId,
}: {
  jobId: string;
}) {
  const router = useRouter();

  const [status, setStatus] = useState<AnalysisJobStatus | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const redirecting = useRef(false);

  // Reset state when navigating to a new job (e.g. retry).
  useEffect(() => {
    setStatus(null);
    setFatalError(null);
    redirecting.current = false;
  }, [jobId]);

  // Poll job status until it reaches a terminal state.
  useEffect(() => {
    if (!jobId || fatalError) return;
    if (status && isTerminal(status.status)) return;

    let active = true;

    const poll = async () => {
      try {
        const next = await getAnalysisJobStatus(jobId);

        if (!active) return;

        setStatus(next);
      } catch (err) {
        if (!active) return;

        if (err instanceof ApiError && err.status === 404) {
          setFatalError(
            "This analysis job no longer exists. Please start a new analysis."
          );
        }

        // Transient failures are ignored; the next poll retries.
      }
    };

    poll();

    const interval = window.setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [jobId, fatalError, status]);

  // Redirect to the repository dashboard once analysis completes.
  useEffect(() => {
    if (
      status?.status === "completed" &&
      status.repository_id &&
      !redirecting.current
    ) {
      redirecting.current = true;

      const timeout = window.setTimeout(() => {
        router.replace(`/analyze/${status.repository_id}/overview`);
      }, 900);

      return () => window.clearTimeout(timeout);
    }
  }, [status, router]);

  const handleRetry = async () => {
    const githubUrl = status?.github_url;

    if (!githubUrl || retrying) return;

    setRetrying(true);

    try {
      const job = await createAnalysisJob(githubUrl);

      router.replace(`/analyze/progress?job_id=${job.job_id}`);
    } catch (err) {
      setFatalError(
        err instanceof ApiError
          ? err.message
          : "Unable to retry the analysis. Please try again."
      );
    } finally {
      setRetrying(false);
    }
  };

  if (!jobId) {
    return (
      <Shell>
        <p className="text-zinc-300">
          No analysis job was provided.
        </p>

        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
        >
          Analyze a repository
        </Link>
      </Shell>
    );
  }

  const failed = status?.status === "failed";
  const completed = status?.status === "completed";

  const currentStage = status?.current_stage ?? "queued";

  const stageIndex =
    currentStage === "completed"
      ? PROCESSING_STAGES.length
      : PROCESSING_STAGES.indexOf(
          currentStage as (typeof PROCESSING_STAGES)[number]
        );

  return (
    <Shell>
      <h1 className="font-[family-name:var(--font-instrument-serif)] text-3xl text-white">
        Analyzing repository
      </h1>

      {status?.github_url && (
        <p className="mt-2 truncate text-sm text-zinc-400">
          {status.github_url}
        </p>
      )}

      {/* Current stage */}
      {!failed && !completed && (
        <div className="mt-6 flex items-center gap-2">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-400" />

          <span className="text-sm font-medium capitalize text-zinc-200">
            {status
              ? status.current_stage?.replace("_", " ")
              : "Starting analysis"}
          </span>
        </div>
      )}

      {/* Completed */}
      {completed && (
        <div className="mt-6 flex items-center gap-2">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-400" />

          <span className="text-sm text-zinc-300">
            Analysis complete — opening your repository…
          </span>
        </div>
      )}

      {/* Stage list */}
      <ul className="mt-6 space-y-3">
        {PROCESSING_STAGES.map((stage, index) => {
          const done = stageIndex >= 0 && index < stageIndex;
          const active = !failed && !completed && index === stageIndex;

          return (
            <li key={stage} className="flex items-center gap-3">
              {done ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : active ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-400" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-zinc-700" />
              )}

              <span
                className={
                  done
                    ? "text-sm text-zinc-400"
                    : active
                      ? "text-sm font-medium text-white"
                      : "text-sm text-zinc-600"
                }
              >
                {stage.replace("_", " ")}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Failed */}
      {failed && (
        <div className="mt-6 rounded-xl border border-red-900/60 bg-red-950/40 p-5">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

            <div>
              <p className="text-sm font-medium text-red-300">
                Analysis failed
              </p>

              <p className="mt-1 text-sm text-red-200/80">
                {status?.error ?? "The analysis failed. Please try again."}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={handleRetry}
              disabled={retrying || !status?.github_url}
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {retrying ? "Retrying…" : "Retry analysis"}
            </button>

            <Link
              href="/"
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              Analyze a different repository
            </Link>
          </div>
        </div>
      )}

      {/* Fatal error (missing job, retry failed, etc.) */}
      {fatalError && (
        <div className="mt-6 rounded-xl border border-red-900/60 bg-red-950/40 p-5">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

            <p className="text-sm text-red-200/80">{fatalError}</p>
          </div>

          <Link
            href="/"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Analyze a repository
          </Link>
        </div>
      )}
    </Shell>
  );
}
