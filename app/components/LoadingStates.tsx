/**
 * Loading state components for better UX
 */

export function SkeletonChatBubble() {
  return (
    <div className="flex w-full items-start gap-3 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-zinc-800/50" />
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-zinc-800/50 rounded-2xl w-3/4" />
        <div className="h-4 bg-zinc-800/50 rounded-2xl w-5/6" />
        <div className="h-4 bg-zinc-800/50 rounded-2xl w-1/2" />
      </div>
    </div>
  );
}

export function LoadingDots() {
  return (
    <div className="flex gap-1">
      <div className="h-2 w-2 rounded-full bg-emerald-400/60 animate-bounce [animation-delay:-0.3s]" />
      <div className="h-2 w-2 rounded-full bg-emerald-400/60 animate-bounce [animation-delay:-0.15s]" />
      <div className="h-2 w-2 rounded-full bg-emerald-400/60 animate-bounce" />
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-400">
      <LoadingDots />
      <span>Falastin يكتب...</span>
    </div>
  );
}
