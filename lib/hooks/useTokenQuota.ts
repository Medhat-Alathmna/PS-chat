"use client";

import { useCallback, useEffect, useState } from "react";

interface QuotaState {
  tokensUsed: number;
  tokenLimit: number;
  remaining: number;
}

export function useTokenQuota() {
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/backend/token-usage");
      if (res.ok) {
        setQuota(await res.json());
      }
    } catch {
      // Backend unreachable — leave quota as-is
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
