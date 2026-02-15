"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { City, CITIES, CityRegion } from "@/lib/data/cities";
import { createCustomMarkerHTML, getMarkerSize, getMarkerAnchor, getPopupAnchor, MarkerState } from "@/app/components/map/CustomMarker";
import CityPopover from "@/app/components/map/CityPopover";
import MapControls from "@/app/components/map/MapControls";
import "@/app/components/map/map-styles.css";

interface PalestineLeafletMapProps {
  onCityClick?: (city: City) => void;
  /** Callback for "Ask Medhat about city" button in popup */
  onAskAboutCity?: (city: City) => void;
  highlightedCity?: string;
  className?: string;
  /** Enable game mode with fog/reveal mechanics */
  gameMode?: boolean;
  /** City IDs that have been revealed (correct answers) */
  revealedCities?: string[];
  /** City ID to pulse as a region clue */
  highlightRegion?: string;
  /** City ID to auto-fly to (e.g. just-revealed city) */
  flyToCity?: string;
  /** Show map controls (search, filter, reset) */
  showControls?: boolean;
  /** Enable full map interaction (zoom, pan, drag) */
  enableFullInteraction?: boolean;
  /** Custom height (default: "100%") */
  height?: string;
}

// Detailed Palestine historical borders (1948 British Mandate borders)
// Based on actual geographic landmarks and historical maps
// Reference: خارطة فلسطين التاريخية
const PALESTINE_OUTLINE: [number, number][] = [
  // === NORTHERN BORDER (Lebanon/Syria) ===
  // Starting from Ras al-Naqoura on Mediterranean coast
  [33.089, 35.104], // رأس الناقورة - Ras al-Naqoura (coastal border)

  // Border extends north then curves east
  [33.095, 35.140],
  [33.105, 35.180],
  [33.120, 35.220],
  [33.138, 35.260],
  [33.158, 35.300],
  [33.180, 35.340],
  [33.205, 35.380],
  [33.232, 35.420],
  [33.260, 35.460],
  [33.285, 35.500],
  [33.308, 35.540],
  [33.325, 35.580],
  [33.338, 35.620], // Maximum northern extent

  // Curves southeast toward Banias
  [33.345, 35.660],
  [33.348, 35.700],
  [33.345, 35.740],
  [33.338, 35.775], // بانياس - Banias area (NE corner)

  // === EASTERN BORDER (Syria/Jordan) ===
  // Border descends south along Golan Heights
  [33.320, 35.770],
  [33.290, 35.760],
  [33.250, 35.745],
  [33.200, 35.730],
  [33.150, 35.715],
  [33.100, 35.700],
  [33.050, 35.685],
  [33.000, 35.675],
  [32.950, 35.670],

  // Eastern shore of Sea of Galilee - الشاطئ الشرقي لبحيرة طبريا
  [32.900, 35.665],
  [32.850, 35.660],
  [32.800, 35.655],
  [32.750, 35.645],
  [32.700, 35.630], // Yarmouk River - نهر اليرموك

  // Jordan River - نهر الأردن (border along the river ~35.57)
  [32.650, 35.600],
  [32.600, 35.590],
  [32.550, 35.580],
  [32.500, 35.575],
  [32.450, 35.570],
  [32.400, 35.568],
  [32.350, 35.565],
  [32.300, 35.560], // Beit She'an / بيسان
  [32.250, 35.558],
  [32.200, 35.555],
  [32.150, 35.552],
  [32.100, 35.550],
  [32.050, 35.548],
  [32.000, 35.545],
  [31.950, 35.542],
  [31.900, 35.540],
  [31.850, 35.535],
  [31.800, 35.530],
  [31.750, 35.525],
  [31.700, 35.520],
  [31.650, 35.515],
  [31.600, 35.510],
  [31.550, 35.505],
  [31.500, 35.500], // Near Jericho - قرب أريحا

  // Dead Sea - البحر الميت (border ~35.50 middle of sea)
  [31.450, 35.500],
  [31.400, 35.500],
  [31.350, 35.495],
  [31.300, 35.490],
  [31.250, 35.485],
  [31.200, 35.480],
  [31.150, 35.475],
  [31.100, 35.470], // Dead Sea south - جنوب البحر الميت

  // Wadi Araba - وادي عربة
  [31.050, 35.460],
  [31.000, 35.450],
  [30.950, 35.430],
  [30.900, 35.400],
  [30.850, 35.370],
  [30.800, 35.340],
  [30.750, 35.310],
  [30.700, 35.280],
  [30.650, 35.250],
  [30.600, 35.220],
  [30.550, 35.190],
  [30.500, 35.160],
  [30.450, 35.130],
  [30.400, 35.100],
  [30.350, 35.080],
  [30.300, 35.060],
  [30.250, 35.045],
  [30.200, 35.030],
  [30.150, 35.015],
  [30.100, 35.005],
  [30.050, 34.995],
  [30.000, 34.985],
  [29.950, 34.978],
  [29.900, 34.972],
  [29.850, 34.968],
  [29.800, 34.965],
  [29.750, 34.962],
  [29.700, 34.960],
  [29.650, 34.958],
  [29.600, 34.956],
  [29.550, 34.955], // إيلات / أم الرشراش - Eilat / Umm Rashrash

  // === SOUTHERN BORDER (Egypt - Sinai) ===
  // Gulf of Aqaba to Rafah - خليج العقبة إلى رفح
  [29.550, 34.950],
  [29.600, 34.910],
  [29.700, 34.870],
  [29.800, 34.830],
  [29.900, 34.790],
  [30.000, 34.750],
  [30.100, 34.710],
  [30.200, 34.670],
  [30.300, 34.630],
  [30.400, 34.590],
  [30.500, 34.550],
  [30.600, 34.510],
  [30.700, 34.470],
  [30.800, 34.430],
  [30.900, 34.390],
  [31.000, 34.350],
  [31.100, 34.310],
  [31.220, 34.270], // رفح - Rafah

  // === WESTERN BORDER (Mediterranean Coast) ===
  // Gaza coast - ساحل غزة
  [31.230, 34.260],
  [31.280, 34.270],
  [31.330, 34.300],
  [31.380, 34.330], // خان يونس - Khan Yunis
  [31.430, 34.360],
  [31.480, 34.390], // غزة - Gaza City
  [31.530, 34.430],
  [31.580, 34.470],

  // Central coast - الساحل الأوسط
  [31.630, 34.510],
  [31.680, 34.540], // عسقلان - Ashkelon
  [31.730, 34.570],
  [31.780, 34.600], // إسدود - Ashdod
  [31.830, 34.630],
  [31.880, 34.660],
  [31.930, 34.690], // يافا - Jaffa
  [31.980, 34.720],
  [32.030, 34.745],
  [32.080, 34.770], // تل أبيب - Tel Aviv
  [32.130, 34.790],
  [32.180, 34.810],
  [32.230, 34.830],
  [32.280, 34.850],
  [32.330, 34.870],
  [32.380, 34.885],
  [32.430, 34.900],
  [32.480, 34.915],
  [32.530, 34.930], // قيسارية - Caesarea
  [32.580, 34.940],
  [32.630, 34.950],
  [32.680, 34.960],
  [32.730, 34.970],
  [32.780, 34.980],
  [32.820, 34.990], // حيفا - Haifa
  [32.860, 35.000],
  [32.900, 35.015],
  [32.940, 35.035], // عكا - Acre
  [32.970, 35.050],
  [33.000, 35.065],
  [33.030, 35.078],
  [33.055, 35.090],
  [33.089, 35.104], // العودة لرأس الناقورة - Back to Ras al-Naqoura
];

