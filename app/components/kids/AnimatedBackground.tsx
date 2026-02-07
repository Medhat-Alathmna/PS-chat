"use client";

import { useMemo, useState, useEffect } from "react";

interface AnimatedBackgroundProps {
  variant?: "sky" | "night" | "gradient";
  showClouds?: boolean;
  showBirds?: boolean;
  showStars?: boolean;
  children?: React.ReactNode;
}

/**
 * Animated background with floating elements
 * Perfect for kids interface
 */
export default function AnimatedBackground({
  variant = "sky",
  showClouds = true,
  showBirds = true,
  showStars = false,
  children,
}: AnimatedBackgroundProps) {
  const bgClass = useMemo(() => {
    switch (variant) {
      case "night":
        return "bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-800";
      case "gradient":
        return "bg-gradient-to-br from-[var(--kids-purple)] via-[var(--kids-blue)] to-[var(--kids-green)]";
      default:
        return "bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100";
    }
  }, [variant]);

  return (
    <div className={`relative min-h-screen overflow-hidden ${bgClass}`}>
      {/* Clouds */}
      {showClouds && <Clouds />}

      {/* Birds */}
      {showBirds && <Birds />}

      {/* Stars (for night mode) */}
      {(showStars || variant === "night") && <Stars />}

      {/* Palestinian flag stripe at top */}
      <div className="kids-ps-stripe" />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Ground decoration */}
      <GroundDecoration />
    </div>
  );
}

/**
 * Floating clouds component
 */
function Clouds() {
  const clouds = useMemo(
    () => [
      { id: 1, size: "w-24 h-12", top: "10%", delay: "0s", duration: "30s" },
      { id: 2, size: "w-32 h-16", top: "15%", delay: "5s", duration: "35s" },
      { id: 3, size: "w-20 h-10", top: "25%", delay: "10s", duration: "25s" },
      { id: 4, size: "w-28 h-14", top: "8%", delay: "15s", duration: "40s" },
      { id: 5, size: "w-16 h-8", top: "30%", delay: "20s", duration: "28s" },
    ],
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {clouds.map((cloud) => (
        <div
          key={cloud.id}
          className={`absolute ${cloud.size} animate-cloud-drift`}
          style={{
            top: cloud.top,
            left: "-100px",
            animationDelay: cloud.delay,
            animationDuration: cloud.duration,
          }}
        >
          <Cloud />
        </div>
      ))}
    </div>
  );
}

/**
 * Single cloud shape
 */
function Cloud() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 bg-white rounded-full opacity-90" />
      <div className="absolute left-1/4 -top-1/4 w-1/2 h-3/4 bg-white rounded-full opacity-90" />
      <div className="absolute left-1/2 -top-1/3 w-1/2 h-2/3 bg-white rounded-full opacity-90" />
    </div>
  );
}

/**
 * Flying birds
 */
function Birds() {
  const birds = useMemo(
    () => [
      { id: 1, top: "12%", delay: "0s", duration: "15s" },
      { id: 2, top: "20%", delay: "7s", duration: "18s" },
      { id: 3, top: "8%", delay: "12s", duration: "20s" },
    ],
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {birds.map((bird) => (
        <div
          key={bird.id}
          className="absolute text-2xl animate-bird-fly"
          style={{
            top: bird.top,
            left: "-50px",
            animationDelay: bird.delay,
            animationDuration: bird.duration,
          }}
        >
          🕊️
        </div>
      ))}
    </div>
  );
}

/**
 * Twinkling stars for night mode
 */
function Stars() {
  const [stars, setStars] = useState<Array<{
    id: number;
    left: string;
    top: string;
    delay: string;
    size: string;
  }>>([]);

  // Generate stars only on client to avoid hydration mismatch
  useEffect(() => {
    setStars(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 50}%`,
        delay: `${Math.random() * 3}s`,
        size: Math.random() > 0.5 ? "text-lg" : "text-sm",
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <span
          key={star.id}
          className={`absolute ${star.size} animate-twinkle`}
          style={{
            left: star.left,
            top: star.top,
            animationDelay: star.delay,
          }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

/**
 * Ground decoration with olive trees and hills
 */
function GroundDecoration() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none">
      {/* Hills */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg
          viewBox="0 0 1200 120"
          className="w-full h-24"
          preserveAspectRatio="none"
        >
          <path
            d="M0,120 Q300,60 600,90 T1200,60 V120 H0 Z"
            fill="rgba(34, 197, 94, 0.3)"
          />
          <path
            d="M0,120 Q400,80 800,100 T1200,80 V120 H0 Z"
            fill="rgba(34, 197, 94, 0.5)"
          />
        </svg>
      </div>

      {/* Olive trees */}
      <span className="absolute bottom-8 left-[10%] text-4xl">🌳</span>
      <span className="absolute bottom-12 left-[30%] text-3xl">🌳</span>
      <span className="absolute bottom-6 left-[70%] text-4xl">🌳</span>
      <span className="absolute bottom-10 left-[90%] text-3xl">🌳</span>
    </div>
  );
}

/**
 * Simplified sky background component
 */
export function SkyBackground({ children }: { children?: React.ReactNode }) {
  return (
    <AnimatedBackground variant="sky" showClouds showBirds>
      {children}
    </AnimatedBackground>
  );
}

/**
 * Night mode background
 */
export function NightBackground({ children }: { children?: React.ReactNode }) {
  return (
    <AnimatedBackground variant="night" showClouds={false} showStars>
      {children}
    </AnimatedBackground>
  );
}
