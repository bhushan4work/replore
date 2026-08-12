"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Warp } from "@paper-design/shaders-react";
import { GithubStar } from "@/components/landing-page/github-star";
import Footer from "@/components/landing-page/footer";
import Navbar from "@/components/landing-page/navbar";
import Features from "@/components/landing-page/features";
import DemoShowcase from "@/components/landing-page/demo-showcase";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { CircleAlert, Loader2 } from "lucide-react";
import FAQSection from "@/components/landing-page/faq-section";
import { createAnalysisJob } from "@/lib/api";

const GITHUB_REPO_REGEX =
  /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/;

export default function Home() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed = repoUrl.trim();

    if (!trimmed) {
      setError("Paste a repository link to get started.");
      return;
    }

    if (!GITHUB_REPO_REGEX.test(trimmed)) {
      setError(
        "Please enter a valid GitHub repository URL"
      );
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const job = await createAnalysisJob(trimmed);

      router.push(`/analyze/progress?job_id=${job.job_id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start the analysis. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen font-[family-name:var(--font-geist-sans)] bg-zinc-950">
      <Navbar />
      {/* Hero with Warp shader */}
      <div className="relative h-[600px] overflow-hidden bg-zinc-900">
        {/* Shader background */}
        <div className="absolute inset-0">
          <Warp
            style={{ width: "100%", height: "100%" }}
            colors={["#7503f8", "#091316"]}
            proportion={0.52}
            softness={0}
            distortion={0}
            swirl={0.2}
            swirlIterations={4}
            shape="stripes"
            shapeScale={1}
            speed={12}
            scale={1.1}
            rotation={40}
          />
        </div>

        {/* Dark overlay */}
        <div className="absolute inset-x-0 bottom-28 z-10 px-4 text-center"></div>

        {/* Title + Tagline */}
        <div className="absolute mb-4 inset-x-0 bottom-28 z-10 px-4 text-center">
          <h1 className="font-[family-name:var(--font-instrument-serif)] text-5xl tracking-tight text-white drop-shadow-lg underline sm:text-8xl">
            Replore
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-xl text-white/90 drop-shadow">
            turn repository data into actionable engineering insights. <br />
            analyze faster. ship smarter.
          </p>
        </div>

        {/* Search Bar */}
        <div className="absolute bottom-10 left-1/2 z-20 w-full max-w-xl -translate-x-1/2 px-4">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex items-center gap-3"
          >
            {/* Input */}
            <div className="relative flex-1">
              <MagnifyingGlass
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
                weight="bold"
              />

              <input
                type="text"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  if (error) setError("");
                }}
                placeholder="https://github.com/repo-name"
                aria-invalid={!!error}
                aria-describedby={error ? "repo-error" : undefined}
                className={`w-full rounded-2xl bg-neutral-900 py-4 pl-12 pr-4 text-md text-white placeholder-zinc-400 outline-none shadow-2xl ${error ? "ring-2 ring-red-500" : ""
                  }`}
              />

              {error && (
                <p
                  id="repo-error"
                  role="alert"
                  className="absolute left-0 top-full z-30 mt-2 flex w-full items-start gap-1.5 text-sm text-red-400"
                >
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Analyze Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl bg-white px-6 py-3 text-lg font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Starting...
                </>
              ) : (
                "Analyze"
              )}
            </button>
          </form>
        </div>

      </div>


      <div className="py-4 text-center text-sm text-zinc-400 ">
        <GithubStar />
      </div>

      <DemoShowcase />

      <Features />

      <FAQSection />


      <div className="h-24 bg-zinc-950" />

      <Footer />

    </div>
  );
}