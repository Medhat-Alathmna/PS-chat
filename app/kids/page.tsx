"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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
import KidsIntroScreen from "../components/kids/KidsIntroScreen";
import KidsChatBubble, { TypingBubble } from "../components/kids/KidsChatBubble";
import AnimatedMascot from "../components/kids/AnimatedMascot";
import AnimatedBackground from "../components/kids/AnimatedBackground";
import RewardsBar, {
  PointsPopup,
  LevelUpCelebration,
} from "../components/kids/RewardsBar";
import StickerCollection, {
  StickerUnlockedPopup,
} from "../components/kids/StickerCollection";
import Confetti from "../components/kids/Confetti";
import ErrorBoundary from "../components/ErrorBoundary";
import ProfileSetup from "../components/kids/ProfileSetup";
import ProfileSwitcher from "../components/kids/ProfileSwitcher";
import SpeechInput from "../components/kids/SpeechInput";

// Leaflet map — dynamic import (no SSR)
const PalestineLeafletMap = dynamic(
  () => import("../components/kids/PalestineLeafletMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-sky-100/30 rounded-2xl">
        <div className="w-6 h-6 border-2 border-[var(--kids-purple)]/30 border-t-[var(--kids-purple)] rounded-full animate-spin" />
      </div>
    ),
  }
);

// Hooks
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useRewards } from "@/lib/hooks/useRewards";
import { useStickers } from "@/lib/hooks/useStickers";
import { useSounds } from "@/lib/hooks/useSounds";
import { useChatContext } from "@/lib/hooks/useChatContext";
import { useVoiceSynthesis } from "@/lib/hooks/useVoiceSynthesis";
import { getStickerById } from "@/lib/data/stickers";

export default function KidsPage() {
  return (
    <ErrorBoundary>
      <KidsPageInner />
    </ErrorBoundary>
  );
}

