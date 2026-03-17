"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Country } from "@/lib/data/countries";
import { countryCodeToFlag } from "@/lib/data/countries";
import { useGlobeSettings } from "@/lib/hooks/useGlobeSettings";
import { useProfiles } from "@/lib/hooks/useProfiles";
import WorldGlobe from "@/app/components/kids/globe/WorldGlobe";
import GlobeSearch from "@/app/components/kids/globe/GlobeSearch";
import CountrySheet from "@/app/components/kids/globe/CountrySheet";
import GlobeSettingsPanel from "@/app/components/kids/globe/GlobeSettingsPanel";
import CountriesListModal from "@/app/components/kids/globe/CountriesListModal";

// Hardcoded star positions to avoid JS randomness / hydration issues
const STARS = [
  { top: "8%",  left: "12%", size: 1.5 }, { top: "15%", left: "78%", size: 1 },
  { top: "22%", left: "34%", size: 2   }, { top: "5%",  left: "55%", size: 1 },
  { top: "38%", left: "91%", size: 1.5 }, { top: "48%", left: "7%",  size: 1 },
  { top: "62%", left: "23%", size: 2   }, { top: "71%", left: "85%", size: 1 },
  { top: "83%", left: "47%", size: 1.5 }, { top: "91%", left: "67%", size: 1 },
  { top: "12%", left: "89%", size: 1   }, { top: "29%", left: "5%",  size: 2 },
  { top: "44%", left: "61%", size: 1   }, { top: "57%", left: "39%", size: 1.5 },
  { top: "76%", left: "14%", size: 1   }, { top: "88%", left: "82%", size: 2 },
  { top: "3%",  left: "42%", size: 1   }, { top: "18%", left: "19%", size: 1.5 },
  { top: "33%", left: "72%", size: 1   }, { top: "52%", left: "93%", size: 2 },
  { top: "66%", left: "52%", size: 1   }, { top: "79%", left: "31%", size: 1.5 },
  { top: "95%", left: "18%", size: 1   }, { top: "41%", left: "44%", size: 1 },
  { top: "9%",  left: "66%", size: 2   }, { top: "55%", left: "75%", size: 1 },
  { top: "85%", left: "9%",  size: 1.5 }, { top: "24%", left: "50%", size: 1 },
  { top: "68%", left: "63%", size: 2   }, { top: "37%", left: "27%", size: 1 },
];

