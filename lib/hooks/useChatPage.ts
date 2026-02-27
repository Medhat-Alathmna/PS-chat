/**
 * Custom hook for the Kids Chat page.
 * Contains all state, refs, effects, and callbacks.
 * Returns grouped objects for cleaner usage.
 */

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
import dynamic from "next/dynamic";

import { ChatMessage, ImageResult, Sticker, RewardLevel, UnlockedSticker } from "@/lib/types";
import { buildKidsSystemPrompt } from "@/lib/ai/kids";
import { detectCityInText, CITIES } from "@/lib/data/cities";
import type { City } from "@/lib/data/cities";
import { convertMessages } from "@/lib/utils/messageConverter";
import type { QuickReplyData, SuggestionChip as ChipType } from "@/app/components/kids/games/QuickReplyChips";

// Hooks
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useRewards } from "@/lib/hooks/useRewards";
import { useStickers } from "@/lib/hooks/useStickers";
import { useSounds } from "@/lib/hooks/useSounds";
import { useChatContext } from "@/lib/hooks/useChatContext";
import { useVoiceSynthesis } from "@/lib/hooks/useVoiceSynthesis";
import { useMapSettings } from "@/lib/hooks/useMapSettings";
import { useTextSettings, getTextStyleValues } from "@/lib/hooks/useTextSettings";
import { useChatSettings } from "@/lib/hooks/useChatSettings";
import { useBackgroundMusicContext } from "@/app/layout";

// Dynamic import for map component
const PalestineLeafletMap = dynamic(
  () => import("@/app/components/kids/PalestineLeafletMap"),
  { ssr: false }
);

/**
 * Return type for useChatPage hook - grouped for cleaner usage
 */
export interface UseChatPageReturn {
  // Profile management
  profile: {
    profiles: ReturnType<typeof useProfiles>["profiles"];
    activeProfile: ReturnType<typeof useProfiles>["activeProfile"];
    isLoaded: boolean;
    createProfile: ReturnType<typeof useProfiles>["createProfile"];
    updateProfile: ReturnType<typeof useProfiles>["updateProfile"];
    deleteProfile: ReturnType<typeof useProfiles>["deleteProfile"];
    switchProfile: ReturnType<typeof useProfiles>["switchProfile"];
    showProfileSetup: boolean;
    setShowProfileSetup: React.Dispatch<React.SetStateAction<boolean>>;
    editingProfileId: string | null;
  };

  // Chat state
  chat: {
    messages: ChatMessage[];
    isLoading: boolean;
    status: string;
    canSend: boolean;
    activeQuickReplies: QuickReplyData | null;
    hasActiveChips: boolean;
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
  };

  // Map state
  map: {
    showMobileMap: boolean;
    setShowMobileMap: React.Dispatch<React.SetStateAction<boolean>>;
    highlightedCityId: string | null;
    flyToCoordinates: { lat: number; lng: number; zoom?: number } | null;
    mapSettings: ReturnType<typeof useMapSettings>["settings"];
    PalestineLeafletMap: typeof PalestineLeafletMap;
  };

  // Images
  images: {
    imagePreview: { url: string; mediaType: string; file: File } | null;
    directImagesLoading: boolean;
    persistedImages: Record<string, ImageResult[]>;
    setImagePreview: React.Dispatch<React.SetStateAction<{ url: string; mediaType: string; file: File } | null>>;
  };

  // Rewards (re-exported from useRewards)
  rewards: {
    points: number;
    level: RewardLevel;
    unlockedStickers: UnlockedSticker[];
    showCelebration: boolean;
    pointsEarned: number;
    progressToNextLevel: () => number;
  };

  // Stickers (re-exported from useStickers)
  stickers: {
    showCollection: boolean;
    setShowCollection: React.Dispatch<React.SetStateAction<boolean>>;
    newlyUnlocked: string | null;
    totalCount: number;
  };

  // Sounds (re-exported from useSounds)
  sounds: {
    soundEnabled: boolean;
    toggleSound: () => void;
    playPop: () => void;
    playDing: () => void;
    playCoin: () => void;
    playFanfare: () => void;
  };

