"use client";

import { useState } from "react";
import RepoChat, {
  type ChatMessage,
  type CodeReference,
} from "@/components/repo-chat";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hi! I've indexed this repository. Ask me about its architecture, key modules, or how specific files work.",
  },
  {
    id: "2",
    role: "user",
    content: "How does the chunking pipeline split source files?",
  },
  {
    id: "3",
    role: "assistant",
    content:
      "The parser chunks each file by Tree-sitter symbols. Functions, classes, and declarations become their own chunks with symbol metadata; the remaining module-level code is grouped into module chunks. Oversized symbols are split so no chunk exceeds CHUNK_SIZE.",
    codeReference: {
      filePath: "src/app/services/parser.ts",
      lineNumber: 42,
      code: `def _chunk_by_symbols(parsed_file):
    tree = parse_ast(parsed_file)
    if tree is None:
        return []
    for node in tree.root_node.named_children:
        symbol_type = _symbol_type(node.type)
        if symbol_type is None:
            module_parts.append(_node_text(parsed_file.content, node))
        else:
            flush_module()
            chunks.extend(_split_to_chunks(parsed_file, node))`,
    },
  },
  {
    id: "4",
    role: "user",
    content: "Where are embeddings stored and how are duplicates avoided?",
  },
  {
    id: "5",
    role: "assistant",
    content:
      "Embeddings are written to the code_chunks table via upsert on (repository_id, file_path, chunk_index), so a retried insert never duplicates a chunk. Stale chunks from earlier analyses of the same repository are deleted after indexing completes.",
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [typing, setTyping] = useState(false);

  const handleSend = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      },
    ]);

    setTyping(true);

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "That's a great question. Once the chat API is wired up, I'll answer it using only context retrieved from this repository. For now this is a mock assistant response.",
        },
      ]);

      setTyping(false);
    }, 1200);
  };

  const handleCodeFileClick = (reference: CodeReference) => {
    console.log("Navigate to file:", reference.filePath);
  };

  return (
    <RepoChat
      messages={messages}
      onSend={handleSend}
      onCodeFileClick={handleCodeFileClick}
      isTyping={typing}
    />
  );
}
