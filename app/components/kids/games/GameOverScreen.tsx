"use client";

import { GameSessionSummary } from "@/lib/types/games";
import { getGameConfig } from "@/lib/data/games";
import Confetti from "../Confetti";

interface GameOverScreenProps {
  summary: GameSessionSummary;
  onPlayAgain: () => void;
  onChooseAnother: () => void;
}

export default function GameOverScreen({
  summary,
  onPlayAgain,
  onChooseAnother,
}: GameOverScreenProps) {
  const config = getGameConfig(summary.gameId);
  const percentage =
    summary.totalRounds > 0
      ? Math.round((summary.correctAnswers / summary.totalRounds) * 100)
      : 0;
  const isGreat = percentage >= 70;

  const getMessage = () => {
    if (percentage >= 90) return "ممتاز يا بطل! 🏆";
    if (percentage >= 70) return "أحسنت كتير! 🌟";
    if (percentage >= 50) return "كويس! كمّل تدريب! 💪";
    return "لا تقلق! جرب مرة تانية! 🌈";
  };

  const getEmoji = () => {
    if (percentage >= 90) return "🏆";
    if (percentage >= 70) return "🌟";
    if (percentage >= 50) return "👍";
    return "💪";
  };

  const durationSeconds = Math.round(summary.duration / 1000);
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return (
    <>
      <Confetti show={isGreat} variant="palestinian" />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-pop-in text-center">
          {/* Big emoji */}
          <div className="text-6xl mb-3 animate-bounce-kids">{getEmoji()}</div>

          {/* Game name */}
          <div className="text-sm text-gray-500 mb-1">
            {config.emoji} {config.nameAr}
          </div>

          {/* Result message */}
          <h2 className="text-2xl font-bold text-[var(--kids-purple)] mb-4 bubble-text">
            {getMessage()}
          </h2>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatBox
              label="النقاط"
              value={`${summary.score}`}
              emoji="⭐"
              color="var(--kids-orange)"
            />
            <StatBox
              label="إجابات صح"
              value={`${summary.correctAnswers}/${summary.totalRounds}`}
              emoji="✅"
              color="var(--kids-green)"
            />
            <StatBox
              label="الوقت"
              value={`${minutes}:${seconds.toString().padStart(2, "0")}`}
              emoji="⏱️"
              color="var(--kids-blue)"
            />
            <StatBox
              label="التلميحات"
              value={`${summary.hintsUsed}`}
              emoji="💡"
              color="var(--kids-yellow)"
            />
          </div>

          {/* Bonus notification */}
          {summary.bonusEarned && (
            <div className="bg-[var(--kids-yellow)]/20 rounded-xl px-4 py-2 mb-4 animate-pop-in">
              <span className="text-sm font-bold text-[var(--kids-orange)]">
                🎁 مكافأة +{getGameConfig(summary.gameId).bonusPoints} نقطة!
              </span>
            </div>
          )}

          {/* Sticker unlock */}
          {summary.stickerUnlocked && (
            <div className="bg-purple-50 rounded-xl px-4 py-2 mb-4 animate-pop-in">
              <span className="text-sm font-bold text-[var(--kids-purple)]">
                🎉 فتحت ملصق جديد!
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onPlayAgain}
              className="flex-1 py-3 bg-[var(--kids-green)] text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-transform shadow-md"
            >
              العب مرة تانية 🔄
            </button>
            <button
              onClick={onChooseAnother}
              className="flex-1 py-3 bg-[var(--kids-purple)] text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-transform shadow-md"
            >
              لعبة تانية 🎮
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function StatBox({
  label,
  value,
  emoji,
  color,
}: {
  label: string;
  value: string;
  emoji: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ backgroundColor: `${color}15` }}
    >
      <div className="text-lg">{emoji}</div>
      <div className="font-bold text-lg" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
