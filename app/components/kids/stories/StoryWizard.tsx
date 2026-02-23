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
}

const STEPS: WizardStep[] = ["genre", "setting", "companion", "length", "mode"];

const STEP_LABELS: Record<WizardStep, string> = {
  genre: "نوع القصة",
  setting: "مكان القصة",
  companion: "رفيق المغامرة",
  length: "طول القصة",
  mode: "أسلوب القصة",
};

export default function StoryWizard({ onComplete, onBack }: StoryWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [genre, setGenre] = useState<StoryGenre | null>(null);
  const [setting, setSetting] = useState<StorySetting | null>(null);
  const [companion, setCompanion] = useState<StoryCompanion | null>(null);
  const [length, setLength] = useState<StoryLength | null>(null);
  const [mode, setMode] = useState<StoryMode | null>(null);

  const currentStep = STEPS[stepIndex];

  // Auto-advance: small delay so the selection highlight is visible
  const autoAdvance = useCallback(
    (nextStepIndex: number) => {
      setTimeout(() => {
        setStepIndex(nextStepIndex);
      }, 250);
    },
    []
  );

  // Selection handlers — set value + auto-advance
  const pickGenre = useCallback((id: StoryGenre) => {
    setGenre(id);
    autoAdvance(1);
  }, [autoAdvance]);

  const pickSetting = useCallback((id: StorySetting) => {
    setSetting(id);
    autoAdvance(2);
  }, [autoAdvance]);

  const pickCompanion = useCallback((id: StoryCompanion) => {
    setCompanion(id);
    autoAdvance(3);
  }, [autoAdvance]);

  const pickLength = useCallback((id: StoryLength) => {
    setLength(id);
    autoAdvance(4);
  }, [autoAdvance]);

  // Last step — auto-complete after selection
  const pickMode = useCallback((id: StoryMode) => {
    setMode(id);
    if (genre && setting && companion && length) {
      setTimeout(() => {
        onComplete({ genre, setting, companion, length, mode: id });
      }, 300);
    }
  }, [genre, setting, companion, length, onComplete]);

  const handleBack = useCallback(() => {
    if (stepIndex === 0) {
      onBack();
      return;
    }
    setStepIndex((i) => i - 1);
  }, [stepIndex, onBack]);

  const palestineSettings = STORY_SETTINGS.filter((s) => s.category === "palestine");
  const fantasySettings = STORY_SETTINGS.filter((s) => s.category === "fantasy");

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handleBack}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all active:scale-90"
            aria-label="رجوع"
          >
            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-white font-bold text-lg text-center">
            📖 {STEP_LABELS[currentStep]}
          </h1>
          <div className="w-9" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === stepIndex
                  ? "bg-white w-8"
                  : i < stepIndex
                    ? "bg-white/60 w-4"
                    : "bg-white/20 w-4"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Genre step */}
        {currentStep === "genre" && (
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            {STORY_GENRES.map((g) => (
              <button
                key={g.id}
                onClick={() => pickGenre(g.id)}
                className={`p-4 rounded-2xl text-center transition-all duration-200 border-2 ${
                  genre === g.id
                    ? "border-white/60 bg-white/20 scale-105 shadow-lg"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30"
                }`}
              >
                <span className="text-4xl block mb-2">{g.emoji}</span>
                <span className="text-white font-bold text-sm block">{g.nameAr}</span>
                <span className="text-white/50 text-xs block mt-1">{g.descriptionAr}</span>
              </button>
            ))}
          </div>
        )}

        {/* Setting step */}
        {currentStep === "setting" && (
          <div className="max-w-md mx-auto space-y-5">
            {/* Palestine settings */}
            <div>
              <h3 className="text-white/70 text-sm font-medium mb-2 flex items-center gap-1">
                🇵🇸 مدن فلسطين
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {palestineSettings.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => pickSetting(s.id)}
                    className={`p-3 rounded-xl text-right transition-all duration-200 border-2 ${
                      setting === s.id
                        ? "border-white/60 bg-white/20 scale-105"
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{s.emoji}</span>
                      <div>
                        <span className="text-white font-bold text-sm block">{s.nameAr}</span>
                        <span className="text-white/50 text-xs">{s.descriptionAr}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fantasy settings */}
            <div>
              <h3 className="text-white/70 text-sm font-medium mb-2 flex items-center gap-1">
                ✨ أماكن خيالية
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {fantasySettings.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => pickSetting(s.id)}
                    className={`p-3 rounded-xl text-right transition-all duration-200 border-2 ${
                      setting === s.id
                        ? "border-white/60 bg-white/20 scale-105"
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{s.emoji}</span>
                      <div>
                        <span className="text-white font-bold text-sm block">{s.nameAr}</span>
                        <span className="text-white/50 text-xs">{s.descriptionAr}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Companion step */}
        {currentStep === "companion" && (
          <div className="flex flex-col gap-4 max-w-sm mx-auto mt-4">
            {STORY_COMPANIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => pickCompanion(c.id)}
                className={`p-6 rounded-2xl text-center transition-all duration-200 border-2 ${
                  companion === c.id
                    ? "border-white/60 bg-white/20 scale-105 shadow-lg"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30"
                }`}
              >
                <span className="text-6xl block mb-3">{c.emoji}</span>
                <span className="text-white font-bold text-lg block">{c.nameAr}</span>
                <span className="text-white/50 text-sm block mt-1">{c.descriptionAr}</span>
              </button>
            ))}
          </div>
        )}

        {/* Length step */}
        {currentStep === "length" && (
          <div className="flex flex-col gap-3 max-w-sm mx-auto mt-4">
            {STORY_LENGTHS.map((l) => (
              <button
                key={l.id}
                onClick={() => pickLength(l.id)}
                className={`p-5 rounded-2xl text-right transition-all duration-200 border-2 ${
                  length === l.id
                    ? "border-white/60 bg-white/20 scale-105 shadow-lg"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{l.emoji}</span>
                  <div>
                    <span className="text-white font-bold text-base block">{l.labelAr}</span>
                    <span className="text-white/50 text-sm">{l.descriptionAr}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Mode step */}
        {currentStep === "mode" && (
          <div className="flex flex-col gap-4 max-w-sm mx-auto mt-4">
            {STORY_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => pickMode(m.id)}
                className={`p-6 rounded-2xl text-center transition-all duration-200 border-2 ${
                  mode === m.id
                    ? "border-white/60 bg-white/20 scale-105 shadow-lg"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30"
                }`}
              >
                <span className="text-5xl block mb-3">{m.emoji}</span>
                <span className="text-white font-bold text-lg block">{m.nameAr}</span>
                <span className="text-white/50 text-sm block mt-1">{m.descriptionAr}</span>
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
