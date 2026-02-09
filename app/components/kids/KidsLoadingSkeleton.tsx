"use client";

export default function KidsLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-sky-200 flex flex-col">
      {/* Header skeleton */}
      <div className="px-4 py-3">
        <div className="h-14 bg-white/50 rounded-2xl animate-pulse" />
      </div>

      {/* Chat area skeleton */}
      <div className="flex-1 px-4 py-4">
        <div className="mx-auto max-w-2xl flex flex-col gap-4">
          {/* Assistant bubble */}
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-[var(--kids-purple)]/20 animate-pulse shrink-0" />
            <div className="flex-1 max-w-[80%]">
              <div className="h-24 bg-white/60 rounded-2xl rounded-tl-sm animate-pulse" />
            </div>
          </div>
          {/* User bubble */}
          <div className="flex justify-end">
            <div className="h-12 w-48 bg-[var(--kids-green)]/20 rounded-2xl rounded-tr-sm animate-pulse" />
          </div>
          {/* Assistant bubble */}
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-[var(--kids-purple)]/20 animate-pulse shrink-0" />
            <div className="flex-1 max-w-[80%]">
              <div className="h-32 bg-white/60 rounded-2xl rounded-tl-sm animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="px-4 py-4 bg-white/50">
        <div className="mx-auto max-w-2xl">
          <div className="h-14 bg-white/70 rounded-3xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
