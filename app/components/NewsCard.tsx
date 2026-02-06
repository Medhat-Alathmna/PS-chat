"use client";

import { NewsItem } from "@/lib/types";

type Props = {
  news: NewsItem[];
};

/**
 * NewsCard component - displays news items from Palestinian sources
 */
export default function NewsCard({ news }: Props) {
  if (!news || news.length === 0) return null;

  return (
    <div className="space-y-2">
      {news.slice(0, 3).map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-[var(--border-color)] bg-[var(--background-secondary)] overflow-hidden hover:border-[var(--ps-green)]/50 transition-all group"
        >
          {item.imageUrl && (
            <div className="relative h-20 overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {item.category && (
                <span className="absolute bottom-1.5 right-1.5 bg-[var(--ps-green)] text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                  {item.category}
                </span>
              )}
            </div>
          )}
          <div className="p-2.5">
            <p className="text-xs font-medium text-[var(--foreground)] line-clamp-2 leading-relaxed group-hover:text-[var(--ps-green)] transition-colors">
              {item.title}
            </p>
            {item.description && (
              <p className="text-[10px] text-[var(--foreground-secondary)] line-clamp-2 mt-1">
                {item.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-2 text-[9px] text-[var(--foreground-secondary)]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ps-red)]" />
                {item.source}
              </span>
              <span>{formatDate(item.publishedAt)}</span>
            </div>
          </div>
        </a>
      ))}

      {news.length > 3 && (
        <p className="text-center text-[10px] text-[var(--foreground-secondary)] py-1">
          +{news.length - 3} أخبار أخرى
        </p>
      )}
    </div>
  );
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "الآن";
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;

    return new Intl.DateTimeFormat("ar", {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}
