"use client";

import { useState, useCallback } from "react";
import type {
  StoryConfig,
  StoryGenre,
  StorySetting,
  StoryCompanion,
  StoryLength,
  StoryMode,
  WizardStep,
} from "@/lib/types/stories";
import {
  STORY_GENRES,
  STORY_SETTINGS,
  STORY_COMPANIONS,
  STORY_LENGTHS,
  STORY_MODES,
} from "@/lib/data/stories/config";

interface StoryWizardProps {
  onComplete: (config: StoryConfig) => void;
  onBack: () => void;
  /** Pre-selected genre from quick-start chip; wizard starts at step 1 (setting) */
  preSelectedGenre?: StoryGenre;
  /** Profile age for recommendation badges */
  profileAge?: number;
}

const STEPS: WizardStep[] = ["genre", "setting", "companion", "length", "mode"];

const STEP_LABELS: Record<WizardStep, string> = {
  genre: "نوع القصة",
  setting: "مكان القصة",
  companion: "رفيق المغامرة",
  length: "طول القصة",
  mode: "أسلوب القصة",
};

const STEP_ICONS: Record<WizardStep, string> = {
  genre: "🎭",
  setting: "📍",
  companion: "🦊",
  length: "📚",
  mode: "✨",
};

// Genre-specific animated particle configs
const GENRE_PARTICLES: Record<StoryGenre, { chars: string[]; count: number }> = {
  fantasy: { chars: ["✦", "✧", "⋆", "✶"], count: 8 },
  "palestinian-folklore": { chars: ["🫒", "🌿", "🍃", "💚"], count: 6 },
  adventure: { chars: ["🧭", "⚡", "💨", "✦"], count: 6 },
  animal: { chars: ["🐾", "🌿", "🐾", "🌱"], count: 8 },
  space: { chars: ["⭐", "✦", "🌟", "·"], count: 10 },
  funny: { chars: ["🎉", "⭐", "✨", "💫"], count: 8 },
};

const GENRE_GRADIENTS: Record<StoryGenre, string> = {
  fantasy: "from-purple-900 via-purple-700 to-indigo-800",
  "palestinian-folklore": "from-amber-900 via-amber-700 to-yellow-800",
  adventure: "from-emerald-900 via-emerald-700 to-teal-800",
  animal: "from-orange-900 via-orange-700 to-amber-800",
  space: "from-blue-950 via-blue-900 to-indigo-950",
  funny: "from-rose-800 via-pink-700 to-orange-700",
};

// Age-based recommendations
function getAgeRecommendations(age?: number) {
  if (!age) return { length: null as StoryLength | null, mode: null as StoryMode | null };
  if (age <= 6) return { length: "short" as StoryLength, mode: "continuous" as StoryMode };
  if (age <= 9) return { length: "medium" as StoryLength, mode: "interactive" as StoryMode };
  return { length: "long" as StoryLength, mode: "interactive" as StoryMode };
}

