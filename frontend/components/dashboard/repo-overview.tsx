"use client";

import type { ReactNode } from "react";
import {
  Star,
  GitFork,
  Eye,
  WarningCircle,
  Tag,
  Globe,
  GitCommit,
  Users,
} from "@phosphor-icons/react";
import type { ContributorStat, HeadCommit } from "@/lib/api";

interface QuickStats {
  totalFiles: number;
  linesOfCode: number;
  blankLines: number;
  directories: number;
  primaryLanguagePercent: string;
  contributors: number;
  totalCommits: number;
}

export interface RepoOverviewProps {
  repoName: string;
  repoOwner: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  defaultBranch: string;
  homepage: string | null;
  license: string | null;
  topics: string[];
  createdLabel: string | null;
  sizeLabel: string | null;
  archived: boolean;
  isFork: boolean;
  lastUpdated: string;
  stats: QuickStats;
  headCommit: HeadCommit | null;
  topContributors: ContributorStat[];
}

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-5">
    <p className="text-sm text-gray-400">{label}</p>
    <p className="mt-3 text-3xl font-bold text-white">
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>
  </div>
);

const Pill = ({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) => (
  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 py-1.5 text-sm text-gray-200">
    {icon}
    <span>{children}</span>
  </span>
);

const Badge = ({ label }: { label: string }) => (
  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
    {label}
  </span>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="rounded-2xl border border-[#2a2a2a] bg-[#161616]">
    <div className="border-b border-[#2a2a2a] px-5 py-4">
      <h2 className="font-semibold text-white">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export default function RepoOverview({
  repoName,
  repoOwner,
  description,
  stars,
  forks,
  openIssues,
  watchers,
  defaultBranch,
  homepage,
  license,
  topics,
  createdLabel,
  sizeLabel,
  archived,
  isFork,
  lastUpdated,
  stats,
  headCommit,
  topContributors,
}: RepoOverviewProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white">
      <div className="mx-auto max-w-8xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="mr-2 text-4xl font-bold">{repoName}</h1>

          <Pill icon={<Star size={16} weight="fill" />}>
            {stars.toLocaleString()}
          </Pill>

          <Pill icon={<GitFork size={16} />}>{forks.toLocaleString()}</Pill>

          <Pill icon={<Eye size={16} />}>{watchers.toLocaleString()}</Pill>

          <Pill icon={<WarningCircle size={16} />}>
            {openIssues.toLocaleString()}
          </Pill>

          {archived && <Badge label="Archived" />}
          {isFork && <Badge label="Fork" />}
        </div>

        {description && (
          <p className="max-w-3xl text-sm leading-relaxed text-gray-300">
            {description}
          </p>
        )}

        {topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#161616] px-3 py-1 text-xs text-gray-300"
              >
                <Tag size={12} />
                {topic}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400">
          <span>
            <span className="text-gray-500">Owner:</span> {repoOwner}
          </span>

          <span>
            <span className="text-gray-500">Branch:</span> {defaultBranch}
          </span>

          {createdLabel && (
            <span>
              <span className="text-gray-500">Created:</span> {createdLabel}
            </span>
          )}

          {sizeLabel && (
            <span>
              <span className="text-gray-500">Size:</span> {sizeLabel}
            </span>
          )}

          {license && (
            <span>
              <span className="text-gray-500">License:</span> {license}
            </span>
          )}

          {homepage && (
            <a
              href={homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-violet-300 transition hover:text-violet-200 hover:underline"
            >
              <Globe size={14} />
              Homepage
            </a>
          )}

          <span className="ml-auto">Last updated {lastUpdated}</span>
        </div>

        {/* Quick Stats */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Quick Stats</h2>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Files" value={stats.totalFiles} />
            <StatCard label="Lines of Code" value={stats.linesOfCode} />
            <StatCard label="Blank Lines" value={stats.blankLines} />
            <StatCard label="Directories" value={stats.directories} />

            <StatCard
              label="Primary Language"
              value={stats.primaryLanguagePercent}
            />
            <StatCard label="Contributors" value={stats.contributors} />
            <StatCard label="Total Commits" value={stats.totalCommits} />
            <StatCard label="Repository Size" value={sizeLabel ?? "—"} />
          </div>
        </div>

        {/* Git Activity */}
        <Section title="Git Activity">
          {headCommit ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Latest commit
              </p>
              <div className="mt-2 flex items-center gap-2">
                <GitCommit size={16} className="shrink-0 text-violet-400" />
                <span className="font-mono text-xs text-violet-300">
                  {headCommit.short_sha}
                </span>
                <span className="truncate text-sm text-gray-200">
                  {headCommit.message}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{headCommit.author}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No commit information available.
            </p>
          )}

          {topContributors.length > 0 && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Top Contributors
              </p>
              <ul className="mt-2 space-y-1.5">
                {topContributors.map((contributor) => (
                  <li
                    key={contributor.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="inline-flex items-center gap-2 text-gray-200">
                      <Users size={14} className="text-gray-500" />
                      {contributor.name}
                    </span>
                    <span className="text-gray-400">
                      {contributor.commits.toLocaleString()}{" "}
                      commit{contributor.commits === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}