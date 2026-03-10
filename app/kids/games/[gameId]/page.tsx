"use client";

import { useParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useEffect, useRef, useMemo, FormEvent, KeyboardEvent, useCallback } from "react";
import { GameId, GameConfig } from "@/lib/types/games";
import { ImageResult } from "@/lib/types";
import { GAME_CONFIGS } from "@/lib/data/games";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useGameState } from "@/lib/hooks/useGameState";
import { useGameRewards } from "@/lib/hooks/useGameRewards";
import { useChatContext } from "@/lib/hooks/useChatContext";
import { useSounds } from "@/lib/hooks/useSounds";
import { useDiscoveredCities } from "@/lib/hooks/useDiscoveredCities";
import { useVoiceSynthesis } from "@/lib/hooks/useVoiceSynthesis";
import { useTextSettings, getTextStyleValues } from "@/lib/hooks/useTextSettings";
import { useChatSettings } from "@/lib/hooks/useChatSettings";
import { useStaticReveal } from "@/lib/hooks/useStaticReveal";
import AnimatedBackground from "../../../components/kids/AnimatedBackground";
import ErrorBoundary from "../../../components/ErrorBoundary";
import ProfileSetup from "../../../components/kids/ProfileSetup";
import GameHeader from "../../../components/kids/games/GameHeader";
import GameChatBubble, { GameTypingBubble } from "../../../components/kids/games/GameChatBubble";
import GameOverScreen from "../../../components/kids/games/GameOverScreen";
import Confetti from "../../../components/kids/Confetti";
import SpeechInput from "../../../components/kids/SpeechInput";
import { CITIES, detectCityInText } from "@/lib/data/cities";
import ExpandableMap from "../../../components/kids/ExpandableMap";
import { extractTextAndImages, getToolOutput } from "@/lib/utils/messageConverter";

// Synthetic marker injected during history trim — hidden from display
const TRIM_MARKER = "السؤال الجاي";

export default function GamePage() {
  return (
    <ErrorBoundary>
      <GamePageInner />
    </ErrorBoundary>
  );
}

function GamePageInner() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as GameId;

  // Validate gameId
  const config: GameConfig | undefined = GAME_CONFIGS[gameId];
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-sky-200">
        <div className="text-center bg-white/90 rounded-3xl p-8 shadow-xl">
          <div className="text-4xl mb-3">😕</div>
          <h2 className="text-xl font-bold text-gray-700 mb-4">هاي اللعبة مش موجودة!</h2>
          <button
            onClick={() => router.push("/kids/games")}
            className="px-6 py-3 bg-[var(--kids-green)] text-white rounded-2xl font-bold"
          >
            رجوع للألعاب 🎮
          </button>
        </div>
      </div>
    );
  }

  return <GameSession gameId={gameId} config={config} />;
}

