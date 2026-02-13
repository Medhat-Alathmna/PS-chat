"use client";

import { useState, useCallback, useEffect } from "react";
import { CITIES } from "@/lib/data/cities";

const STORAGE_KEY = "falastin_discovered_cities";

function getStorageKey(profileId?: string): string {
  return profileId ? `${STORAGE_KEY}_${profileId}` : STORAGE_KEY;
}

/**
 * Persists discovered city IDs per profile.
 * Cities won't repeat until all are discovered or the user resets.
 */
export function useDiscoveredCities(profileId?: string) {
  const [discoveredIds, setDiscoveredIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(profileId));
      if (stored) {
        setDiscoveredIds(JSON.parse(stored));
      } else {
        setDiscoveredIds([]);
      }
    } catch {
      setDiscoveredIds([]);
    }
    setIsLoaded(true);
  }, [profileId]);

  // Save to localStorage
  const persist = useCallback(
    (ids: string[]) => {
      try {
        localStorage.setItem(getStorageKey(profileId), JSON.stringify(ids));
      } catch {
        // localStorage full or unavailable
      }
    },
    [profileId]
  );

  /** Mark a city as discovered */
  const addCity = useCallback(
    (cityId: string) => {
      setDiscoveredIds((prev) => {
        if (prev.includes(cityId)) return prev;
        const next = [...prev, cityId];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  /** Reset all discovered cities (start fresh) */
  const reset = useCallback(() => {
    setDiscoveredIds([]);
    persist([]);
  }, [persist]);

  const totalCities = CITIES.length;
  const allDiscovered = discoveredIds.length >= totalCities;

  return {
    discoveredIds,
    addCity,
    reset,
    isLoaded,
    totalCities,
    allDiscovered,
    discoveredCount: discoveredIds.length,
  };
}