  // Voice (re-exported from useVoiceSynthesis)
  voice: {
    voiceEnabled: boolean;
    isSpeaking: boolean;
    voiceSupported: boolean;
    currentMessageId: string | null;
    toggleVoice: () => void;
    stopSpeaking: () => void;
    speakMessage: (message: ChatMessage) => void;
  };

  // Music
  music: {
    isPlaying: boolean;
    isLoaded: boolean;
    toggle: () => void;
  };

  // Text settings
  text: {
    style: { fontFamily: string; fontSize: string };
    displayMode: import("@/lib/types/chat-settings").MessageDisplayMode;
  };

  // Popups state
  popups: {
    showPointsPopup: boolean;
    showLevelUp: boolean;
    setShowLevelUp: React.Dispatch<React.SetStateAction<boolean>>;
    unlockedStickerData: Sticker | null;
    setUnlockedStickerData: React.Dispatch<React.SetStateAction<Sticker | null>>;
  };

  // Refs
  refs: {
    chatContainerRef: React.RefObject<HTMLDivElement | null>;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
  };

  // Handlers
  handlers: {
    handleChipClick: (chip: ChipType) => void;
    handleCityClick: (city: City) => void;
    handleAskAboutCity: (city: City) => void;
    handleImageSelect: (event: ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (event?: FormEvent) => Promise<void>;
    handleKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
    clearImagePreview: () => void;
  };
}

/**
 * Main hook for Kids Chat page
 */
export function useChatPage(): UseChatPageReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // Map state
  const [highlightedCityId, setHighlightedCityId] = useState<string | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [flyToCoordinates, setFlyToCoordinates] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  // Direct images from photo chip (no AI round-trip)
  const [directImages, setDirectImages] = useState<ImageResult[]>([]);
  const [directImagesLoading, setDirectImagesLoading] = useState(false);
  // Persisted map of messageId → images so they survive the next send
  const [persistedImages, setPersistedImages] = useState<Record<string, ImageResult[]>>({});

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

  // Text settings
  const { settings: textSettings } = useTextSettings(profileId);
  const textStyle = getTextStyleValues(textSettings);

  // Chat display settings
  const { settings: chatSettings } = useChatSettings(profileId);

  // System prompt with name
  const systemPrompt = useMemo(
    () => buildKidsSystemPrompt(activeProfile?.name),
    [activeProfile?.name]
  );

