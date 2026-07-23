export default function Loading() {
  return (
    <div className="p-8 animate-pulse">
      {/* Header */}
      <div className="h-10 w-72 rounded-lg bg-zinc-800" />

      <div className="mt-3 h-4 w-96 rounded bg-zinc-900" />

      {/* Cards */}
      <div className="mt-10 grid grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-52 rounded-2xl border border-zinc-800 bg-zinc-900"
          />
        ))}
      </div>

      {/* Large section */}
      <div className="mt-8 h-96 rounded-2xl border border-zinc-800 bg-zinc-900" />
    </div>
  );
}