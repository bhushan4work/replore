"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import RepoChat, {
  type ChatMessage,
  type CodeReference,
} from "@/components/dashboard/repo-chat";
import { ApiError, sendChatMessage } from "@/lib/api";

const GENERIC_INVALID_MESSAGE =
  "I can only answer questions related to this repository. Please ask about its code, structure, or features.";

const NO_INFORMATION_MESSAGE =
  "I couldn't find relevant information in this repository for that question. Try asking about a specific file, module, or feature.";

const WORD_ABBREVIATIONS: Record<string, string> = {
  repo: "repository",
  repos: "repositories",
  config: "configuration",
  auth: "authentication",
  pkg: "package",
  pkgs: "packages",
  util: "utility",
  utils: "utilities",
  func: "function",
  funcs: "functions",
  fn: "function",
  db: "database",
  ui: "user interface",
  ux: "user experience",
  dev: "developer",
  prod: "production",
  docs: "documentation",
  doc: "documentation",
  src: "source code",
  param: "parameter",
  params: "parameters",
  dep: "dependency",
  deps: "dependencies",
  lib: "library",
  libs: "libraries",
  app: "application",
};

function normalizeQuestion(input: string): string {
  const words = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  return words.map((word) => WORD_ABBREVIATIONS[word] ?? word).join(" ");
}

const CHATTER_PHRASES = new Set([
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
  "namaste",
  "bonjour",
  "hey there",
  "hello there",
  "hi there",
  "good morning",
  "good afternoon",
  "good evening",
  "greetings",
  "thanks",
  "thank you",
  "ty",
  "thx",
  "thanks a lot",
  "thanks so much",
  "thanks a bunch",
  "thank you so much",
  "you're welcome",
  "your welcome",
  "no problem",
  "no worries",
  "sure",
  "ok",
  "okay",
  "cool",
  "nice",
  "wow",
  "great",
  "awesome",
  "amazing",
  "lol",
  "omg",
  "nice to meet you",
  "bye",
  "goodbye",
  "good night",
  "see you",
  "see you later",
  "see ya",
  "catch you later",
  "talk to you later",
  "talk later",
  "help",
  "help me",
  "can you help me",
  "can you help",
  "i need help",
  "help please",
  "please help",
  "how are you",
  "how's it going",
  "hows it going",
  "how do you do",
  "whats up",
  "what's up",
  "wassup",
  "watsup",
  "what are you doing",
  "how was your day",
  "how is your day",
  "long time no see",
  "joke",
  "tell me a joke",
  "tell a joke",
  "story",
  "tell me a story",
  "tell a story",
  "poem",
  "tell me a poem",
  "write me a poem",
  "write a poem",
  "write a song",
  "write me a song",
  "sing a song",
  "sing me a song",
  "weather",
  "what is the weather",
  "whats the weather",
  "what's the weather",
  "how is the weather",
  "what time is it",
  "whats the time",
  "what's the time",
  "what is the date today",
  "what day is it today",
  "what is your name",
  "what's your name",
  "whats your name",
  "who are you",
  "what are you",
  "what can you do",
  "what do you do",
  "are you human",
  "are you real",
  "are you ai",
  "are you an ai",
  "are you a robot",
  "are you a bot",
  "do you have feelings",
  "do you have a name",
  "where are you from",
  "where do you live",
  "how old are you",
  "who made you",
  "who created you",
  "who is your creator",
  "what is the meaning of life",
  "meaning of life",
  "why do you exist",
  "tell me about yourself",
  "introduce yourself",
  "what is the capital of france",
  "who is the president",
  "test",
  "testing",
  "random",
  "whatever",
  "nevermind",
  "never mind",
  "skip",
  "stop",
  "thats all",
  "that's all",
  "no",
  "yes",
]);

function isValidQuestion(input: string): boolean {
  return !CHATTER_PHRASES.has(normalizeQuestion(input));
}

export default function ChatPage() {
  const { repositoryId } = useParams<{ repositoryId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const inFlightRef = useRef(0);

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
      appendAssistant(GENERIC_INVALID_MESSAGE);
      return;
    }

    const question = normalizeQuestion(text);

    setTyping(true);
    inFlightRef.current += 1;

    try {
      const response = await sendChatMessage(repositoryId, question);

      const unanswered = response.answer
        .toLowerCase()
        .includes("couldn't find relevant information");

      appendAssistant(
        unanswered ? NO_INFORMATION_MESSAGE : response.answer
      );
    } catch (err) {
      let message: string;

      if (err instanceof ApiError) {
        message = err.message;
      } else if (err instanceof Error && err.name === "TimeoutError") {
        message = "The request timed out. Please try again.";
      } else {
        message = "The backend could not be reached. Please try again.";
      }

      appendAssistant(message);
    } finally {
      inFlightRef.current -= 1;
      setTyping(inFlightRef.current > 0);
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