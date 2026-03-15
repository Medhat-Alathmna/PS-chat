"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import { Country, COUNTRIES_BY_ID, countryCodeToFlag } from "@/lib/data/countries";
import { GlobeSettings } from "@/lib/types/globe-settings";
import geoData from "@/lib/data/countries geo json/countries.geo.json";


// ── Palestine 1948 polygon (British Mandate borders) ──────────────────────
const PALESTINE_FEATURE = {
  type: "Feature",
  id: "PSE",
  properties: { name: "فلسطين" },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [34.95, 29.50], [34.24, 30.75], [34.23, 31.35], [34.26, 31.70],
      [34.48, 31.86], [34.75, 31.87], [34.90, 32.07], [35.10, 32.49],
      [35.16, 32.87], [35.10, 33.10], [35.18, 33.33], [35.48, 33.09],
      [35.88, 33.38], [36.09, 33.06], [35.93, 32.72], [35.78, 32.52],
      [35.57, 32.54], [35.55, 32.27], [35.73, 32.19], [35.75, 31.87],
      [35.79, 31.75], [35.53, 31.52], [35.41, 31.25], [35.18, 30.71],
      [34.95, 29.50],
    ]],
  },
};

// ── Globe texture URLs ─────────────────────────────────────────────────────
const TEXTURE_URLS: Record<string, string | null> = {
  realistic: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
  night:     "//unpkg.com/three-globe/example/img/earth-night.jpg",
  political: null,
  cartoon:   null,
};

// ── Country colours by appearance ─────────────────────────────────────────
const CONTINENT_COLORS: Record<string, string> = {
  africa:   "#48CAE4",
  asia:     "#95D5B2",
  europe:   "#ADB5BD",
  americas: "#FFAFCC",
  oceania:  "#CDB4DB",
};

const CARTOON_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
];

function getCountryColor(
  feature: { id?: string },
  appearance: GlobeSettings["appearance"],
  selectedId: string | null
): string {
  const id = feature.id as string;

  if (id === "PSE") return "#2D7D46"; // Palestine always green
  if (id === selectedId) return "#A55EEA";

  const country = COUNTRIES_BY_ID.get(id);
  if (!country) return "#CCCCCC";

  if (appearance === "cartoon") {
    const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return CARTOON_COLORS[hash % CARTOON_COLORS.length];
  }

  if (appearance === "political") {
    return CONTINENT_COLORS[country.continent] ?? "#CCCCCC";
  }

  return "#FFFFFF20"; // transparent overlay for realistic/night
}

// Constant polygon style callbacks — defined at module level to avoid recreating each render
const polygonSideColor = () => "rgba(0,0,0,0.15)";
const polygonStrokeColor = () => "rgba(255,255,255,0.2)";

// ── Props ──────────────────────────────────────────────────────────────────
interface WorldGlobeInnerProps {
  onCountryClick: (country: Country) => void;
  selectedCountryId: string | null;
  flyToCountryId: string | null;
  settings: GlobeSettings;
  width: number;
  height: number;
}

