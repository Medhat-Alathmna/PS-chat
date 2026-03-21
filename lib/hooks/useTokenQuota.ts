"use client";

import { useCallback, useEffect, useState } from "react";

interface QuotaState {
  tokensUsed: number;
  tokenLimit: number;
  remaining: number;
}

// Module-level deduplication: all concurrent callers share one in-flight request
let inflightPromise: Promise<QuotaState | null> | null = null;

async function fetchQuota(): Promise<QuotaState | null> {
  if (inflightPromise) return inflightPromise;
  inflightPromise = fetch("/api/backend/token-usage")
    .then((res) => (res.ok ? (res.json() as Promise<QuotaState>) : null))
    .catch(() => null)
    .finally(() => { inflightPromise = null; });
  return inflightPromise;
}

export function useTokenQuota() {
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchQuota();
      if (data) setQuota(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Update quota state from API response (avoids extra fetch) */
  const updateFromResponse = useCallback((quotaData: QuotaState) => {
    setQuota(quotaData);
  }, []);

  const percentUsed = quota
    ? Math.min(100, (quota.tokensUsed / quota.tokenLimit) * 100)
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
