"use client";
import Link from "next/link";
import { Menu, CircleUserRound, LogOut } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-[1080px] -translate-x-1/2">
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
        <div className="grid grid-cols-3 items-center h-full px-6">

          {/* Left */}
          <div className="flex items-center">
            <Link
              href="/"
              className="font-[family-name:var(--font-instrument-serif)] text-2xl sm:text-3xl text-white underline"
            >
              Replore
            </Link>
          </div>

          {/* Center (Desktop) */}
          <nav className="hidden justify-center md:flex">
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
                href="#faq"
                className="text-xl text-white/70 transition hover:text-white"
              >
                FAQ
              </Link>
            </div>
          </nav>

          {/* Right (Desktop) */}
          <div className="hidden items-center justify-end md:flex">
            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full p-2 text-white transition hover:bg-white/10">
                    <CircleUserRound size={34} />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-70 border-white/10 bg-zinc-950 text-white"
                >
                  <div className="border-b border-white/10 px-3 py-2 text-sm text-white/70">
                    {user.email}
                  </div>

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/signup"
                className="rounded-full bg-white px-6 py-2 text-xl font-medium text-black transition hover:bg-white/90"
              >
                Get Started
              </Link>
            )}
          </div>

          {/* Mobile */}
          <div className="col-span-2 flex justify-end md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="rounded-lg p-2 text-white transition hover:bg-white/10"
                >
                  <Menu className="h-6 w-6 sm:h-7 sm:w-7" />
                </button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="flex h-full w-[85vw] max-w-[340px] flex-col border-l border-white/10 bg-black/90 p-0 text-white backdrop-blur-2xl sm:w-[340px]"
              >
                {/* Header */}
                <div className="border-b border-white/10 px-5 py-5 sm:px-6 sm:py-6">
                  <Link
                    href="/"
                    className="font-[family-name:var(--font-instrument-serif)] text-3xl underline"
                  >
                    Replore
                  </Link>
                </div>

                {/* Navigation */}
                <nav className="flex flex-1 flex-col px-4 sm:px-4">
                  <Link
                    href="#features"
                    className="rounded-lg px-3 py-4 text-lg sm:text-lg transition hover:bg-white/5"
                  >
                    Features
                  </Link>

                  <Link
                    href="#how-it-works"
                    className="rounded-lg px-3 py-4 text-lg sm:text-lg transition hover:bg-white/5"
                  >
                    How it works
                  </Link>

                  <Link
                    href="#pricing"
                    className="rounded-lg px-3 py-4 text-lg sm:text-lg transition hover:bg-white/5"
                  >
                    Pricing
                  </Link>

                  {/* Push auth buttons to bottom */}
                  <div className="mt-auto pb-6 pt-6">
                    {user ? (
                      <button
                        onClick={handleLogout}
                        className="w-full rounded-full border border-white/20 py-3 text-lg sm:text-xl transition hover:bg-white/10"
                      >
                        Logout
                      </button>
                    ) : (
                      <>
                        <Link
                          href="/signup"
                          className="mb-3 block w-full rounded-full border border-white/20 py-3 text-lg sm:text-xl text-center transition hover:bg-white/10"
                        >
                          Get Started
                        </Link>
                      </>
                    )}
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