function GameSession({ gameId, config }: { gameId: GameId; config: GameConfig }) {
  const router = useRouter();
  const [gameStarted, setGameStarted] = useState(false);
  const [input, setInput] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  // Map state for city-explorer
  const isCityExplorer = gameId === "city-explorer";
  const [revealedCities, setRevealedCities] = useState<string[]>([]);
  const [highlightRegion, setHighlightRegion] = useState<string | null>(null);
  const [flyToCity, setFlyToCity] = useState<string | null>(null);
  const [mapExpandTrigger, setMapExpandTrigger] = useState(0);
  const [mapUncollapseTrigger, setMapUncollapseTrigger] = useState(0);

  // Current city being asked — sent to server so it can use it directly (no seed reconstruction)
  const [currentCityId, setCurrentCityId] = useState<string | null>(null);

  // Pending hint state - hint is pre-generated server-side and shown client-side on demand
  const [pendingHint, setPendingHint] = useState<{ hint: string; images?: ImageResult[]; targetCityId?: string } | null>(null);
  const [showPendingHint, setShowPendingHint] = useState(false);
  // Track the current city being asked — used for reliable map reveal on correct answer
  const currentTargetCityIdRef = useRef<string | null>(null);
  const prevHintCityIdRef = useRef<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startSentRef = useRef(false);

  // Trim history after round advance — clear old messages once the new round starts
  const trimPending = useRef(false);

  // Profiles
  const {
    profiles,
    activeProfile,
    isLoaded,
    createProfile,
    updateProfile,
  } = useProfiles();

  const profileId = activeProfile?.id;

  const { soundEnabled, playSound } = useSounds();
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
  const { getContext } = useChatContext(profileId);
  const { settings: textSettings } = useTextSettings(profileId);
  const textStyle = getTextStyleValues(textSettings);
  const { settings: chatSettings } = useChatSettings(profileId);
  const gameState = useGameState(gameId, undefined, profileId);
  const gameRewards = useGameRewards(profileId);
  const discoveredCities = useDiscoveredCities(profileId);

  // Sync map revealed cities from persisted discovered cities on load
  useEffect(() => {
    if (isCityExplorer && discoveredCities.isLoaded && discoveredCities.discoveredIds.length > 0) {
      setRevealedCities((prev) => {
        const merged = new Set([...prev, ...discoveredCities.discoveredIds]);
        return Array.from(merged);
      });
    }
  }, [isCityExplorer, discoveredCities.isLoaded, discoveredCities.discoveredIds]);

  // Chat hook
  const {
    messages: aiMessages,
    sendMessage,
    setMessages,
    status,
  } = useChat({
    transport: useMemo(
      () =>
        new DefaultChatTransport({
          api: "/api/games/chat",
          body: {
            gameId,
            chatContext: getContext(),
            kidsProfile: activeProfile,
            discoveredCityIds: isCityExplorer ? discoveredCities.discoveredIds : undefined,
            currentCityId: isCityExplorer ? currentCityId : undefined,
            currentRound: isCityExplorer ? gameState.state.round - 1 : undefined,
          },
        }),
      [gameId, activeProfile, getContext, isCityExplorer, discoveredCities.discoveredIds, currentCityId, gameState.state.round]
    ),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Process tool calls from AI messages
  const processedTools = useRef(new Set<string>());
  useEffect(() => {
    for (const msg of aiMessages) {
      if (msg.role !== "assistant") continue;
      for (const part of msg.parts) {
        if (part.type.startsWith("tool-")) {
          const toolPart = part as {
            type: string;
            toolCallId: string;
            state: string;
            output?: Record<string, unknown>;
          };
          if (
            toolPart.state === "output-available" &&
            toolPart.output &&
            !processedTools.current.has(toolPart.toolCallId)
          ) {
            processedTools.current.add(toolPart.toolCallId);
            const toolName = toolPart.type.replace("tool-", "");
            gameState.processToolResult(toolName, toolPart.output);

            // advance_round is now the correct-answer signal (check_answer removed)
            if (toolName === "advance_round") {
              playSound("correct" as any);
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 2000);
              gameRewards.onCorrectAnswer(gameId, config.pointsPerCorrect);
              gameRewards.onRoundComplete(gameId, 0);
              // Map: reveal city on advance_round — use tracked ref, fall back to text detection
              if (isCityExplorer) {
                const cityId = currentTargetCityIdRef.current || detectCityInText(toolPart.output.feedback as string || "");
                if (cityId) {
                  if (!revealedCities.includes(cityId)) {
                    const city = CITIES.find((c) => c.id === cityId);
                    if (city && typeof city.lat === "number" && typeof city.lng === "number" && !isNaN(city.lat) && !isNaN(city.lng)) {
                      setRevealedCities((prev) => [...prev, cityId]);
                      setHighlightRegion(null);
                      setFlyToCity(cityId);
                      discoveredCities.addCity(cityId);
                    }
                  }
                }
              }
              trimPending.current = true;
            } else if (toolName === "end_game") {
              playSound("gameOver" as any);
              if (gameState.summary) {
                gameRewards.onGameComplete(gameState.summary);
              }
            }
          }
        }
      }
    }
  }, [aiMessages, gameState, gameRewards, gameId, config.pointsPerCorrect, playSound]);

  // Auto-send "Start!" message
  useEffect(() => {
    if (gameStarted && !startSentRef.current) {
      startSentRef.current = true;
      playSound("gameStart" as any);
      sendMessage({ text: "ابدأ!" });
    }
  }, [gameStarted, sendMessage, playSound]);

  // Auto-scroll
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [aiMessages, isLoading]);

  // Trim chat history after round advance — keep only the new round's content
  useEffect(() => {
    if (status !== "ready" || !trimPending.current) return;

    // Find last assistant message
    const lastAssistant = [...aiMessages].reverse().find(m => m.role === "assistant");
    if (!lastAssistant) return;

    // Only trim once the new round actually started (has data-game-turn)
    const hasGameTurn = lastAssistant.parts.some(p => {
      const tp = p as { type?: string };
      return tp.type === "data-game-turn";
    });
    if (!hasGameTurn) return;

    trimPending.current = false;

    // Synthetic user message (hidden by displayMessages filter)
    const syntheticUser: UIMessage = {
      id: "trim-" + Date.now(),
      role: "user",
      parts: [{ type: "text", text: TRIM_MARKER }],
    };

    setMessages([syntheticUser, lastAssistant]);

    // Clean up processedTools — only keep IDs from the surviving message
    const survivingIds = new Set<string>();
    for (const part of lastAssistant.parts) {
      if (part.type.startsWith("tool-")) {
        const tp = part as { type: string; toolCallId: string };
        if (tp.toolCallId) survivingIds.add(tp.toolCallId);
      }
    }
    processedTools.current = survivingIds;

    console.log("[game] Trimmed history after round advance, kept", survivingIds.size, "tool parts");
  }, [status, aiMessages, setMessages]);

  // Resize textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
  }, [input]);

  // Convert messages for display
  const displayMessages = useMemo(() => {
    return aiMessages.filter((msg) => {
      // Hide trim-marker messages from display
      if (msg.role === "user") {
        const { textContent } = extractTextAndImages(msg.parts);
        if (textContent.trim() === TRIM_MARKER) return false;
      }
      return true;
    }).map((msg) => {
      const { textContent } = extractTextAndImages(msg.parts);
      const imageOutput = getToolOutput<{ images: ImageResult[] }>(msg.parts, "image_search");

      // Read data-game-turn part (injected server-side after streaming)
      const gameTurnPart = (msg.parts as Array<{ type?: string; data?: unknown }>)
        .find((p) => p?.type === "data-game-turn");
      const gameTurn = (gameTurnPart?.data as { options: string[]; hint: string; hintImages?: ImageResult[]; targetCityId?: string } | undefined) ?? null;

      // Check if this message had advance_round (correct-answer signal)
      const hadAdvance = msg.role === "assistant" && msg.parts.some((p) => {
        const tp = p as { type: string };
        return tp.type === "tool-advance_round";
      });

      return {
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: textContent,
        gameTurn,
        hadAdvance,
        imageResults: imageOutput?.images || null,
      };
    });
  }, [aiMessages]);

  // Static reveal for display mode
  const { shouldHide: shouldHideMsg, revealClass: getRevealClass, showTypingBubble } = useStaticReveal(status, displayMessages, chatSettings.displayMode);

  // Extract pending hint from the last assistant message with a gameTurn
  useEffect(() => {
    if (status === "streaming") {
      setShowPendingHint(false);
      return;
    }

    for (let i = displayMessages.length - 1; i >= 0; i--) {
      const msg = displayMessages[i];
      if (msg.role === "assistant" && msg.gameTurn?.hint) {
        const newTargetId = msg.gameTurn.targetCityId ?? null;
        // When the city changes (new round), reset hint visibility
        if (newTargetId !== prevHintCityIdRef.current) {
          prevHintCityIdRef.current = newTargetId;
          currentTargetCityIdRef.current = newTargetId;
          setCurrentCityId(newTargetId);
          setShowPendingHint(false);
        }
        setPendingHint({ hint: msg.gameTurn.hint, images: msg.gameTurn.hintImages, targetCityId: msg.gameTurn.targetCityId });
        return;
      }
    }

    setPendingHint(null);
    setShowPendingHint(false);
    setCurrentCityId(null);
    currentTargetCityIdRef.current = null;
    prevHintCityIdRef.current = null;
  }, [displayMessages, status]);

  // Auto-read assistant messages when streaming completes
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    if (!isLoading && displayMessages.length > prevMsgCountRef.current) {
      const lastMsg = displayMessages[displayMessages.length - 1];
      if (lastMsg?.role === "assistant" && lastMsg.content) {
        autoReadMessage(lastMsg);
      }
    }
    prevMsgCountRef.current = displayMessages.length;
  }, [isLoading, displayMessages, autoReadMessage]);

  // Find the active options (last assistant message with a gameTurn)
  const activeOptions = useMemo<{ messageId: string; gameTurn: { options: string[]; hint: string; hintImages?: ImageResult[]; targetCityId?: string }; hasHint: boolean } | null>(() => {
    if (status === "streaming") return null;
    for (let i = displayMessages.length - 1; i >= 0; i--) {
      const msg = displayMessages[i];
      if (msg.role === "assistant" && msg.gameTurn?.options?.length) {
        return { messageId: msg.id, gameTurn: msg.gameTurn, hasHint: !!msg.gameTurn.hint };
      }
    }
    return null;
  }, [displayMessages, status]);


  const hasActiveOptions = activeOptions !== null;

  const handleOptionClick = useCallback(
    (optionText: string) => {
      if (isLoading) return;
      stopSpeaking();
      playSound("click");
      sendMessage({ text: optionText });
    },
    [isLoading, playSound, sendMessage, stopSpeaking]
  );

  const handleHintClick = useCallback(() => {
    if (isLoading) return;
    stopSpeaking();
    playSound("hint" as any);

    if (pendingHint) {
      setShowPendingHint(true);
      // Map: zoom to target city
      if (isCityExplorer && pendingHint.targetCityId) {
        const city = CITIES.find((c) => c.id === pendingHint.targetCityId);
        if (city && typeof city.lat === "number" && typeof city.lng === "number" && !isNaN(city.lat) && !isNaN(city.lng)) {
          setMapUncollapseTrigger((c) => c + 1);
          setFlyToCity("");
          setTimeout(() => setFlyToCity(pendingHint.targetCityId!), 150);
        }
      }
    } else {
      // Fallback: send message if no pending hint (shouldn't happen in normal flow)
      sendMessage({ text: "تلميح" });
    }
  }, [isLoading, playSound, sendMessage, stopSpeaking, pendingHint, isCityExplorer]);


  const playerAge = activeProfile?.age;
  const isYoungKid = playerAge !== undefined && playerAge <= 7;
  const canSend = input.trim().length > 0 && !isLoading;

  const handleSubmit = useCallback(
    (event?: FormEvent) => {
      event?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isLoading) return;
      stopSpeaking(); // Cancel any TTS before sending
      setInput("");
      playSound("click");
      sendMessage({ text: trimmed });
    },
    [input, isLoading, playSound, sendMessage, stopSpeaking]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  // --- RENDER ---

  if (!isLoaded) return null;

  if (profiles.length === 0) {
    return (
      <ProfileSetup
        onComplete={(data) => {
          createProfile(data);
        }}
        existingProfiles={profiles}
      />
    );
  }

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

  // Auto-start
  if (!gameStarted) {
    setGameStarted(true);
  }

  // Game over screen
  if (gameState.state.status === "finished" && gameState.summary) {
    return (
      <GameOverScreen
        summary={gameState.summary}
        onPlayAgain={() => {
          startSentRef.current = false;
          processedTools.current.clear();
          trimPending.current = false;
          prevMsgCountRef.current = 0;
          setMessages([]); // Clear chat history so AI starts fresh
          gameState.resetGame();
          setGameStarted(false);
          // Reset city tracking for new session
          setCurrentCityId(null);
          currentTargetCityIdRef.current = null;
          prevHintCityIdRef.current = null;
          setRevealedCities([]);
          setHighlightRegion(null);
          setFlyToCity(null);
        }}
        onChooseAnother={() => router.push("/kids/games")}
      />
    );
  }

  return (
    <AnimatedBackground variant="sky" showClouds showBirds={false}>
      <div className="relative flex h-screen flex-col overflow-hidden">
        {/* Game header - Mobile Compact */}
        <header className="shrink-0 px-3 py-2 z-10 w-full">
          <div className={`mx-auto ${isCityExplorer ? "max-w-7xl" : "max-w-4xl"}`}>
            <GameHeader
              config={config}
              state={gameState.state}
              onBack={() => router.push("/kids/games")}
              voiceEnabled={voiceEnabled}
              onToggleVoice={toggleVoice}
              isSpeaking={isSpeaking}
              voiceSupported={voiceSupported}
            />
          </div>
        </header>

        {/* Main content: side-by-side on desktop for city-explorer, stacked otherwise */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Map panel for city-explorer — mobile only (stacked) */}
          {isCityExplorer && (
            <div className="shrink-0 px-3 z-10 md:hidden">
              <ExpandableMap
                gameMode
                revealedCities={revealedCities}
                highlightRegion={highlightRegion || undefined}
                flyToCity={flyToCity || undefined}
                size="sm"
                collapsible
                initialCollapsed={false}
                subtitle={`${discoveredCities.discoveredCount}/${discoveredCities.totalCities} مدن مكتشفة 🌟`}
                expandTrigger={mapExpandTrigger}
                uncollapseTrigger={mapUncollapseTrigger}
              />
            </div>
          )}

          {/* Chat + Input column — offset on desktop for city-explorer map */}
          <div className={`flex-1 min-h-0 flex flex-col overflow-hidden `}>
            {/* Chat area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-3 py-4 sm:px-4 scroll-smooth" ref={chatContainerRef}>
              <div className={`mx-auto flex flex-col gap-4 pb-4 ${isCityExplorer ? "max-w-3xl" : "max-w-2xl"}`}>
                {displayMessages.map((msg, index) => {
                  if (shouldHideMsg(index, msg.role)) return null;
                  const reveal = getRevealClass(msg.id);
                  return (
                    <GameChatBubble
                      key={msg.id}
                      role={msg.role}
                      content={msg.content}
                      isStreaming={
                        status === "streaming" &&
                        index === displayMessages.length - 1 &&
                        msg.role === "assistant"
                      }
                      imageResults={msg.imageResults}
                      isSpeaking={currentMessageId === msg.id}
                      onSpeak={() => speakMessage(msg)}
                      onStopSpeaking={stopSpeaking}
                      textStyle={textStyle}
                      {...(reveal ? { className: reveal } : {})}
                    />
                  );
                })}

                {/* Pending hint bubble — shown when player taps hint button (ABOVE options) */}
                {showPendingHint && pendingHint && (
                  <div className="px-4 py-3 rounded-2xl shadow-md bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 animate-pop-in">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">💡</span>
                      <span className="font-bold text-sm text-yellow-700">
                        تلميح مساعد
                      </span>
                    </div>
                    <p className="text-base text-gray-700 leading-relaxed" dir="auto">
                      {pendingHint.hint}
                    </p>
                    {pendingHint.images && pendingHint.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {pendingHint.images.slice(0, 2).map((img, i) => (
                          <div
                            key={i}
                            className="relative rounded-xl overflow-hidden border-2 border-yellow-200"
                          >
                            <img
                              src={img.thumbnailUrl || img.imageUrl}
                              alt={img.title}
                              className="w-full h-24 object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Active city options — render prominently at bottom */}
                {activeOptions && (
                  <CityOptionsBlock
                    options={activeOptions.gameTurn.options}
                    hasHint={activeOptions.hasHint}
                    onOptionClick={handleOptionClick}
                    onHintClick={handleHintClick}
                    hintAlreadyShown={showPendingHint}
                  />
                )}

                {isLoading &&
                  (showTypingBubble || displayMessages[displayMessages.length - 1]?.role !== "assistant") && (
                    <GameTypingBubble />
                  )}
              </div>
            </main>

            {/* Input area - Floating Capsule Design */}
            <div className="shrink-0 p-3 sm:p-4 z-20">
              <div className={`mx-auto flex flex-col gap-2 ${isCityExplorer ? "max-w-3xl" : "max-w-2xl"}`}>
                <form onSubmit={(event) => void handleSubmit(event)}>
                  <div className={`flex items-end gap-2 sm:gap-3 rounded-[2rem] bg-white/90 backdrop-blur-xl border border-white/50 p-2 sm:p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all focus-within:shadow-[0_8px_32px_rgba(108,92,231,0.2)] focus-within:bg-white ${hasActiveOptions ? "opacity-90 grayscale-[0.5]" : ""}`}>

                    {/* Mic button FIRST for young kids (more prominent in RTL) */}
                    {isYoungKid && (
                      <div className="shrink-0">
                        <SpeechInput
                          onTranscript={(text) => setInput((prev) => prev ? prev + " " + text : text)}
                          disabled={isLoading}
                          playerAge={playerAge}
                        />
                      </div>
                    )}

                    <textarea
                      ref={textareaRef}
                      className="flex-1 max-h-[100px] resize-none bg-transparent text-base sm:text-lg text-gray-800 placeholder:text-gray-400 focus:outline-none leading-relaxed px-2 py-2"
                      placeholder={
                        hasActiveOptions
                          ? "أو اكتب جوابك... ✍️"
                          : isYoungKid
                            ? "احكي جوابك... 🎤"
                            : "اكتب جوابك هنا... ✍️"
                      }
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      maxLength={300}
                      disabled={isLoading}
                      dir="auto"
                    />

                    {/* Mic button for older kids (after textarea) */}
                    {!isYoungKid && (
                      <div className="shrink-0">
                        <SpeechInput
                          onTranscript={(text) => setInput((prev) => prev ? prev + " " + text : text)}
                          disabled={isLoading}
                          playerAge={playerAge}
                        />
                      </div>
                    )}

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
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop map panel — absolutely positioned, independent from chat */}
        {isCityExplorer && (
          <div className="hidden md:block absolute top-[60px] right-3 w-[25%] min-w-[200px] max-w-[350px] h-[70%] z-10" style={{ marginBlockStart: '5rem' }}>
            <ExpandableMap
              gameMode
              revealedCities={revealedCities}
              highlightRegion={highlightRegion || undefined}
              flyToCity={flyToCity || undefined}
              size="lg"
              collapsible
              initialCollapsed={false}
              subtitle={`${discoveredCities.discoveredCount}/${discoveredCities.totalCities} مدن مكتشفة 🌟`}
              className="h-full flex flex-col"
              collapsedHeight="h-full"
              expandTrigger={mapExpandTrigger}
            />
          </div>
        )}

        {/* Confetti for correct answers */}
        <Confetti show={showConfetti} variant="celebration" />
      </div>
    </AnimatedBackground>
  );
}

const NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];

function CityOptionsBlock({
  options,
  hasHint,
  onOptionClick,
  onHintClick,
  hintAlreadyShown = false,
}: {
  options: string[];
  hasHint: boolean;
  onOptionClick: (text: string) => void;
  onHintClick: () => void;
  hintAlreadyShown?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 animate-pop-in my-2">
      <div className="text-center text-sm text-[var(--kids-purple)] font-bold opacity-80 mb-1">
        اختار الإجابة الصحيحة 👇
      </div>
      <div className="grid gap-3">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => onOptionClick(option)}
            className="group relative flex items-center gap-3 px-5 py-4 rounded-3xl text-right transition-all shadow-md bg-white border-2 border-[var(--kids-purple)]/20 text-gray-800 hover:bg-purple-50 hover:border-[var(--kids-purple)] hover:scale-[1.02] hover:shadow-lg active:scale-95 cursor-pointer overflow-hidden"
            dir="auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--kids-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-2xl shrink-0 filter drop-shadow-sm">{NUMBER_EMOJIS[i]}</span>
            <span className="text-base sm:text-lg font-bold leading-relaxed">{option}</span>
          </button>
        ))}
      </div>

      {hasHint && !hintAlreadyShown && (
        <button
          onClick={() => onHintClick()}
          className="self-center mt-2 flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm sm:text-base font-bold bg-yellow-100 text-yellow-800 border-2 border-yellow-300 hover:bg-yellow-200 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <span className="text-xl">💡</span>
          <span>أحتاج مساعدة (تلميح)</span>
        </button>
      )}
    </div>
  );
}
