"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import {
  CaretRight,
  CaretDown,
  Folder,
  FolderOpen,
  File,
  RocketLaunch,
  Stack,
  ListBullets,
} from "@phosphor-icons/react";
import type {
  ArchitectureDependency,
  ArchitectureDirectoryStat,
  ArchitectureEntryPoint,
  ArchitectureKeyFile,
  ArchitectureLanguage,
} from "@/lib/api";

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

export interface RepoArchitectureProps {
  markdown: string;
  tree: FileNode[];
  languages: ArchitectureLanguage[];
  directories: ArchitectureDirectoryStat[];
  entryPoints: ArchitectureEntryPoint[];
  technologies: string[];
  dependencies: ArchitectureDependency[];
  keyFiles: ArchitectureKeyFile[];
}

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) => (
  <div className="rounded-2xl border border-[#2a2a2a] bg-[#161616]">
    <div className="border-b border-[#2a2a2a] px-5 py-4">
      <h2 className="flex items-center gap-2 font-semibold text-white">
        {icon}
        {title}
      </h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Bar = ({
  label,
  value,
  percent,
}: {
  label: ReactNode;
  value: string;
  percent: number;
}) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-sm">
      <span className="truncate text-gray-200">{label}</span>
      <span className="shrink-0 text-gray-500">{value}</span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
      <div
        className="h-full rounded-full bg-violet-500"
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
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

export default function RepoArchitecture({
  markdown,
  tree,
  languages,
  directories,
  entryPoints,
  technologies,
  dependencies,
  keyFiles,
}: RepoArchitectureProps) {
  const maxDirectoryLines = directories.reduce(
    (max, item) => Math.max(max, item.lines),
    0
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white">
      <div className="mx-auto max-w-8xl space-y-8">
        <h1 className="text-2xl font-semibold">Architecture</h1>

        <div className="grid gap-6 lg:grid-cols-10">
          {/* Project Structure */}
          <aside className="lg:col-span-3">
            <Section title="Project Structure">
              {tree.length > 0 ? (
                <div className="max-h-[700px] overflow-y-auto">
                  {tree.map((node) => (
                    <TreeNode key={node.id} node={node} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No repository files available.
                </p>
              )}
            </Section>
          </aside>

          {/* Main content */}
          <section className="space-y-6 lg:col-span-7">
            {/* LLM summary */}
            <Section title="Architecture Summary">
              <article className="prose prose-invert prose-zinc max-w-none">
                <ReactMarkdown
                  components={{
                    a: ({ children, ...props }) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </article>
            </Section>

            {/* Technology stack */}
            {technologies.length > 0 && (
              <Section title="Technology Stack" icon={<Stack size={18} />}>
                <div className="flex flex-wrap gap-2">
                  {technologies.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-1 text-xs text-violet-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Languages / Directory breakdown */}
            <div className="grid gap-6 sm:grid-cols-2">
              {languages.length > 0 && (
                <Section title="Languages">
                  <ul className="space-y-3">
                    {languages.map((language) => (
                      <li key={language.name}>
                        <Bar
                          label={language.name}
                          value={`${language.files.toLocaleString()} files · ${language.lines.toLocaleString()} lines · ${language.percent}%`}
                          percent={language.percent}
                        />
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {directories.length > 0 && (
                <Section title="Directory Breakdown">
                  <ul className="space-y-3">
                    {directories.slice(0, 8).map((directory) => (
                      <li key={directory.path}>
                        <Bar
                          label={
                            <span className="font-mono text-xs">
                              {directory.path}
                            </span>
                          }
                          value={`${directory.files.toLocaleString()} files · ${directory.lines.toLocaleString()} lines`}
                          percent={
                            maxDirectoryLines > 0
                              ? (directory.lines / maxDirectoryLines) * 100
                              : 0
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>

            {/* Entry points / Key files */}
            <div className="grid gap-6 sm:grid-cols-2">
              {entryPoints.length > 0 && (
                <Section
                  title="Entry Points"
                  icon={<RocketLaunch size={18} />}
                >
                  <ul className="space-y-2.5">
                    {entryPoints.map((entry) => (
                      <li
                        key={`${entry.path}-${entry.kind}`}
                        className="flex items-center gap-2"
                      >
                        <span className="shrink-0 rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-2 py-0.5 text-[10px] text-amber-300">
                          {entry.kind}
                        </span>
                        <span className="truncate font-mono text-xs text-gray-300">
                          {entry.path}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {keyFiles.length > 0 && (
                <Section
                  title="Key Files"
                  icon={<ListBullets size={18} />}
                >
                  <ul className="space-y-2.5">
                    {keyFiles.map((file) => (
                      <li
                        key={file.path}
                        className="flex items-center justify-between gap-4"
                      >
                        <span className="truncate font-mono text-xs text-gray-300">
                          {file.path}
                        </span>
                        <span className="flex shrink-0 items-center gap-2 text-xs text-gray-500">
                          <span className="rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-2 py-0.5 text-violet-300">
                            {file.language}
                          </span>
                          {file.lines.toLocaleString()} lines
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>

            {/* Dependencies */}
            {dependencies.length > 0 && (
              <Section title="Dependencies">
                <div className="flex flex-wrap gap-2">
                  {dependencies.map((dependency) => (
                    <span
                      key={`${dependency.language}-${dependency.name}`}
                      title={dependency.language}
                      className="group relative rounded-full border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-1 text-xs text-gray-300"
                    >
                      {dependency.name}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}