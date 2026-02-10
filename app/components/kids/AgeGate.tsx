"use client";

/**
 * @deprecated Use ProfileSetup and useProfiles() instead.
 * This component is kept only for backward compatibility.
 * All functionality has been migrated to the multi-profile system.
 */

import { useState } from "react";
import AnimatedMascot from "./AnimatedMascot";
import AnimatedBackground from "./AnimatedBackground";

export type KidsProfile = {
  age: number;
  createdAt: number;
};

interface AgeGateProps {
  onComplete: (profile: KidsProfile) => void;
}

export default function AgeGate({ onComplete }: AgeGateProps) {
  const [age, setAge] = useState(7);

  const handleConfirm = () => {
    const profile: KidsProfile = { age, createdAt: Date.now() };
    onComplete(profile);
  };

  return (
    <AnimatedBackground variant="sky" showClouds>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="mb-6">
            <AnimatedMascot state="waving" size="xl" showName />
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl animate-fade-in-up">
            <h2 className="text-2xl font-bold text-[var(--kids-purple)] mb-2 bubble-text">
              أهلاً يا بطل! 🌟
            </h2>
            <p className="text-gray-600 mb-6">قديش عمرك؟</p>

            {/* Age picker */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setAge((a) => Math.max(4, a - 1))}
                className="w-12 h-12 rounded-full bg-[var(--kids-purple)]/10 text-[var(--kids-purple)] text-2xl font-bold hover:scale-110 active:scale-95 transition-transform"
                aria-label="أقل"
              >
                -
              </button>
              <div className="w-20 h-20 rounded-2xl bg-[var(--kids-yellow)]/30 flex items-center justify-center border-3 border-[var(--kids-yellow)]">
                <span className="text-4xl font-bold text-[var(--kids-orange)]">
                  {age}
                </span>
              </div>
              <button
                onClick={() => setAge((a) => Math.min(12, a + 1))}
                className="w-12 h-12 rounded-full bg-[var(--kids-purple)]/10 text-[var(--kids-purple)] text-2xl font-bold hover:scale-110 active:scale-95 transition-transform"
                aria-label="أكثر"
              >
                +
              </button>
            </div>

            {/* Age bubbles */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
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

            <button
              onClick={handleConfirm}
              className="w-full py-3 bg-[var(--kids-green)] text-white rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-transform shadow-md"
            >
              يلا نبدأ! 🚀
            </button>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
