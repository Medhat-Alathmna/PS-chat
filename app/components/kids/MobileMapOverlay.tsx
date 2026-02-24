"use client";

import type { City } from "@/lib/data/cities";
import type { MapSettings } from "@/lib/types/map-settings";

/**
 * Props for the MobileMapOverlay component
 */
interface MobileMapOverlayProps {
  show: boolean;
  onClose: () => void;
  highlightedCityId: string | null;
  mapSettings: MapSettings;
  onCityClick: (city: City) => void;
  onAskAboutCity: (city: City) => void;
  MapComponent: React.ComponentType<{
    onCityClick?: (city: City) => void;
    onAskAboutCity?: (city: City) => void;
    highlightedCity?: string;
    showControls?: boolean;
    enableFullInteraction?: boolean;
    className?: string;
    mapSettings?: MapSettings;
  }>;
}

/**
 * Mobile fullscreen map overlay component.
 * Renders a modal with the map for mobile users.
 */
export default function MobileMapOverlay({
  show,
  onClose,
  highlightedCityId,
  mapSettings,
  onCityClick,
  onAskAboutCity,
  MapComponent,
}: MobileMapOverlayProps) {
  if (!show) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Map container */}
      <div className="absolute inset-3 flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden animate-pop-in">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--kids-purple)] to-[var(--kids-blue)] text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            <span className="font-bold text-lg">خريطة فلسطين</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-105 active:scale-95"
            aria-label="إغلاق"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 min-h-0 p-2">
          <MapComponent
            onCityClick={onCityClick}
            onAskAboutCity={onAskAboutCity}
            highlightedCity={highlightedCityId || undefined}
            showControls={true}
            enableFullInteraction={true}
            className="h-full"
            mapSettings={mapSettings}
          />
        </div>

        {/* Footer hint */}
        <div className="shrink-0 px-4 py-2 bg-gray-50 text-center text-sm text-gray-500">
          اضغط على أي مدينة لمعرفة المزيد عنها 📍
        </div>
      </div>
    </div>
  );
}