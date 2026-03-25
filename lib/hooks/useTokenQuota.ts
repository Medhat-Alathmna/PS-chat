"use client";

import { useCallback, useEffect, useState } from "react";

interface QuotaState {
  tokensUsed: number;
  tokenLimit: number;
  remaining: number;
}

// Module-level deduplication: per-profile in-flight requests
const inflightPromises = new Map<string, Promise<QuotaState | null>>();

async function fetchQuota(profileId?: string): Promise<QuotaState | null> {
  const key = profileId ?? "__default__";
  if (inflightPromises.has(key)) return inflightPromises.get(key)!;
  
  const promise = fetch("/api/backend/token-usage", {
    headers: profileId ? { "X-Profile-Id": profileId } : {},
  })
    .then((res) => (res.ok ? (res.json() as Promise<QuotaState>) : null))
    .catch(() => null)
    .finally(() => {
      setTimeout(() => { inflightPromises.delete(key); }, 5000);
    });

  inflightPromises.set(key, promise);
  return promise;
}

export function useTokenQuota(profileId?: string) {
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!profileId) return;
    try {
      const data = await fetchQuota(profileId);
      if (data) setQuota(data);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }
    refresh();
  }, [refresh, profileId]);

  /** Update quota state from API response (avoids extra fetch) */
  const updateFromResponse = useCallback((quotaData: QuotaState) => {
    setQuota(quotaData);
  }, []);

  const percentUsed = quota
    ? (quota.tokensUsed / quota.tokenLimit) * 100
    : 0;

  return {
    quota,
    isLoading,
    isBlocked: quota ? quota.remaining <= 0 : false,
    percentUsed,
    refresh,
    updateFromResponse,
  };
}
