"use client";

import { City } from "@/lib/data/cities";
import CityPopover from "./CityPopover";

interface InfoDisplayProps {
  city: City;
  onClose: () => void;
  onAskAboutCity?: (city: City) => void;
}

/**
 * Slide-in side panel from the right — reuses CityPopover content.
 */
export function SidePanelOverlay({ city, onClose, onAskAboutCity }: InfoDisplayProps) {
  return (
    <div className="absolute inset-0 z-[1000] pointer-events-none" dir="rtl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 pointer-events-auto"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="absolute top-0 right-0 h-full w-80 max-w-[85%] bg-white shadow-2xl pointer-events-auto overflow-y-auto animate-slideInFromRight"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="sticky top-2 right-2 z-10 float-left ml-2 mt-2 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          aria-label="إغلاق"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <CityPopover city={city} onAskAboutCity={onAskAboutCity} />
      </div>
    </div>
  );
}

/**
 * Centered card with CSS 3D flip — front shows image+name, back shows full info.
 */
export function FlipCardOverlay({ city, onClose, onAskAboutCity }: InfoDisplayProps) {
  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center p-4" dir="rtl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Flip container */}
      <div className="relative w-full max-w-sm flip-card-container" style={{ perspective: "1000px" }}>
        <div className="flip-card-inner animate-flipIn">
          {/* Front face */}
          <div className="flip-card-front absolute inset-0 rounded-2xl overflow-hidden shadow-2xl bg-white" style={{ backfaceVisibility: "hidden" }}>
            <div className="relative h-48">
              <img
                src={city.imageUrl}
                alt={city.nameAr}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 right-3 text-white">
                <h3 className="text-2xl font-black">{city.nameAr}</h3>
                <p className="text-sm opacity-80">{city.name}</p>
              </div>
              {city.emoji && (
                <span className="absolute top-3 left-3 text-3xl">{city.emoji}</span>
              )}
            </div>
            <div className="p-4 text-center text-sm text-gray-500">
              انقر للمزيد من المعلومات
            </div>
          </div>

          {/* Back face — full info */}
          <div
            className="flip-card-back rounded-2xl overflow-hidden shadow-2xl bg-white max-h-[70vh] overflow-y-auto"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <CityPopover city={city} onClose={onClose} onAskAboutCity={onAskAboutCity} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact floating bubble near the marker — shows emoji + name + truncated description.
 */
export function FloatingBubble({ city, onClose, onAskAboutCity }: InfoDisplayProps) {
  return (
    <div className="absolute inset-0 z-[1000] pointer-events-none">
      {/* Backdrop (invisible but captures clicks) */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onClick={onClose}
      />
      {/* Bubble — centered horizontally, near top-third */}
      <div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-auto animate-fade-in"
        dir="rtl"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 max-w-[260px] min-w-[200px]">
          <div className="flex items-center gap-2 mb-1.5">
            {city.emoji && <span className="text-2xl">{city.emoji}</span>}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm" style={{ color: city.color }}>{city.nameAr}</h4>
              <p className="text-[10px] text-gray-500">{city.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs shrink-0"
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>
          {city.descriptionAr && (
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mb-2">
              {city.descriptionAr}
            </p>
          )}
          {onAskAboutCity && (
            <button
              onClick={() => onAskAboutCity(city)}
              className="w-full py-1.5 bg-gradient-to-r from-[var(--kids-purple)] to-[var(--kids-blue)] text-white rounded-lg font-bold text-xs hover:scale-[1.02] active:scale-95 transition-all"
            >
              اسأل مدحت
            </button>
          )}
        </div>
        {/* Arrow pointing down */}
        <div className="flex justify-center">
          <div className="w-3 h-3 bg-white border-r border-b border-gray-100 transform rotate-45 -mt-1.5 shadow-sm" />
        </div>
      </div>
    </div>
  );
}
