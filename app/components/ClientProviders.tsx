"use client";

import { createContext, useContext, useEffect } from "react";
import { useBackgroundMusic } from "@/lib/hooks/useBackgroundMusic";
import { AuthProvider } from "@/lib/context/auth-context";
import { EmailVerificationGuard } from "./kids/EmailVerificationGuard";
import { Toaster } from "sonner";
import SplashScreen from "./kids/SplashScreen";
import PWAInstallPrompt from "./kids/PWAInstallPrompt";

interface BackgroundMusicContextType {
  isPlaying: boolean;
  isLoaded: boolean;
  toggle: () => void;
  play: () => void;
  pause: () => void;
}

const BackgroundMusicContext = createContext<BackgroundMusicContextType | null>(null);

export function useBackgroundMusicContext() {
  const context = useContext(BackgroundMusicContext);
  if (!context) {
    throw new Error("useBackgroundMusicContext must be used within ClientProviders");
  }
  return context;
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const music = useBackgroundMusic();

  // Register Service Worker for PWA/WebAPK support
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed — non-critical, app works without it
      });
    }
  }, []);

  return (
    <AuthProvider>
      <EmailVerificationGuard>
        <BackgroundMusicContext.Provider value={music}>
          <Toaster position="top-center" richColors />
          <div className="min-h-dvh bg-gradient-to-b from-sky-300 via-sky-200 to-cyan-50">
            {children}
          </div>
          <SplashScreen />
          <PWAInstallPrompt />
        </BackgroundMusicContext.Provider>
      </EmailVerificationGuard>
    </AuthProvider>
  );
}
