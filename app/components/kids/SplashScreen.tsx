"use client";

import { useState, useEffect } from "react";

const SPLASH_KEY = "falastin_splash_shown";

export default function SplashScreen() {
  // Start as true so splash renders immediately (no delay)
  // useEffect hides it instantly if already seen this session
  const [showSplash, setShowSplash] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // On mount: hide immediately if already shown this session
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SPLASH_KEY)) {
        setShowSplash(false);
      }
    } catch {
      // sessionStorage unavailable — keep showing
    }
  }, []);

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => setIsExiting(true), 3000);
    return () => clearTimeout(timer);
  }, [showSplash]);

  // Cleanup after exit animation (500ms)
  useEffect(() => {
    if (!isExiting) return;
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(SPLASH_KEY, "1");
      } catch {
        // sessionStorage unavailable
      }
      setShowSplash(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [isExiting]);

  if (!showSplash) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[200]
        flex flex-col items-center justify-center
        bg-gradient-to-b from-sky-300 via-sky-200 to-cyan-50
        ${isExiting ? "animate-splash-exit" : ""}
      `}
      aria-hidden="true"
    >
      {/* App name — typewriter reveal */}
      <div dir="ltr">
        <h1
          className="
            animate-splash-typewriter
            text-4xl sm:text-5xl lg:text-6xl
            font-extrabold tracking-tight
            font-[family-name:var(--font-geist-sans)]
            bg-gradient-to-r from-[var(--ps-green)] via-[var(--kids-green)] to-[var(--ps-green-light)]
            bg-clip-text text-transparent
          "
        >
          PS Kids
        </h1>
      </div>

      {/* Tagline */}
      <p
        className="
          animate-splash-tagline
          mt-4 sm:mt-5 px-8
          text-base sm:text-lg lg:text-xl
          text-slate-600/90 font-medium text-center leading-relaxed
          max-w-xs sm:max-w-sm
          font-[family-name:var(--font-arabic)]
        "
      >
        حيث يتعلّم أطفالك عن بلدنا بأكثر الطرق متعة
      </p>
    </div>
  );
}
