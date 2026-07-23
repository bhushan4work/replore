"use client";

import { useState } from "react";
import {
  CaretRight,
  CaretDown,
  Folder,
  FolderOpen,
  File,
  Star,
} from "@phosphor-icons/react";

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

interface QuickStats {
  totalFiles: number;
  linesOfCode: number;
  primaryLanguagePercent: string;
  contributors: number;
}

export interface RepoOverviewProps {
  repoName: string;
  stars: number;
  languages: string[];
  lastUpdated: string;
  fileTree: FileNode[];
  stats: QuickStats;
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
    <p className="mt-3 text-3xl font-bold text-white">{value}</p>
  </div>
);

function TreeNode({
  node,
  depth = 0,
}: {
  node: FileNode;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth < 1);

  const isFolder = node.type === "folder";

  return (
    <div>
      <button
        disabled={!isFolder}
        onClick={() => isFolder && setOpen(!open)}
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-white/5 ${
          !isFolder ? "cursor-default" : ""
        }`}
        style={{ paddingLeft: depth * 18 + 8 }}
      >
        {isFolder ? (
          open ? (
            <CaretDown size={14} className="text-gray-400" />
          ) : (
            <CaretRight size={14} className="text-gray-400" />
          )
        ) : (
          <span className="w-[14px]" />
        )}

        {isFolder ? (
          open ? (
            <FolderOpen size={18} className="text-yellow-400" />
          ) : (
            <Folder size={18} className="text-yellow-400" />
          )
        ) : (
          <File size={18} className="text-gray-400" />
        )}

        <span className="truncate text-sm text-gray-200">{node.name}</span>
      </button>

      {isFolder &&
        open &&
        node.children?.map((child) => (
          <TreeNode key={child.id} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export default function RepoOverview({
  repoName,
  stars,
  languages,
  lastUpdated,
  fileTree,
  stats,
}: RepoOverviewProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="mr-2 text-4xl font-bold">{repoName}</h1>

          <div className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 py-1.5 text-sm text-gray-200">
            <Star size={16} weight="fill" />
            <span>{stars.toLocaleString()}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <span
                key={lang}
                className="rounded-full border border-[#2a2a2a] bg-[#161616] px-3 py-1 text-xs text-gray-300"
              >
                {lang}
              </span>
            ))}
          </div>

          <span className="ml-auto text-sm text-gray-400">
            Last updated {lastUpdated}
          </span>
        </div>

        {/* Content */}
        <div className="grid gap-6 lg:grid-cols-10">
          {/* File Tree */}
          <aside className="lg:col-span-3">
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#161616]">
              <div className="border-b border-[#2a2a2a] px-5 py-4">
                <h2 className="font-semibold text-white">Repository Files</h2>
              </div>

              <div className="max-h-[700px] overflow-y-auto p-3">
                {fileTree.map((node) => (
                  <TreeNode key={node.id} node={node} />
                ))}
              </div>
            </div>
          </aside>

          {/* Right */}
          <section className="space-y-6 lg:col-span-7">
            <div>
              <h2 className="mb-4 text-xl font-semibold">Quick Stats</h2>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total Files"
                  value={stats.totalFiles.toLocaleString()}
                />
                <StatCard
                  label="Lines of Code"
                  value={stats.linesOfCode.toLocaleString()}
                />
                <StatCard
                  label="Primary Language"
                  value={stats.primaryLanguagePercent}
                />
                <StatCard
                  label="Contributors"
                  value={stats.contributors}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}