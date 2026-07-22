"use client";

import { useRouter } from "next/navigation";
import { Warp } from "@paper-design/shaders-react";
import { GithubStar } from "@/components/github-star";
import { MagnifyingGlass } from "@phosphor-icons/react";

export default function Home() {
  const router = useRouter();
  return (
    <div className="relative min-h-screen bg-zinc-50 font-[family-name:var(--font-geist-sans)] dark:bg-zinc-950">
      {/* Hero with Warp shader */}
      <div className="relative h-[500px] overflow-hidden bg-white dark:bg-zinc-900">
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
        <div className="absolute inset-x-0 bottom-28 z-10 px-4 text-center">
          <h1 className="font-[family-name:var(--font-instrument-serif)] text-5xl tracking-tight text-white drop-shadow-lg sm:text-7xl">
            Replore
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-lg text-white/90 drop-shadow">
            discover, understand and explore any github repository with ai.
          </p>
        </div>

        {/* Search Bar */}
        {/* Search Bar */}
        <div className="absolute bottom-10 left-1/2 z-20 w-full max-w-xl -translate-x-1/2 px-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/analyze/docs");
            }}
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
                placeholder="https://github.com/repo-name"
                className="w-full rounded-2xl bg-neutral-900 py-4 pl-12 pr-4 text-sm text-white placeholder-zinc-400 outline-none shadow-2xl"
              />
            </div>

            {/* Analyze Button */}
            <button
              type="submit"
              className="cursor-pointer rounded-2xl bg-white px-6 py-2 text-lg font-medium text-black transition hover:bg-zinc-200"
            >
              Analyze
            </button>
          </form>
        </div>

      </div>

      {/* Spacer for floating search bar */}
      <div className="h-12" />

      {/* Footer */}
      <div className="py-4 text-center text-sm text-zinc-400">
        <GithubStar />
        <div className="mt-8"> © {new Date().getFullYear()} Replore</div>
      </div>


    </div>
  );
}