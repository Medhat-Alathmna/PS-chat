"use client";

import { useCallback, useEffect, useState } from "react";
import ReactConfetti from "react-confetti";

interface ConfettiProps {
  show: boolean;
  onComplete?: () => void;
  duration?: number;
  variant?: "celebration" | "palestinian" | "stars";
}

// Palestinian flag colors for confetti
const PALESTINIAN_COLORS = ["#EE2A35", "#009736", "#000000", "#FFFFFF"];

// Fun bright colors for general celebration
const CELEBRATION_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFE66D",
  "#FF9F43",
  "#A55EEA",
  "#54A0FF",
  "#FF9FF3",
];

// Gold/star colors
const STAR_COLORS = ["#FFD700", "#FFA500", "#FFFF00", "#FFE66D", "#FFFFFF"];

/**
 * Confetti celebration component
 * Uses react-confetti for the effect
 */
export default function Confetti({
  show,
  onComplete,
  duration = 3000,
  variant = "palestinian",
}: ConfettiProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Get colors based on variant
  const colors = useCallback(() => {
    switch (variant) {
      case "celebration":
        return CELEBRATION_COLORS;
      case "stars":
        return STAR_COLORS;
      default:
        return PALESTINIAN_COLORS;
    }
  }, [variant]);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Start/stop confetti based on show prop
  useEffect(() => {
    if (show) {
      setIsRunning(true);

      // Stop after duration
      const timer = setTimeout(() => {
        setIsRunning(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsRunning(false);
    }
  }, [show, duration, onComplete]);

  if (!show && !isRunning) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <ReactConfetti
        width={dimensions.width}
        height={dimensions.height}
        colors={colors()}
        numberOfPieces={isRunning ? 200 : 0}
        recycle={false}
        gravity={0.3}
        wind={0.01}
        tweenDuration={5000}
        confettiSource={{
          x: dimensions.width / 2,
          y: 0,
          w: dimensions.width,
          h: 0,
        }}
      />
    </div>
  );
}

/**
 * Mini confetti burst for smaller celebrations
 */
export function MiniConfetti({
  show,
  onComplete,
  x = 50,
  y = 50,
}: {
  show: boolean;
  onComplete?: () => void;
  x?: number; // percentage from left
  y?: number; // percentage from top
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    if (show) {
      setIsRunning(true);
      const timer = setTimeout(() => {
        setIsRunning(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show && !isRunning) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <ReactConfetti
        width={dimensions.width}
        height={dimensions.height}
        colors={PALESTINIAN_COLORS}
        numberOfPieces={isRunning ? 50 : 0}
        recycle={false}
        gravity={0.5}
        confettiSource={{
          x: (dimensions.width * x) / 100,
          y: (dimensions.height * y) / 100,
          w: 50,
          h: 50,
        }}
      />
    </div>
  );
}

/**
 * Emoji explosion - alternative to confetti
 */
export function EmojiExplosion({
  show,
  emoji = "⭐",
  count = 10,
}: {
  show: boolean;
  emoji?: string;
  count?: number;
}) {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; rotation: number }>
  >([]);

  useEffect(() => {
    if (show) {
      const newParticles = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 200 - 100, // -100 to 100
        y: Math.random() * -200 - 50, // -50 to -250
        rotation: Math.random() * 720 - 360,
      }));
      setParticles(newParticles);

      // Clear after animation
      const timer = setTimeout(() => setParticles([]), 2000);
      return () => clearTimeout(timer);
    }
  }, [show, count]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute text-3xl"
          style={{
            animation: "confettiFall 2s ease-out forwards",
            transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}
