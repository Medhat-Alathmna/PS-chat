"use client";

import { useRouter } from "next/navigation";
import AnimatedBackground from "../../components/kids/AnimatedBackground";
import ProfileSetup from "../../components/kids/ProfileSetup";
import ErrorBoundary from "../../components/ErrorBoundary";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useMapSettings } from "@/lib/hooks/useMapSettings";
import type {
  InfoDisplayMode,
  MarkerStyle,
  MapTheme,
  AnimationLevel,
} from "@/lib/types/map-settings";

export default function MapSettingsPage() {
  return (
    <ErrorBoundary>
      <MapSettingsInner />
    </ErrorBoundary>
  );
}

// --- Option data ---

const INFO_DISPLAY_OPTIONS: { value: InfoDisplayMode; icon: string; label: string; desc: string }[] = [
  { value: "popup", icon: "\u{1F4AC}", label: "نافذة منبثقة", desc: "النافذة الحالية" },
  { value: "side-panel", icon: "\u{1F4CB}", label: "لوحة جانبية", desc: "لوحة منزلقة من الجانب" },
  { value: "flip-card", icon: "\u{1F504}", label: "بطاقة مقلوبة", desc: "بطاقة ثلاثية الأبعاد" },
  { value: "floating-bubble", icon: "\u{1FAE7}", label: "فقاعة عائمة", desc: "فقاعة صغيرة قرب العلامة" },
];

const MARKER_STYLE_OPTIONS: { value: MarkerStyle; icon: string; label: string; desc: string }[] = [
  { value: "pin", icon: "\u{1F4CD}", label: "دبوس", desc: "الدبوس الحالي" },
  { value: "emoji", icon: "\u{1F60A}", label: "رموز تعبيرية", desc: "دائرة مع رمز المدينة" },
  { value: "dot", icon: "\u{1F535}", label: "نقاط ملونة", desc: "نقطة ملونة بسيطة" },
  { value: "flag", icon: "\u{1F1F5}\u{1F1F8}", label: "علم فلسطين", desc: "شريط بألوان العلم" },
];

const MAP_THEME_OPTIONS: { value: MapTheme; icon: string; label: string; desc: string }[] = [
  { value: "light", icon: "\u2600\uFE0F", label: "فاتح", desc: "خلفية فاتحة نظيفة" },
  { value: "dark", icon: "\u{1F319}", label: "داكن", desc: "خلفية داكنة" },
  { value: "satellite", icon: "\u{1F6F0}\uFE0F", label: "قمر صناعي", desc: "صورة جوية" },
  { value: "watercolor", icon: "\u{1F3A8}", label: "ألوان مائية", desc: "تصميم فني" },
];

const ANIMATION_LEVELS: { value: AnimationLevel; label: string }[] = [
  { value: "full", label: "كامل" },
  { value: "reduced", label: "مخفف" },
  { value: "none", label: "بدون" },
];

// --- Components ---

function OptionCard<T extends string>({
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

function ToggleRow({
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

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-base sm:text-lg font-black text-[var(--kids-purple)] mb-3">
      <span>{icon}</span>
      <span>{title}</span>
    </h2>
  );
}

function MapSettingsInner() {
  const router = useRouter();
  const {
    profiles,
    activeProfile,
    isLoaded,
    createProfile,
    updateProfile,
  } = useProfiles();

  const profileId = activeProfile?.id;

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

  if (!isLoaded) return null;

  if (profiles.length === 0) {
    return (
      <ProfileSetup
        onComplete={(data) => createProfile(data)}
        existingProfiles={profiles}
      />
    );
  }

  if (activeProfile && !activeProfile.name) {
    return (
      <ProfileSetup
        onComplete={(data) => updateProfile(activeProfile.id, data)}
        existingProfiles={profiles}
      />
    );
  }

  if (!activeProfile) return null;

  return (
    <AnimatedBackground variant="sky" showClouds showBirds={false}>
      <div className="relative flex h-screen flex-col overflow-hidden" dir="rtl">
        {/* Header */}
        <header className="shrink-0 px-4 py-3 z-10">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <button
              onClick={() => router.push("/kids/chat")}
              className="flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
              aria-label="رجوع"
            >
              <span className="text-xl">{"\u2192"}</span>
            </button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-black text-[var(--kids-purple)] drop-shadow-sm">
                {"\u2699\uFE0F"} إعدادات الخريطة
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                خصّص مظهر الخريطة لـ {activeProfile.name}
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
          <div className="mx-auto max-w-2xl space-y-6 pb-24">
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
        </main>
      </div>
    </AnimatedBackground>
  );
}
