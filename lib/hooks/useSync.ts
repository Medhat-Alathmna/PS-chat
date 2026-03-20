"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthContext } from "@/lib/context/auth-context";
import { collectSyncPayload } from "@/lib/sync/collect-sync-data";
import {
  executeSyncImport,
  isSyncing as engineIsSyncing,
  cooldownElapsed,
} from "@/lib/sync/sync-engine";

const POST_AUTH_DELAY_MS = 2_000;
const VISIBILITY_MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useSync() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSync = useCallback(async () => {
    if (!isAuthenticated || engineIsSyncing() || !cooldownElapsed()) return;

    const payload = collectSyncPayload();
    if (payload.profiles.length === 0) return;

    setIsSyncing(true);
    setLastSyncError(null);

    try {
      const result = await executeSyncImport(payload);
      if (result.success) {
        setLastSyncAt(Date.now());
      } else {
        setLastSyncError(result.error ?? "Sync failed");
      }
    } catch {
      setLastSyncError("Unexpected sync error");
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated]);

  // Trigger 1: Post-authentication sync (2s delay to let hooks settle)
  const prevAuthRef = useRef(false);
  useEffect(() => {
    if (isLoading) return;

    const wasAuthenticated = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;

    if (isAuthenticated && !wasAuthenticated) {
      timerRef.current = setTimeout(triggerSync, POST_AUTH_DELAY_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated, isLoading, triggerSync]);

  // Trigger 2: Visibility change (>5 min since last sync)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const elapsed = Date.now() - (lastSyncAt ?? 0);
      if (elapsed >= VISIBILITY_MIN_INTERVAL_MS) {
        triggerSync();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [isAuthenticated, lastSyncAt, triggerSync]);

  return { isSyncing, lastSyncAt, lastSyncError, triggerSync };
}

/**
 * Headless component that activates sync inside AuthProvider's tree.
 * Renders nothing — just calls useSync().
 */
export function SyncTrigger() {
  useSync();
  return null;
}
