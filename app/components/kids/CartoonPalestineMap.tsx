"use client";

import { useState } from "react";

interface City {
  id: string;
  name: string;
  nameAr: string;
  emoji: string;
  x: number; // percentage from left
  y: number; // percentage from top
  color: string;
  fact: string;
}

const CITIES: City[] = [
  {
    id: "jerusalem",
    name: "Jerusalem",
    nameAr: "القدس",
    emoji: "🕌",
    x: 48,
    y: 52,
    color: "#FFD700",
    fact: "أولى القبلتين وثالث الحرمين",
  },
  {
    id: "gaza",
    name: "Gaza",
    nameAr: "غزة",
    emoji: "🌊",
    x: 22,
    y: 72,
    color: "#54A0FF",
    fact: "مدينة على شاطئ البحر",
  },
  {
    id: "nablus",
    name: "Nablus",
    nameAr: "نابلس",
    emoji: "🏔️",
    x: 52,
    y: 32,
    color: "#4ECDC4",
    fact: "مشهورة بالكنافة اللذيذة!",
  },
  {
    id: "bethlehem",
    name: "Bethlehem",
    nameAr: "بيت لحم",
    emoji: "⭐",
    x: 50,
    y: 58,
    color: "#FF9FF3",
    fact: "مدينة السلام",
  },
  {
    id: "hebron",
    name: "Hebron",
    nameAr: "الخليل",
    emoji: "🏺",
    x: 52,
    y: 68,
    color: "#FF9F43",
    fact: "مشهورة بالزجاج والخزف",
  },
  {
    id: "ramallah",
    name: "Ramallah",
    nameAr: "رام الله",
    emoji: "🏛️",
    x: 48,
    y: 42,
    color: "#A55EEA",
    fact: "مدينة الثقافة والفن",
  },
  {
    id: "jaffa",
    name: "Jaffa",
    nameAr: "يافا",
    emoji: "🍊",
    x: 32,
    y: 38,
    color: "#FF6B6B",
    fact: "عروس البحر - مشهورة بالبرتقال",
  },
  {
    id: "acre",
    name: "Acre",
    nameAr: "عكا",
    emoji: "⚓",
    x: 38,
    y: 12,
    color: "#4ECDC4",
    fact: "مدينة الميناء التاريخية",
  },
];

interface CartoonPalestineMapProps {
  onCityClick?: (city: City) => void;
  highlightedCity?: string;
  className?: string;
}

/**
 * Cartoon-style interactive Palestine map for kids
 */
export default function CartoonPalestineMap({
  onCityClick,
  highlightedCity,
  className = "",
}: CartoonPalestineMapProps) {
  const [hoveredCity, setHoveredCity] = useState<City | null>(null);

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div className="relative w-full max-w-md mx-auto aspect-[3/4]">
        {/* Map SVG background */}
        <svg
          viewBox="0 0 100 130"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Sea (Mediterranean) */}
          <rect x="0" y="0" width="40" height="130" fill="#87CEEB" opacity="0.5" />

          {/* Palestine shape (simplified) */}
          <path
            d="M40,5 Q55,3 60,10 L65,25 L60,40 L55,60 L58,75 Q60,90 55,100 L50,110 Q45,120 35,125 L25,120 L20,100 L25,80 L35,65 L40,50 L38,30 L40,5 Z"
            fill="#90EE90"
            stroke="#2E8B57"
            strokeWidth="2"
          />

          {/* Palestinian flag colors decoration */}
          <rect x="85" y="5" width="12" height="3" fill="#000" />
          <rect x="85" y="8" width="12" height="3" fill="#FFF" stroke="#ccc" strokeWidth="0.2" />
          <rect x="85" y="11" width="12" height="3" fill="#009736" />
          <polygon points="85,5 85,14 90,9.5" fill="#EE2A35" />
        </svg>

        {/* City markers */}
        {CITIES.map((city) => (
          <CityMarker
            key={city.id}
            city={city}
            isHovered={hoveredCity?.id === city.id}
            isHighlighted={highlightedCity === city.id}
            onHover={() => setHoveredCity(city)}
            onLeave={() => setHoveredCity(null)}
            onClick={() => onCityClick?.(city)}
          />
        ))}

        {/* Tooltip */}
        {hoveredCity && (
          <div
            className="
              absolute z-20 bg-white rounded-xl shadow-lg p-3
              text-center min-w-[120px]
              animate-pop-in pointer-events-none
            "
            style={{
              left: `${hoveredCity.x}%`,
              top: `${hoveredCity.y - 20}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <span className="text-2xl block">{hoveredCity.emoji}</span>
            <p className="font-bold text-gray-700">{hoveredCity.nameAr}</p>
            <p className="text-xs text-gray-500">{hoveredCity.fact}</p>
            {/* Arrow */}
            <div
              className="absolute w-3 h-3 bg-white rotate-45"
              style={{
                bottom: "-6px",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>🗺️ انقر على المدينة لتعرف أكثر!</p>
      </div>
    </div>
  );
}

/**
 * Individual city marker
 */
function CityMarker({
  city,
  isHovered,
  isHighlighted,
  onHover,
  onLeave,
  onClick,
}: {
  city: City;
  isHovered: boolean;
  isHighlighted: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const isActive = isHovered || isHighlighted;

  return (
    <button
      className={`
        absolute z-10
        flex items-center justify-center
        rounded-full
        transition-all duration-200
        ${isActive ? "scale-150 z-20" : "hover:scale-125"}
      `}
      style={{
        left: `${city.x}%`,
        top: `${city.y}%`,
        transform: "translate(-50%, -50%)",
        width: isActive ? "40px" : "32px",
        height: isActive ? "40px" : "32px",
        backgroundColor: city.color,
        boxShadow: isActive
          ? `0 0 0 4px ${city.color}50, 0 4px 12px rgba(0,0,0,0.3)`
          : `0 2px 8px rgba(0,0,0,0.2)`,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <span
        className={`text-lg ${isActive ? "animate-bounce-kids" : ""}`}
        style={{ fontSize: isActive ? "1.25rem" : "1rem" }}
      >
        {city.emoji}
      </span>
    </button>
  );
}

/**
 * Mini map for inline use
 */
export function MiniPalestineMap({
  highlightedCity,
  className = "",
}: {
  highlightedCity?: string;
  className?: string;
}) {
  return (
    <div className={`w-24 h-32 ${className}`}>
      <CartoonPalestineMap highlightedCity={highlightedCity} />
    </div>
  );
}
