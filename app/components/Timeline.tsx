"use client";

import { useState } from "react";
import { TimelineEvent } from "@/lib/types";

type Props = {
  events: TimelineEvent[];
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  political: { bg: "bg-[var(--ps-red)]/20", text: "text-[var(--ps-red)]", border: "border-[var(--ps-red)]" },
  cultural: { bg: "bg-[var(--ps-green)]/20", text: "text-[var(--ps-green)]", border: "border-[var(--ps-green)]" },
  military: { bg: "bg-amber-500/20", text: "text-amber-500", border: "border-amber-500" },
  social: { bg: "bg-blue-500/20", text: "text-blue-500", border: "border-blue-500" },
  other: { bg: "bg-[var(--foreground-secondary)]/20", text: "text-[var(--foreground-secondary)]", border: "border-[var(--foreground-secondary)]" },
};

const categoryLabels: Record<string, string> = {
  political: "سياسي",
  cultural: "ثقافي",
  military: "عسكري",
  social: "اجتماعي",
  other: "أخرى",
};

/**
 * Timeline component - displays historical events in a vertical timeline
 */
export default function Timeline({ events }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!events || events.length === 0) return null;

  // Sort events by year
  const sortedEvents = [...events].sort((a, b) => a.year - b.year);

  return (
    <div className="relative max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
      {/* Timeline line */}
      <div className="absolute right-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--ps-green)] via-[var(--ps-red)] to-[var(--ps-black)]" />

      <div className="space-y-3">
        {sortedEvents.map((event, index) => {
          const isExpanded = expandedId === event.id;
          const category = event.category || "other";
          const colors = categoryColors[category];

          return (
            <div
              key={event.id}
              className="relative pr-8 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Timeline dot */}
              <div
                className={`absolute right-1.5 top-1 w-3 h-3 rounded-full ${colors.border} border-2 bg-[var(--background)] z-10`}
              />

              {/* Event card */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : event.id)}
                className={`w-full text-right rounded-xl border ${
                  isExpanded ? colors.border : "border-[var(--border-color)]"
                } bg-[var(--background-secondary)] overflow-hidden transition-all hover:border-[var(--accent)]/50`}
              >
                {/* Year badge */}
                <div className="flex items-center justify-between p-2 border-b border-[var(--border-color)]">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} font-medium`}>
                    {categoryLabels[category]}
                  </span>
                  <span className="text-sm font-bold text-[var(--accent)]">{event.year}</span>
                </div>

                {/* Content */}
                <div className="p-2.5">
                  <h4 className="text-xs font-semibold text-[var(--foreground)] leading-relaxed">
                    {event.title}
                  </h4>

                  {isExpanded && (
                    <div className="mt-2 animate-fade-in">
                      {event.imageUrl && (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                      )}
                      <p className="text-[11px] text-[var(--foreground-secondary)] leading-relaxed">
                        {event.description}
                      </p>
                      {event.location && (
                        <p className="text-[10px] text-[var(--ps-green)] mt-1.5 flex items-center gap-1">
                          <span>📍</span>
                          {event.location}
                        </p>
                      )}
                    </div>
                  )}

                  {!isExpanded && (
                    <p className="text-[10px] text-[var(--foreground-secondary)] mt-1 line-clamp-1">
                      {event.description}
                    </p>
                  )}
                </div>

                {/* Expand indicator */}
                <div className="px-2.5 pb-1.5 flex justify-center">
                  <span
                    className={`text-[var(--foreground-secondary)] text-[10px] transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
