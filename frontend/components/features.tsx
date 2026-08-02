"use client";

import {
  RepoChatCard,
  ImportCard,
  DependencyCard,
  DocsCard,
  OverviewCard,
} from "./feature-card";

export default function FeaturesSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24 lg:py-32">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-violet-500/0 blur-[120px] sm:h-[420px] sm:w-[420px] sm:blur-[150px] lg:h-[500px] lg:w-[500px] lg:blur-[170px]" />
      </div>

      <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-6 lg:px-8 xl:px-10">
        {/* Heading */}

        <div className="mx-auto max-w-6xl text-center">

          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:mt-6 sm:text-4xl md:text-5xl lg:text-6xl">
            Powerful AI Tools for every repository
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:mt-6 sm:text-lg sm:leading-8">
            Explore, understand and document any GitHub repository with AI.
            Built for developers who need answers instantly.
          </p>
        </div>

        {/* Grid */}

        <div className="mt-14 grid grid-cols-1 items-stretch gap-5 sm:mt-16 sm:gap-6 lg:mt-20 lg:grid-cols-12 lg:gap-7">

          {/* Left */}

          <div className="lg:col-span-8">
            <RepoChatCard />
          </div>

          {/* Right */}

          <div className="lg:col-span-4">
            <ImportCard />
          </div>
          {/* Bottom Left */}
          <div className="lg:col-span-4">
            <DependencyCard />
          </div>

          {/* Bottom Middle */}
          <div className="lg:col-span-4">
            <DocsCard />
          </div>

          {/* Bottom Right */}
          <div className="lg:col-span-4">
            <OverviewCard />
          </div>

        </div>
      </div>
    </section>
  );
}