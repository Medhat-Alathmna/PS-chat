"use client";

import { useState } from "react";
import { KidsProfile, ProfileAvatar, ProfileColor } from "@/lib/types/games";
import AnimatedMascot from "./AnimatedMascot";
import AnimatedBackground from "./AnimatedBackground";

const AVATARS: ProfileAvatar[] = [
  "🦁", "🐯", "🦊", "🐼", "🐸", "🦋", "🌻", "🌟",
  "🚀", "🎨", "⚽", "🦄", "🐬", "🦅", "🌈", "🎵",
];

const COLORS: { id: ProfileColor; hex: string }[] = [
  { id: "purple", hex: "#6C5CE7" },
  { id: "green", hex: "#00B894" },
  { id: "blue", hex: "#0984E3" },
  { id: "orange", hex: "#FF9F43" },
  { id: "pink", hex: "#FD79A8" },
  { id: "red", hex: "#EE2A35" },
];

type Step = "name" | "age" | "avatar" | "color";
const STEPS: Step[] = ["name", "age", "avatar", "color"];

interface ProfileSetupProps {
  onComplete: (data: { name: string; age: number; avatar: ProfileAvatar; color: ProfileColor }) => void;
  existingProfiles?: KidsProfile[];
  onCancel?: () => void;
}

export default function ProfileSetup({ onComplete, existingProfiles, onCancel }: ProfileSetupProps) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [age, setAge] = useState(7);
  const [avatar, setAvatar] = useState<ProfileAvatar>("🌟");
  const [color, setColor] = useState<ProfileColor>("purple");

  const stepIndex = STEPS.indexOf(step);

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const handleFinish = () => {
    onComplete({ name: name.trim(), age, avatar, color });
  };

  return (
    <AnimatedBackground variant="sky" showClouds>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto w-full">
          <div className="mb-6">
            <AnimatedMascot state="waving" size="xl" showName />
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl animate-fade-in-up">
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-4">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i <= stepIndex
                      ? "bg-[var(--kids-purple)] scale-110"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            {/* Step: Name */}
            {step === "name" && (
              <div className="animate-fade-in-up">
                <h2 className="text-2xl font-bold text-[var(--kids-purple)] mb-2 bubble-text">
                  شو اسمك يا بطل! 🌟
                </h2>
                <p className="text-gray-500 text-sm mb-4">حتى مدحت يعرف يناديك</p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 20))}
                  placeholder="اكتب اسمك هنا..."
                  className="w-full px-4 py-3 text-center text-xl font-bold rounded-2xl border-3 border-[var(--kids-purple)]/30 focus:border-[var(--kids-purple)] focus:outline-none bg-white transition-colors"
                  dir="auto"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">{name.length}/20</p>
                <button
                  onClick={goNext}
                  disabled={!name.trim()}
                  className="w-full mt-4 py-3 bg-[var(--kids-green)] text-white rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-transform shadow-md disabled:opacity-40 disabled:hover:scale-100"
                >
                  التالي ←
                </button>
              </div>
            )}

            {/* Step: Age */}
            {step === "age" && (
              <div className="animate-fade-in-up">
                <h2 className="text-2xl font-bold text-[var(--kids-purple)] mb-2 bubble-text">
                  قديش عمرك يا {name}؟ 🎂
                </h2>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={() => setAge((a) => Math.max(4, a - 1))}
                    className="w-12 h-12 rounded-full bg-[var(--kids-purple)]/10 text-[var(--kids-purple)] text-2xl font-bold hover:scale-110 active:scale-95 transition-transform"
                  >
                    -
                  </button>
                  <div className="w-20 h-20 rounded-2xl bg-[var(--kids-yellow)]/30 flex items-center justify-center border-3 border-[var(--kids-yellow)]">
                    <span className="text-4xl font-bold text-[var(--kids-orange)]">{age}</span>
                  </div>
                  <button
                    onClick={() => setAge((a) => Math.min(12, a + 1))}
                    className="w-12 h-12 rounded-full bg-[var(--kids-purple)]/10 text-[var(--kids-purple)] text-2xl font-bold hover:scale-110 active:scale-95 transition-transform"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((a) => (
                    <button
                      key={a}
                      onClick={() => setAge(a)}
                      className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                        age === a
                          ? "bg-[var(--kids-green)] text-white scale-110 shadow-md"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={goBack}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-transform"
                  >
                    → رجوع
                  </button>
                  <button
                    onClick={goNext}
                    className="flex-1 py-3 bg-[var(--kids-green)] text-white rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-transform shadow-md"
                  >
                    التالي ←
                  </button>
                </div>
              </div>
            )}

            {/* Step: Avatar */}
            {step === "avatar" && (
              <div className="animate-fade-in-up">
                <h2 className="text-2xl font-bold text-[var(--kids-purple)] mb-2 bubble-text">
                  اختار صورتك! 🎭
                </h2>
                <p className="text-gray-500 text-sm mb-4">هاي رح تكون صورتك مع مدحت</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAvatar(a)}
                      className={`w-full aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all ${
                        avatar === a
                          ? "bg-[var(--kids-purple)]/20 scale-110 shadow-md ring-3 ring-[var(--kids-purple)]"
                          : "bg-gray-50 hover:bg-gray-100 hover:scale-105"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={goBack}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-transform"
                  >
                    → رجوع
                  </button>
                  <button
                    onClick={goNext}
                    className="flex-1 py-3 bg-[var(--kids-green)] text-white rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-transform shadow-md"
                  >
                    التالي ←
                  </button>
                </div>
              </div>
            )}

            {/* Step: Color */}
            {step === "color" && (
              <div className="animate-fade-in-up">
                <h2 className="text-2xl font-bold text-[var(--kids-purple)] mb-2 bubble-text">
                  اختار لونك المفضل! 🎨
                </h2>
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                  {COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setColor(c.id)}
                      className={`w-14 h-14 rounded-full transition-all ${
                        color === c.id
                          ? "scale-125 shadow-lg ring-4 ring-offset-2 ring-gray-300"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
                {/* Preview */}
                <div className="mb-4 p-3 rounded-2xl bg-gray-50 flex items-center justify-center gap-3">
                  <span className="text-3xl">{avatar}</span>
                  <span className="text-xl font-bold" style={{ color: COLORS.find((c) => c.id === color)?.hex }}>
                    {name}
                  </span>
                  <span className="text-sm text-gray-400">({age} سنين)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={goBack}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-transform"
                  >
                    → رجوع
                  </button>
                  <button
                    onClick={handleFinish}
                    className="flex-1 py-3 bg-[var(--kids-green)] text-white rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-transform shadow-md"
                  >
                    يلا نبدأ! 🚀
                  </button>
                </div>
              </div>
            )}

            {/* Cancel button (if editing or adding second profile) */}
            {onCancel && (
              <button
                onClick={onCancel}
                className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
