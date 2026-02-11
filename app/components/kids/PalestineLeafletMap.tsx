"use client";

import { useEffect, useState } from "react";
import { City, CITIES } from "@/lib/data/cities";

interface PalestineLeafletMapProps {
  onCityClick?: (city: City) => void;
  highlightedCity?: string;
  className?: string;
  /** Enable game mode with fog/reveal mechanics */
  gameMode?: boolean;
  /** City IDs that have been revealed (correct answers) */
  revealedCities?: string[];
  /** City ID to pulse as a region clue */
  highlightRegion?: string;
}

// Simplified Palestine outline (GeoJSON polygon)
const PALESTINE_OUTLINE: [number, number][] = [
  [33.3, 35.6],   // North-east (near Lebanese border)
  [33.1, 35.1],   // North (Acre area)
  [32.9, 35.07],  // Acre
  [32.5, 34.9],   // Haifa coast
  [32.1, 34.8],   // North of Jaffa
  [31.95, 34.75], // Jaffa coast
  [31.7, 34.6],   // South of Jaffa
  [31.5, 34.45],  // Gaza coast north
  [31.3, 34.3],   // Gaza coast south
  [31.2, 34.25],  // Rafah
  [31.2, 34.9],   // Southern Negev border
  [31.4, 35.1],   // Hebron area
  [31.5, 35.15],  // South Hebron
  [31.7, 35.22],  // Jerusalem-Bethlehem
  [31.9, 35.25],  // Ramallah
  [32.1, 35.35],  // Nablus area
  [32.4, 35.5],   // Jordan valley
  [32.7, 35.55],  // Upper Jordan valley
  [33.0, 35.6],   // Northern border east
  [33.3, 35.6],   // Close loop
];

export default function PalestineLeafletMap(props: PalestineLeafletMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`flex items-center justify-center bg-sky-50 rounded-2xl ${props.className || ""}`}>
        <div className="w-6 h-6 border-2 border-[var(--kids-purple)]/30 border-t-[var(--kids-purple)] rounded-full animate-spin" />
      </div>
    );
  }

  return <LeafletMapInner {...props} />;
}

function LeafletMapInner({
  onCityClick,
  highlightedCity,
  className = "",
  gameMode = false,
  revealedCities = [],
  highlightRegion,
}: PalestineLeafletMapProps) {
  const [mapModules, setMapModules] = useState<any>(null);
  const [leafletLib, setLeafletLib] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load Leaflet CSS
    const existingLink = document.querySelector('link[href*="leaflet"]');
    if (!existingLink && document.head) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    }

    Promise.all([import("react-leaflet"), import("leaflet")])
      .then(([reactLeaflet, L]) => {
        setMapModules(reactLeaflet);
        setLeafletLib(L);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load Leaflet:", err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-sky-50 rounded-2xl ${className}`}>
        <div className="w-6 h-6 border-2 border-[var(--kids-purple)]/30 border-t-[var(--kids-purple)] rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!mapModules || !leafletLib) {
    return (
      <div className={`flex items-center justify-center bg-sky-50 rounded-2xl ${className}`}>
        <p className="text-sm text-gray-500">تعذر تحميل الخريطة</p>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } = mapModules;
  const L = leafletLib;

  function createCityIcon(city: City, state: "normal" | "fogged" | "regionHint" | "revealed", isHighlighted: boolean) {
    if (state === "fogged") {
      return L.divIcon({
        className: "city-emoji-marker city-marker-fogged",
        html: `<div style="width:26px;height:26px;border-radius:50%;background:#D1D5DB;opacity:0.6;display:flex;align-items:center;justify-content:center;border:2px solid rgba(156,163,175,0.5);font-size:13px;">❓</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
    }

    if (state === "regionHint") {
      return L.divIcon({
        className: "city-emoji-marker city-marker-region-hint",
        html: `<div style="width:32px;height:32px;border-radius:50%;background:${city.color}80;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px ${city.color}40,0 0 16px ${city.color}60;font-size:16px;">❓</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    }

    const active = isHighlighted;
    const size = active ? 38 : 32;
    const half = size / 2;

    return L.divIcon({
      className: `city-emoji-marker ${state === "revealed" ? "city-marker-revealed" : ""}`,
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${city.color};display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px ${city.color}50,0 3px 8px rgba(0,0,0,0.2);font-size:${active ? 18 : 15}px;cursor:pointer;${active ? "filter:brightness(1.1);" : ""}">${city.emoji}</div><div style="text-align:center;margin-top:1px;font-size:9px;font-weight:700;color:#374151;background:rgba(255,255,255,0.9);padding:0 4px;border-radius:9999px;white-space:nowrap;">${city.nameAr}</div>`,
      iconSize: [size, size + 14],
      iconAnchor: [half, half],
      popupAnchor: [0, -half],
    });
  }

  function FlyToCity({ cityId }: { cityId?: string }) {
    const map = useMap();
    useEffect(() => {
      if (!cityId) return;
      const city = CITIES.find((c) => c.id === cityId);
      if (city) {
        map.flyTo([city.lat, city.lng], 10, { duration: 1 });
      }
    }, [cityId, map]);
    return null;
  }

  const bounds = L.latLngBounds([31.0, 34.1], [33.4, 35.9]);

  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}>
      <MapContainer
        center={[31.9, 35.0]}
        zoom={8}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        minZoom={8}
        maxZoom={8}
        zoomControl={false}
        attributionControl={false}
      >
        {/* Very clean, minimal tile layer — labels only for context */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Palestine country outline */}
        <Polygon
          positions={PALESTINE_OUTLINE}
          pathOptions={{
            color: "#2E8B57",
            weight: 3,
            fillColor: "#90EE90",
            fillOpacity: 0.25,
            dashArray: "6, 4",
          }}
        />

        {/* Animated sea label area — just a subtle visual */}
        <FlyToCity cityId={highlightedCity} />

        {CITIES.map((city) => {
          const isRevealed = revealedCities.includes(city.id);
          const isRegionHint = highlightRegion === city.id;
          const isHighlighted = highlightedCity === city.id;

          let markerState: "normal" | "fogged" | "regionHint" | "revealed" = "normal";
          if (gameMode) {
            if (isRevealed) markerState = "revealed";
            else if (isRegionHint) markerState = "regionHint";
            else markerState = "fogged";
          }

          const icon = createCityIcon(city, markerState, isHighlighted);
          const showPopup = !gameMode || isRevealed || markerState === "normal";

          return (
            <Marker
              key={city.id}
              position={[city.lat, city.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onCityClick?.(city),
              }}
            >
              {showPopup && (
                <Popup className="kids-leaflet-popup">
                  <div className="text-center" dir="rtl">
                    <span className="text-2xl block">{city.emoji}</span>
                    <p className="font-bold text-gray-700 text-sm">{city.nameAr}</p>
                    <p className="text-xs text-gray-500">{city.name}</p>
                    {!gameMode && (
                      <p className="text-xs text-gray-400 mt-1">{city.fact}</p>
                    )}
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
