"use client";

import { useTheme } from "@/lib/hooks/useTheme";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] transition-all"
        aria-label="تبديل الثيم"
      >
        <span className="h-5 w-5 bg-[var(--foreground-secondary)] rounded-full opacity-30" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="group relative flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] transition-all hover:border-[var(--accent)] hover:shadow-md"
      aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع المظلم"}
      title={isDark ? "الوضع الفاتح" : "الوضع المظلم"}
    >
      {/* Sun icon */}
      <svg
        className={`h-5 w-5 transition-all duration-300 ${
          isDark
            ? "rotate-0 scale-100 text-amber-400"
            : "rotate-90 scale-0 absolute"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      {/* Moon icon */}
      <svg
        className={`h-5 w-5 transition-all duration-300 ${
          isDark
            ? "-rotate-90 scale-0 absolute"
            : "rotate-0 scale-100 text-[var(--ps-black)]"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>

      {/* Hover effect */}
      <span className="absolute inset-0 rounded-xl bg-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-10" />
    </button>
  );
}
