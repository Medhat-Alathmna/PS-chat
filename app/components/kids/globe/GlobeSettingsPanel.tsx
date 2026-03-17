"use client";

import type {
  GlobeSettings,
  GlobeAppearance,
  SpaceBackground,
} from "@/lib/types/globe-settings";

// ── Props ──────────────────────────────────────────────────────────────────
interface GlobeSettingsPanelProps {
  settings: GlobeSettings;
  onAppearanceChange: (v: GlobeAppearance) => void;
  onAutoRotateChange: (v: boolean) => void;
  onRotationSpeedChange: (v: number) => void;
  onSpaceBackgroundChange: (v: SpaceBackground) => void;
  onSelectedCountryColorChange: (v: string) => void;
  onResetDefaults: () => void;
  onClose: () => void;
  isOpen: boolean;
}

const COUNTRY_COLORS: { value: string; label: string }[] = [
  { value: "#A55EEA", label: "بنفسجي" },
  { value: "#FF9F43", label: "برتقالي" },
  { value: "#54A0FF", label: "أزرق" },
  { value: "#FFE66D", label: "أصفر" },
  { value: "#FF9FF3", label: "وردي" },
  { value: "#FF6B6B", label: "أحمر" },
  { value: "#4ECDC4", label: "فيروزي" },
];

// ── Option Data ────────────────────────────────────────────────────────────
const APPEARANCES: { value: GlobeAppearance; label: string; emoji: string; desc: string }[] = [
  { value: "realistic", label: "واقعي",   emoji: "🌍", desc: "ألوان الأرض" },
  { value: "night",     label: "ليلي",    emoji: "🌃", desc: "أضواء المدن" },
  { value: "political", label: "سياسي",   emoji: "🗺️", desc: "ألوان القارات" },
  { value: "cartoon",   label: "كرتوني",  emoji: "🎨", desc: "ألوان مرحة" },
];

