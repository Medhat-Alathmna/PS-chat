"use client";

import { useSounds } from "@/lib/hooks/useSounds";
import { SoundType } from "@/lib/types";

/**
 * Test page for sound effects
 * Visit: http://localhost:3000/test-sounds
 */
export default function TestSoundsPage() {
  const {
    soundEnabled,
    toggleSound,
    playPop,
    playDing,
    playCoin,
    playSuccess,
    playFanfare,
    playClick,
  } = useSounds();

  const sounds: { name: string; emoji: string; play: () => void }[] = [
    { name: "Pop", emoji: "🎈", play: playPop },
    { name: "Ding", emoji: "🔔", play: playDing },
    { name: "Coin", emoji: "🪙", play: playCoin },
    { name: "Success", emoji: "✨", play: playSuccess },
    { name: "Fanfare", emoji: "🎺", play: playFanfare },
    { name: "Click", emoji: "👆", play: playClick },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--kids-purple)] to-[var(--kids-blue)] p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[var(--kids-purple)] mb-2">
            اختبار الأصوات 🎵
          </h1>
          <p className="text-gray-600">
            اضغط على الأزرار لسماع الأصوات!
          </p>
        </div>

        {/* Sound toggle */}
        <div className="flex justify-center mb-8">
          <button
            onClick={toggleSound}
            className={`
              px-6 py-3 rounded-2xl font-bold text-lg
              transition-all duration-300
              ${
                soundEnabled
                  ? "bg-[var(--kids-green)] text-white shadow-lg hover:scale-105"
                  : "bg-gray-300 text-gray-600"
              }
            `}
          >
            {soundEnabled ? "🔊 الصوت مفعّل" : "🔇 الصوت مغلق"}
          </button>
        </div>

        {/* Sound buttons grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {sounds.map((sound) => (
            <button
              key={sound.name}
              onClick={sound.play}
              className={`
                p-6 rounded-2xl
                bg-gradient-to-br from-[var(--kids-yellow)] to-[var(--kids-orange)]
                text-white font-bold text-lg
                shadow-lg
                hover:scale-105 active:scale-95
                transition-all duration-200
                flex flex-col items-center gap-2
                ${!soundEnabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
              disabled={!soundEnabled}
            >
              <span className="text-5xl">{sound.emoji}</span>
              <span>{sound.name}</span>
            </button>
          ))}
        </div>

        {/* Info box */}
        <div className="mt-8 p-4 bg-[var(--kids-blue)]/10 rounded-xl border-2 border-[var(--kids-blue)]">
          <p className="text-sm text-gray-700 text-center">
            💡 هذه الأصوات تم توليدها باستخدام Web Audio API
            <br />
            ✨ لا تحتاج ملفات صوتية خارجية!
          </p>
        </div>

        {/* Back button */}
        <div className="mt-6 text-center">
          <a
            href="/kids"
            className="
              inline-block px-6 py-3
              bg-[var(--kids-purple)] text-white
              rounded-2xl font-bold
              hover:scale-105 active:scale-95
              transition-transform
            "
          >
            ← الرجوع للصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
