"use client";

import { useState, useMemo } from "react";
import type { Country, Continent } from "@/lib/data/countries";
import { COUNTRIES, countryCodeToFlag } from "@/lib/data/countries";
import { COUNTRY_DETAILS } from "@/lib/data/country-details";

// ── Types ───────────────────────────────────────────────────────────────────

interface CountriesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCountrySelect: (country: Country) => void;
}

type SortBy = "alpha" | "area" | "population";

const RELIGIONS = ["الإسلام", "المسيحية", "البوذية", "الهندوسية", "اليهودية", "مختلطة", "أخرى"] as const;
type ReligionFilter = (typeof RELIGIONS)[number];

// ── Static Data ─────────────────────────────────────────────────────────────

const CONTINENTS: { value: Continent; label: string; emoji: string }[] = [
  { value: "africa",   label: "أفريقيا",    emoji: "🌍" },
  { value: "asia",     label: "آسيا",        emoji: "🌏" },
  { value: "europe",   label: "أوروبا",      emoji: "🗺️" },
  { value: "americas", label: "الأمريكتان",  emoji: "🌎" },
  { value: "oceania",  label: "أوقيانوسيا",  emoji: "🌊" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "alpha",      label: "أبجدي" },
  { value: "population", label: "السكان ↓" },
  { value: "area",       label: "المساحة ↓" },
];

