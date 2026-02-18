"use client";

import { useTextSettings, getTextStyleValues } from "@/lib/hooks/useTextSettings";
import type { FontFamily, TextSize } from "@/lib/types/text-settings";
import { SectionHeader } from "./SettingsComponents";

const FONT_OPTIONS: { value: FontFamily; label: string; cssVar: string }[] = [
  { value: "noto-sans-arabic", label: "نوتو عربي", cssVar: "var(--font-arabic)" },
  { value: "cairo", label: "القاهرة", cssVar: "var(--font-cairo)" },
  { value: "tajawal", label: "تجوال", cssVar: "var(--font-tajawal)" },
  { value: "changa", label: "شانغا", cssVar: "var(--font-changa)" },
];

const SIZE_OPTIONS: { value: TextSize; label: string }[] = [
  { value: "small", label: "صغير" },
  { value: "medium", label: "متوسط" },
  { value: "large", label: "كبير" },
];

export default function TextSettingsContent({ profileId }: { profileId?: string }) {
  const {
    settings,
    setFontFamily,
    setTextSize,
    resetToDefaults,
  } = useTextSettings(profileId);

  const previewStyle = getTextStyleValues(settings);

  return (
    <div className="space-y-6">
      {/* Font family picker */}
      <section>
        <SectionHeader icon={"\u{1F524}"} title="نوع الخط" />
        <div className="grid grid-cols-2 gap-3">
          {FONT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFontFamily(opt.value)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 ${
                settings.fontFamily === opt.value
                  ? "border-[var(--kids-purple)] bg-purple-50 shadow-lg shadow-purple-200/50"
                  : "border-gray-200 bg-white/80 hover:border-gray-300"
              }`}
            >
              {settings.fontFamily === opt.value && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[var(--kids-purple)] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <span
                className="text-2xl font-bold text-gray-800"
                style={{ fontFamily: opt.cssVar }}
              >
                فلسطين
              </span>
              <span className={`text-xs font-bold ${settings.fontFamily === opt.value ? "text-[var(--kids-purple)]" : "text-gray-500"}`}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Text size picker */}
      <section>
        <SectionHeader icon={"\u{1F4CF}"} title="حجم النص" />
        <div className="flex gap-2 bg-white/80 rounded-2xl p-1.5 border border-gray-100">
          {SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTextSize(opt.value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                settings.textSize === opt.value
                  ? "bg-[var(--kids-purple)] text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Live preview */}
      <section>
        <SectionHeader icon={"\u{1F441}\uFE0F"} title="معاينة" />
        <div className="bg-white/80 rounded-2xl border border-gray-100 p-4">
          <div className="flex gap-3 items-start">
            <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--kids-purple)]/20 flex items-center justify-center text-xl">
              🐻
            </div>
            <div
              className="flex-1 px-4 py-3 rounded-2xl rounded-tl-sm"
              style={{ backgroundColor: "#6C5CE715", border: "2px solid #6C5CE730" }}
            >
              <p
                className="leading-relaxed text-gray-800"
                style={previewStyle}
                dir="auto"
              >
                مرحبا! أنا مدحت، صاحبك من فلسطين 🇵🇸
              </p>
            </div>
          </div>
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
