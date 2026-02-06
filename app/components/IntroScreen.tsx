"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

type IntroScreenProps = {
  onSelect: (text: string) => void;
};

const suggestions = [
  { text: "أخبرني عن القدس القديمة وتاريخها العريق", icon: "🕌", category: "تاريخ" },
  { text: "ما هي أشهر الأماكن السياحية في رام الله؟", icon: "🏛️", category: "سياحة" },
  { text: "أعطني معلومات عن مدينة حيفا وموقعها على الخريطة", icon: "📍", category: "جغرافيا" },
  { text: "ما هي الأحداث التاريخية المهمة في عام 1948؟", icon: "📜", category: "تاريخ" },
  { text: "أخبرني عن الأكلات الفلسطينية التقليدية الشهيرة", icon: "🍲", category: "ثقافة" },
  { text: "أين تقع مدينة يافا وما قصتها؟", icon: "🗺️", category: "مدن" },
  { text: "ما هي قصة المسجد الأقصى المبارك؟", icon: "🕋", category: "دين" },
  { text: "أعطني صوراً ومعلومات عن قرية دير ياسين", icon: "🌳", category: "تاريخ" },
];

const features = [
  { icon: "📷", label: "صور من مصادر متعددة", color: "var(--ps-green)" },
  { icon: "🗺️", label: "خرائط تفاعلية", color: "var(--ps-red)" },
  { icon: "📺", label: "فيديوهات", color: "#EAB308" },
  { icon: "📰", label: "أخبار محلية", color: "#3B82F6" },
  { icon: "📅", label: "جدول زمني تاريخي", color: "#8B5CF6" },
];

export default function IntroScreen({ onSelect }: IntroScreenProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--background)] text-[var(--foreground)]"
      style={{
        backgroundImage: `
          linear-gradient(to bottom, var(--background) 0%, transparent 30%, transparent 70%, var(--background) 100%),
          linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)),
          url('../pl.jpg')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Palestinian Flag Stripe at Top */}
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-[var(--ps-black)]" />
        <div className="flex-1 bg-[var(--ps-white)]" />
        <div className="flex-1 bg-[var(--ps-green)]" />
        <div className="w-16 bg-[var(--ps-red)]" style={{ clipPath: "polygon(100% 0, 0 50%, 100% 100%)" }} />
      </div>

      {/* Header */}
      <header className="relative border-b border-[var(--border-color)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="../pss.webp"
              alt="Palestine map"
              className="h-10 logo-h drop-shadow-md"
            />
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-widest text-[var(--ps-green)] font-semibold">
                Falastin Assistant
              </p>
              <h1 className="text-lg sm:text-2xl font-semibold text-[var(--foreground)]">
                دردش مع مساعد متخصص في فلسطين
              </h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div
          className={`w-full max-w-5xl transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Welcome Message */}
          <div className="text-center mb-8 sm:mb-12">
            {/* Animated Flag */}
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[var(--ps-green)]/20 via-[var(--ps-red)]/10 to-[var(--ps-black)]/20 text-4xl sm:text-5xl mb-6 animate-bounce shadow-lg ring-2 ring-[var(--ps-green)]/30">
              🇵🇸
            </div>

            {/* Title with Palestinian colors gradient */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[var(--ps-green)] via-[var(--ps-red)] to-[var(--ps-black)] bg-clip-text text-transparent">
                مرحباً بك في فلسطين Chat
              </span>
            </h2>

            <p className="text-base sm:text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto leading-relaxed px-4">
              مساعدك الذكي للتعرف على فلسطين - تاريخها، ثقافتها، جغرافيتها، وشعبها
            </p>

            {/* Features badges */}
            <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3 px-2">
              {features.map((feature, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 sm:gap-2 bg-[var(--card-bg)] border border-[var(--border-color)] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm text-[var(--foreground-secondary)] shadow-sm"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: feature.color }}
                  />
                  <span>{feature.icon}</span>
                  {feature.label}
                </span>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div>
            <h3 className="text-center text-base sm:text-lg font-medium text-[var(--foreground-secondary)] mb-4 sm:mb-6">
              جرّب أحد هذه الأسئلة للبدء:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto px-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(suggestion.text)}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 sm:p-5 text-right transition-all hover:border-[var(--ps-green)]/60 hover:bg-[var(--accent-light)] hover:scale-[1.02] hover:shadow-xl animate-slide-in"
                  style={{
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  {/* Category tag */}
                  <span className="absolute top-2 left-2 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[var(--ps-green)]/10 text-[var(--ps-green)] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {suggestion.category}
                  </span>

                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--ps-green)]/5 via-transparent to-[var(--ps-red)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Content */}
                  <div className="relative flex items-start gap-3">
                    <span className="text-xl sm:text-2xl flex-shrink-0 transform group-hover:scale-110 transition-transform">
                      {suggestion.icon}
                    </span>
                    <p className="text-xs sm:text-sm text-[var(--foreground)] leading-relaxed group-hover:text-[var(--ps-green)] transition-colors">
                      {suggestion.text}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--ps-green)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 sm:mt-12 text-center text-xs sm:text-sm text-[var(--foreground-secondary)] px-4">
            <p className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-[var(--ps-green)]">💡</span>
              يمكنك السؤال عن أي شيء يتعلق بفلسطين - المدن، التاريخ، الثقافة، الجغرافيا
            </p>
            <p className="mt-2 text-[10px] sm:text-xs opacity-60">
              صُنع بـ ❤️ لفلسطين
            </p>
          </div>
        </div>
      </main>

      {/* Palestinian Flag Stripe at Bottom */}
      <div className="h-1 w-full flex">
        <div className="w-16 bg-[var(--ps-red)]" style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }} />
        <div className="flex-1 bg-[var(--ps-green)]" />
        <div className="flex-1 bg-[var(--ps-white)]" />
        <div className="flex-1 bg-[var(--ps-black)]" />
      </div>
    </div>
  );
}
