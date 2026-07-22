"use client";

import { useEffect, useState } from "react";

export function GithubStar() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    async function fetchStars() {
      try {
        const res = await fetch(
          "https://api.github.com/repos/bhushan4work/replore"
        );

        if (!res.ok) return;

        const data = await res.json();

        setStars(data.stargazers_count);
      } catch {
        // Ignore network/API errors
      }
    }

    fetchStars();
  }, []);

  return (
    <a
      href="https://github.com/bhushan4work/replore"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md transition hover:bg-white/20"
    >
      ⭐ Star

      {stars !== null && (
        <span className="font-semibold">
          {stars.toLocaleString()}
        </span>
      )}
    </a>
  );
}