function KidsPageInner() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // Map state
  const [highlightedCityId, setHighlightedCityId] = useState<string | null>(null);

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
    autoReadMessage,
    speakMessage,
  } = useVoiceSynthesis({ soundEnabled });

  // Chat context for game integration
  const { addTopic } = useChatContext(profileId);

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
  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          config: {
            mode: "localPrompt",
            systemPrompt,
          },
        },
      }),
    [systemPrompt]
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
      };
    });
  }, [aiMessages]);

  const canSend = (input.trim().length > 0 || !!imagePreview) && !isLoading;

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

  // Handle initial question
  useEffect(() => {
    if (initialQuestion && started) {
      setInput(initialQuestion);
      setTimeout(() => {
        void handleSubmit();
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion, started]);

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

  // Handle response received - add points, track topics, auto-read
  useEffect(() => {
    if (
      !isLoading &&
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant"
    ) {
      playDing();

      // Auto-read the new assistant message
      const lastMsg = messages[messages.length - 1];
      autoReadMessage(lastMsg);

      // Track topics for game context
      if (lastMsg.location?.name) {
        addTopic(lastMsg.location.name);
      }
    }
  }, [isLoading, messages, playDing, addTopic, autoReadMessage]);

  // Auto-highlight cities when AI mentions them
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "assistant" && lastMsg.content) {
      const cityId = detectCityInText(lastMsg.content);
      if (cityId) {
        setHighlightedCityId(cityId);
      }
    }
  }, [messages]);

  // City click handler — fill input with question about the city
  const handleCityClick = (city: City) => {
    setInput(`أخبرني عن ${city.nameAr}`);
    setHighlightedCityId(city.id);
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

  // Show intro screen
  if (!started) {
    return (
      <KidsIntroScreen
        onSelect={(text) => {
          setInitialQuestion(text);
          setStarted(true);
        }}
        points={points}
        level={level}
        playerName={activeProfile.name}
      />
    );
  }

  return (
    <AnimatedBackground variant="sky" showClouds showBirds={false}>
      <div className="relative flex h-screen flex-col overflow-hidden" key={activeProfile.id}>
        {/* Header with rewards - Optimized for mobile */}
        <header className="shrink-0 px-3 py-2 sm:px-4 sm:py-3 z-10">
          <div className="flex items-center gap-2 sm:gap-4 max-w-6xl mx-auto">
            {/* Profile switcher */}
            <ProfileSwitcher
              profiles={profiles}
              activeProfile={activeProfile}
              onSwitch={(id) => {
                switchProfile(id);
                setStarted(false);
                setInitialQuestion(null);
              }}
              onAddNew={() => setShowProfileSetup(true)}
              onEdit={(id) => {
                setEditingProfileId(id);
                setShowProfileSetup(true);
              }}
              onDelete={deleteProfile}
            />

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

            <button
              onClick={() => router.push("/kids/games")}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-[var(--kids-purple)] to-[var(--kids-blue)] text-white rounded-2xl font-bold text-sm sm:text-base hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl hover:shadow-purple-500/20"
            >
              <span className="text-lg">🎮</span>
              <span className="hidden sm:inline">ألعاب</span>
            </button>
          </div>
        </header>

        {/* Two-column layout: Map beside Chat (always side-by-side) */}
        <div className="flex-1 flex flex-row overflow-hidden">

          {/* === Map Sidebar === */}
          <aside className="shrink-0 w-[140px] sm:w-[200px] md:w-[280px] lg:w-[360px] flex flex-col p-1.5 sm:p-2 lg:p-3 z-10">
            <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-2xl p-1 sm:p-1.5 lg:p-2 shadow-md overflow-hidden flex flex-col">
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-bold text-[var(--kids-purple)] px-1.5 sm:px-2 py-1">
                <span>🗺️</span>
                <span className="hidden sm:inline">خريطة فلسطين</span>
              </div>
              <div className="flex-1 min-h-0">
                <PalestineLeafletMap
                  onCityClick={handleCityClick}
                  highlightedCity={highlightedCityId || undefined}
                  className="h-full"
                />
              </div>
            </div>
          </aside>

          {/* === Chat Column === */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Chat Messages */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4 scroll-smooth" ref={chatContainerRef}>
              <div className="mx-auto max-w-2xl flex flex-col gap-4 pb-4">
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

                {/* Typing indicator */}
                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                  <TypingBubble />
                )}
              </div>
            </main>

            {/* Input Area - Modern Floating Design */}
            <div className="shrink-0 p-3 sm:p-4 z-20">
              {/* Image preview */}
              {imagePreview && (
                <div className="mx-auto max-w-2xl mb-3 animate-fade-in-up">
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
                className="mx-auto max-w-2xl"
              >
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />

                <div className="flex items-end gap-2 sm:gap-3 rounded-[2rem] bg-white/80 backdrop-blur-xl border border-white/50 p-2 sm:p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all focus-within:shadow-[0_8px_32px_rgba(108,92,231,0.2)] focus-within:bg-white">

                  {/* Camera button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-purple-50 text-[var(--kids-purple)] transition-all hover:bg-purple-100 active:scale-90 disabled:opacity-40"
                    aria-label="إرفاق صورة"
                  >
                    <span className="text-xl sm:text-2xl">📷</span>
                  </button>

                  <div className="flex-1 min-w-0 py-2 sm:py-3">
                    <textarea
                      ref={textareaRef}
                      className="w-full max-h-[120px] resize-none bg-transparent text-base sm:text-lg text-gray-800 placeholder:text-gray-400 focus:outline-none leading-relaxed px-1"
                      placeholder="اسأل مدحت... 🇵🇸"
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      maxLength={500}
                      disabled={isLoading}
                      dir="auto"
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
                    className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--kids-green)] to-emerald-400 text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 hover:shadow-emerald-500/50 active:scale-90 disabled:opacity-50 disabled:shadow-none disabled:grayscale"
                    aria-label="إرسال"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="text-xl sm:text-2xl transform -translate-x-0.5 -translate-y-0.5">🚀</span>
                    )}
                  </button>
                </div>

                {/* Helper text or mascot placement */}
                <div className="flex justify-center mt-2 h-6">
                  <AnimatedMascot
                    state={isSpeaking ? "speaking" : isLoading ? "thinking" : "idle"}
                    size="xs"
                    className={isLoading || isSpeaking ? "opacity-100 scale-100" : "opacity-0 scale-90"}
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
