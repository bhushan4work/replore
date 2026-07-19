"use client";

import { useEffect, useState } from "react";

const COLORS = [
  "#ff4d4f",
  "#ff7a45",
  "#fadb14",
  "#52c41a",
  "#13c2c2",
  "#1677ff",
  "#722ed1",
  "#eb2f96",
  "#ffffff",
  "#a3e635",
];

const BAR_COUNT = 140;

type Bar = {
  id: number;
  width: number;
  colors: string[];
  duration: number;
  delay: number;
};

function randomColor(exclude?: string) {
  let c = COLORS[Math.floor(Math.random() * COLORS.length)];
  while (c === exclude) {
    c = COLORS[Math.floor(Math.random() * COLORS.length)];
  }
  return c;
}

function makeBars(): Bar[] {
  return Array.from({ length: BAR_COUNT }, (_, id) => {
    // each bar gets its own little cycle of colors it will flicker through
    const steps = 4 + Math.floor(Math.random() * 3); // 4-6 colors
    const colors: string[] = [];
    for (let i = 0; i < steps; i++) {
      colors.push(randomColor(colors[i - 1]));
    }
    return {
      id,
      width: 6 + Math.random() * 22, // px
      colors,
      duration: 1.4 + Math.random() * 2.6, // seconds per full cycle
      delay: -Math.random() * 6, // negative delay desyncs everyone immediately
    };
  });
}

export default function Hero() {
  // Generated client-side only so every reload/mount looks freshly glitched
  // and we avoid an SSR/client markup mismatch.
  const [bars, setBars] = useState<Bar[] | null>(null);

  useEffect(() => {
    setBars(makeBars());
  }, []);

  return (
    <section className="flex min-h-screen items-center justify-center px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center">

        {/* Heading */}
        <div className="mb-4 w-full max-w-3xl text-left">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            replore
          </h1>

          <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-400">
            understand any gitHub repository in minutes with ai-powered architecture
            analysis, dependency visualization, and repository-aware chat.
          </p>
        </div>

        <div className="w-full max-w-3xl overflow-hidden bg-black">
          <div className="glitch-strip flex h-36 w-full sm:h-60">
            {bars?.map((bar) => (
              <span
                key={bar.id}
                className="glitch-bar block h-full"
                style={
                  {
                    flex: `${bar.width} 0 auto`,
                    // expose the color cycle + timing to CSS via custom props
                    "--c0": bar.colors[0],
                    "--c1": bar.colors[1],
                    "--c2": bar.colors[2],
                    "--c3": bar.colors[3] ?? bar.colors[0],
                    "--c4": bar.colors[4] ?? bar.colors[1],
                    "--c5": bar.colors[5] ?? bar.colors[2],
                    animationDuration: `${bar.duration}s`,
                    animationDelay: `${bar.delay}s`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </div>

        <input
          className="mt-6 h-12 w-full max-w-3xl border border-zinc-700 bg-zinc-950 px-4 text-white outline-none"
          placeholder="https://"
        />


      </div>

      <style jsx global>{`
        .glitch-bar {
          background-color: var(--c0);
          animation-name: glitch-flicker;
          animation-timing-function: steps(1, end);
          animation-iteration-count: infinite;
        }

        @keyframes glitch-flicker {
          0%,
          16.6% {
            background-color: var(--c0);
          }
          16.7%,
          33.2% {
            background-color: var(--c1);
          }
          33.3%,
          49.9% {
            background-color: var(--c2);
          }
          50%,
          66.6% {
            background-color: var(--c3);
          }
          66.7%,
          83.2% {
            background-color: var(--c4);
          }
          83.3%,
          100% {
            background-color: var(--c5);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .glitch-bar {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}