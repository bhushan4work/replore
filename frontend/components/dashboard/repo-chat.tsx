"use client";

import { useEffect, useRef, useState } from "react";
import {
  CaretRight,
  CaretDown,
  PaperPlaneRight,
  FileCode,
} from "@phosphor-icons/react";

// ---------------------------------------------------------
// Data model
// ---------------------------------------------------------

export interface CodeReference {
  filePath: string;
  symbol?: string;
  startLine?: number;
  endLine?: number;
  lineNumber?: number;
  code?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  codeReference?: CodeReference;
  sources?: CodeReference[];
}

export interface RepoChatProps {
  messages: ChatMessage[];
  onSend?: (message: string) => void;
  onCodeFileClick?: (reference: CodeReference) => void;
  isTyping?: boolean;
}

// ---------------------------------------------------------
// Collapsible code snippet (legacy single-reference)
// ---------------------------------------------------------

function CodeSnippet({
  reference,
  onFileClick,
}: {
  reference: CodeReference;
  onFileClick?: (reference: CodeReference) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#0d0d0d]">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-400 transition hover:text-white"
          aria-label={open ? "Collapse" : "Expand"}
        >
          {open ? (
            <CaretDown size={14} />
          ) : (
            <CaretRight size={14} />
          )}
        </button>

        <FileCode size={14} className="shrink-0 text-violet-400" />

        <button
          onClick={() => onFileClick?.(reference)}
          className="truncate font-mono text-xs text-violet-300 underline-offset-2 transition hover:text-violet-200 hover:underline"
          title="Open in architecture/graph view"
        >
          {reference.filePath}
          {reference.lineNumber != null ? `:${reference.lineNumber}` : ""}
        </button>
      </div>

      {open && reference.code && (
        <pre className="max-h-80 overflow-auto border-t border-[#2a2a2a] px-4 py-3 text-xs leading-relaxed text-gray-200">
          <code>{reference.code}</code>
        </pre>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// Referenced files list (structured sources from backend)
// ---------------------------------------------------------

function ReferencedFiles({
  sources,
  onFileClick,
}: {
  sources: CodeReference[];
  onFileClick?: (reference: CodeReference) => void;
}) {
  if (!sources.length) return null;

  return (
    <div className="mt-3 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2">
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-500">
        Referenced files
      </p>

      <ul className="space-y-1">
        {sources.map((source, idx) => {
          const lineRange =
            source.startLine != null && source.endLine != null
              ? `:${source.startLine}-${source.endLine}`
              : source.startLine != null
                ? `:${source.startLine}`
                : "";

          const label = source.symbol
            ? `${source.filePath}${lineRange} — ${source.symbol}`
            : `${source.filePath}${lineRange}`;

          return (
            <li key={`${source.filePath}-${idx}`}>
              <button
                onClick={() => onFileClick?.(source)}
                className="flex items-center gap-1.5 font-mono text-xs text-violet-300 underline-offset-2 transition hover:text-violet-200 hover:underline"
                title="Open file"
              >
                <FileCode
                  size={12}
                  className="shrink-0 text-violet-400"
                />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------
// Message bubble
// ---------------------------------------------------------

function MessageBubble({
  message,
  onCodeFileClick,
}: {
  message: ChatMessage;
  onCodeFileClick?: (reference: CodeReference) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-violet-600 text-white"
            : "border border-[#2a2a2a] bg-[#161616] text-gray-200"
        }`}
      >
        <p>{message.content}</p>

        {message.codeReference && (
          <CodeSnippet
            reference={message.codeReference}
            onFileClick={onCodeFileClick}
          />
        )}

        {message.sources && message.sources.length > 0 && (
          <ReferencedFiles
            sources={message.sources}
            onFileClick={onCodeFileClick}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Chat
// ---------------------------------------------------------

export default function RepoChat({
  messages,
  onSend,
  onCodeFileClick,
  isTyping = false,
}: RepoChatProps) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the message list pinned to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
    });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = draft.trim();

    if (!trimmed) return;

    onSend?.(trimmed);
    setDraft("");
  };

  return (
    <div className="flex h-screen flex-col px-52 bg-[#0a0a0a] text-white">
      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-8"
      >
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-500">
              Ask anything about this repository.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onCodeFileClick={onCodeFileClick}
          />
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#161616] px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500" />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-[#2a2a2a] bg-[#0a0a0a] px-4 py-4 sm:px-8"
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about this repository…"
            className="flex-1 rounded-xl border border-[#2a2a2a] bg-[#161616] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-violet-500/60"
          />

          <button
            type="submit"
            disabled={!draft.trim()}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send"
          >
            <PaperPlaneRight size={18} weight="fill" />
          </button>
        </div>
      </form>
    </div>
  );
}