export default function WorldGlobeInner({
  onCountryClick,
  selectedCountryId,
  flyToCountryId,
  settings,
  width,
  height,
}: WorldGlobeInnerProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);

  // Build polygon data: filter out unrecognized territories (would render gray) + inject Palestine
  const polygonsData = useMemo(() => {
    // IDs not in COUNTRIES_BY_ID would render as #CCCCCC gray — filter them out entirely
    const SKIP_IDS = new Set(["ATA", "ISR", "ATF", "BMU", "-99", "FLK", "GRL", "GUF", "CS-KM", "NCL", "PRI", "ESH", "TWN"]);
    const features = (geoData as { features: object[] }).features
      .filter((f: object) => {
        const id = (f as { id?: string }).id;
        return !SKIP_IDS.has(id ?? "");
      });
    return [...features, PALESTINE_FEATURE];
  }, []);

  // Globe texture URL — realistic/night load a real image; political/cartoon use empty (handled via onGlobeReady)
  const globeImageUrl = TEXTURE_URLS[settings.appearance] ?? "";

  // Background color based on space setting
  const bgColor = ({
    "stars-dense": "#000814",
    "stars-light": "#0D1B2A",
    black:         "#000000",
  } as Record<string, string>)[settings.spaceBackground] ?? "#000814";

  // Atmosphere color
  const atmosphereColor = settings.appearance === "night" ? "#1a6699" : "#63a8e3";

  // Fly to country when flyToCountryId changes
  useEffect(() => {
    if (!flyToCountryId || !globeRef.current) return;
    const country = COUNTRIES_BY_ID.get(flyToCountryId);
    if (!country) return;
    globeRef.current.pointOfView(
      { lat: country.lat, lng: country.lng, altitude: 0.8 },
      1200
    );
  }, [flyToCountryId]);

  // Sync auto-rotate settings to OrbitControls
  useEffect(() => {
    if (!globeRef.current) return;
    const ctrl = globeRef.current.controls() as { autoRotate: boolean; autoRotateSpeed: number } | undefined;
    if (!ctrl) return;
    ctrl.autoRotate = settings.autoRotate;
    ctrl.autoRotateSpeed = settings.rotationSpeed;
  }, [settings.autoRotate, settings.rotationSpeed]);

  // Start at Palestine and apply initial auto-rotate settings after globe initializes
  useEffect(() => {
    const t = setTimeout(() => {
      const g = globeRef.current;
      if (!g) return;
      g.pointOfView({ lat: 31.9, lng: 35.2, altitude: 2.5 }, 800);
      // Apply auto-rotate here too — the separate effect misses first mount since controls aren't ready yet
      const ctrl = g.controls() as { autoRotate: boolean; autoRotateSpeed: number; minDistance: number } | undefined;
      if (ctrl) {
        ctrl.autoRotate = settings.autoRotate;
        ctrl.autoRotateSpeed = settings.rotationSpeed;
        ctrl.minDistance = 150; // prevent zooming in too close (globe radius=100, altitude≈0.5)
      }
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount — settings are already loaded (parent returns null until isLoaded)

  const handlePolygonClick = useCallback(
    (polygon: object) => {
      const feature = polygon as { id?: string };
      const id = feature.id;
      if (!id) return;
      const country = COUNTRIES_BY_ID.get(id);
      if (country) onCountryClick(country);
    },
    [onCountryClick]
  );

  const getPolygonLabel = useCallback((d: object) => {
    const f = d as { id?: string };
    const country = COUNTRIES_BY_ID.get(f.id ?? "");
    if (!country) return "";
    // Return HTMLElement instead of HTML string to avoid innerHTML XSS sink
    const div = document.createElement("div");
    div.style.cssText = "background:rgba(0,0,0,0.75);color:white;padding:6px 10px;border-radius:8px;font-family:Cairo,'Noto Sans Arabic',sans-serif;font-size:14px;direction:rtl";
    div.textContent = `${countryCodeToFlag(country.code)} ${country.nameAr}`;
    return div;
  }, []);

  const getPolygonAltitude = useCallback(
    (d: object) => {
      const f = d as { id?: string };
      if (f.id === "PSE") return 0.025;
      if (f.id === selectedCountryId) return 0.015;
      return 0.005;
    },
    [selectedCountryId]
  );

  const getPolygonCapColor = useCallback(
    (d: object) => getCountryColor(d as { id?: string }, settings.appearance, selectedCountryId),
    [settings.appearance, selectedCountryId]
  );

  // Apply ocean color to the globe sphere for non-textured modes (cartoon/political).
  // three-globe leaves the sphere with its default white MeshPhongMaterial when globeImageUrl="",
  // causing ocean/sea areas (not covered by country polygons) to render as gray under WebGL lighting.
  // We use scene().traverse() since react-globe.gl only exposes "scene" in its ref API — not "globeMaterial".
  // The globe sphere has widthSegments=90 (= 360/globeCurvatureResolution default 4), distinguishing it
  // from the tile-engine's inner sphere (widthSegments=180) and all other meshes.
  const applyOceanColor = useCallback(() => {
    const g = globeRef.current;
    if (!g) return;
    const isFlat = settings.appearance === "cartoon" || settings.appearance === "political";
    try {
      g.scene().traverse((obj: Record<string, any>) => {
        if (
          obj.isMesh &&
          obj.geometry?.type === "SphereGeometry" &&
          obj.material?.type === "MeshPhongMaterial" &&
          obj.geometry?.parameters?.widthSegments === 90
        ) {
          obj.material.map = null;
          obj.material.color?.set(isFlat ? "#1a3a6c" : "#ffffff");
          obj.material.needsUpdate = true;
        }
      });
    } catch {
      // Globe not fully initialized yet — onGlobeReady will retry
    }
  }, [settings.appearance]);

  // Run on mount (when globe is ready) and whenever appearance changes
  useEffect(() => { applyOceanColor(); }, [applyOceanColor]);
  const handleGlobeReady = applyOceanColor;



  return (
    <Globe
      ref={globeRef}
      width={width}
      height={height}
      backgroundColor={bgColor}
      globeImageUrl={globeImageUrl}
      bumpImageUrl={settings.appearance === "realistic" ? "//unpkg.com/three-globe/example/img/earth-topology.png" : ""}
      polygonsData={polygonsData}
      polygonCapColor={getPolygonCapColor}
      polygonSideColor={polygonSideColor}
      polygonStrokeColor={polygonStrokeColor}
      polygonAltitude={getPolygonAltitude}
      polygonLabel={getPolygonLabel}
      onPolygonClick={handlePolygonClick}
      onGlobeReady={handleGlobeReady}
      polygonsTransitionDuration={300}
      atmosphereColor={atmosphereColor}
      atmosphereAltitude={0.15}
      enablePointerInteraction
      animateIn={false}
    />
  );
}
