"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-zinc-950 text-white">
      {/* Content */}
      <div className="relative z-20 mx-auto max-w-[1750px] px-8 pt-16 pb-[18rem]">
        <div className="flex flex-col gap-16 lg:flex-row mb-24">
          {/* Brand */}
          <div>
            <h2 className="font-[family-name:var(--font-instrument-serif)] text-6xl underline">
              Replore
            </h2>

            <p className="mt-6 max-w-xs text-xl leading-8 text-white/55">
              Discover, understand and explore any GitHub repository instantly
              with AI-powered code intelligence.
            </p>
          </div>

          {/* Right Side */}
          <div className="ml-auto flex gap-20 xl:gap-60">
            {/* Product */}
            <div>
              <h3 className="mb-7 text-2xl font-semibold">Product</h3>

              <div className="flex flex-col gap-4 text-white/60">
                <Link
                  href="#features"
                  className="text-2xl transition hover:text-white"
                >
                  Features
                </Link>

                <Link
                  href="#how-it-works"
                  className="text-2xl transition hover:text-white"
                >
                  How it Works
                </Link>

                <Link
                  href="#faq"
                  className="text-2xl transition hover:text-white"
                >
                  FAQ
                </Link>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 className="mb-7 text-2xl font-semibold">Resources</h3>

              <div className="flex flex-col gap-4 text-white/60">
                <Link
                  href="/"
                  className="text-2xl transition hover:text-white"
                >
                  Documentation
                </Link>

                <Link
                  href="/"
                  className="text-2xl transition hover:text-white"
                >
                  GitHub
                </Link>

                <Link
                  href="/"
                  className="text-2xl transition hover:text-white"
                >
                  Contact
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h3 className="mb-7 text-2xl font-semibold">Legal</h3>

              <div className="flex flex-col gap-4 text-white/60">
                <Link
                  href="/"
                  className="text-2xl transition hover:text-white"
                >
                  Privacy Policy
                </Link>

                <Link
                  href="/"
                  className="text-2xl transition hover:text-white"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Giant Background Text */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden">
        <h1
          className="
            text-center
            whitespace-nowrap
            select-none
            font-black
            uppercase
            leading-[0.82]
            tracking-[-0.09em]

            text-[10rem]
            sm:text-[12rem]
            md:text-[18rem]
            lg:text-[24rem]
            xl:text-[28rem]

            translate-y-[10%]
          "
          style={{
            background:
              "linear-gradient(to bottom, #1f1f1f 0%, #191919 45%, #1d1d1d 75%, #101010 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          REPLORE
        </h1>
      </div>
    </footer>
  );
}