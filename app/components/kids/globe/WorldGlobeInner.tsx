"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import { Country, COUNTRIES, COUNTRIES_BY_ID } from "@/lib/data/countries";
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

// ── Unique color per country (golden ratio hue distribution) ─────────────
// Each country gets a unique hsl color. The golden ratio conjugate (φ⁻¹) spaces
// hues maximally apart so consecutive entries look as different as possible.
function buildCartoonColorMap(): Map<string, string> {
  const ids = (geoData as { features: object[] }).features
    .map(f => (f as { id?: string }).id)
    .filter((id): id is string => !!id)
    .sort(); // stable alphabetical order → same color per country across renders

  const PHI = 0.618033988749895;
  const result = new Map<string, string>();
  ids.forEach((id, i) => {
    const hue = Math.round(((i * PHI) % 1) * 360);
    const lightness = 55 + (i % 3) * 8; // 55 / 63 / 71 — mild variation
    result.set(id, `hsl(${hue}, 60%, ${lightness}%)`);
  });
  return result;
}

const CARTOON_COLOR_MAP = buildCartoonColorMap();

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
    return CARTOON_COLOR_MAP.get(id) ?? CARTOON_COLORS[0];
  }

  if (appearance === "political") {
    return CONTINENT_COLORS[country.continent] ?? "#CCCCCC";
  }

  return "#FFFFFF20"; // transparent overlay for realistic/night
}

// Constant polygon style callbacks — defined at module level to avoid recreating each render
const polygonSideColor = () => "rgba(0,0,0,0.15)";
const polygonStrokeColor = () => "rgba(255,255,255,0.2)";

// ── Point-in-polygon (ray-casting) for GeoJSON ring ──────────────────────
function pointInRing(lat: number, lng: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// ── Find the country whose GeoJSON polygon contains lat/lng ───────────────
function countryAtPoint(lat: number, lng: number, features: object[]): Country | null {
  for (const f of features) {
    const feat = f as { id?: string; geometry?: { type: string; coordinates: unknown } };
    if (!feat.id || !feat.geometry) continue;
    const country = COUNTRIES_BY_ID.get(feat.id);
    if (!country) continue;
    const { type, coordinates } = feat.geometry as { type: string; coordinates: number[][][] | number[][][][] };
    if (type === "Polygon") {
      if (pointInRing(lat, lng, (coordinates as number[][][])[0])) return country;
    } else if (type === "MultiPolygon") {
      for (const poly of coordinates as number[][][][]) {
        if (pointInRing(lat, lng, poly[0])) return country;
      }
    }
  }
  return null;
}

// ── Fallback: nearest country centroid (for ocean areas) ─────────────────
function nearestCountry(lat: number, lng: number): Country | null {
  let best: Country | null = null;
  let bestDist = Infinity;
  for (const c of COUNTRIES) {
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best;
}

// ── Props ──────────────────────────────────────────────────────────────────
interface WorldGlobeInnerProps {
  onCountryClick: (country: Country) => void;
  selectedCountryId: string | null;
  flyToCountryId: string | null;
  settings: GlobeSettings;
  width: number;
  height: number;
  onCountryCenter?: (country: Country | null) => void;
  paused?: boolean;
}

export default function WorldGlobeInner({
  onCountryClick,
  selectedCountryId,
  flyToCountryId,
  settings,
  width,
  height,
  onCountryCenter,
  paused = false,
}: WorldGlobeInnerProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [isChangingAppearance, setIsChangingAppearance] = useState(false);
  const prevAppearanceRef = useRef(settings.appearance);

  useEffect(() => {
    if (prevAppearanceRef.current === settings.appearance) return;
    prevAppearanceRef.current = settings.appearance;
    setIsChangingAppearance(true);

    const textureUrl = TEXTURE_URLS[settings.appearance];
    if (textureUrl) {
      const img = new Image();
      img.src = textureUrl;
      img.onload = () => setIsChangingAppearance(false);
      img.onerror = () => setIsChangingAppearance(false);
    } else {
      const t = setTimeout(() => setIsChangingAppearance(false), 500);
      return () => clearTimeout(t);
    }
  }, [settings.appearance]);

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

  // Sync auto-rotate settings to OrbitControls — pause when sheet is open
  useEffect(() => {
    if (!globeRef.current) return;
    const ctrl = globeRef.current.controls() as { autoRotate: boolean; autoRotateSpeed: number } | undefined;
    if (!ctrl) return;
    ctrl.autoRotate = settings.autoRotate && !paused;
    ctrl.autoRotateSpeed = settings.rotationSpeed;
  }, [settings.autoRotate, settings.rotationSpeed, paused]);

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

  // RAF loop: report the country currently facing the camera (center of screen)
  useEffect(() => {
    if (!onCountryCenter) return;
    let rafId: number;
    let lastId: string | null = null;
    const tick = () => {
      const g = globeRef.current;
      if (g) {
        const { lat, lng } = g.pointOfView();
        const c = countryAtPoint(lat, lng, polygonsData);
        const id = c?.id ?? null;
        if (id !== lastId) {
          lastId = id;
          onCountryCenter(c ?? null);
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onCountryCenter, polygonsData]);

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
    <div style={{ position: "relative", width, height }}>
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
        onPolygonClick={handlePolygonClick}
        onGlobeReady={handleGlobeReady}
        polygonsTransitionDuration={300}
        atmosphereColor={atmosphereColor}
        atmosphereAltitude={0.15}
        enablePointerInteraction
        animateIn={false}
      />
      {isChangingAppearance && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,8,20,0.75)",
            backdropFilter: "blur(4px)",
            gap: 12,
          }}
        >
          <div className="animate-spin-slow" style={{ fontSize: 56 }}>🌍</div>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: 0 }}>
            جاري تحميل الأرض...
          </p>
        </div>
      )}
    </div>
  );
}