function PalestineLeafletMapBase(props: PalestineLeafletMapProps) {
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
  onAskAboutCity,
  highlightedCity,
  className = "",
  gameMode = false,
  revealedCities = [],
  highlightRegion,
  flyToCity: flyToCityProp,
  showControls = false,
  enableFullInteraction = false,
  height = "100%",
}: PalestineLeafletMapProps) {
  const [mapModules, setMapModules] = useState<any>(null);
  const [leafletLib, setLeafletLib] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Map controls state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<CityRegion[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  // Filter cities based on search and region - MUST be before early returns
  const filteredCities = useMemo(() => {
    let filtered = CITIES;

    // Filter by selected regions
    if (selectedRegions.length > 0) {
      filtered = filtered.filter((city) => selectedRegions.includes(city.region));
    }

    return filtered;
  }, [selectedRegions]);

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

  function createCityIcon(city: City, state: MarkerState, isHighlighted: boolean) {
    const markerState = isHighlighted ? "highlighted" : state;
    return L.divIcon({
      className: "custom-marker",
      html: createCustomMarkerHTML(city, markerState),
      iconSize: getMarkerSize(markerState),
      iconAnchor: getMarkerAnchor(markerState),
      popupAnchor: getPopupAnchor(markerState),
    });
  }

  function FlyToCity({ cityId, zoomLevel }: { cityId?: string; zoomLevel: number }) {
    const map = useMap();
    useEffect(() => {
      // Skip if cityId is empty, null, or undefined
      if (!cityId || cityId.trim() === "") return;

      const city = CITIES.find((c) => c.id === cityId);

      // Only fly to city if it exists and has valid coordinates
      if (city && typeof city.lat === "number" && typeof city.lng === "number" && !isNaN(city.lat) && !isNaN(city.lng)) {
        const lat = Number(city.lat);
        const lng = Number(city.lng);
        if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) return;

        let retries = 0;
        const tryFly = () => {
          try {
            const container = map.getContainer();
            if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
              // Container not laid out yet (e.g. expand animation) — retry up to 10 times
              if (retries < 10) {
                retries++;
                requestAnimationFrame(tryFly);
              }
              return;
            }
            map.setView([lat, lng], zoomLevel, { animate: false });
          } catch (error) {
            console.error("FlyToCity error:", error, { cityId, lat, lng });
          }
        };
        tryFly();
      }
    }, [cityId, map, zoomLevel]);
    return null;
  }

  const handleCitySelect = (cityId: string) => {
    setSelectedCityId(cityId);
    const city = CITIES.find((c) => c.id === cityId);
    if (city) {
      onCityClick?.(city);
    }
  };

  const handleRegionFilter = (regions: CityRegion[]) => {
    setSelectedRegions(regions);
  };

  const handleReset = () => {
    setSelectedRegions([]);
    setSearchQuery("");
    setSelectedCityId(null);
  };

  // Define bounds for Palestine with some padding
  const bounds = L.latLngBounds(
    [29.40, 34.10],  // South-West corner (Umm Rashrash area with padding)
    [33.40, 35.85]   // North-East corner (extended to include northern border)
  );

  return (
    <div className={`rounded-2xl overflow-hidden relative ${className}`} style={{ height }}>
      {/* Map Controls */}
      {showControls && (
        <MapControls
          onCitySelect={handleCitySelect}
          onRegionFilter={handleRegionFilter}
          onReset={handleReset}
          filteredCount={filteredCities.length}
          totalCount={CITIES.length}
        />
      )}

      <MapContainer
        center={[31.4, 35.0]}
        zoom={enableFullInteraction ? 7 : 7}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={enableFullInteraction}
        dragging={enableFullInteraction}
        doubleClickZoom={enableFullInteraction}
        maxBounds={enableFullInteraction ? bounds : undefined}
        maxBoundsViscosity={0.7}
        minZoom={6}
        maxZoom={enableFullInteraction ? 12 : 10}
        zoomControl={enableFullInteraction}
        attributionControl={false}
      >
        {/* Very clean, minimal tile layer — labels only for context */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Palestine border shadow (3D effect) */}
        <Polygon
          positions={PALESTINE_OUTLINE}
          pathOptions={{
            color: "#000000",
            weight: 5,
            opacity: 0.15,
            fill: false,
          }}
        />

        {/* Palestine country outline - solid green border */}
        <Polygon
          positions={PALESTINE_OUTLINE}
          pathOptions={{
            color: "#009639", // Palestinian flag green
            weight: 3,
            fillColor: "#009639",
            fillOpacity: 0.08,
            lineCap: "round",
            lineJoin: "round",
          }}
        />

        {/* Fly to city when highlighted, selected, or auto-fly */}
        <FlyToCity
          cityId={flyToCityProp || highlightedCity || selectedCityId || undefined}
          zoomLevel={enableFullInteraction ? 11 : 10}
        />

        {/* Render filtered cities */}
        {filteredCities
          .filter((city) => typeof city.lat === "number" && typeof city.lng === "number" && !isNaN(city.lat) && !isNaN(city.lng))
          .map((city) => {
            const isRevealed = revealedCities.includes(city.id);
            const isRegionHint = highlightRegion === city.id;
            const isHighlighted = highlightedCity === city.id || selectedCityId === city.id;

            let markerState: MarkerState = "normal";
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
                  click: () => {
                    // Verify city has valid coordinates before triggering fly-to
                    if (city.id && typeof city.lat === "number" && typeof city.lng === "number" &&
                        !isNaN(city.lat) && !isNaN(city.lng) && isFinite(city.lat) && isFinite(city.lng)) {
                      onCityClick?.(city);
                      setSelectedCityId(city.id);
                    }
                  },
                }}
              >
                {showPopup && (
                  <Popup className="city-popup-custom">
                    <CityPopover city={city} onAskAboutCity={onAskAboutCity} />
                  </Popup>
                )}
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}

function arraysEqual(a: string[] | undefined, b: string[] | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function arePropsEqual(prev: PalestineLeafletMapProps, next: PalestineLeafletMapProps): boolean {
  return (
    prev.highlightedCity === next.highlightedCity &&
    prev.className === next.className &&
    prev.gameMode === next.gameMode &&
    prev.highlightRegion === next.highlightRegion &&
    prev.flyToCity === next.flyToCity &&
    prev.showControls === next.showControls &&
    prev.enableFullInteraction === next.enableFullInteraction &&
    prev.height === next.height &&
    prev.onCityClick === next.onCityClick &&
    prev.onAskAboutCity === next.onAskAboutCity &&
    arraysEqual(prev.revealedCities, next.revealedCities)
  );
}

export default memo(PalestineLeafletMapBase, arePropsEqual);
