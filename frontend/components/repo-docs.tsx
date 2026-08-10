"use client";

import { useEffect, useMemo, useState } from "react";
import { isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { DownloadSimple } from "@phosphor-icons/react";

// ---------------------------------------------------------
// Data model
// ---------------------------------------------------------

export interface RepoDocsProps {
  markdown: string;
  title?: string;
}

interface TocItem {
  id: string;
  level: number;
  text: string;
}

// ---------------------------------------------------------
// Heading slugging + text extraction (shared by TOC and render)
// ---------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function nodeToText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(nodeToText).join("");
  }
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return nodeToText(props.children);
  }
  return "";
}

function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];

  for (const line of markdown.split("\n")) {
    const match = /^(#{2,3})\s+(.+)$/.exec(line);

    if (!match) continue;

    const level = match[1].length;
    const text = match[2].trim();
    const id = slugify(text);

    if (id) {
      items.push({ id, level, text });
    }
  }

  return items;
}

// ---------------------------------------------------------
// Component
// ---------------------------------------------------------

export default function RepoDocs({ markdown, title }: RepoDocsProps) {
  const toc = useMemo(() => extractToc(markdown), [markdown]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Track which heading is currently in view.
  useEffect(() => {
    if (toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top
          );

        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-72px 0px -70% 0px" }
    );

    for (const item of toc) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [toc]);

  const scrollTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleExport = () => {
    const blob = new Blob([markdown], {
      type: "text/markdown;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(title ?? "README").replace(/[^\w\-]+/g, "-")}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-10">
        {/* Table of contents */}
        <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 self-start overflow-y-auto rounded-xl border border-[#2a2a2a] bg-[#111] p-3 lg:block">
          <p className="px-3 pb-3 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            On this page
          </p>

          <nav className="space-y-0.5">
            {toc.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`w-full rounded-md border-l-2 py-1.5 pr-2 text-left text-sm transition ${
                  activeId === item.id
                    ? "border-violet-500 text-white"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
                style={{
                  paddingLeft: item.level === 3 ? "2.5rem" : "0.875rem",
                }}
              >
                <span
                  className={
                    item.level === 3 ? "text-xs" : "text-sm font-medium"
                  }
                >
                  {item.text}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <section className="min-w-0 flex-1">
          {/* Sticky export button */}
          <div className="sticky top-0 z-10 flex justify-end bg-[#0a0a0a]/95 py-2 backdrop-blur">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
            >
              <DownloadSimple size={14} />
              Export as Markdown
            </button>
          </div>

          <article className="prose prose-invert prose-zinc mx-auto max-w-3xl">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 id={slugify(nodeToText(children))}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 id={slugify(nodeToText(children))}>
                    {children}
                  </h3>
                ),
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
        </section>
      </div>
    </div>
  );
}
