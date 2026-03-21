export default function ProfilesLoadingOverlay() {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ pointerEvents: "all" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-14 h-14 rounded-full border-4 border-white/30 border-t-white animate-spin"
          style={{ borderTopColor: "var(--kids-purple, #6C5CE7)" }}
        />
        <p className="text-white font-bold text-lg drop-shadow">جاري التحميل...</p>
      </div>
    </div>
  );
}