// Pre-merged at module level — static, never changes
const MERGED_COUNTRIES = COUNTRIES.map((c) => ({
  ...c,
  detail: COUNTRY_DETAILS[c.id] ?? null,
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

function normalizeReligion(r: string): ReligionFilter {
  if (r.includes("الإسلام") && (r.includes("المسيحية") || r.includes("أديان"))) return "مختلطة";
  if (r.includes("الإسلام"))    return "الإسلام";
  if (r.includes("المسيحية"))   return "المسيحية";
  if (r.includes("البوذية"))    return "البوذية";
  if (r.includes("الهندوسية")) return "الهندوسية";
  if (r.includes("اليهودية"))  return "اليهودية";
  return "أخرى";
}

function formatPopulation(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} مليار`;
  if (n >= 1_000_000)     return `${Math.round(n / 1_000_000)} مليون`;
  return n.toLocaleString("ar-EG");
}

function formatArea(km2: number): string {
  return `${km2.toLocaleString("ar-EG")} كم²`;
}

// ── Pill Button ──────────────────────────────────────────────────────────────

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95"
      style={{
        background: active
          ? "linear-gradient(135deg, #c084fc, #93c5fd)"
          : "rgba(255,255,255,0.08)",
        color: active ? "#000" : "rgba(255,255,255,0.7)",
        border: active ? "none" : "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {children}
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CountriesListModal({
  isOpen,
  onClose,
  onCountrySelect,
}: CountriesListModalProps) {
  const [sortBy, setSortBy] = useState<SortBy>("area");
  const [filterContinent, setFilterContinent] = useState<Continent | null>(null);
  const [filterReligion, setFilterReligion] = useState<ReligionFilter | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const displayed = useMemo(() => {
    let list = MERGED_COUNTRIES;

    if (filterContinent) {
      list = list.filter((c) => c.continent === filterContinent);
    }
    if (filterReligion) {
      list = list.filter((c) => normalizeReligion(c.detail?.religion ?? "") === filterReligion);
    }

    if (sortBy === "alpha") {
      return [...list].sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar"));
    }
    if (sortBy === "area") {
      return [...list].sort((a, b) => (b.detail?.area ?? 0) - (a.detail?.area ?? 0));
    }
    return [...list].sort((a, b) => (b.detail?.population ?? 0) - (a.detail?.population ?? 0));
  }, [sortBy, filterContinent, filterReligion]);

  if (!isOpen) return null;

  function handleSelect(country: Country) {
    onCountrySelect(country);
    onClose();
  }

  function toggleContinent(v: Continent) {
    setFilterContinent((prev) => (prev === v ? null : v));
  }

  function toggleReligion(v: ReligionFilter) {
    setFilterReligion((prev) => (prev === v ? null : v));
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60]"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed inset-0 z-[60] flex flex-col overflow-hidden"
        style={{
          background: "#000d1f",
          borderTop: "3px solid transparent",
          backgroundImage:
            "linear-gradient(#000d1f, #000d1f), linear-gradient(90deg, #c084fc, #93c5fd, #5eead4)",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.08)" }}
            aria-label="إغلاق"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center">
            <h2
              className="text-base font-black"
              style={{
                background: "linear-gradient(90deg, #c084fc, #93c5fd, #5eead4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              دول العالم 🌍
            </h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {displayed.length} دولة
            </p>
          </div>

          {/* spacer to center title */}
          <div className="w-9" />
        </div>

        {/* ── Filters ── */}
        <div className="flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Toggle bar */}
          <button
            onClick={() => setFiltersOpen((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-2.5 transition-all active:scale-[0.99]"
            style={{ background: "transparent" }}
          >
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: filtersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
              <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
                الفلاتر والترتيب
              </span>
            </div>
            {(filterContinent || filterReligion || sortBy !== "alpha") && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: "linear-gradient(135deg, #c084fc, #93c5fd)", color: "#000" }}
              >
                {[filterContinent, filterReligion, sortBy !== "alpha" ? sortBy : null].filter(Boolean).length} نشط
              </span>
            )}
          </button>

          {/* Collapsible content */}
          {filtersOpen && (
            <div className="px-4 pb-3 space-y-3">
              {/* Continent filter */}
              <div>
                <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                  القارة
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  <Pill active={filterContinent === null} onClick={() => setFilterContinent(null)}>
                    الكل
                  </Pill>
                  {CONTINENTS.map((c) => (
                    <Pill key={c.value} active={filterContinent === c.value} onClick={() => toggleContinent(c.value)}>
                      {c.emoji} {c.label}
                    </Pill>
                  ))}
                </div>
              </div>

              {/* Religion filter */}
              <div>
                <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                  الديانة
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  <Pill active={filterReligion === null} onClick={() => setFilterReligion(null)}>
                    الكل
                  </Pill>
                  {RELIGIONS.map((r) => (
                    <Pill key={r} active={filterReligion === r} onClick={() => toggleReligion(r)}>
                      {r}
                    </Pill>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                  الترتيب
                </p>
                <div className="flex gap-2">
                  {SORT_OPTIONS.map((s) => (
                    <Pill key={s.value} active={sortBy === s.value} onClick={() => setSortBy(s.value)}>
                      {s.label}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Countries List ── */}
        <div className="flex-1 overflow-y-auto" style={{ direction: "rtl" }}>
          {displayed.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>لا توجد دول</p>
            </div>
          ) : (
            <ul>
              {displayed.map((country, index) => {
                const detail = country.detail;
                return (
                  <li key={country.id}>
                    <button
                      onClick={() => handleSelect(country)}
                      className="country-row w-full flex items-center gap-3 px-4 py-3 text-right transition-all active:scale-[0.98]"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <span
                        className="flex-shrink-0 text-xs font-bold w-7 text-center"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                      >
                        {index + 1}
                      </span>

                      <span className="flex-shrink-0 text-2xl leading-none">
                        {countryCodeToFlag(country.code)}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="text-white font-bold text-sm truncate">
                          {country.nameAr}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {detail ? (
                            <>
                              <span>👥 {formatPopulation(detail.population)}</span>
                              <span className="mx-1.5" style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                              <span>📐 {formatArea(detail.area)}</span>
                            </>
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                      </div>

                      <svg
                        className="flex-shrink-0"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 18l-6-6 6-6" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <style>{`
        .country-row:hover { background: rgba(192,132,252,0.08); }
      `}</style>
    </>
  );
}
