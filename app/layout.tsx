"use client";

import { createContext, useContext } from "react";
import { Geist, Geist_Mono, Noto_Sans_Arabic, Cairo, Tajawal, Changa } from "next/font/google";
import "./globals.css";
import { useBackgroundMusic } from "@/lib/hooks/useBackgroundMusic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

const changa = Changa({
  variable: "--font-changa",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

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
    throw new Error("useBackgroundMusicContext must be used within RootLayout");
  }
  return context;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Initialize background music for entire app
  const music = useBackgroundMusic();

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#6C5CE7" />
        <title>PS-Kids | تعلم مع مدحت - Learn with Medhat</title>
        <meta name="description" content="تطبيق تعليمي ممتع للأطفال عن فلسطين - An engaging educational app for kids about Palestine" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} ${cairo.variable} ${tajawal.variable} ${changa.variable} antialiased font-[family-name:var(--font-arabic)]`}
      >
        <BackgroundMusicContext.Provider value={music}>
          <div className="min-h-screen bg-gradient-to-b from-sky-300 via-sky-200 to-cyan-50">
            {children}
          </div>
        </BackgroundMusicContext.Provider>
      </body>
    </html>
  );
}