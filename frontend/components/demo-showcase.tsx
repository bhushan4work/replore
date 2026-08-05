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
            <video
              className="aspect-video h-full w-full object-cover"
              src="/demo/demo.mp4"
              controls
              playsInline
              preload="metadata"
            />
          </div>
        </div>
      </div>
    </section>
  );
}