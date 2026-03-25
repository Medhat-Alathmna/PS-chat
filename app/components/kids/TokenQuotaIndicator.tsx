"use client";

import { useEffect, useRef, useState } from "react";
import { useTokenQuota } from "@/lib/hooks/useTokenQuota";
import { useProfiles } from "@/lib/hooks/useProfiles";
import TokenQuotaBar from "./TokenQuotaBar";

export default function TokenQuotaIndicator() {
  const { activeProfile } = useProfiles();
  const { quota, isLoading, percentUsed } = useTokenQuota(activeProfile?.id);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popup on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // 5 tiers: 0-25 green, 25-50 yellow, 50-75 purple, 75-100 red, 100+ orange (free tier active)
  const tierColor =
    percentUsed >= 100
      ? { text: "text-orange-600", bg: "bg-orange-50" }
      : percentUsed >= 75
        ? { text: "text-red-500", bg: "bg-red-50" }
        : percentUsed >= 50
          ? { text: "text-[var(--kids-purple)]", bg: "bg-purple-50" }
          : percentUsed >= 25
            ? { text: "text-yellow-500", bg: "bg-yellow-50" }
            : { text: "text-emerald-600", bg: "bg-emerald-50" };

  // Don't render while loading with no data
  if (isLoading && !quota) return null;

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isLoading}
        className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 backdrop-blur-sm rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 ${quota ? tierColor.bg : "bg-white/80"}`}
        aria-label="استهلاك الرسائل"
        title="استهلاك الرسائل"
      >
        <span className={`text-xs sm:text-sm font-black leading-none ${quota ? tierColor.text : "text-gray-400"}`}>
          {quota ? `${Math.round(percentUsed)}%` : "…"}
        </span>
      </button>

      {/* Mobile backdrop */}
      {open && quota && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Popup — fixed full-width on mobile, absolute dropdown on sm+ */}
      {open && quota && (
        <div
          className="fixed top-20 left-3 right-3 z-50 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:min-w-[220px] sm:w-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-4"
          dir="rtl"
        >
          {/* Title */}
          <p className="font-bold text-gray-800 text-sm mb-2">استهلاكك للحزمة</p>

          {/* Big percentage */}
          <p className={`text-4xl font-black mb-3 ${tierColor.text}`}>
            {Math.round(percentUsed)}%
          </p>

          {/* Progress bar */}
          <TokenQuotaBar
            percentUsed={percentUsed}
            remaining={quota.remaining}
            tokenLimit={quota.tokenLimit}
          />

          <hr className="my-3 border-gray-100" />

          {/* Free tier notice */}
          {percentUsed >= 100 && (
            <p className="text-xs text-orange-600 leading-relaxed font-medium mb-2">
              🔄 يتم استخدام نموذج ذكاء اصطناعي مجاني بديل
            </p>
          )}

          {/* User-level note */}
          <p className="text-xs text-gray-500 leading-relaxed">
            ⚠️ هذا الرصيد لحساب المستخدم وليس لبروفايل واحد فقط
          </p>
        </div>
      )}
    </div>
  );
}
