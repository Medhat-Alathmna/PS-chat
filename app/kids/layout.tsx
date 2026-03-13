"use client";

// Re-export from root layout so consumers get the single shared music instance
export { useBackgroundMusicContext } from "@/app/layout";

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-300 via-sky-200 to-cyan-50">
      {children}
    </div>
  );
}
