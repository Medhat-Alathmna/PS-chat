"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

// Get current theme from DOM
function getSnapshot(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): "light" | "dark" {
  return "dark";
}

function subscribe(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  if (typeof document !== "undefined") {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
  return () => observer.disconnect();
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");
  const resolvedTheme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Get system preference
  const getSystemTheme = useCallback((): "light" | "dark" => {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  // Apply theme to document
  const applyTheme = useCallback(
    (newTheme: Theme) => {
      const root = document.documentElement;
      const resolved = newTheme === "system" ? getSystemTheme() : newTheme;

      root.classList.remove("light", "dark");
      root.classList.add(resolved);
    },
    [getSystemTheme]
  );

  // Initialize theme on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const initialTheme = stored || "system";
    setThemeState(initialTheme);
    applyTheme(initialTheme);

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const currentTheme = localStorage.getItem("theme") as Theme | null;
      if (!currentTheme || currentTheme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [applyTheme]);

  // Set theme function
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      localStorage.setItem("theme", newTheme);
      applyTheme(newTheme);
    },
    [applyTheme]
  );

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const currentResolved = document.documentElement.classList.contains("dark") ? "dark" : "light";
    const newTheme = currentResolved === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }, [setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === "dark",
    isLight: resolvedTheme === "light",
  };
}
