"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";


export default function SignUpPage() {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <main className="flex min-h-screen w-full bg-white">
            {/* ================= LEFT PANEL ================= */}
            <section className="relative flex w-full flex-col px-8 py-8 sm:px-12 lg:w-[42%] lg:px-16">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <Link
                        href="/"
                        className="text-[22px] font-semibold tracking-[-0.02em] text-neutral-900"
                    >
                        replore
                    </Link>

                    <Link
                        href="/sign-in"
                        className="text-[13px] font-medium text-neutral-900 transition hover:underline"
                    >
                        Sign in
                    </Link>
                </header>

                {/* Authentication Form Container */}
                <div className="flex flex-1 items-center justify-center py-12">
                    <div className="w-full max-w-[380px]">

                        <form className="flex w-full flex-col">
                            <h1 className="text-[34px] leading-[1.05] font-semibold tracking-tight text-neutral-900">
                                Create your account
                            </h1>

                            {/* OAuth Buttons */}
                            <div className="mt-7 flex flex-col gap-3">
                                {/* Google */}
                                <button
                                    type="button"
                                    className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white text-[15px] font-medium text-neutral-900 transition hover:bg-neutral-50"
                                >
                                    <svg width="18" height="18" viewBox="0 0 48 48">
                                        <path
                                            fill="#FFC107"
                                            d="M43.611 20.083H42V20H24v8h11.303A12 12 0 0124 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                                        />
                                        <path
                                            fill="#FF3D00"
                                            d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.682 0-14.344 4.337-17.694 10.691z"
                                        />
                                        <path
                                            fill="#4CAF50"
                                            d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                                        />
                                        <path
                                            fill="#1976D2"
                                            d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                                        />
                                    </svg>

                                    Continue with Google
                                </button>

                                {/* GitHub */}
                                <button
                                    type="button"
                                    className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white text-[15px] font-medium text-neutral-900 transition hover:bg-neutral-50"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="18"
                                        height="18"
                                        fill="currentColor"
                                    >
                                        <path d="M12 .297a12 12 0 00-3.794 23.39c.6.111.82-.261.82-.577v-2.04c-3.338.726-4.042-1.611-4.042-1.611-.546-1.385-1.333-1.754-1.333-1.754-1.09-.744.082-.729.082-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.775.418-1.305.761-1.605-2.665-.303-5.467-1.332-5.467-5.931 0-1.311.469-2.382 1.236-3.222-.124-.303-.535-1.524.117-3.176 0 0 1.008-.323 3.301 1.23a11.51 11.51 0 016.008 0c2.292-1.553 3.299-1.23 3.299-1.23.653 1.652.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.222 0 4.61-2.807 5.625-5.48 5.921.43.372.814 1.102.814 2.222v3.293c0 .319.216.694.825.576A12.003 12.003 0 0012 .297" />
                                    </svg>

                                    Continue with GitHub
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="my-6 flex items-center gap-4">
                                <div className="h-px flex-1 bg-neutral-200" />
                                <span className="text-sm text-neutral-500">or</span>
                                <div className="h-px flex-1 bg-neutral-200" />
                            </div>

                            {/* Inputs */}
                            <div className="space-y-3">
                                <input
                                    placeholder="Username"
                                    className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-[15px] outline-none transition focus:border-neutral-400"
                                />

                                <input
                                    type="email"
                                    placeholder="Email"
                                    className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-[15px] outline-none transition focus:border-neutral-400"
                                />

                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        className="h-12 w-full rounded-xl border border-neutral-200 px-4 pr-12 text-[15px] outline-none transition focus:border-neutral-400"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Terms */}
                            <p className="mt-4 text-[13px] leading-6 text-neutral-500">
                                By creating an account you agree to our{" "}
                                <Link
                                    href="/terms"
                                    className="font-medium text-neutral-900 hover:underline"
                                >
                                    Terms of Service
                                </Link>
                                .
                            </p>

                            {/* CTA */}
                            <button
                                className="
      group
      mt-7
      flex
      h-[52px]
      w-full
      items-center
      justify-center
      gap-2
      rounded-xl
      bg-neutral-900
      text-white
      transition
      hover:bg-black
    "
                            >
                                Create Account

                                <ArrowRight
                                    size={17}
                                    className="transition-transform group-hover:translate-x-1"
                                />
                            </button>

                            <p className="mt-6 text-center text-[14px] text-neutral-500">
                                Already have an account?{" "}
                                <Link
                                    href="/sign-in"
                                    className="font-medium text-neutral-900 hover:underline"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <footer className="flex items-center justify-between text-[12.5px] text-neutral-500">
                    <span>© 2026 replore</span>

                    <div className="flex items-center gap-5">
                        <Link
                            href="/privacy"
                            className="transition hover:underline"
                        >
                            Privacy
                        </Link>

                        <Link
                            href="/terms"
                            className="transition hover:underline"
                        >
                            Terms
                        </Link>
                    </div>
                </footer>
            </section>

            {/* ================= RIGHT PANEL ================= */}
            <section className="relative hidden min-h-screen flex-none p-3 lg:block lg:w-[58%]">
                <div className="relative h-full w-full overflow-hidden rounded-xl bg-neutral-100">

                    {/* Replace this image later */}
                    <Image
                        src="/auth-preview.png"
                        alt="Replore Preview"
                        fill
                        priority
                        className="object-cover"
                    />

                    {/* Optional subtle overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                </div>
            </section>
        </main>
    );
}