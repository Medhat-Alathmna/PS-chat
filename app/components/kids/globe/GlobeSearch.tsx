"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Country, searchCountries, countryCodeToFlag } from "@/lib/data/countries";

interface GlobeSearchProps {
  onCountrySelect: (country: Country) => void;
}

export default function GlobeSearch({ onCountrySelect }: GlobeSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Country[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setResults(searchCountries(value));
      setOpen(!!value.trim());
    }, 300);
  }, []);

  const handleSelect = useCallback(
    (country: Country) => {
      onCountrySelect(country);
      setQuery("");
      setResults([]);
      setOpen(false);
      inputRef.current?.blur();
    },
    [onCountrySelect]
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest("[data-globe-search]")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div data-globe-search className="relative w-full max-w-xs">
      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="ابحث عن دولة... 🔍"
          dir="rtl"
          className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-50">
          {results.map((country) => (
            <button
              key={country.id}
              onClick={() => handleSelect(country)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-right hover:bg-white/20 transition-colors"
              dir="rtl"
            >
              <span className="text-xl">{countryCodeToFlag(country.code)}</span>
              <div>
                <div className="text-white text-sm font-bold">{country.nameAr}</div>
                <div className="text-white/60 text-xs">{country.capitalAr}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl z-50 text-center text-white/60 text-sm">
          لا توجد نتائج لـ &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