// ── Particle overlay for genre cards ──────────────────────────────────────────
function GenreParticles({ genre }: { genre: StoryGenre }) {
  const config = GENRE_PARTICLES[genre];
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" aria-hidden>
      {config.chars.map((char, i) => (
        <span
          key={i}
          className="absolute text-sm select-none"
          style={{
            left: `${10 + ((i * 73) % 80)}%`,
            top: `${5 + ((i * 47) % 75)}%`,
            animation: `floatParticle ${2.5 + (i % 3) * 0.8}s ease-in-out ${(i * 0.4) % 2}s infinite`,
            opacity: 0.6 + (i % 3) * 0.15,
            fontSize: `${0.7 + (i % 3) * 0.2}rem`,
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

// ── Book fan visual for length cards ─────────────────────────────────────────
function BookFan({ pages, isSelected }: { pages: number; isSelected: boolean }) {
  const fanCount = pages <= 5 ? 3 : pages <= 8 ? 5 : 7;
  const maxAngle = pages <= 5 ? 20 : pages <= 8 ? 35 : 50;

  return (
    <div className="relative flex items-end justify-center h-16 w-20 mx-auto mb-2">
      {Array.from({ length: fanCount }).map((_, i) => {
        const angle = -maxAngle / 2 + (i * maxAngle) / (fanCount - 1);
        return (
          <div
            key={i}
            className="absolute bottom-0 left-1/2 w-10 h-14 rounded-t-md shadow-md border border-white/20"
            style={{
              transformOrigin: "50% 100%",
              transform: `translateX(-50%) rotate(${angle}deg)`,
              background: isSelected
                ? `hsl(${220 + i * 15}, 80%, ${50 + i * 5}%)`
                : `hsl(${210 + i * 10}, 30%, ${55 + i * 5}%)`,
              transition: "all 0.3s ease",
              zIndex: i,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Mode mini-demo ────────────────────────────────────────────────────────────
function ModeMiniDemo({ mode }: { mode: "interactive" | "continuous" }) {
  if (mode === "interactive") {
    return (
      <div className="mt-3 bg-white/10 rounded-xl p-2 text-right">
        <div className="h-1.5 bg-white/30 rounded mb-1.5 w-full" />
        <div className="h-1.5 bg-white/30 rounded mb-2 w-3/4" />
        <div className="flex flex-col gap-1">
          <div className="bg-white/20 border border-white/30 rounded-lg px-2 py-0.5 text-xs text-white/80 text-right">
            ◯ خيار ١
          </div>
          <div className="bg-white/20 border border-white/30 rounded-lg px-2 py-0.5 text-xs text-white/80 text-right">
            ◯ خيار ٢
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-3 bg-white/10 rounded-xl p-2 text-right">
      <div className="h-1.5 bg-white/30 rounded mb-1.5 w-full" />
      <div className="h-1.5 bg-white/30 rounded mb-1.5 w-5/6" />
      <div className="h-1.5 bg-white/30 rounded mb-1.5 w-full" />
      <div className="h-1.5 bg-white/30 rounded w-2/3" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StoryWizard({
  onComplete,
  onBack,
  preSelectedGenre,
  profileAge,
}: StoryWizardProps) {
  const initialStep = preSelectedGenre ? 1 : 0;
  const [stepIndex, setStepIndex] = useState(initialStep);
  const [genre, setGenre] = useState<StoryGenre | null>(preSelectedGenre ?? null);
  const [setting, setSetting] = useState<StorySetting | null>(null);
  const [companion, setCompanion] = useState<StoryCompanion | null>(null);
  const [length, setLength] = useState<StoryLength | null>(null);
  const [mode, setMode] = useState<StoryMode | null>(null);

  const ageRec = getAgeRecommendations(profileAge);
  const currentStep = STEPS[stepIndex];

  const autoAdvance = useCallback((nextStepIndex: number) => {
    setTimeout(() => setStepIndex(nextStepIndex), 250);
  }, []);

  const pickGenre = useCallback(
    (id: StoryGenre) => {
      setGenre(id);
      autoAdvance(1);
    },
    [autoAdvance]
  );

  const pickSetting = useCallback(
    (id: StorySetting) => {
      setSetting(id);
      autoAdvance(2);
    },
    [autoAdvance]
  );

  const pickCompanion = useCallback(
    (id: StoryCompanion) => {
      setCompanion(id);
      autoAdvance(3);
    },
    [autoAdvance]
  );

  const pickLength = useCallback(
    (id: StoryLength) => {
      setLength(id);
      autoAdvance(4);
    },
    [autoAdvance]
  );

  const pickMode = useCallback(
    (id: StoryMode) => {
      setMode(id);
      if (genre && setting && companion && length) {
        setTimeout(() => {
          onComplete({ genre, setting, companion, length, mode: id });
        }, 300);
      }
    },
    [genre, setting, companion, length, onComplete]
  );

  const handleBack = useCallback(() => {
    if (stepIndex === 0 || (preSelectedGenre && stepIndex === 1)) {
      onBack();
      return;
    }
    setStepIndex((i) => i - 1);
  }, [stepIndex, onBack, preSelectedGenre]);

  // 4 wizard settings: palestine + 3 fantasy
  const wizardSettings = STORY_SETTINGS.filter(
    (s) => s.id === "palestine" || s.category === "fantasy"
  );

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* ── Header ── */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handleBack}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all active:scale-90 touch-manipulation"
            aria-label="رجوع"
          >
            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 text-center">
            <p className="text-white/50 text-xs mb-0.5">
              الخطوة {stepIndex + 1} من {STEPS.length}
            </p>
            <h1 className="text-white font-bold text-lg leading-tight">
              {STEP_ICONS[currentStep]} {STEP_LABELS[currentStep]}
            </h1>
          </div>

          <div className="w-9" />
        </div>

        {/* Step progress bar */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-400 ${
                i === stepIndex
                  ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                  : i < stepIndex
                    ? "bg-white/60"
                    : "bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
        {/* ═══ STEP 1: GENRE ═══ */}
        {currentStep === "genre" && (
          <div className="max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-3">
              {STORY_GENRES.map((g) => {
                const isSelected = genre === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => pickGenre(g.id)}
                    className={`relative overflow-hidden rounded-2xl text-center transition-all duration-200 border-2 p-4 min-h-[130px] flex flex-col items-center justify-center bg-gradient-to-br touch-manipulation ${GENRE_GRADIENTS[g.id]} ${
                      isSelected
                        ? "border-white/70 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                        : "border-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-95"
                    }`}
                  >
                    <GenreParticles genre={g.id} />
                    <span className="relative text-4xl block mb-2 drop-shadow-lg">{g.emoji}</span>
                    <span className="relative text-white font-bold text-sm block leading-tight">{g.nameAr}</span>
                    <span className="relative text-white/60 text-xs block mt-1 leading-tight">{g.descriptionAr}</span>
                    {isSelected && (
                      <div className="absolute top-2 left-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ STEP 2: SETTING ═══ */}
        {currentStep === "setting" && (
          <div className="max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-3">
              {wizardSettings.map((s) => {
                const isSelected = setting === s.id;
                const isPalestine = s.id === "palestine";
                return (
                  <button
                    key={s.id}
                    onClick={() => pickSetting(s.id)}
                    className={`relative overflow-hidden rounded-2xl text-center transition-all duration-200 border-2 p-5 min-h-[130px] flex flex-col items-center justify-center touch-manipulation ${
                      isSelected
                        ? "border-white/70 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                        : "border-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-95"
                    }`}
                    style={{
                      background: isPalestine
                        ? isSelected
                          ? "linear-gradient(135deg, #166534 0%, #15803d 40%, #b45309 100%)"
                          : "linear-gradient(135deg, #14532d 0%, #166534 40%, #92400e 100%)"
                        : isSelected
                          ? "linear-gradient(135deg, #4c1d95 0%, #6d28d9 60%, #1e1b4b 100%)"
                          : "linear-gradient(135deg, #2e1065 0%, #4c1d95 60%, #1e1b4b 100%)",
                    }}
                  >
                    {/* Particle shimmer on selected */}
                    {isSelected && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" aria-hidden>
                        {["✦", "·", "✧"].map((char, i) => (
                          <span
                            key={i}
                            className="absolute text-white/30 select-none"
                            style={{
                              left: `${20 + i * 30}%`,
                              top: `${15 + i * 25}%`,
                              fontSize: "0.8rem",
                              animation: `floatParticle ${2 + i * 0.7}s ease-in-out ${i * 0.4}s infinite`,
                            }}
                          >
                            {char}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="relative text-4xl block mb-2 drop-shadow-lg">{s.emoji}</span>
                    <span className="relative text-white font-bold text-base block leading-tight">{s.nameAr}</span>
                    <span className="relative text-white/65 text-xs block mt-1 leading-tight">{s.descriptionAr}</span>
                    {isSelected && (
                      <div className="absolute top-2 left-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ STEP 3: COMPANION ═══ */}
        {currentStep === "companion" && (
          <div className="flex flex-col gap-4 max-w-sm mx-auto mt-2">
            {STORY_COMPANIONS.map((c, i) => {
              const isSelected = companion === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => pickCompanion(c.id)}
                  className={`relative p-6 rounded-2xl text-center transition-all duration-200 border-2 overflow-hidden touch-manipulation ${
                    isSelected
                      ? "border-white/70 bg-white/20 scale-[1.03] shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                      : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 active:scale-95"
                  }`}
                >
                  <span
                    className="text-6xl block mb-3"
                    style={{
                      animation: `emojiBouncePulse 1.8s ease-in-out ${i * 0.3}s infinite`,
                      display: "inline-block",
                    }}
                  >
                    {c.emoji}
                  </span>
                  <span className="text-white font-bold text-xl block">{c.nameAr}</span>
                  <span className="text-white/60 text-sm block mt-1">{c.descriptionAr}</span>
                  {isSelected && (
                    <div className="absolute top-3 left-3 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
                      <span className="text-green-600 text-sm font-bold">✓</span>
                    </div>
                  )}
                  {/* Age recommendation badge */}
                  {profileAge && profileAge <= 7 && c.id === "medhat" && (
                    <div className="absolute top-3 right-3 bg-yellow-400/90 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow">
                      ⭐ مناسب لعمرك
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ═══ STEP 4: LENGTH ═══ */}
        {currentStep === "length" && (
          <div className="flex flex-col gap-3 max-w-sm mx-auto mt-2">
            {STORY_LENGTHS.map((l) => {
              const isSelected = length === l.id;
              const isRec = ageRec.length === l.id;
              const timeMap: Record<string, string> = {
                short: "~٥ دقائق",
                medium: "~١٠ دقائق",
                long: "~٢٠ دقيقة",
              };
              return (
                <button
                  key={l.id}
                  onClick={() => pickLength(l.id)}
                  className={`relative p-4 rounded-2xl text-right transition-all duration-200 border-2 touch-manipulation ${
                    isSelected
                      ? "border-white/70 bg-white/20 scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                      : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 active:scale-95"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <BookFan pages={l.pages} isSelected={isSelected} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-base">{l.labelAr}</span>
                        {isRec && profileAge && (
                          <span className="bg-yellow-400/90 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                            ⭐ مناسب
                          </span>
                        )}
                      </div>
                      <span className="text-white/50 text-sm block">{l.pages} صفحات</span>
                      <span className="text-white/70 text-sm font-medium block mt-0.5">{timeMap[l.id]}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 left-3 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                      <span className="text-green-600 text-xs font-bold">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ═══ STEP 5: MODE ═══ */}
        {currentStep === "mode" && (
          <div className="flex flex-col gap-4 max-w-sm mx-auto mt-2">
            {STORY_MODES.map((m) => {
              const isSelected = mode === m.id;
              const isRec = ageRec.mode === m.id;
              const labels: Record<string, { title: string; sub: string }> = {
                interactive: {
                  title: "أنا أقرر القصة 🧑‍✈️",
                  sub: "تختار ماذا يحدث في كل مرحلة",
                },
                continuous: {
                  title: "الراوي يحكي 📖",
                  sub: "قصة سلسة من البداية للنهاية",
                },
              };
              const label = labels[m.id];
              return (
                <button
                  key={m.id}
                  onClick={() => pickMode(m.id)}
                  className={`relative p-5 rounded-2xl text-right transition-all duration-200 border-2 touch-manipulation ${
                    isSelected
                      ? "border-white/70 bg-white/20 scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                      : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 active:scale-95"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-white font-bold text-base block">{label.title}</span>
                      <span className="text-white/60 text-sm block mt-0.5">{label.sub}</span>
                      {isRec && profileAge && (
                        <span className="inline-block mt-1.5 bg-yellow-400/90 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                          ⭐ مناسب لعمرك
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow shrink-0 mt-0.5">
                        <span className="text-green-600 text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  {/* Mini demo */}
                  <ModeMiniDemo mode={m.id as "interactive" | "continuous"} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
