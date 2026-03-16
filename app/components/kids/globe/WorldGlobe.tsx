"use client";

/**
 * WorldGlobe — dynamic wrapper to disable SSR for react-globe.gl (WebGL)
 */

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Country } from "@/lib/data/countries";
import type { GlobeSettings } from "@/lib/types/globe-settings";
import { DEFAULT_GLOBE_SETTINGS } from "@/lib/types/globe-settings";

const WorldGlobeInner = dynamic(() => import("./WorldGlobeInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#000814]">
      <div className="text-center space-y-4">
        <div className="text-6xl animate-spin-slow">🌍</div>
        <p className="text-white/60 text-sm font-medium">جاري تحميل الكرة الأرضية...</p>
      </div>
    </div>
  ),
});

interface WorldGlobeProps {
  onCountryClick: (country: Country) => void;
  selectedCountryId: string | null;
  flyToCountryId: string | null;
  settings?: GlobeSettings;
  onCountryCenter?: (country: Country | null) => void;
}

export default function WorldGlobe({
  onCountryClick,
  selectedCountryId,
  flyToCountryId,
  settings = DEFAULT_GLOBE_SETTINGS,
  onCountryCenter,
}: WorldGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });

    observer.observe(el);
    // Initial size
    setDimensions({
      width: Math.floor(el.offsetWidth),
      height: Math.floor(el.offsetHeight),
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <WorldGlobeInner
          onCountryClick={onCountryClick}
          selectedCountryId={selectedCountryId}
          flyToCountryId={flyToCountryId}
          settings={settings}
          width={dimensions.width}
          height={dimensions.height}
          onCountryCenter={onCountryCenter}
        />
      )}
    </div>
  );
}
