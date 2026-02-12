"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { City } from "@/lib/data/cities";

// Dynamic import to avoid SSR issues with Leaflet
const PalestineLeafletMap = dynamic(
  () => import("@/app/components/kids/PalestineLeafletMap"),
  { ssr: false }
);

export default function MapPage() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const handleCityClick = (city: City) => {
    setSelectedCity(city);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div className="flex items-center gap-3" dir="rtl">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg">
                <span className="text-2xl">🗺️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  خريطة فلسطين التفاعلية
                </h1>
                <p className="text-sm text-gray-500">
                  اكتشف 47 مدينة فلسطينية بالتاريخ والحقائق
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              <Link
                href="/kids"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
                <span dir="rtl">ركن الأطفال</span>
              </Link>
              <Link
                href="/"
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span dir="rtl">الرئيسية</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Map Container */}
      <div className="flex-1 relative">
        <PalestineLeafletMap
          onCityClick={handleCityClick}
          showControls={true}
          enableFullInteraction={true}
          height="100%"
          className="h-full"
        />
      </div>

      {/* Info Panel - Optional overlay when city is selected */}
      {selectedCity && (
        <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 max-w-md border border-gray-200" dir="rtl">
          <button
            onClick={() => setSelectedCity(null)}
            className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{selectedCity.emoji}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800" style={{ color: selectedCity.color }}>
                {selectedCity.nameAr}
              </h3>
              <p className="text-sm text-gray-500">{selectedCity.name}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">معلومة سريعة</p>
            {selectedCity.facts && selectedCity.facts.length > 0 && (
              <p className="text-sm text-gray-700 leading-relaxed">{selectedCity.facts[0]}</p>
            )}
          </div>
        </div>
      )}

      {/* Instructions - Show on first load */}
      <div className="absolute top-24 left-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 max-w-xs border border-green-200" dir="rtl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-lg">💡</span>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 text-sm mb-1">كيف تستخدم الخريطة؟</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>🔍 ابحث عن المدن من المربع أعلاه</li>
              <li>🗂️ صفّي حسب المنطقة</li>
              <li>🖱️ اضغط على المدن لعرض التفاصيل</li>
              <li>⚡ zoom وتحرك بحرية على الخريطة</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
