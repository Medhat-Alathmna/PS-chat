"use client";

interface TokenQuotaBarProps {
  percentUsed: number;
  remaining: number;
  tokenLimit: number;
  className?: string;
}

export default function TokenQuotaBar({
  percentUsed,
  remaining,
  tokenLimit,
  className = "",
}: TokenQuotaBarProps) {
  const color =
    percentUsed >= 90
      ? "bg-red-500"
      : percentUsed >= 70
        ? "bg-yellow-500"
        : "bg-emerald-500";

  const label =
    percentUsed >= 100
      ? "انتهى الرصيد"
      : `${Math.round(percentUsed)}%`;

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <span className="text-gray-500 whitespace-nowrap">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, percentUsed)}%` }}
        />
      </div>
    </div>
  );
}
