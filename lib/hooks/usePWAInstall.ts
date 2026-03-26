"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const SESSION_KEY = "falastin_pwa_prompt_shown";
const INSTALLED_KEY = "falastin_pwa_installed";
const SPLASH_KEY = "falastin_splash_shown";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface UsePWAInstallReturn {
  showPrompt: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  install: () => Promise<void>;
  dismiss: () => void;
}

function getIsIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const isIOS = useRef(false);

  useEffect(() => {
    isIOS.current = getIsIOS();

    // Already installed as standalone — don't show anything
    if (getIsStandalone() || localStorage.getItem(INSTALLED_KEY) === "true") {
      setIsInstalled(true);
      return;
    }

    // Already shown this session
    if (sessionStorage.getItem(SESSION_KEY) === "true") return;

    // Wait for SplashScreen to finish before showing prompt
    const waitForSplash = () => {
      // If splash was already dismissed (returning user in same session), show after short delay
      if (sessionStorage.getItem(SPLASH_KEY)) {
        setTimeout(() => setShowPrompt(true), 2000);
        return;
      }
      // Otherwise poll for splash dismissal (splash sets this key when it exits)
      const interval = setInterval(() => {
        if (sessionStorage.getItem(SPLASH_KEY)) {
          clearInterval(interval);
          setTimeout(() => setShowPrompt(true), 2000);
        }
      }, 500);
      // Safety: stop polling after 15s
      setTimeout(() => clearInterval(interval), 15000);
    };

    // Android/Chrome: capture beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      waitForSplash();
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // iOS: no beforeinstallprompt — show manual instructions
    if (isIOS.current) {
      waitForSplash();
    }

    // Listen for successful install
    const handleInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem(INSTALLED_KEY, "true");
    };
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "true");
      setIsInstalled(true);
    }
    setShowPrompt(false);
    sessionStorage.setItem(SESSION_KEY, "true");
    deferredPromptRef.current = null;
  }, []);

  const dismiss = useCallback(() => {
    setShowPrompt(false);
    sessionStorage.setItem(SESSION_KEY, "true");
  }, []);

  return {
    showPrompt,
    isInstalled,
    isIOS: isIOS.current,
    install,
    dismiss,
  };
}
