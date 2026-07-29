"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
//import { RiTwitterXFill } from "react-icons/ri";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // TODO:
    // Add Supabase/Auth logic here
    console.log(form);
  };

  return (
    <main className="h-screen overflow-hidden bg-white">
      <div className="grid h-full grid-cols-2">
        {/* LEFT SIDE */}

        <section className="relative flex flex-col bg-white">
          {/* Header */}

          <header className="flex items-center justify-between px-34 pt-8">
            <Link
              href="/"
              style={{ fontFamily: "var(--font-instrument-serif)" }}
              className="text-[38px] italic underline tracking-[-0.03em] text-black"
            >
              Replore
            </Link>

            <Link
              href="/signin"
              className="text-[20px] hover:underline font-medium text-black transition hover:opacity-70"
            >
              Sign in
            </Link>
          </header>

          {/* Form Container */}

          <div className="flex flex-1 items-center justify-center">
            <div className="w-[510px]">
              {/* Heading */}

              <h1 className="mb-10 text-[44px] font-medium leading-[1.02] tracking-[-0.045em] text-black">
                Create your account
              </h1>

              {/* Google */}

              <button
                type="button"
                className="mb-4 flex h-[68px] w-full items-center justify-center rounded-xl border border-neutral-200 bg-white text-[22px] text-neutral-900 transition-all duration-200 hover:bg-neutral-50"
              >
                <FcGoogle className="mr-3 text-[22px]" />

                Sign up with Google
              </button>


              {/* Divider */}

              <div className="my-4 flex items-center">
                <div className="h-px flex-1 bg-neutral-200" />

                <span className="mx-5 text-[20px] text-neutral-500">or</span>

                <div className="h-px flex-1 bg-neutral-200" />
              </div>

              {/* FORM */}

              <form onSubmit={handleSubmit}>
                {/* Username */}

                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className="mb-4 h-[64px] w-full rounded-xl border border-neutral-200 px-5 text-[22px] text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-400"
                />

                {/* Email */}

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="mb-4 h-[64px] w-full rounded-xl border border-neutral-200 px-5 text-[22px] text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-400"
                />

                {/* Password */}

                <div className="relative mb-5">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="h-[64px] w-full rounded-xl border border-neutral-200 px-5 pr-14 text-[22px] text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-700"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {/* Terms */}

                <p className="mb-8 text-[18px] leading-6 text-neutral-500">
                  By signing up you agree to our{" "}
                  <Link
                    href="/terms"
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    Terms of Service
                  </Link>
                  .
                </p>

                {/* Submit */}

                <button
                  type="submit"
                  className="flex h-[58px] w-full items-center justify-center rounded-xl bg-[#2f2f34] text-[20px] font-medium text-white transition-all duration-200 hover:bg-black"
                >
                  Create account

                  <ArrowRight className="ml-3 h-5 w-5" />
                </button>
              </form>

              {/* Bottom text */}

              <p className="mt-8 text-center text-[18px] text-neutral-500">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="font-medium text-black hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}

          <footer className="flex items-center justify-between px-34 pb-8 text-[20px] text-neutral-500">
            <span>© {new Date().getFullYear()} replore</span>

            <div className="flex items-center gap-8">
              <Link
                href="/privacy"
                className="transition hover:text-black"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="transition hover:text-black"
              >
                Terms
              </Link>
            </div>
          </footer>
        </section>

        {/* RIGHT SIDE */}

        <section className="p-[10px]">
          <div className="relative h-full w-full overflow-hidden rounded-[18px]">
            <Image
              src="/demooo.png"
              alt="Signup illustration"
              fill
              priority
              sizes="50vw"
              className="object-cover"
            />
          </div>
        </section>
      </div>
    </main>
  );
}