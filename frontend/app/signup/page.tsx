"use client";

import Image from "next/image";
import Link from "next/link";

import { FcGoogle } from "react-icons/fc";

import { supabase } from "@/lib/supabase";

export default function SignUpPage() {
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",

      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google Sign-In Error:", error.message);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT SIDE */}

        <section className="relative flex min-h-screen flex-col bg-white">
          {/* Header */}

          <header className="flex items-center justify-between px-6 py-6 sm:px-8 lg:px-16 xl:px-24 2xl:px-34">
            <Link
              href="/"
              style={{
                fontFamily: "var(--font-instrument-serif)",
              }}
              className="text-[20px] italic underline tracking-[-0.03em] text-black sm:text-[24px] lg:text-[28px]"
            >
              ← Back
            </Link>
          </header>

          {/* Form */}

          <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-8 lg:px-0">
            <div className="w-full max-w-[510px]">

              <p
                style={{
                  fontFamily: "var(--font-instrument-serif)",
                }}
                className="text-center text-[30px] italic underline tracking-[-0.03em] text-black sm:text-[34px] lg:text-[30px]"
              >
                Replore Workspace
              </p>

              <p className="mb-6 text-center text-[16px] tracking-[-0.03em] text-black sm:text-[18px] lg:text-[16px]">
                Dive deeper into your repositories.
                <br />
                Ready to replore your repo?
              </p>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="mb-4 flex h-[58px] w-full cursor-pointer items-center justify-center rounded-xl border border-neutral-200 bg-white text-[18px] text-neutral-900 transition hover:bg-neutral-50"
              >
                <FcGoogle className="mr-3 text-[22px]" />

                Continue with Google
              </button>

              <p className="mb-8 text-[14px] leading-6 text-neutral-500">
                By continuing, you agree to our{" "}
                <span className="font-medium text-neutral-900 hover:underline">
                  Terms of Service
                </span>
                .
              </p>

                          </div>
          </div>

          {/* Footer */}

          <footer className="flex flex-col items-center justify-between gap-4 px-6 pb-6 text-[15px] text-neutral-500 sm:flex-row sm:px-8 lg:px-16 lg:pb-8 lg:text-[20px] xl:px-24 2xl:px-34">
            <span>© {new Date().getFullYear()} replore</span>

            <div className="flex items-center gap-5 lg:gap-8">
              <button
                type="button"
                className="transition hover:text-black"
              >
                Privacy
              </button>

              <button
                type="button"
                className="transition hover:text-black"
              >
                Terms
              </button>
            </div>
          </footer>
        </section>

        {/* RIGHT SIDE */}

        <section className="hidden p-[10px] lg:block">
          <div className="relative h-full w-full overflow-hidden rounded-[18px]">
            <Image
              src="/b.jpg"
              alt="Signup illustration"
              fill
              priority
              sizes="(max-width: 1024px) 0vw, 50vw"
              className="object-cover"
            />
          </div>
        </section>
      </div>
    </main>
  );
}