export default function WorldExplorerPage() {
  const router = useRouter();
  const { activeProfile } = useProfiles();

  const {
    settings,
    isLoaded,
    setAppearance,
    setAutoRotate,
    setRotationSpeed,
    setSpaceBackground,
    resetToDefaults,
  } = useGlobeSettings(activeProfile?.id);

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [flyToCountryId, setFlyToCountryId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCountriesList, setShowCountriesList] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [centeredCountry, setCenteredCountry] = useState<Country | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setHasInteracted(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const flyTo = useCallback((country: Country) => {
    setSelectedCountry(country);
    setSheetOpen(true);
    setHasInteracted(true);
    setFlyToCountryId(country.id);
  }, []);

  // Reset flyToCountryId after a tick so re-tapping the same country re-triggers the effect
  useEffect(() => {
    if (!flyToCountryId) return;
    const t = setTimeout(() => setFlyToCountryId(null), 100);
    return () => clearTimeout(t);
  }, [flyToCountryId]);

  const handleSheetClose = useCallback(() => {
    setSheetOpen(false);
    setSelectedCountry(null);
  }, []);

  if (!isLoaded) return null;

  return (
    <div
      className="relative w-full h-dvh overflow-hidden"
      style={{ background: "#000814" }}
    >
      {/* ── Starfield ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              opacity: 0.4 + (i % 3) * 0.15,
            }}
          />
        ))}
      </div>

      {/* ── Header ── */}
      <header
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-3 h-12"
        style={{
          background: "rgba(0,8,20,0.55)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.08)" }}
          aria-label="رجوع"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Title */}
        <h1
          className="text-base font-black tracking-tight"
          style={{
            background: "linear-gradient(90deg, #c084fc, #93c5fd, #5eead4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          مستكشف الدول 🌍
        </h1>

        {/* Right: Countries List + Settings */}
        <div className="flex items-center gap-2">
          {/* Countries List */}
          <button
            onClick={() => setShowCountriesList(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.08)" }}
            aria-label="قائمة الدول"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.08)" }}
            aria-label="الإعدادات"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Globe Area ── */}
      <div
        className="absolute inset-0 z-10"
        style={{
          top: 48, // below header
          bottom: sheetOpen ? "42%" : 0,
          transition: "bottom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <WorldGlobe
          onCountryClick={flyTo}
          selectedCountryId={selectedCountry?.id ?? null}
          flyToCountryId={flyToCountryId}
          settings={settings}
          onCountryCenter={setCenteredCountry}
          paused={sheetOpen}
        />

        {/* ── Center Crosshair ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div style={{ position: "relative", width: 40, height: 40 }}>
            {/* Horizontal line */}
            <div style={{
              position: "absolute", top: "50%", left: 0, right: 0,
              height: 1.5, background: "rgba(255,255,255,0.55)",
              transform: "translateY(-50%)",
            }} />
            {/* Vertical line */}
            <div style={{
              position: "absolute", left: "50%", top: 0, bottom: 0,
              width: 1.5, background: "rgba(255,255,255,0.55)",
              transform: "translateX(-50%)",
            }} />
            {/* Center dot */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              width: 6, height: 6, borderRadius: "50%",
              background: "#c084fc",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 6px 2px rgba(192,132,252,0.6)",
            }} />
          </div>
        </div>

        {/* ── Centered Country Indicator ── */}
        {centeredCountry && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none
              flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap"
            style={{
              background: "rgba(0,8,20,0.72)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              fontFamily: "Cairo, 'Noto Sans Arabic', sans-serif",
              fontSize: 14,
              direction: "rtl",
            }}
          >
            <span>{countryCodeToFlag(centeredCountry.code)}</span>
            <span>{centeredCountry.nameAr}</span>
          </div>
        )}
      </div>

      {/* ── Search Bar ── */}
      <div
        className="fixed z-20 inset-x-0 flex justify-center px-4"
        style={{ top: 60 }}
      >
        <GlobeSearch onCountrySelect={flyTo} />
      </div>

      {/* ── Welcome Hint ── */}
      {!hasInteracted && (
        <div
          className="fixed z-20 inset-x-0 flex justify-center pointer-events-none"
          style={{ top: "50%" }}
        >
          <div
            className="px-4 py-2 rounded-full text-sm"
            style={{
              background: "rgba(0,8,20,0.6)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)",
              animation: "hintPulse 2.5s ease-in-out infinite",
            }}
          >
            👆 العب بالكرة واضغط على أي دولة!
          </div>
        </div>
      )}

      {/* ── Country Sheet ── */}
      <CountrySheet
        country={selectedCountry}
        playerName={activeProfile?.name}
        isOpen={sheetOpen}
        onClose={handleSheetClose}
      />

      {/* ── Countries List Modal ── */}
      <CountriesListModal
        isOpen={showCountriesList}
        onClose={() => setShowCountriesList(false)}
        onCountrySelect={flyTo}
      />

      {/* ── Settings Panel ── */}
      <GlobeSettingsPanel
        settings={settings}
        isOpen={showSettings}
        onAppearanceChange={setAppearance}
        onAutoRotateChange={setAutoRotate}
        onRotationSpeedChange={setRotationSpeed}
        onSpaceBackgroundChange={setSpaceBackground}
        onResetDefaults={resetToDefaults}
        onClose={() => setShowSettings(false)}
      />

      <style>{`
        @keyframes hintPulse {
          0%, 100% { opacity: 0.7; transform: translateY(0); }
          50%       { opacity: 1;   transform: translateY(-4px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
      `}</style>
    </div>
  );
}
