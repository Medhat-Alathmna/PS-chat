"use client";

import { City } from "@/lib/data/cities";
import { useState } from "react";

interface CityPopoverProps {
  city: City;
  onClose?: () => void;
}

/**
 * Rich popover/card displaying city information
 * Shows image, name, and all facts about the city
 */
export default function CityPopover({ city, onClose }: CityPopoverProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="city-popover" dir="rtl">
      {/* Header with Image */}
      <div className="relative">
        {!imageError ? (
          <>
            {!imageLoaded && (
              <div className="w-full h-40 bg-gray-100 animate-pulse rounded-t-lg flex items-center justify-center">
                <div className="text-gray-400 text-sm">جاري التحميل...</div>
              </div>
            )}
            <img
              src={city.imageUrl}
              alt={city.nameAr}
              className={`w-full h-40 object-cover rounded-t-lg transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div
            className="w-full h-40 rounded-t-lg flex items-center justify-center text-white text-xl font-bold"
            style={{ background: city.color }}
          >
            {city.nameAr}
          </div>
        )}

        {/* Emoji badge */}
        {city.emoji && (
          <div
            className="absolute top-2 right-2 bg-white/95 rounded-full px-3 py-1.5 shadow-md"
            style={{ borderLeft: `3px solid ${city.color}` }}
          >
            <span className="text-xl">{city.emoji}</span>
          </div>
        )}

        {/* Close button (optional) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 left-2 bg-white/95 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-white transition-colors"
            aria-label="إغلاق"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* City name */}
        <div className="mb-3">
          <h3
            className="text-xl font-bold mb-1 transition-colors"
            style={{ color: city.color }}
          >
            {city.nameAr}
          </h3>
          <p className="text-sm text-gray-500">{city.name}</p>
        </div>

        {/* Facts */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">حقائق ومعلومات</p>
          {city.facts.map((fact, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span
                className="flex-shrink-0 mt-0.5 text-sm"
                style={{ color: city.color }}
              >
                ✓
              </span>
              <p className="text-sm text-gray-700 leading-relaxed">{fact}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
