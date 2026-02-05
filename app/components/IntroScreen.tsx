"use client";

import { useEffect, useState } from "react";

type IntroScreenProps = {
  onSelect: (text: string) => void;
};

const suggestions = [
  { text: "أخبرني عن القدس القديمة وتاريخها العريق", icon: "🕌" },
  { text: "ما هي أشهر الأماكن السياحية في رام الله؟", icon: "🏛️" },
  { text: "أعطني معلومات عن مدينة حيفا وموقعها على الخريطة", icon: "📍" },
  { text: "ما هي الأحداث التاريخية المهمة في عام 1948؟", icon: "📜" },
  { text: "أخبرني عن الأكلات الفلسطينية التقليدية الشهيرة", icon: "🍲" },
  { text: "أين تقع مدينة يافا وما قصتها؟", icon: "🗺️" },
  { text: "ما هي قصة المسجد الأقصى المبارك؟", icon: "🕋" },
  { text: "أعطني صوراً ومعلومات عن قرية دير ياسين", icon: "🌳" },
];

export default function IntroScreen({ onSelect }: IntroScreenProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.85)),
          url('../pl.jpg')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Header */}
      <header className="relative border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="../pss.webp"
              alt="Palestine map"
              className="h-8 logo-h drop-shadow-md"
            />
            <div>
              <p className="text-sm uppercase tracking-widest text-emerald-400 font-semibold">
                Falastin Assistant
              </p>
              <h1 className="text-2xl font-semibold">
                دردش مع مساعد متخصص في فلسطين
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div
          className={`w-full max-w-5xl transition-all duration-700 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          {/* Welcome Message */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 text-4xl mb-6 animate-bounce">
              🇵🇸
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              مرحباً بك في فلسطين Chat
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              مساعدك الذكي للتعرف على فلسطين - تاريخها، ثقافتها، جغرافيتها، وشعبها
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-zinc-500">
              <span className="flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                صور من مصادر متعددة
              </span>
              <span className="flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-full">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                خرائط تفاعلية
              </span>
              <span className="flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-full">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                معلومات تاريخية
              </span>
            </div>
          </div>

          {/* Suggestions */}
          <div>
            <h3 className="text-center text-lg font-medium text-zinc-300 mb-6">
              جرّب أحد هذه الأسئلة للبدء:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(suggestion.text)}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 p-5 text-right transition-all hover:border-emerald-400/60 hover:bg-zinc-900/80 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10"
                  style={{
                    animationDelay: `${i * 100}ms`,
                    animation: isVisible
                      ? "slideIn 0.5s ease-out forwards"
                      : "none",
                  }}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Content */}
                  <div className="relative flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0 transform group-hover:scale-110 transition-transform">
                      {suggestion.icon}
                    </span>
                    <p className="text-sm text-zinc-200 leading-relaxed group-hover:text-zinc-100 transition-colors">
                      {suggestion.text}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-5 h-5 text-emerald-400"
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
          <div className="mt-12 text-center text-sm text-zinc-500">
            <p>
              💡 يمكنك السؤال عن أي شيء يتعلق بفلسطين - المدن، التاريخ، الثقافة، الجغرافيا
            </p>
          </div>
        </div>
      </main>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
