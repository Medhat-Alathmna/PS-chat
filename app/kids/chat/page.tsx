"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChatMessage,
  ImageResult,
  LocationInfo,
  MapData,
  ToolCallInfo,
  WebSearchResultItem,
  VideoResult,
  NewsItem,
  TimelineEvent,
  Sticker,
} from "@/lib/types";
import { buildKidsSystemPrompt } from "@/lib/ai/config";
import { detectCityInText, CITIES } from "@/lib/data/cities";
import type { City } from "@/lib/data/cities";

// Kids components
import KidsChatBubble, { TypingBubble } from "../../components/kids/KidsChatBubble";
import AnimatedMascot from "../../components/kids/AnimatedMascot";
import AnimatedBackground from "../../components/kids/AnimatedBackground";
import RewardsBar, {
  PointsPopup,
  LevelUpCelebration,
} from "../../components/kids/RewardsBar";
import StickerCollection, {
  StickerUnlockedPopup,
} from "../../components/kids/StickerCollection";
import Confetti from "../../components/kids/Confetti";
import ErrorBoundary from "../../components/ErrorBoundary";
import ProfileSetup from "../../components/kids/ProfileSetup";
import ProfileSwitcher from "../../components/kids/ProfileSwitcher";
import SettingsMenu from "../../components/kids/SettingsMenu";
import SpeechInput from "../../components/kids/SpeechInput";
import QuickReplyChips from "../../components/kids/games/QuickReplyChips";
import type { QuickReplyData } from "../../components/kids/games/QuickReplyChips";

// Expandable map component
import ExpandableMap from "../../components/kids/ExpandableMap";
import dynamic from "next/dynamic";

// Direct map import for mobile fullscreen overlay
const PalestineLeafletMap = dynamic(
  () => import("../../components/kids/PalestineLeafletMap"),
  { ssr: false }
);

// Hooks
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useRewards } from "@/lib/hooks/useRewards";
import { useStickers } from "@/lib/hooks/useStickers";
import { useSounds } from "@/lib/hooks/useSounds";
import { useChatContext } from "@/lib/hooks/useChatContext";
import { useVoiceSynthesis } from "@/lib/hooks/useVoiceSynthesis";
import { useMapSettings } from "@/lib/hooks/useMapSettings";
import { useBackgroundMusicContext } from "../layout";

export default function KidsChatPage() {
  return (
    <ErrorBoundary>
      <KidsChatPageInner />
    </ErrorBoundary>
  );
}

function KidsChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // Map state
  const [highlightedCityId, setHighlightedCityId] = useState<string | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);

  // Background music - Use context from layout to avoid duplicate music
  const { isPlaying: isMusicPlaying, toggle: toggleMusic, isLoaded: isMusicLoaded } = useBackgroundMusicContext();

  // Profiles system
  const {
    profiles,
    activeProfile,
    isLoaded,
    createProfile,
    updateProfile,
    deleteProfile,
    switchProfile,
  } = useProfiles();

  const profileId = activeProfile?.id;

  // Rewards system
  const {
    points,
    level,
    unlockedStickers,
    showCelebration,
    pointsEarned,
    addPoints,
    recordMessage,
    unlockSticker,
    progressToNextLevel,
  } = useRewards(profileId);

  // Stickers system
  const {
    showCollection,
    setShowCollection,
    newlyUnlocked,
    canUnlockNew,
    unlockRandomSticker,
    totalCount,
  } = useStickers(unlockedStickers, unlockSticker);

  // Sounds
  const { soundEnabled, toggleSound, playPop, playDing, playCoin, playFanfare } =
    useSounds();

  // Voice synthesis (TTS)
  const {
    voiceEnabled,
    isSpeaking,
    isSupported: voiceSupported,
    currentMessageId,
    toggleVoice,
    stop: stopSpeaking,
    speakMessage,
  } = useVoiceSynthesis({ soundEnabled });

  // Chat context for game integration
  const { addTopic } = useChatContext(profileId);

  // Map settings
  const { settings: mapSettings } = useMapSettings(profileId);

  // System prompt with name
  const systemPrompt = useMemo(
    () => buildKidsSystemPrompt(activeProfile?.name),
    [activeProfile?.name]
  );

  // UI state
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [unlockedStickerData, setUnlockedStickerData] = useState<Sticker | null>(
    null
  );

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; mediaType: string; file: File } | null>(null);

  // AI Chat hook — key by profileId so it resets on switch
  // Uses dedicated /api/kids/chat endpoint with limited tools (image_search, location_search)
  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/kids/chat",
        body: {
          config: {
            mode: "localPrompt",
            systemPrompt,
          },
          playerName: activeProfile?.name,
        },
      }),
    [systemPrompt, activeProfile?.name]
  );

  const {
    messages: aiMessages,
    sendMessage,
    status,
  } = useChat({
    transport: chatTransport,
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Convert AI SDK messages to ChatMessage format
  const messages = useMemo<ChatMessage[]>(() => {
    return aiMessages.map((msg, index) => {
      let images: ImageResult[] | undefined;
      let location: LocationInfo | undefined;
      let mapData: MapData | undefined;
      let webSearchResults: WebSearchResultItem[] | undefined;
      let video: VideoResult | undefined;
      let news: NewsItem[] | undefined;
      let timeline: TimelineEvent[] | undefined;
      let suggestRepliesData: { suggestions: string[]; showHintChip: boolean } | undefined;
      let textContent = "";
      const toolCalls: ToolCallInfo[] = [];
      const userImageParts: { url: string; mediaType: string }[] = [];

      for (const part of msg.parts) {
        if (part.type === "text") {
          textContent += part.text;
        } else if (part.type === "file") {
          const filePart = part as { type: "file"; mediaType: string; url: string };
          if (filePart.mediaType?.startsWith("image/")) {
            userImageParts.push({ url: filePart.url, mediaType: filePart.mediaType });
          }
        } else if (part.type.startsWith("tool-")) {
          const toolName = part.type.replace("tool-", "");
          const toolPart = part as {
            type: string;
            toolCallId: string;
            state: string;
            input?: Record<string, unknown>;
            output?: unknown;
          };

          toolCalls.push({
            toolName,
            toolCallId: toolPart.toolCallId || "unknown",
            input: toolPart.input || {},
            output: toolPart.output,
            state:
              toolPart.state === "output-available"
                ? "completed"
                : toolPart.state === "output-error"
                  ? "error"
                  : "running",
          });

          // Process specific tools
          if (
            toolName === "image_search" &&
            toolPart.state === "output-available"
          ) {
            const result = toolPart.output as {
              success: boolean;
              images: ImageResult[];
            };
            if (result?.success && result?.images) {
              images = result.images;
            }
          } else if (
            toolName === "location_search" &&
            toolPart.state === "output-available"
          ) {
            const result = toolPart.output as {
              success: boolean;
              location: string;
              coordinates: { lat: number; lng: number } | null;
              formattedAddress: string | null;
            };
            if (result?.success && result?.coordinates) {
              location = {
                name: result.location,
                coordinates: result.coordinates,
                significance: result.formattedAddress || undefined,
              };
              mapData = {
                coordinates: result.coordinates,
                zoom: 14,
              };
            }
          } else if (
            toolName === "web_search" &&
            toolPart.state === "output-available"
          ) {
            const result = toolPart.output as {
              success: boolean;
              results: WebSearchResultItem[];
            };
            if (result?.success && result?.results?.length > 0) {
              webSearchResults = result.results;
            }
          } else if (
            toolName === "video_search" &&
            toolPart.state === "output-available"
          ) {
            const result = toolPart.output as {
              success: boolean;
              video: VideoResult;
            };
            if (result?.success && result?.video) {
              video = result.video;
            }
          } else if (
            toolName === "news_search" &&
            toolPart.state === "output-available"
          ) {
            const result = toolPart.output as {
              success: boolean;
              news: NewsItem[];
            };
            if (result?.success && result?.news?.length > 0) {
              news = result.news;
            }
          } else if (
            toolName === "timeline_search" &&
            toolPart.state === "output-available"
          ) {
            const result = toolPart.output as {
              success: boolean;
              events: TimelineEvent[];
            };
            if (result?.success && result?.events?.length > 0) {
              timeline = result.events;
            }
          } else if (
            toolName === "suggest_replies" &&
            toolPart.state === "output-available"
          ) {
            const result = toolPart.output as {
              suggestions: string[];
              showHintChip: boolean;
            };
            if (result?.suggestions) {
              suggestRepliesData = {
                suggestions: result.suggestions,
                showHintChip: result.showHintChip,
              };
            }
          }
        }
      }

      return {
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: textContent,
        createdAt: index,
        images,
        userImages: userImageParts.length > 0 ? userImageParts : undefined,
        location,
        mapData,
        webSearchResults,
        video,
        news,
        timeline,
        suggestRepliesData,
      };
    });
  }, [aiMessages]);

  const canSend = (input.trim().length > 0 || !!imagePreview) && !isLoading;

  // Active quick reply chips from last assistant message
  const activeQuickReplies = useMemo<QuickReplyData | null>(() => {
    if (status === "streaming") return null;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return null;
    return lastMsg.suggestRepliesData ?? null;
  }, [messages, status]);

  const hasActiveChips = !!activeQuickReplies && !isLoading;

  // Handle chip click — send chip text as user message
  const handleChipClick = useCallback(
    (text: string) => {
      if (isLoading) return;
      stopSpeaking();
      playPop();
      sendMessage({ text });
    },
    [isLoading, playPop, sendMessage, stopSpeaking]
  );

  // Auto-scroll
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // Resize textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [input]);

  // Handle initial question from URL
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !messages.length) {
      setInput(q);
      setTimeout(() => {
        void handleSubmit();
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Handle points earned
  useEffect(() => {
    if (pointsEarned > 0) {
      setShowPointsPopup(true);
      playCoin();
      setTimeout(() => setShowPointsPopup(false), 2000);

      // Check for sticker unlock
      if (canUnlockNew(points)) {
        const newSticker = unlockRandomSticker();
        if (newSticker) {
          setUnlockedStickerData(newSticker);
          playFanfare();
        }
      }
    }
  }, [pointsEarned, points, canUnlockNew, unlockRandomSticker, playCoin, playFanfare]);

  // Handle level up
  useEffect(() => {
    if (showCelebration) {
      setShowLevelUp(true);
      playFanfare();
    }
  }, [showCelebration, playFanfare]);

  // Handle response received - add points, track topics
  useEffect(() => {
    if (
      !isLoading &&
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant"
    ) {
      playDing();

      const lastMsg = messages[messages.length - 1];

      // Track topics for game context
      if (lastMsg.location?.name) {
        addTopic(lastMsg.location.name);
      }
    }
  }, [isLoading, messages, playDing, addTopic]);

  // Auto-highlight cities when AI mentions them
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "assistant" && lastMsg.content) {
      const cityId = detectCityInText(lastMsg.content);
      if (cityId) {
        // Verify the city exists and has valid coordinates before highlighting
        const city = CITIES.find((c) => c.id === cityId);
        if (city && typeof city.lat === "number" && typeof city.lng === "number" && !isNaN(city.lat) && !isNaN(city.lng)) {
          setHighlightedCityId(cityId);
        }
      }
    }
  }, [messages]);

  // City click handler — just highlight the city
  const handleCityClick = (city: City) => {
    setHighlightedCityId(city.id);
  };

  // Ask about city handler — fill input and close map/popup
  const handleAskAboutCity = (city: City) => {
    setInput(`أخبرني عن ${city.nameAr}`);
    setHighlightedCityId(city.id);
    setShowMobileMap(false); // Close mobile map if open
    textareaRef.current?.focus();
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview({
        url: reader.result as string,
        mediaType: file.type,
        file,
      });
    };
    reader.readAsDataURL(file);

    // Reset file input so the same file can be re-selected
    event.target.value = "";
  };

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();

    const trimmed = input.trim();
    if ((!trimmed && !imagePreview) || isLoading) {
      return;
    }

    stopSpeaking(); // Cancel any TTS before sending
    const currentImage = imagePreview;
    setInput("");
    setImagePreview(null);
    playPop();
    recordMessage(); // Add points for sending message

    sendMessage({
      text: trimmed || "🖼️",
      ...(currentImage
        ? {
          files: [
            {
              type: "file" as const,
              mediaType: currentImage.mediaType,
              url: currentImage.url,
            },
          ],
        }
        : {}),
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  // Loading state
  if (!isLoaded) return null;

  // No profiles yet or explicit "add new" flow
  if (profiles.length === 0 || showProfileSetup) {
    return (
      <ProfileSetup
        onComplete={(data) => {
          createProfile(data);
          setShowProfileSetup(false);
        }}
        existingProfiles={profiles}
        onCancel={profiles.length > 0 ? () => setShowProfileSetup(false) : undefined}
      />
    );
  }

  // Migrated profile with no name — prompt for name completion
  if (activeProfile && !activeProfile.name) {
    return (
      <ProfileSetup
        onComplete={(data) => {
          updateProfile(activeProfile.id, data);
        }}
        existingProfiles={profiles}
      />
    );
  }

  if (!activeProfile) return null;

  return (
    <AnimatedBackground variant="sky" showClouds showBirds={false}>
      <div className="relative flex h-screen flex-col overflow-hidden" key={activeProfile.id}>
        {/* Header with rewards - Optimized for mobile */}
        <header className="shrink-0 px-2 py-1.5 sm:px-3 sm:py-2 z-10">
          <div className="flex items-center gap-2 sm:gap-4 max-w-6xl mx-auto">
            {/* Profile switcher - hidden on mobile */}
            <div className="hidden md:block">
              <ProfileSwitcher
                profiles={profiles}
                activeProfile={activeProfile}
                onSwitch={switchProfile}
                onAddNew={() => setShowProfileSetup(true)}
                onEdit={(id) => {
                  setEditingProfileId(id);
                  setShowProfileSetup(true);
                }}
                onDelete={deleteProfile}
              />
            </div>

            {/* Map button - mobile only */}
            <button
              onClick={() => setShowMobileMap(true)}
              className="md:hidden flex items-center justify-center w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl"
              aria-label="فتح الخريطة"
              title="الخريطة"
            >
              <span className="text-lg">🗺️</span>
            </button>

            <div className="flex-1 min-w-0">
              <RewardsBar
                points={points}
                level={level}
                progress={progressToNextLevel()}
                unlockedStickersCount={unlockedStickers.length}
                totalStickersCount={totalCount}
                pointsEarned={pointsEarned}
                onOpenStickers={() => setShowCollection(true)}
                soundEnabled={soundEnabled}
                onToggleSound={toggleSound}
                voiceEnabled={voiceEnabled}
                onToggleVoice={toggleVoice}
                isSpeaking={isSpeaking}
                voiceSupported={voiceSupported}
              />
            </div>

            {/* Background music toggle */}
            <button
              onClick={toggleMusic}
              disabled={!isMusicLoaded}
              className="shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-white/80 backdrop-blur-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              aria-label={isMusicPlaying ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
              title={isMusicPlaying ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
            >
              <span className="text-lg sm:text-xl">
                {isMusicPlaying ? "🎵" : "🔇"}
              </span>
            </button>

            {/* Settings menu - mobile only */}
            <div className="md:hidden">
              <SettingsMenu
                profiles={profiles}
                activeProfile={activeProfile}
                onSwitch={switchProfile}
                onAddNew={() => setShowProfileSetup(true)}
                onEdit={(id) => {
                  setEditingProfileId(id);
                  setShowProfileSetup(true);
                }}
                onDelete={deleteProfile}
              />
            </div>

            <button
              onClick={() => router.push("/kids/map-settings")}
              className="shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-white/80 backdrop-blur-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl"
              aria-label="إعدادات الخريطة"
              title="إعدادات الخريطة"
            >
              <span className="text-lg sm:text-xl">{"\u2699\uFE0F"}</span>
            </button>

            <button
              onClick={() => router.push("/kids/games")}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-[var(--kids-purple)] to-[var(--kids-blue)] text-white rounded-2xl font-bold text-sm sm:text-base hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl hover:shadow-purple-500/20"
            >
              <span className="text-lg">🎮</span>
              <span className="hidden sm:inline">ألعاب</span>
            </button>
          </div>
        </header>

        {/* Two-column layout: Map beside Chat */}
        <div className="flex-1 flex flex-row overflow-hidden gap-2 sm:gap-3 lg:gap-4 pl-1 pr-2 sm:pl-2 sm:pr-3 lg:pl-3 lg:pr-4 py-2">

          {/* === Map Sidebar (hidden on mobile, visible on md+) === */}
          <aside className="hidden md:flex w-[130px] lg:w-[170px] flex-col flex-shrink-0 z-10">
            <ExpandableMap
              onCityClick={handleCityClick}
              onAskAboutCity={handleAskAboutCity}
              highlightedCity={highlightedCityId || undefined}
              size="lg"
              className="h-full"
              mapSettings={mapSettings}
            />
          </aside>

          {/* === Mobile Fullscreen Map Overlay === */}
          {showMobileMap && (
            <div className="md:hidden fixed inset-0 z-50 animate-fade-in">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowMobileMap(false)}
              />

              {/* Map container */}
              <div className="absolute inset-3 flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden animate-pop-in">
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--kids-purple)] to-[var(--kids-blue)] text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🗺️</span>
                    <span className="font-bold text-lg">خريطة فلسطين</span>
                  </div>
                  <button
                    onClick={() => setShowMobileMap(false)}
                    className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-105 active:scale-95"
                    aria-label="إغلاق"
                  >
                    <span className="text-2xl">✕</span>
                  </button>
                </div>

                {/* Map */}
                <div className="flex-1 min-h-0 p-2">
                  <PalestineLeafletMap
                    onCityClick={handleCityClick}
                    onAskAboutCity={handleAskAboutCity}
                    highlightedCity={highlightedCityId || undefined}
                    showControls={true}
                    enableFullInteraction={true}
                    className="h-full"
                    mapSettings={mapSettings}
                  />
                </div>

                {/* Footer hint */}
                <div className="shrink-0 px-4 py-2 bg-gray-50 text-center text-sm text-gray-500">
                  اضغط على أي مدينة لمعرفة المزيد عنها 📍
                </div>
              </div>
            </div>
          )}

          {/* === Chat Column === */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Chat Messages */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-3 py-3 scroll-smooth" ref={chatContainerRef}>
              <div className="mx-auto w-full max-w-none flex flex-col gap-4 pb-4">
                {messages.map((message, index) => (
                  <KidsChatBubble
                    key={message.id}
                    message={message}
                    isStreaming={
                      status === "streaming" &&
                      index === messages.length - 1 &&
                      message.role === "assistant"
                    }
                    isSpeaking={currentMessageId === message.id}
                    onSpeak={() => speakMessage(message)}
                    onStopSpeaking={stopSpeaking}
                  />
                ))}

                {/* Quick reply chips */}
                {activeQuickReplies && !isLoading && (
                  <QuickReplyChips
                    data={activeQuickReplies}
                    onChipClick={handleChipClick}
                    onHintClick={() => {}}
                    disabled={isLoading}
                  />
                )}

                {/* Typing indicator */}
                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                  <TypingBubble />
                )}
              </div>
            </main>

            {/* Input Area - Modern Floating Design */}
            <div className="shrink-0 p-2 sm:p-3 z-20">
              {/* Image preview */}
              {imagePreview && (
                <div className="mx-auto w-full max-w-none mb-3 animate-fade-in-up">
                  <div className="relative inline-block group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview.url}
                      alt="معاينة الصورة"
                      className="h-24 w-24 object-cover rounded-2xl border-4 border-white shadow-lg rotate-2 group-hover:rotate-0 transition-transform duration-300"
                    />
                    <button
                      onClick={() => setImagePreview(null)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md hover:scale-110 active:scale-95 transition-transform border-2 border-white"
                      aria-label="إزالة الصورة"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <form
                onSubmit={(event) => void handleSubmit(event)}
                className="mx-auto w-full max-w-none"
              >
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />

                <div className={`flex items-end gap-3 sm:gap-4 rounded-[2rem] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all focus-within:shadow-[0_12px_48px_rgba(108,92,231,0.25)] focus-within:ring-4 focus-within:ring-[var(--kids-purple)]/20 border-2 border-white p-3 sm:p-4 ${hasActiveChips ? "opacity-90 grayscale-[0.5]" : ""}`}>

                  {/* Camera button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-purple-50 text-[var(--kids-purple)] transition-all hover:from-purple-200 hover:to-purple-100 hover:scale-110 active:scale-90 disabled:opacity-40 shadow-md"
                    aria-label="إرفاق صورة"
                  >
                    <span className="text-2xl sm:text-3xl">📷</span>
                  </button>

                  <div className="flex-1 min-w-0 py-3 sm:py-4">
                    <textarea
                      ref={textareaRef}
                      className="w-full max-h-[140px] resize-none bg-transparent text-lg sm:text-xl text-gray-800 placeholder:text-gray-500 focus:outline-none leading-relaxed px-2 font-medium"
                      placeholder="اسأل مدحت..."
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      maxLength={500}
                      disabled={isLoading}
                      dir="auto"
                      style={{
                        minHeight: '32px',
                      }}
                    />
                  </div>

                  {/* Mic button for speech input */}
                  <div className="shrink-0">
                    <SpeechInput
                      onTranscript={(text) => setInput((prev) => prev ? prev + " " + text : text)}
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!canSend}
                    className="group relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--kids-green)] to-emerald-400 text-white shadow-lg shadow-emerald-500/40 transition-all hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/60 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:grayscale disabled:cursor-not-allowed"
                    aria-label="إرسال"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-3 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="text-2xl sm:text-3xl transform -translate-x-0.5 group-active:translate-x-2 group-active:-translate-y-2 transition-transform duration-200">🚀</span>
                        {canSend && (
                          <span className="absolute inset-0 rounded-full bg-white/30 scale-0 group-active:scale-110 group-active:opacity-0 transition-all duration-300"></span>
                        )}
                      </>
                    )}
                  </button>
                </div>

                {/* Helper text or mascot placement */}
                <div className="flex justify-center mt-3 h-8">
                  <AnimatedMascot
                    state={isSpeaking ? "speaking" : isLoading ? "thinking" : "idle"}
                    size="sm"
                    className={`transition-all duration-300 ${isLoading || isSpeaking ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Confetti celebration */}
        <Confetti show={showCelebration || !!unlockedStickerData} variant="palestinian" />

        {/* Points popup */}
        <PointsPopup points={pointsEarned} show={showPointsPopup} />

        {/* Level up celebration */}
        <LevelUpCelebration
          level={level}
          show={showLevelUp}
          onDismiss={() => setShowLevelUp(false)}
        />

        {/* Sticker collection modal */}
        {showCollection && (
          <StickerCollection
            unlockedStickers={unlockedStickers}
            newlyUnlocked={newlyUnlocked}
            onClose={() => setShowCollection(false)}
          />
        )}

        {/* Sticker unlocked popup */}
        <StickerUnlockedPopup
          sticker={unlockedStickerData}
          show={!!unlockedStickerData}
          onDismiss={() => setUnlockedStickerData(null)}
        />
      </div>
    </AnimatedBackground>
  );
}
