"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className="
          mx-auto mt-4
          h-20
          w-[95%]
          max-w-6xl
          rounded-full
          border border-white/10
          bg-black/25
          backdrop-blur-xl
          supports-[backdrop-filter]:bg-black/20
        "
      >
        <div className="flex h-full items-center px-6">

          {/* Left */}
          <div className="flex flex-1 items-center">
            <Link
              href="/"
              className="font-[family-name:var(--font-instrument-serif)] text-3xl text-white underline"
            >
              Replore
            </Link>
          </div>

          {/* Center (Desktop) */}
          <nav className="hidden flex-1 justify-center md:flex">
            <div className="flex items-center gap-10">
              <Link
                href="#features"
                className="text-xl text-white/70 transition hover:text-white"
              >
                Features
              </Link>

              <Link
                href="#how-it-works"
                className="text-xl text-white/70 transition hover:text-white"
              >
                How it works
              </Link>

              <Link
                href="#pricing"
                className="text-xl text-white/70 transition hover:text-white"
              >
                Pricing
              </Link>
            </div>
          </nav>

          {/* Right (Desktop) */}
          <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
            <button className="rounded-full bg-white px-6 py-2 text-xl font-medium text-black transition hover:bg-white/90">
              Get Started
            </button>
          </div>

          {/* Mobile */}
          <div className="flex flex-1 justify-end md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="rounded-lg p-2 text-white transition hover:bg-white/10"
                >
                  <Menu size={26} />
                </button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="flex h-full w-[85vw] max-w-[340px] flex-col border-l border-white/10 bg-black/90 p-0 text-white backdrop-blur-2xl"
              >
                {/* Header */}
                <div className="border-b border-white/10 px-6 py-6">
                  <Link
                    href="/"
                    className="font-[family-name:var(--font-instrument-serif)] text-3xl underline"
                  >
                    Replore
                  </Link>
                </div>

                {/* Navigation */}
                <nav className="flex flex-1 flex-col px-6 py-8">
                  <Link
                    href="#features"
                    className="rounded-lg px-3 py-4 text-xl transition hover:bg-white/5"
                  >
                    Features
                  </Link>

                  <Link
                    href="#how-it-works"
                    className="rounded-lg px-3 py-4 text-xl transition hover:bg-white/5"
                  >
                    How it works
                  </Link>

                  <Link
                    href="#pricing"
                    className="rounded-lg px-3 py-4 text-xl transition hover:bg-white/5"
                  >
                    Pricing
                  </Link>

                  {/* Push auth buttons to bottom */}
                  <div className="mt-auto pt-6">
                    <button className="mb-3 w-full rounded-full border border-white/20 py-2 text-xl transition hover:bg-white/10">
                      Sign in
                    </button>

                    <button className="w-full rounded-full bg-white py-3 text-base text-xl text-black transition hover:bg-white/90">
                      Sign up
                    </button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </header>
  );
}