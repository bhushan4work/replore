"use client";

import { ReactNode } from "react";
import { FaGithub } from "react-icons/fa";
import {
  ArrowRight,
  MessageSquare,
  GitBranch,
  FolderGit2,
  FileText,
  Sparkles,
  CheckCircle2,
  BarChart3,
  FolderTree,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "relative h-full overflow-hidden",
        "rounded-[24px] sm:rounded-[28px] lg:rounded-[32px]",
        "border border-white/[0.06]",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]",
        "transition-all duration-300 will-change-transform",
        "hover:border-violet-500/20",
        "hover:-translate-y-1",
        className
      )}
    >

      {/* Content */}

      <div className="relative h-full p-12 sm:p-13 lg:p-14">
        {children}
      </div>
    </div>
  );
}


export function RepoChatCard() {
  return (
    <Card className="min-h-[390px] sm:min-h-[430px] lg:min-h-[450px]">
      <div className="relative flex h-full flex-col">


      {/* Purple Corner Glow */}
      <div className="pointer-events-none absolute -right-52 -top-52 h-[300px] w-[300px] rounded-full bg-violet-500/30 blur-[100px]" />
      
        {/* Model Badge */}
        <div className="relative">
          <div className="flex items-center">
            <span className="text-[10px] font-medium tracking-[0.18em] text-violet-400 uppercase">
              Replore AI
            </span>
          </div>
        </div>

        {/* Hero */}
        <div className="relative mt-4">
          <h3 className="text-xl font-semibold text-white sm:text-2xl">
            Repository AI Chat
          </h3>

          <p className="mt-2 max-w-[760px] text-md leading-6 text-violet-300/90">
            Converse with your repository. Ask about architecture,
            dependencies, code flow, documentation and implementation details
            in real-time.
          </p>
        </div>

        {/* Conversation */}

        <div className="relative mt-8 flex flex-1 flex-col">

          {/* User Bubble */}
          <div className="flex justify-end">
            <div className="rounded-[12px] border border-white/10 bg-[#26262B] px-6 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="text-[16px] text-zinc-100">
                Explain the authentication flow in auth.ts?
              </p>
            </div>
          </div>

          {/* AI Bubble */}
          <div className="mt-6 max-w-[82%]">
            <div className="rounded-[12px] border border-violet-500/40 bg-[#2A203D] px-6 py-3 shadow-[0_0_40px_rgba(124,58,237,0.08)]">
              <p className="font-mono text-[16px] leading-5 text-[#D9D0FF]">
                The flow uses JWT with a 15-minute rotation.
                It's initialized in the Middleware layer...
              </p>
            </div>
          </div>

          {/* Second User Bubble */}
          <div className="mt-8 flex justify-end">
            <div className="rounded-[12px] border border-white/10 bg-[#26262B] px-6 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="text-[16px] text-zinc-100">
                Can we optimize the refresh token logic?
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}


export function ImportCard() {
  return (
    <Card className="relative h-full min-h-[390px] sm:min-h-[430px] lg:min-h-[450px]">

      {/* Dot Grid */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.22]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="dot-grid"
            width="34"
            height="34"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="2"
              cy="2"
              r="1.2"
              className="fill-white/60"
            />
          </pattern>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="url(#dot-grid)"
        />
      </svg>

      <div className="relative flex h-full p-4 flex-col">

        {/* Header */}
        <div>

          <h3 className="text-xl font-semibold text-white sm:text-2xl">
            Import Repo
          </h3>

          <p className="mt-2 max-w-[320px] text-[16px] leading-[1.45] text-violet-300">
            Sync your GitHub,
            GitLab, or
            <br />
            Bitbucket in seconds.
          </p>

        </div>

        {/* Illustration */}

        <div className="flex flex-1 items-center justify-center">

          <div className="flex items-center">

            {/* Left Node */}

            <div className="flex h-[58px] w-[58px] items-center justify-center rounded-2xl border border-white/10 bg-[#18181D] shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
              <FolderGit2 className="h-6 w-6 text-zinc-300" />
            </div>

            {/* Connector */}

            <svg
              className="mx-3"
              width="96"
              height="20"
              viewBox="0 0 96 20"
            >
              <line
                x1="0"
                y1="10"
                x2="96"
                y2="10"
                stroke="rgba(255,255,255,.18)"
                strokeWidth="2"
                strokeDasharray="8 8"
              />
            </svg>

            {/* Purple Node */}

            <div className="relative">

              <div className="absolute inset-0 rounded-full bg-violet-500 blur-xl opacity-10" />

              <div className="relative h-6 w-6 rounded-full bg-[#8B5CF6]" />

            </div>

          </div>

        </div>
        {/* CTA */}

        <div className="mt-auto px-10">
          <button
            type="button"
            className="
              group
              relative
              flex
              h-[80px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-white
              text-black
              shadow-[0_12px_40px_rgba(255,255,255,.08)]
              transition-all
              duration-300
              hover:-translate-y-1
              hover:bg-[#F7F7F8]
              active:translate-y-0

              sm:h-[50px]
            "
          >
            {/* Icon */}

            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform duration-300 group-hover:-translate-y-0.5"
            >
              <path
                d="M12 3V15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              <path
                d="M8 11L12 15L16 11"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M4 19H20"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            <span className="text-[16px] font-semibold">
              Connect Repository
            </span>
          </button>
        </div>

      </div>
    </Card>
  );
}

export function DependencyCard() {
  return (
    <Card className="min-h-[340px] sm:min-h-[360px] lg:min-h-[380px]">
      <div className="flex h-full flex-col">

         {/* Dot Grid */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.22]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="dot-grid"
            width="34"
            height="34"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="2"
              cy="2"
              r="1.2"
              className="fill-white/60"
            />
          </pattern>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="url(#dot-grid)"
        />
      </svg>

        {/* Label */}

        <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-violet-400 sm:text-xs">
          Mapping
        </span>

        {/* Heading */}

        <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
          Dependency Graph
        </h3>

        {/* Graph */}

        <div className="mt-6 flex flex-1 items-center justify-center">
          <svg
            viewBox="0 0 320 170"
            className="h-auto w-full max-w-[300px] overflow-visible"
          >
            {/* Connections */}

            <line
              x1="160"
              y1="32"
              x2="72"
              y2="84"
              stroke="rgba(139,92,246,.28)"
              strokeWidth="2.8"
            />

            <line
              x1="160"
              y1="32"
              x2="248"
              y2="84"
              stroke="rgba(139,92,246,.28)"
              strokeWidth="2.8"
            />

            <line
              x1="72"
              y1="84"
              x2="160"
              y2="132"
              stroke="rgba(139,92,246,.28)"
              strokeWidth="2.8"
            />

            <line
              x1="248"
              y1="84"
              x2="160"
              y2="132"
              stroke="rgba(139,92,246,.28)"
              strokeWidth="2.8"
            />

            {/* Glow */}

            <g opacity=".45">
              <circle cx="160" cy="32" r="8" fill="#8B5CF6" />
              <circle cx="72" cy="84" r="8" fill="#8B5CF6" />
              <circle cx="248" cy="84" r="8" fill="#8B5CF6" />
              <circle cx="160" cy="132" r="8" fill="#8B5CF6" />
            </g>

            {/* Nodes */}

            {[
              [160, 32],
              [72, 84],
              [248, 84],
              [160, 132],
            ].map(([x, y], i) => (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="2"
                  fill="#6D4AFF"
                />

                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#8B5CF6"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Footer */}

        <div className="mt-auto pt-4">
          <p className="max-w-[360px] text-lg leading-6 text-violet-300">
            Visualize circular dependencies and
            <br />
            bloat instantly.
          </p>
        </div>
      </div>
    </Card>
  );
}




export function DocsCard() {
  return (
    <Card className="min-h-[340px] sm:min-h-[360px] lg:min-h-[380px]">
      <div className="flex h-full flex-col">
        {/* Label */}

        <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-violet-400 sm:text-xs">
          Automation
        </span>

        {/* Heading */}

        <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
          Doc Generator
        </h3>

        {/* Progress Preview */}

        <div className="mt-8 space-y-4">
          {/* Primary */}

          <div className="h-2 rounded-full bg-[#2A2A30]">
            <div className="h-full w-[70%] rounded-full bg-violet-500" />
          </div>

          {/* Secondary */}

          <div className="h-2 w-[80%] rounded-full bg-[#2A2A30]" />

          {/* Third */}

          <div className="h-2 w-[90%] rounded-full bg-[#2A2A30]" />
        </div>

        {/* Footer */}

        <div className="mt-auto">
          <p className="max-w-[300px] text-lg leading-6 text-violet-300">
            Auto-sync READMEs with code changes.
            <span className="text-white"> 100% coverage.</span>
          </p>
        </div>
      </div>
    </Card>
  );
}

export function OverviewCard() {
  return (
    <Card className="min-h-[340px] sm:min-h-[360px] lg:min-h-[380px]">
      <div className="flex h-full flex-col">


      {/* Purple Corner Glow */}
      <div className="pointer-events-none absolute -left-52 -bottom-52 h-[340px] w-[340px] rounded-full bg-violet-500/30 blur-[120px]" />
      
        {/* Label */}

        <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-violet-400 sm:text-xs">
          Health
        </span>

        {/* Heading */}

        <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
          Overview
        </h3>

        {/* Chart */}

        <div className="mt-10 flex items-end gap-2">
          <div className="h-10 w-5 rounded-md bg-violet-900/70" />

          <div className="h-16 w-5 rounded-md bg-violet-700/80" />

          <div className="h-24 w-5 rounded-md bg-violet-500" />

          <div className="h-20 w-5 rounded-md bg-violet-600/80" />
        </div>

        {/* Footer */}

        <div className="mt-auto pt-6">
          <p className="max-w-[300px] text-lg leading-6 text-violet-300">
            High-level metrics on complexity,
            <br />
            technical debt, and velocity.
          </p>
        </div>
      </div>
    </Card>
  );
}