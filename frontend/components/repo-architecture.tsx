"use client";

import ReactMarkdown from "react-markdown";

export interface RepoArchitectureProps {
  markdown: string;
}

export default function RepoArchitecture({
  markdown,
}: RepoArchitectureProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <h1 className="text-2xl font-semibold">Architecture</h1>

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
      </div>
    </div>
  );
}
