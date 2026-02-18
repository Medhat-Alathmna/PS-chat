"use client";

export function OptionCard({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 ${
        selected
          ? "border-[var(--kids-purple)] bg-purple-50 shadow-lg shadow-purple-200/50"
          : "border-gray-200 bg-white/80 hover:border-gray-300"
      }`}
    >
      {selected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[var(--kids-purple)] rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <span className="text-2xl sm:text-3xl">{icon}</span>
      <span className={`text-xs sm:text-sm font-bold ${selected ? "text-[var(--kids-purple)]" : "text-gray-700"}`}>
        {label}
      </span>
    </button>
  );
}

export function ToggleRow({
  label,
  icon,
  enabled,
  onToggle,
}: {
  label: string;
  icon: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-white/80 rounded-2xl border border-gray-100">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm sm:text-base font-bold text-gray-700">{label}</span>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-12 h-7 rounded-full transition-colors ${
          enabled ? "bg-[var(--kids-purple)]" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
            enabled ? "right-0.5" : "right-auto left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-base sm:text-lg font-black text-[var(--kids-purple)] mb-3">
      <span>{icon}</span>
      <span>{title}</span>
    </h2>
  );
}
