"use client";

import { CITIES, REGIONS, CityRegion } from "@/lib/data/cities";
import { useState, useMemo } from "react";

interface MapControlsProps {
  onCitySelect?: (cityId: string) => void;
  onRegionFilter?: (regions: CityRegion[]) => void;
  onReset?: () => void;
  filteredCount: number;
  totalCount: number;
}

export default function MapControls({
  onCitySelect,
  onRegionFilter,
  onReset,
  filteredCount,
  totalCount,
}: MapControlsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<CityRegion[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter cities based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return CITIES.filter(
      (city) =>
        city.nameAr.includes(searchQuery) ||
        city.name.toLowerCase().includes(query)
    ).slice(0, 8); // Limit to 8 results
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowResults(true);
  };

  const handleCityClick = (cityId: string) => {
    onCitySelect?.(cityId);
    setSearchQuery("");
    setShowResults(false);
  };

  const toggleRegion = (region: CityRegion) => {
    const newRegions = selectedRegions.includes(region)
      ? selectedRegions.filter((r) => r !== region)
      : [...selectedRegions, region];

    setSelectedRegions(newRegions);
    onRegionFilter?.(newRegions);
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedRegions([]);
    setShowResults(false);
    onReset?.();
  };

  return (
    <div className="map-controls absolute top-4 right-4 z-[1000] max-w-sm">
      {/* Collapsible Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          dir="rtl"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="font-semibold text-gray-800 text-sm">أدوات الخريطة</span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Collapsible Content */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            isCollapsed ? "max-h-0 opacity-0" : "max-h-[600px] opacity-100"
          }`}
          style={{ overflow: isCollapsed ? "hidden" : "visible" }}
        >
          <div className="p-3 space-y-3 border-t border-gray-100">
            {/* Search Box */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery && setShowResults(true)}
                  placeholder="ابحث عن مدينة..."
                  className="flex-1 px-3 py-2 border rounded-md text-right focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  dir="rtl"
                />
              </div>

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-xl max-h-64 overflow-y-auto border border-gray-200 z-10">
                  {searchResults.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleCityClick(city.id)}
                      className="w-full px-4 py-2.5 text-right hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-0"
                      dir="rtl"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: city.color }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{city.nameAr}</p>
                        <p className="text-xs text-gray-500">{city.name}</p>
                      </div>
                      {city.emoji && <span className="text-lg">{city.emoji}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Region Filter */}
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-xs font-semibold text-gray-600 mb-2 text-right" dir="rtl">
                تصفية حسب المنطقة
              </p>
              <div className="flex flex-wrap gap-2" dir="rtl">
                {(Object.keys(REGIONS) as CityRegion[]).map((region) => {
                  const isSelected = selectedRegions.includes(region);
                  const regionInfo = REGIONS[region];

                  return (
                    <button
                      key={region}
                      onClick={() => toggleRegion(region)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-green-600 text-white shadow-md"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {regionInfo.nameAr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats & Reset */}
            <div className="bg-gray-50 rounded-md p-3 flex items-center justify-between" dir="rtl">
              <span className="text-xs font-semibold text-gray-700">
                {filteredCount} / {totalCount} مدينة
              </span>
              <button
                onClick={handleReset}
                className="text-blue-600 text-xs font-medium hover:text-blue-700 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
