"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "How does Replore analyze a GitHub repository?",
    answer:
      "Replore clones the repository, parses the source code using Tree-sitter, builds dependency relationships, generates embeddings, and lets you explore the project using AI.",
  },
  {
    question: "Does Replore support private repositories?",
    answer:
      "Private repository support is planned. The MVP focuses on public GitHub repositories.",
  },
  {
    question: "Which programming languages are supported?",
    answer:
      "Replore is designed around Tree-sitter, allowing support for many popular languages including JavaScript, TypeScript, Python, Go, Java, Rust, C++, and more.",
  },
  {
    question: "Can I chat with my repository?",
    answer:
      "Yes. Once the repository has been analyzed, you can ask questions about architecture, functions, folders, dependencies, setup instructions, and implementation details.",
  },
  {
    question: "What AI models power Replore?",
    answer:
      "The MVP uses Gemini 2.5 Flash for reasoning and Gemini Embeddings together with pgvector for semantic code search.",
  }
  

];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="w-full py-24 lg:py-32 min-h-screen">
      <div className="mx-auto max-w-[1700px] px-6 md:px-10 xl:px-16">
        <div className="grid items-start gap-16 lg:grid-cols-[420px_1fr]">
          {/* Left Side */}
        <div className="self-start lg:sticky lg:top-32 min-h-[700px] ">
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">
              FAQs
            </p>

            <h2 className="max-w-sm text-[58px] font-semibold leading-[0.95] tracking-[-0.05em] text-white">
              Got
              <br />
              questions?
              <br />
              <span className="text-violet-600">we've got you</span>
            </h2>

            <p className="mt-8 max-w-xs text-lg leading-6 text-[#6B6B6B]">
              Can't find what you're looking for?{" "}
              <Link
                href="https://x.com/Bhushan4work_"
                className="font-medium text-violet-600 transition hover:underline"
              >
                contact us.
              </Link>
            </p>
          </div>

          {/* Right Side */}
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const active = open === index;

              return (
                <div
                  key={faq.question}
                  className="overflow-hidden rounded-[30px] bg-neutral-900 transition-all duration-300"
                >
                  <button
                    onClick={() =>
                      setOpen(active ? null : index)
                    }
                    className="flex w-full items-center justify-between px-8 py-7 text-left"
                  >
                    <span className="pr-8 text-[24px] tracking-[-0.03em] text-white max-md:text-lg">
                      {faq.question}
                    </span>

                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] transition-transform duration-300">
                      {active ? (
                        <Minus className="h-5 w-5" strokeWidth={2.5} />
                      ) : (
                        <Plus className="h-5 w-5" strokeWidth={2.5} />
                      )}
                    </span>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ${
                      active
                        ? "grid-rows-[1fr]"
                        : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-8 pb-8 pr-24 text-lg leading-8 text-[#6B7280]">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}