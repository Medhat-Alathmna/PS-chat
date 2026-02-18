"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AnimatedBackground from "../../components/kids/AnimatedBackground";
import ProfileSetup from "../../components/kids/ProfileSetup";
import ErrorBoundary from "../../components/ErrorBoundary";
import { useProfiles } from "@/lib/hooks/useProfiles";
import TextSettingsContent from "@/app/components/kids/settings/TextSettingsContent";
import MapSettingsContent from "@/app/components/kids/settings/MapSettingsContent";

export default function SettingsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <SettingsInner />
      </Suspense>
    </ErrorBoundary>
  );
}

function SettingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") === "map" ? "map" : "text";

  const {
    profiles,
    activeProfile,
    isLoaded,
    createProfile,
    updateProfile,
  } = useProfiles();

  const profileId = activeProfile?.id;

  if (!isLoaded) return null;

  if (profiles.length === 0) {
    return (
      <ProfileSetup
        onComplete={(data) => createProfile(data)}
        existingProfiles={profiles}
      />
    );
  }

  if (activeProfile && !activeProfile.name) {
    return (
      <ProfileSetup
        onComplete={(data) => updateProfile(activeProfile.id, data)}
        existingProfiles={profiles}
      />
    );
  }

  if (!activeProfile) return null;

  return (
    <AnimatedBackground variant="sky" showClouds showBirds={false}>
      <div className="relative flex h-screen flex-col overflow-hidden" dir="rtl">
        {/* Header */}
        <header className="shrink-0 px-4 py-3 z-10">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <button
              onClick={() => router.push("/kids")}
              className="flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
              aria-label="رجوع"
            >
              <svg className="w-5 h-5 text-[var(--kids-purple)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-black text-[var(--kids-purple)] drop-shadow-sm">
                ⚙️ الإعدادات
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                خصّص التجربة لـ {activeProfile.name}
              </p>
            </div>
          </div>
        </header>

        {/* Tab Bar */}
        <div className="shrink-0 px-4 pb-3 z-10">
          <div className="flex gap-2 bg-white/80 rounded-2xl p-1.5 border border-gray-100 max-w-2xl mx-auto">
            <button
              onClick={() => router.replace("/kids/settings")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "text"
                  ? "bg-[var(--kids-purple)] text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>🔤</span>
              <span>إعدادات النص</span>
            </button>
            <button
              onClick={() => router.replace("/kids/settings?tab=map")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "map"
                  ? "bg-[var(--kids-purple)] text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>🗺️</span>
              <span>إعدادات الخريطة</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
          <div className="mx-auto max-w-2xl">
            {activeTab === "text" ? (
              <TextSettingsContent profileId={profileId} />
            ) : (
              <MapSettingsContent profileId={profileId} />
            )}
          </div>
        </main>
      </div>
    </AnimatedBackground>
  );
}