  // UI state
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [unlockedStickerData, setUnlockedStickerData] = useState<Sticker | null>(null);

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
    return convertMessages(aiMessages);
  }, [aiMessages]);

  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const canSend = (input.trim().length > 0 || !!imagePreview) && !isLoading;

  // Active quick reply chips from last assistant message
  const activeQuickReplies = useMemo<QuickReplyData | null>(() => {
    if (status === "streaming") return null;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return null;
    return lastMsg.suggestRepliesData ?? null;
  }, [messages, status]);

  const hasActiveChips = !!activeQuickReplies && !isLoading;

  // Handle chip click — branch on chip type for direct actions
  const handleChipClick = useCallback(
    (chip: ChipType) => {
      if (isLoading) return;
      stopSpeaking();
      playPop();

      if (chip.type === "photo" && chip.actionQuery) {
        // Direct image search — no AI round-trip
        setDirectImagesLoading(true);
        setDirectImages([]);
        fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: chip.actionQuery }),
        })
          .then((res) => res.json())
          .then((data: { success: boolean; images?: ImageResult[] }) => {
            if (data.success && data.images) {
              setDirectImages(data.images);
            }
          })
          .catch(() => { })
          .finally(() => setDirectImagesLoading(false));
        return;
      }

      if (chip.type === "map" && chip.actionQuery) {
        // Direct map action — highlight city + open mobile map
        const cityId = detectCityInText(chip.actionQuery);
        if (cityId) {
          const city = CITIES.find((c) => c.id === cityId);
          if (city && typeof city.lat === "number" && typeof city.lng === "number" && !isNaN(city.lat) && !isNaN(city.lng)) {
            setHighlightedCityId(cityId);
            setShowMobileMap(true);
          }
        }
        return;
      }

      // curiosity / activity — send as message (current behavior)
      sendMessage({ text: chip.text });
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

  // When directImages load, pin them to the last assistant message.
  // Uses a ref for messages so new messages arriving later don't re-trigger this.
  useEffect(() => {
    if (directImages.length === 0) return;
    const lastAssistant = [...messagesRef.current].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return;
    setPersistedImages((prev) => ({
      ...prev,
      [lastAssistant.id]: directImages,
    }));
  }, [directImages]);

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

  // Fly to coordinates from location_search tool result
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "assistant" && lastMsg.mapData?.coordinates) {
      const { lat, lng } = lastMsg.mapData.coordinates;
      if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
        setFlyToCoordinates({ lat, lng, zoom: lastMsg.mapData.zoom ?? 14 });
      }
    }
  }, [messages]);

  // City click handler — just highlight the city
  const handleCityClick = useCallback((city: City) => {
    setHighlightedCityId(city.id);
  }, []);

  // Ask about city handler — fill input and close map/popup
  const handleAskAboutCity = useCallback((city: City) => {
    setInput(`أخبرني عن ${city.nameAr}`);
    setHighlightedCityId(city.id);
    setShowMobileMap(false); // Close mobile map if open
    textareaRef.current?.focus();
  }, []);

  const handleImageSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  const handleSubmit = useCallback(async (event?: FormEvent) => {
    event?.preventDefault();

    const trimmed = input.trim();
    if ((!trimmed && !imagePreview) || isLoading) {
      return;
    }

    stopSpeaking(); // Cancel any TTS before sending
    const currentImage = imagePreview;
    setInput("");
    setImagePreview(null);
    setDirectImages([]); // Clear direct images on new message
    setDirectImagesLoading(false);
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
  }, [input, imagePreview, isLoading, playPop, recordMessage, sendMessage, stopSpeaking]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }, [handleSubmit]);

  const clearImagePreview = useCallback(() => {
    setImagePreview(null);
  }, []);

  // Return grouped object
  return {
    // Profile management
    profile: {
      profiles,
      activeProfile,
      isLoaded,
      createProfile,
      updateProfile,
      deleteProfile,
      switchProfile,
      showProfileSetup,
      setShowProfileSetup,
      editingProfileId,
    },

    // Chat state
    chat: {
      messages,
      isLoading,
      status,
      canSend,
      activeQuickReplies,
      hasActiveChips,
      input,
      setInput,
    },

    // Map state
    map: {
      showMobileMap,
      setShowMobileMap,
      highlightedCityId,
      flyToCoordinates,
      mapSettings,
      PalestineLeafletMap,
    },

    // Images
    images: {
      imagePreview,
      directImagesLoading,
      persistedImages,
      setImagePreview,
    },

    // Rewards
    rewards: {
      points,
      level,
      unlockedStickers,
      showCelebration,
      pointsEarned,
      progressToNextLevel,
    },

    // Stickers
    stickers: {
      showCollection,
      setShowCollection,
      newlyUnlocked,
      totalCount,
    },

    // Sounds
    sounds: {
      soundEnabled,
      toggleSound,
      playPop,
      playDing,
      playCoin,
      playFanfare,
    },

    // Voice
    voice: {
      voiceEnabled,
      isSpeaking,
      voiceSupported,
      currentMessageId,
      toggleVoice,
      stopSpeaking,
      speakMessage,
    },

    // Music
    music: {
      isPlaying: isMusicPlaying,
      isLoaded: isMusicLoaded,
      toggle: toggleMusic,
    },

    // Text settings
    text: {
      style: textStyle,
      displayMode: chatSettings.displayMode,
    },

    // Popups state
    popups: {
      showPointsPopup,
      showLevelUp,
      setShowLevelUp,
      unlockedStickerData,
      setUnlockedStickerData,
    },

    // Refs
    refs: {
      chatContainerRef,
      textareaRef,
      fileInputRef,
    },

    // Handlers
    handlers: {
      handleChipClick,
      handleCityClick,
      handleAskAboutCity,
      handleImageSelect,
      handleSubmit,
      handleKeyDown,
      clearImagePreview,
    },
  };
}