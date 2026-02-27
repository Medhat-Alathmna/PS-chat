"use client";

import { useChatSettings } from "@/lib/hooks/useChatSettings";
import type { MessageDisplayMode } from "@/lib/types/chat-settings";
import { SectionHeader } from "./SettingsComponents";

const MODE_OPTIONS: { value: MessageDisplayMode; icon: string; label: string; description: string }[] = [
  {
    value: "streaming",
    icon: "\u26A1",
    label: "مباشر",
    description: "النص يظهر كلمة بكلمة",
  },
  {
    value: "static",
    icon: "\u2728",
    label: "دفعة واحدة",
    description: "النص يظهر كامل مرة واحدة",
  },
];

export default function ChatSettingsContent({ profileId }: { profileId?: string }) {
  const { settings, setDisplayMode, resetToDefaults } = useChatSettings(profileId);

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader icon={"\uD83D\uDCAC"} title="طريقة عرض الرسائل" />
        <div className="grid grid-cols-2 gap-3">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDisplayMode(opt.value)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 ${
                settings.displayMode === opt.value
                  ? "border-[var(--kids-purple)] bg-purple-50 shadow-lg shadow-purple-200/50"
                  : "border-gray-200 bg-white/80 hover:border-gray-300"
              }`}
            >
              {settings.displayMode === opt.value && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[var(--kids-purple)] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <span className="text-2xl sm:text-3xl">{opt.icon}</span>
              <span className={`text-sm font-bold ${settings.displayMode === opt.value ? "text-[var(--kids-purple)]" : "text-gray-700"}`}>
                {opt.label}
              </span>
              <span className="text-xs text-gray-500 text-center">{opt.description}</span>
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
          {"\uD83D\uDD04"} إعادة تعيين الإعدادات الافتراضية
        </button>
      </section>
    </div>
  );
}
