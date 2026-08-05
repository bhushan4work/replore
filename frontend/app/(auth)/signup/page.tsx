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
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT SIDE */}

        <section className="relative flex min-h-screen flex-col bg-white">
          {/* Header */}

          <header className="flex items-center justify-between px-6 py-6 sm:px-8 lg:px-16 xl:px-24 2xl:px-34">
            <Link
              href="/"
              style={{ fontFamily: "var(--font-instrument-serif)" }}
              className="text-[20px] italic underline tracking-[-0.03em] text-black sm:text-[24px] lg:text-[28px]"
            >
              - Back
            </Link>

          </header>

          {/* Form Container */}

          <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-8 lg:px-0">
            <div className="w-full max-w-[510px]">

              <p
              style={{ fontFamily: "var(--font-instrument-serif)" }}
              className="text-[30px] italic text-center underline tracking-[-0.03em] text-black sm:text-[34px] lg:text-[30px]"
            >
               Replore Workspace 
            </p>

            <p   className="text-[20px] text-center mb-6 tracking-[-0.03em] text-black sm:text-[24px] lg:text-[16px]" >
              dive deeper into your repositories. ready to<br/>
             replore your repo ???
            </p>


              {/* Google */}
              <button
                type="button"
                className="mb-4 hover:cursor-pointer flex h-[46px] w-full items-center justify-center rounded-xl border border-neutral-200 bg-white text-[13px] text-neutral-900 transition-all duration-200 hover:bg-neutral-50 sm:h-[50px] sm:text-[15px] lg:h-[58px] lg:text-[18px]"
              >
                <FcGoogle className="mr-3 text-[18px]" />

                Sign up with Google
              </button>


              <p className="mb-8 text-[13px] leading-6 text-neutral-500 lg:text-[16px]">
                By signing up you agree to our{" "} 
                <span
                  className="font-medium text-neutral-900 hover:underline"
                >
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
              <p
                className="transition hover:text-black"
              >
                Privacy
              </p>

              <p
                className="transition hover:text-black"
              >
                Terms
              </p>
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