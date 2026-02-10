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
        {/* Header with rewards */}
        <header className="shrink-0 px-4 py-3">
          <div className="flex items-center gap-2">
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
                // For simplicity, use ProfileSetup to edit
                setShowProfileSetup(true);
              }}
              onDelete={deleteProfile}
            />
            <div className="flex-1">
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
              className="shrink-0 px-3 py-2 bg-gradient-to-r from-[var(--kids-purple)] to-[var(--kids-blue)] text-white rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-transform shadow-md"
            >
              🎮 ألعاب
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <main className="flex-1 overflow-y-auto px-4 py-4" ref={chatContainerRef}>
          <div className="mx-auto max-w-2xl flex flex-col gap-4">
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

        {/* Input Area */}
        <div className="shrink-0 border-t-2 border-[var(--kids-yellow)]/30 bg-white/90 backdrop-blur-sm px-4 py-4">
          {/* Image preview */}
          {imagePreview && (
            <div className="mx-auto max-w-2xl mb-2">
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview.url}
                  alt="معاينة الصورة"
                  className="h-20 w-20 object-cover rounded-2xl border-3 border-[var(--kids-purple)]/30 shadow-md"
                />
                <button
                  onClick={() => setImagePreview(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:scale-110 active:scale-95 transition-transform"
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

            <div className="flex items-end gap-3 rounded-3xl border-3 border-[var(--kids-purple)]/30 bg-white px-4 py-3 shadow-lg focus-within:border-[var(--kids-purple)] transition-colors">
              {/* Mini mascot */}
              <AnimatedMascot
                state={isSpeaking ? "speaking" : isLoading ? "thinking" : "idle"}
                size="sm"
                className="hidden sm:block"
              />

              {/* Camera button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--kids-purple)]/10 text-lg transition-all hover:scale-105 hover:bg-[var(--kids-purple)]/20 active:scale-95 disabled:opacity-40"
                aria-label="إرفاق صورة"
              >
                📷
              </button>

              <textarea
                ref={textareaRef}
                className="min-h-[40px] flex-1 resize-none bg-transparent text-base text-gray-700 placeholder:text-gray-400 focus:outline-none leading-6"
                placeholder="اسأل مدحت عن فلسطين! 🇵🇸"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={500}
                disabled={isLoading}
                dir="auto"
              />

              {/* Mic button for speech input */}
              <SpeechInput
                onTranscript={(text) => setInput((prev) => prev ? prev + " " + text : text)}
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={!canSend}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--kids-green)] text-white text-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 shadow-md"
                aria-label="إرسال"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "🚀"
                )}
              </button>
            </div>
          </form>
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
