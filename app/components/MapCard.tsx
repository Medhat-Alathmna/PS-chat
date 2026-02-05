"use client";

import { useEffect, useState } from "react";
import { Coordinates } from "@/lib/types";

type MapCardProps = {
  coordinates: Coordinates;
  title: string;
  description?: string;
  zoom?: number;
};

/**
 * MapCard component - displays an interactive map with Leaflet
 * Compact version - 50% smaller
 */
export default function MapCard({
  coordinates,
  title,
  description,
  zoom = 14,
}: MapCardProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-zinc-800/50 animate-pulse flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <DynamicMap
        coordinates={coordinates}
        title={title}
        description={description}
        zoom={zoom}
        onError={setMapError}
      />
      {/* Google Maps Link Overlay */}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 z-[1000] bg-zinc-900/90 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 text-[10px] px-2 py-1 rounded-md transition-colors backdrop-blur-sm"
      >
        Google Maps ↗
      </a>
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800/80">
          <p className="text-xs text-red-400">{mapError}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Dynamic map component that loads Leaflet only on client-side
 */
function DynamicMap({
  coordinates,
  title,
  description,
  zoom,
  onError,
}: MapCardProps & { onError: (error: string) => void }) {
  const [Map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    // Load Leaflet CSS (only once)
    const existingLink = document.querySelector('link[href*="leaflet"]');
    if (!existingLink && document.head) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    }

    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
    ])
      .then(([reactLeaflet, L]) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        setMap(() => reactLeaflet);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load map:", error);
        onError("فشل تحميل الخريطة");
        setIsLoading(false);
      });
  }, [onError]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-800/50">
        <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!Map) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-800/50">
        <div className="text-red-400 text-xs">فشل التحميل</div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = Map;

  return (
    <MapContainer
      center={[coordinates.lat, coordinates.lng]}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[coordinates.lat, coordinates.lng]}>
        <Popup>
          <div className="text-sm">
            <strong className="block">{title}</strong>
            {description && <p className="text-xs text-gray-600 mt-0.5">{description}</p>}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