const BACKGROUNDS: { value: SpaceBackground; label: string; emoji: string }[] = [
  { value: "stars-dense", label: "نجوم كثيفة", emoji: "⭐" },
  { value: "stars-light", label: "نجوم خفيفة", emoji: "🌟" },
  { value: "black",       label: "سوداء",       emoji: "⬛" },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function GlobeSettingsPanel({
  settings,
  onAppearanceChange,
  onAutoRotateChange,
  onRotationSpeedChange,
  onSpaceBackgroundChange,
  onSelectedCountryColorChange,
  onResetDefaults,
  onClose,
  isOpen,
}: GlobeSettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-3xl overflow-hidden mx-auto max-w-sm"
        style={{
          background: "rgba(14, 10, 32, 0.97)",
          border: "1px solid rgba(165, 94, 234, 0.25)",
          boxShadow: "0 0 60px rgba(165, 94, 234, 0.2), 0 25px 50px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Aurora top strip */}
        <div
          className="h-0.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, #A55EEA, #54A0FF, #4ECDC4, #FF9F43, #A55EEA)",
            backgroundSize: "200% 100%",
            animation: "auroraPanel 4s linear infinite",
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4" dir="rtl">
          <h2 className="text-lg font-black text-white tracking-tight">
            إعدادات الكرة 🌍
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all text-sm"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="px-5 pb-5 space-y-5 max-h-[70vh] overflow-y-auto" dir="rtl">

          {/* ── Section: شكل الكرة ── */}
          <section>
            <SectionLabel icon="🪐" text="شكل الكرة" />
            <div className="grid grid-cols-2 gap-2 mt-2">
              {APPEARANCES.map((opt) => {
                const selected = settings.appearance === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onAppearanceChange(opt.value)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95"
                    style={{
                      background: selected
                        ? "linear-gradient(135deg, rgba(165,94,234,0.3), rgba(84,160,255,0.2))"
                        : "rgba(255,255,255,0.05)",
                      border: selected
                        ? "1.5px solid rgba(165,94,234,0.7)"
                        : "1.5px solid rgba(255,255,255,0.08)",
                      boxShadow: selected
                        ? "0 0 16px rgba(165,94,234,0.2)"
                        : "none",
                    }}
                  >
                    <span className="text-2xl leading-none">{opt.emoji}</span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: selected ? "rgba(220,180,255,1)" : "rgba(255,255,255,0.7)" }}
                    >
                      {opt.label}
                    </span>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <Divider />

          {/* ── Section: خلفية الفضاء ── */}
          <section>
            <SectionLabel icon="🌌" text="خلفية الفضاء" />
            <div className="flex gap-2 mt-2 flex-wrap">
              {BACKGROUNDS.map((opt) => {
                const selected = settings.spaceBackground === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onSpaceBackgroundChange(opt.value)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all active:scale-95"
                    style={{
                      background: selected
                        ? "rgba(165,94,234,0.3)"
                        : "rgba(255,255,255,0.06)",
                      border: selected
                        ? "1px solid rgba(165,94,234,0.6)"
                        : "1px solid rgba(255,255,255,0.1)",
                      color: selected ? "rgba(220,180,255,1)" : "rgba(255,255,255,0.6)",
                    }}
                  >
                    <span>{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <Divider />

          {/* ── Section: لون الدولة المحددة ── */}
          <section>
            <SectionLabel icon="🎨" text="لون الدولة المحددة" />
            <div className="flex flex-wrap gap-3 mt-3">
              {COUNTRY_COLORS.map((opt) => {
                const selected = settings.selectedCountryColor === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onSelectedCountryColorChange(opt.value)}
                    title={opt.label}
                    className="flex flex-col items-center gap-1 transition-all active:scale-95"
                  >
                    <span
                      className="block w-8 h-8 rounded-full transition-all"
                      style={{
                        background: opt.value,
                        boxShadow: selected
                          ? `0 0 0 2px rgba(255,255,255,0.15), 0 0 0 4px ${opt.value}`
                          : "0 2px 6px rgba(0,0,0,0.4)",
                        transform: selected ? "scale(1.2)" : "scale(1)",
                      }}
                    />
                    <span className="text-[9px] font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <Divider />

          {/* ── Section: دوران تلقائي ── */}
          <section>
            <div className="flex items-center justify-between">
              <SectionLabel icon="🔄" text="دوران تلقائي" />
              <Toggle
                value={settings.autoRotate}
                onChange={onAutoRotateChange}
              />
            </div>

            {settings.autoRotate && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/40">سريع 🚀</span>
                  <span className="text-xs text-white/50">السرعة</span>
                  <span className="text-xs text-white/40">بطيء 🐌</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  value={settings.rotationSpeed}
                  onChange={(e) => onRotationSpeedChange(parseFloat(e.target.value))}
                  className="w-full accent-purple-400"
                  style={{ direction: "ltr" }}
                />
              </div>
            )}
          </section>

        </div>

        {/* Footer buttons */}
        <div
          className="px-5 pt-3 pb-5 flex gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", direction: "rtl" }}
        >
          <button
            onClick={onResetDefaults}
            className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            إعادة الضبط
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl text-sm font-black text-white transition-all active:scale-95"
            style={{
              background: "var(--kids-purple)",
              boxShadow: "0 4px 20px rgba(165,94,234,0.35)",
            }}
          >
            حسناً ✓
          </button>
        </div>
      </div>

      <style>{`
        @keyframes auroraPanel {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </>
  );
}

// ── Small sub-components ───────────────────────────────────────────────────

function SectionLabel({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base">{icon}</span>
      <span className="text-sm font-bold text-white/70">{text}</span>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="relative flex-shrink-0 w-12 h-6 rounded-full transition-all duration-300"
      style={{
        background: value
          ? "linear-gradient(90deg, #A55EEA, #54A0FF)"
          : "rgba(255,255,255,0.12)",
        boxShadow: value ? "0 0 12px rgba(165,94,234,0.35)" : "none",
      }}
    >
      <span
        className="absolute top-0.5 bottom-0.5 w-5 rounded-full bg-white shadow-md transition-all duration-300"
        style={{
          left: value ? "calc(100% - 22px)" : "2px",
        }}
      />
    </button>
  );
}
