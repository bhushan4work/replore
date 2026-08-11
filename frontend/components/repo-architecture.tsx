"use client";

import { useState } from "react";
import { CaretDown, CaretRight, FileText } from "@phosphor-icons/react";

export interface ArchitectureKeyFile {
  name: string;
  purpose: string;
}

export interface ArchitectureModule {
  id: string;
  name: string;
  description: string;
  color: string;
  keyFiles: ArchitectureKeyFile[];
  dependsOn: string[];
}

export interface RepoArchitectureProps {
  modules: ArchitectureModule[];
}

function ModuleCard({
  module,
  defaultOpen = false,
}: {
  module: ArchitectureModule;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#161616]">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: module.color }}
            />
            <h3 className="truncate font-semibold text-white">
              {module.name}
            </h3>
          </div>

          <p className="mt-1 truncate text-sm text-gray-400">
            {module.description}
          </p>
        </div>

        {open ? (
          <CaretDown
            size={16}
            weight="bold"
            className="shrink-0 text-gray-400"
          />
        ) : (
          <CaretRight
            size={16}
            weight="bold"
            className="shrink-0 text-gray-400"
          />
        )}
      </button>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-[#2a2a2a] px-5 py-4">
          {/* Key files */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Key Files
            </h4>

            <ul className="mt-3 space-y-2">
              {module.keyFiles.map((file) => (
                <li
                  key={file.name}
                  className="flex items-start gap-2.5 text-sm"
                >
                  <FileText
                    size={15}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-gray-500"
                  />
                  <span className="min-w-0">
                    <span className="font-mono text-gray-200">
                      {file.name}
                    </span>
                    <span className="text-gray-400">
                      {" "}
                      — {file.purpose}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dependencies */}
          {module.dependsOn.length > 0 && (
            <div className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Depends On
              </h4>

              <div className="mt-2.5 flex flex-wrap gap-2">
                {module.dependsOn.map((dep) => (
                  <span
                    key={dep}
                    className="rounded-md bg-[#222] px-2.5 py-1 text-xs text-gray-300"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RepoArchitecture({
  modules,
}: RepoArchitectureProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-3">
        {modules.map((module, index) => (
          <ModuleCard
            key={module.id}
            module={module}
            defaultOpen={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
