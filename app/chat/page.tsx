"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useChatPage } from "@/lib/hooks/useChatPage";
import ErrorBoundary from "@/app/components/ErrorBoundary";
import AnimatedBackground from "@/app/components/kids/AnimatedBackground";
import ProfileSetup from "@/app/components/kids/ProfileSetup";
import ChatHeader from "@/app/components/kids/ChatHeader";
import MobileMapOverlay from "@/app/components/kids/MobileMapOverlay";
import ExpandableMap from "@/app/components/kids/ExpandableMap";
import ChatMessages from "@/app/components/kids/ChatMessages";
import ChatInputArea from "@/app/components/kids/ChatInputArea";
import Confetti from "@/app/components/kids/Confetti";
import { PointsPopup, LevelUpCelebration } from "@/app/components/kids/RewardsBar";
import StickerCollection, { StickerUnlockedPopup } from "@/app/components/kids/StickerCollection";

export default function KidsChatPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[var(--kids-bg)]"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--kids-primary)] border-t-transparent"></div></div>}>
        <KidsChatPageInner />
      </Suspense>
    </ErrorBoundary>
  );
}

function KidsChatPageInner() {
  const router = useRouter();
  const {
    profile,
    chat,
    map,
    images,
    rewards,
    stickers,
    sounds,
    voice,
    music,
    text,
    popups,
    refs,
    handlers,
  } = useChatPage();

  // Loading state
  if (!profile.isLoaded) return null;

  // No profiles yet or explicit "add new" flow
  if (profile.profiles.length === 0 || profile.showProfileSetup) {
    return (
      <ProfileSetup
        onComplete={(data) => {
          profile.createProfile(data);
          profile.setShowProfileSetup(false);
        }}
        existingProfiles={profile.profiles}
        onCancel={profile.profiles.length > 0 ? () => profile.setShowProfileSetup(false) : undefined}
      />
    );
  }

  // Migrated profile with no name — prompt for name completion
  if (profile.activeProfile && !profile.activeProfile.name) {
    return (
      <ProfileSetup
        onComplete={(data) => {
          profile.updateProfile(profile.activeProfile!.id, data);
        }}
        existingProfiles={profile.profiles}
      />
    );
  }

  if (!profile.activeProfile) return null;

  return (
    <AnimatedBackground variant="sky" showClouds showBirds={false}>
      <div className="relative flex h-screen flex-col overflow-hidden" key={profile.activeProfile.id}>
        {/* Header with rewards */}
        <ChatHeader
          profiles={profile.profiles}
          activeProfile={profile.activeProfile}
          onSwitchProfile={profile.switchProfile}
          onAddNewProfile={() => profile.setShowProfileSetup(true)}
          onEditProfile={(id) => {
            profile.setShowProfileSetup(true);
          }}
          onDeleteProfile={profile.deleteProfile}
          points={rewards.points}
          level={rewards.level}
          progress={rewards.progressToNextLevel()}
          unlockedStickersCount={rewards.unlockedStickers.length}
          totalStickersCount={stickers.totalCount}
          pointsEarned={rewards.pointsEarned}
          onOpenStickers={() => stickers.setShowCollection(true)}
          soundEnabled={sounds.soundEnabled}
          onToggleSound={sounds.toggleSound}
          voiceEnabled={voice.voiceEnabled}
          onToggleVoice={voice.toggleVoice}
          isSpeaking={voice.isSpeaking}
          voiceSupported={voice.voiceSupported}
          isMusicPlaying={music.isPlaying}
          isMusicLoaded={music.isLoaded}
          onToggleMusic={music.toggle}
          onOpenMap={() => map.setShowMobileMap(true)}
          onNavigateToSettings={() => router.push("/settings")}
          onNavigateToGames={() => router.push("/kids/games")}
        />

        {/* Two-column layout: Map beside Chat */}
        <div className="flex-1 flex flex-row overflow-hidden gap-2 sm:gap-3 lg:gap-4 pl-1 pr-2 sm:pl-2 sm:pr-3 lg:pl-3 lg:pr-4 py-2">

          {/* Mobile Fullscreen Map Overlay */}
          <MobileMapOverlay
            show={map.showMobileMap}
            onClose={() => map.setShowMobileMap(false)}
            highlightedCityId={map.highlightedCityId}
            mapSettings={map.mapSettings}
            onCityClick={handlers.handleCityClick}
            onAskAboutCity={handlers.handleAskAboutCity}
            MapComponent={map.PalestineLeafletMap}
          />

          {/* Desktop Map Column — shown on md+ */}
          <div className="hidden md:flex flex-col w-[260px] lg:w-[300px] xl:w-[340px] shrink-0">
            <ExpandableMap
              onCityClick={handlers.handleCityClick}
              onAskAboutCity={handlers.handleAskAboutCity}
              highlightedCity={map.highlightedCityId || undefined}
              flyToCity={map.highlightedCityId || undefined}
              flyToCoordinates={map.flyToCoordinates}
              mapSettings={map.mapSettings}
              collapsible
              collapsedHeight="h-full"
              className="flex-1 min-h-0 flex flex-col"
            />
          </div>

          {/* Chat Column */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ paddingInlineEnd: "23rem" }}>
            {/* Chat Messages */}
            <ChatMessages
              messages={chat.messages}
              persistedImages={images.persistedImages}
              status={chat.status}
              isLoading={chat.isLoading}
              directImagesLoading={images.directImagesLoading}
              activeQuickReplies={chat.activeQuickReplies}
              currentMessageId={voice.currentMessageId}
              textStyle={text.style}
              displayMode={text.displayMode}
              onChipClick={handlers.handleChipClick}
              onSpeak={voice.speakMessage}
              onStopSpeaking={voice.stopSpeaking}
              chatContainerRef={refs.chatContainerRef}
            />

            {/* Input Area */}
            <ChatInputArea
              input={chat.input}
              onInputChange={chat.setInput}
              onSubmit={handlers.handleSubmit}
              onKeyDown={handlers.handleKeyDown}
              isLoading={chat.isLoading}
              isSpeaking={voice.isSpeaking}
              canSend={chat.canSend}
              hasActiveChips={chat.hasActiveChips}
              imagePreview={images.imagePreview}
              onClearImage={handlers.clearImagePreview}
              onImageSelect={handlers.handleImageSelect}
              textareaRef={refs.textareaRef}
              fileInputRef={refs.fileInputRef}
            />
          </div>
        </div>

        {/* Confetti celebration */}
        <Confetti show={rewards.showCelebration || !!popups.unlockedStickerData} variant="palestinian" />

        {/* Points popup */}
        <PointsPopup points={rewards.pointsEarned} show={popups.showPointsPopup} />

        {/* Level up celebration */}
        <LevelUpCelebration
          level={rewards.level}
          show={popups.showLevelUp}
          onDismiss={() => popups.setShowLevelUp(false)}
        />

        {/* Sticker collection modal */}
        {stickers.showCollection && (
          <StickerCollection
            unlockedStickers={rewards.unlockedStickers}
            newlyUnlocked={stickers.newlyUnlocked}
            onClose={() => stickers.setShowCollection(false)}
          />
        )}

        {/* Sticker unlocked popup */}
        <StickerUnlockedPopup
          sticker={popups.unlockedStickerData}
          show={!!popups.unlockedStickerData}
          onDismiss={() => popups.setUnlockedStickerData(null)}
        />
      </div>
    </AnimatedBackground>
  );
}