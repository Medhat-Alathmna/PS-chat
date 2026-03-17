"use client";

import { useGlobeSettings } from "@/lib/hooks/useGlobeSettings";
import type { GlobeAppearance, SpaceBackground } from "@/lib/types/globe-settings";
import { OptionCard, ToggleRow, SectionHeader } from "./SettingsComponents";

const APPEARANCE_OPTIONS: { value: GlobeAppearance; icon: string; label: string }[] = [
  { value: "realistic", icon: "🌍", label: "واقعي" },
  { value: "night",     icon: "🌃", label: "ليلي" },
  { value: "political", icon: "🗺️", label: "سياسي" },
  { value: "cartoon",   icon: "🎨", label: "كرتوني" },
];

const BACKGROUND_OPTIONS: { value: SpaceBackground; icon: string; label: string }[] = [
  { value: "stars-dense", icon: "⭐", label: "نجوم كثيفة" },
  { value: "stars-light", icon: "🌟", label: "نجوم خفيفة" },
  { value: "black",       icon: "⬛", label: "سوداء" },
];

const SPEED_LEVELS: { value: number; label: string }[] = [
  { value: 0.2, label: "بطيء" },
  { value: 0.5, label: "متوسط" },
  { value: 1.0, label: "سريع" },
];

const COUNTRY_COLOR_OPTIONS: { value: string; label: string }[] = [
  { value: "#A55EEA", label: "بنفسجي" },
  { value: "#FF9F43", label: "برتقالي" },
  { value: "#54A0FF", label: "أزرق" },
  { value: "#FFE66D", label: "أصفر" },
  { value: "#FF9FF3", label: "وردي" },
  { value: "#FF6B6B", label: "أحمر" },
  { value: "#4ECDC4", label: "فيروزي" },
];

export default function GlobeSettingsContent({ profileId }: { profileId?: string }) {
  const {
    settings,
    setAppearance,
    setAutoRotate,
    setRotationSpeed,
    setSpaceBackground,
    setSelectedCountryColor,
    resetToDefaults,
  } = useGlobeSettings(profileId);

  return (
    <div className="space-y-6">
      {/* Globe Appearance */}
      <section>
        <SectionHeader icon="🪐" title="شكل الكرة الأرضية" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {APPEARANCE_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              selected={settings.appearance === opt.value}
              onClick={() => setAppearance(opt.value)}
            />
          ))}
        </div>
      </section>

      {/* Space Background */}
      <section>
        <SectionHeader icon="🌌" title="خلفية الفضاء" />
        <div className="grid grid-cols-3 gap-3">
          {BACKGROUND_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              selected={settings.spaceBackground === opt.value}
              onClick={() => setSpaceBackground(opt.value)}
            />
          ))}
        </div>
      </section>

      {/* Toggles */}
      <section>
        <SectionHeader icon="🔧" title="خيارات الحركة" />
        <div className="space-y-2">
          <ToggleRow
            icon="🔄"
            label="دوران تلقائي"
            enabled={settings.autoRotate}
            onToggle={() => setAutoRotate(!settings.autoRotate)}
          />
        </div>
      </section>

      {/* Rotation Speed */}
      {settings.autoRotate && (
        <section>
          <SectionHeader icon="🚀" title="سرعة الدوران" />
          <div className="flex gap-2 bg-white/80 rounded-2xl p-1.5 border border-gray-100">
            {SPEED_LEVELS.map((lvl) => (
              <button
                key={lvl.value}
                onClick={() => setRotationSpeed(lvl.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  Math.abs(settings.rotationSpeed - lvl.value) < 0.15
                    ? "bg-[var(--kids-purple)] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Selected Country Color */}
      <section>
        <SectionHeader icon="🎨" title="لون الدولة المحددة" />
        <div className="flex flex-wrap gap-3 pt-1">
          {COUNTRY_COLOR_OPTIONS.map((opt) => {
            const selected = settings.selectedCountryColor === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelectedCountryColor(opt.value)}
                title={opt.label}
                className="flex flex-col items-center gap-1 transition-all active:scale-95"
              >
                <span
                  className="block w-9 h-9 rounded-full transition-all"
                  style={{
                    background: opt.value,
                    boxShadow: selected
                      ? `0 0 0 3px white, 0 0 0 5px ${opt.value}`
                      : "0 2px 6px rgba(0,0,0,0.15)",
                    transform: selected ? "scale(1.15)" : "scale(1)",
                  }}
                />
                <span className="text-[10px] text-gray-500 font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Reset */}
      <section className="pt-2">
        <button
          onClick={resetToDefaults}
          className="w-full py-3 bg-white/60 border-2 border-gray-200 rounded-2xl text-gray-500 font-bold text-sm hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all active:scale-95"
        >
          🔄 إعادة تعيين الإعدادات الافتراضية
        </button>
      </section>
    </div>
  );
}
