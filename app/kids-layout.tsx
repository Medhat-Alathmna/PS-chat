"use client";

import { createContext, useContext } from "react";
import { useBackgroundMusic } from "@/lib/hooks/useBackgroundMusic";

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
    throw new Error("useBackgroundMusicContext must be used within KidsLayout");
  }
  return context;
}

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  // Initialize background music for entire kids section
  const music = useBackgroundMusic();

  return (
    <BackgroundMusicContext.Provider value={music}>
      <div className="min-h-screen bg-gradient-to-b from-sky-300 via-sky-200 to-cyan-50">
        {children}
      </div>
    </BackgroundMusicContext.Provider>
  );
}
