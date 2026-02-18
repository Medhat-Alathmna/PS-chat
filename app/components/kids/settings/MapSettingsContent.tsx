"use client";

import { useMapSettings } from "@/lib/hooks/useMapSettings";
import type {
  InfoDisplayMode,
  MarkerStyle,
  MapTheme,
  AnimationLevel,
} from "@/lib/types/map-settings";
import { OptionCard, ToggleRow, SectionHeader } from "./SettingsComponents";

const INFO_DISPLAY_OPTIONS: { value: InfoDisplayMode; icon: string; label: string }[] = [
  { value: "popup", icon: "\u{1F4AC}", label: "نافذة منبثقة" },
  { value: "side-panel", icon: "\u{1F4CB}", label: "لوحة جانبية" },
  { value: "flip-card", icon: "\u{1F504}", label: "بطاقة مقلوبة" },
  { value: "floating-bubble", icon: "\u{1FAE7}", label: "فقاعة عائمة" },
];

const MARKER_STYLE_OPTIONS: { value: MarkerStyle; icon: string; label: string }[] = [
  { value: "pin", icon: "\u{1F4CD}", label: "دبوس" },
  { value: "emoji", icon: "\u{1F60A}", label: "رموز تعبيرية" },
  { value: "dot", icon: "\u{1F535}", label: "نقاط ملونة" },
  { value: "flag", icon: "\u{1F1F5}\u{1F1F8}", label: "علم فلسطين" },
];

const MAP_THEME_OPTIONS: { value: MapTheme; icon: string; label: string }[] = [
  { value: "light", icon: "\u2600\uFE0F", label: "فاتح" },
  { value: "dark", icon: "\u{1F319}", label: "داكن" },
  { value: "satellite", icon: "\u{1F6F0}\uFE0F", label: "قمر صناعي" },
  { value: "watercolor", icon: "\u{1F3A8}", label: "ألوان مائية" },
];

const ANIMATION_LEVELS: { value: AnimationLevel; label: string }[] = [
  { value: "full", label: "كامل" },
  { value: "reduced", label: "مخفف" },
  { value: "none", label: "بدون" },
];

export default function MapSettingsContent({ profileId }: { profileId?: string }) {
  const {
    settings,
    setInfoDisplayMode,
    setMarkerStyle,
    setMapTheme,
    setShowCityLabels,
    setShowRegionBorders,
    setAnimationLevel,
    resetToDefaults,
  } = useMapSettings(profileId);

  return (
    <div className="space-y-6">
      {/* Info Display Mode */}
      <section>
        <SectionHeader icon={"\u{1F4CB}"} title="طريقة عرض المعلومات" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {INFO_DISPLAY_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              selected={settings.infoDisplayMode === opt.value}
              onClick={() => setInfoDisplayMode(opt.value)}
            />
          ))}
        </div>
      </section>

      {/* Marker Style */}
      <section>
        <SectionHeader icon={"\u{1F4CD}"} title="شكل العلامات" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MARKER_STYLE_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              selected={settings.markerStyle === opt.value}
              onClick={() => setMarkerStyle(opt.value)}
            />
          ))}
        </div>
      </section>

      {/* Map Theme */}
      <section>
        <SectionHeader icon={"\u{1F5FA}\uFE0F"} title="خلفية الخريطة" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MAP_THEME_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              selected={settings.mapTheme === opt.value}
              onClick={() => setMapTheme(opt.value)}
            />
          ))}
        </div>
      </section>

      {/* Toggles */}
      <section>
        <SectionHeader icon={"\u{1F527}"} title="خيارات إضافية" />
        <div className="space-y-2">
          <ToggleRow
            icon={"\u{1F3F7}\uFE0F"}
            label="عرض أسماء المدن"
            enabled={settings.showCityLabels}
            onToggle={() => setShowCityLabels(!settings.showCityLabels)}
          />
          <ToggleRow
            icon={"\u{1F30D}"}
            label="عرض حدود فلسطين"
            enabled={settings.showRegionBorders}
            onToggle={() => setShowRegionBorders(!settings.showRegionBorders)}
          />
        </div>
      </section>

      {/* Animation Level */}
      <section>
        <SectionHeader icon={"\u2728"} title="مستوى الحركة" />
        <div className="flex gap-2 bg-white/80 rounded-2xl p-1.5 border border-gray-100">
          {ANIMATION_LEVELS.map((lvl) => (
            <button
              key={lvl.value}
              onClick={() => setAnimationLevel(lvl.value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                settings.animationLevel === lvl.value
                  ? "bg-[var(--kids-purple)] text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </section>

      {/* Reset */}
      <section className="pt-2">
        <button
          onClick={resetToDefaults}
          className="w-full py-3 bg-white/60 border-2 border-gray-200 rounded-2xl text-gray-500 font-bold text-sm hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all active:scale-95"
        >
          {"\u{1F504}"} إعادة تعيين الإعدادات الافتراضية
        </button>
      </section>
    </div>
  );
}
