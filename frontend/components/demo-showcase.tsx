"use client";

export default function DemoShowcase() {
  return (
    <section id="how-it-works" className="mx-auto mt-40 mb-40 w-full max-w-[1350px] px-6">
      <div
        className="
          rounded-[28px]
          border border-white/20
          bg-neutral-800
          shadow-[0_0_40px_rgba(255,255,255,0.08)]
        "
      >
        {/* 0.5cm ≈ 18-20px padding */}
        <div className="p-5">
          <div className="overflow-hidden rounded-[18px] bg-black">
            <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
              <span className="text-sm text-neutral-500">
                Demo video coming soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}