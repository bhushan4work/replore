"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import RepoChat, {
  type ChatMessage,
  type CodeReference,
} from "@/components/repo-chat";
import { ApiError, sendChatMessage } from "@/lib/api";

const INVALID_INPUT_MESSAGE = "Invalid input, ask repo related things only";

const GREETINGS = new Set([
  "hi",
  "hello",
  "hey",
  "hii",
  "heyy",
  "yo",
  "sup",
  "hiya",
  "howdy",
  "hola",
  "thanks",
  "thank you",
  "ty",
  "bye",
  "goodbye",
  "ok",
  "okay",
  "cool",
  "nice",
  "wow",
  "great",
  "help",
]);

function isValidQuestion(input: string): boolean {
  return !GREETINGS.has(input.trim().toLowerCase());
}

export default function ChatPage() {
  const { repositoryId } = useParams<{ repositoryId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);

  const appendAssistant = (content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "assistant", content },
    ]);
  };

  const handleSend = async (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      },
    ]);

    if (!isValidQuestion(text)) {
      appendAssistant(INVALID_INPUT_MESSAGE);
      return;
    }

    setTyping(true);

    try {
      const response = await sendChatMessage(repositoryId, text);

      const irrelevant = response.answer
        .toLowerCase()
        .includes("couldn't find relevant information");

      appendAssistant(irrelevant ? INVALID_INPUT_MESSAGE : response.answer);
    } catch (err) {
      appendAssistant(
        err instanceof ApiError
          ? err.message
          : "The backend could not be reached. Please try again."
      );
    } finally {
      setTyping(false);
    }
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