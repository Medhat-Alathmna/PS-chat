"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo, FormEvent, KeyboardEvent, useCallback } from "react";
import { GameId, GameConfig } from "@/lib/types/games";
import { GAME_CONFIGS } from "@/lib/data/games";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useAuth } from "@/lib/hooks/useAuth";
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
import { CITIES } from "@/lib/data/cities";
import ExpandableMap from "../../../components/kids/ExpandableMap";
import type { GameResponse } from "@/lib/types/games";
import { useTokenQuota } from "@/lib/hooks/useTokenQuota";
import MedhatBlockedMessage from "../../../components/kids/MedhatBlockedMessage";
import { useEmailVerification } from "../../../components/kids/EmailVerificationGuard";

// ── Types ──────────────────────────────────────────────────────────────

type GameMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  // Assistant-only fields
  options?: string[];
  isCorrect?: boolean;
  isGameOver?: boolean;
  hint?: string;
  hintImages?: string[];
  targetCityId?: string;
  targetCityNameAr?: string;
};

type GameApiResponse = {
  turn: GameResponse;
  currentCityId: string;
  targetCityId: string;
  targetCityNameAr: string;
  hint: string;
  hintImages: string[];
  isCorrect: boolean;
};

// ── Page wrapper ────────────────────────────────────────────────────────

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

// ── Main session component ──────────────────────────────────────────────

function GameSession({ gameId, config }: { gameId: GameId; config: GameConfig }) {
  const router = useRouter();
  const { user } = useAuth();
  const { showVerificationModal } = useEmailVerification();
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

  // Current city being asked — sent to server so it picks the same city
  const [currentCityId, setCurrentCityId] = useState<string | null>(null);

  // Pending hint — pre-fetched server-side, revealed client-side on demand
  const [pendingHint, setPendingHint] = useState<{ hint: string; images?: string[]; targetCityId?: string } | null>(null);
  const [showPendingHint, setShowPendingHint] = useState(false);

  // Ref-mirror of revealedCities — lets sendGameMessage check without the dep
  const revealedCitiesRef = useRef<string[]>([]);
  useEffect(() => { revealedCitiesRef.current = revealedCities; }, [revealedCities]);

  const prevHintCityIdRef = useRef<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startSentRef = useRef(false);

  // Profiles
  const { profiles, activeProfile, isLoaded, createProfile, updateProfile, refreshProfiles } = useProfiles();
  const profileId = activeProfile?.id;
  const { isAuthenticated } = useAuth();

  const { soundEnabled, playSound } = useSounds();
  const {
    voiceEnabled, isSpeaking, isSupported: voiceSupported,
    currentMessageId, toggleVoice, stop: stopSpeaking,
    autoReadMessage, speakMessage,
  } = useVoiceSynthesis({ soundEnabled });
  const { getContext } = useChatContext(profileId);
  const { settings: textSettings } = useTextSettings(profileId);
  const textStyle = getTextStyleValues(textSettings);
  const { settings: chatSettings } = useChatSettings(profileId);
  const gameState = useGameState(gameId, undefined, profileId, isAuthenticated);
  const gameRewards = useGameRewards(profileId);
  const discoveredCities = useDiscoveredCities(profileId, isAuthenticated);
  const tokenQuota = useTokenQuota(profileId);

  // Chat state — simple array of messages, no streaming
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Synthetic status string for useStaticReveal compatibility
  const status = isLoading ? "streaming" : "ready";

  // Sync map revealed cities from persisted discovered cities on load
  useEffect(() => {
    if (isCityExplorer && discoveredCities.isLoaded && discoveredCities.discoveredIds.length > 0) {
      setRevealedCities((prev) => {
        const merged = new Set([...prev, ...discoveredCities.discoveredIds]);
        return Array.from(merged);
      });
    }
  }, [isCityExplorer, discoveredCities.isLoaded, discoveredCities.discoveredIds]);

  // Core send function — POSTs to API, handles JSON response
  const sendGameMessage = useCallback(async (text: string) => {
    if (isLoading) return;

    // Block if email not verified
    if (user && !user.isEmailVerified) {
      showVerificationModal();
      return;
    }

    const userMsg: GameMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setShowPendingHint(false);

    try {
      const res = await fetch("/api/games/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(activeProfile?.id ? { "X-Profile-Id": activeProfile.id } : {}),
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          gameId,
          currentCityId,
          discoveredCityIds: isCityExplorer ? discoveredCities.discoveredIds : undefined,
          currentRound: isCityExplorer ? gameState.state.round - 1 : undefined,
          kidsProfile: activeProfile,
          chatContext: getContext(),
        }),
      });

      if (!res.ok) {
        if (res.status === 403) {
          const errBody = await res.json().catch(() => ({}));
          if (errBody?.emailNotVerified) { showVerificationModal(); return; }
          if (errBody?.action === "REFRESH_PROFILES") { await refreshProfiles(); return; }
        }
        if (res.status === 429) {
          const body = await res.json().catch(() => null);
          if (body?.quota) tokenQuota.updateFromResponse(body.quota);
          else tokenQuota.refresh();
          return;
        }
        const errBody = await res.json().catch(() => ({}));
        throw new Error(`API error ${res.status}: ${errBody.detail ?? errBody.error ?? ""}`);
      }

      const data: GameApiResponse = await res.json();
      const { turn, currentCityId: newCityId, targetCityId, targetCityNameAr, hint, hintImages, isCorrect } = data;

      // Build assistant message
      const assistantMsg: GameMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: turn.message,
        options: turn.type === "turn" ? turn.options : undefined,
        isCorrect,
        isGameOver: turn.type === "game_over",
        hint,
        hintImages,
        targetCityId,
        targetCityNameAr,
      };

      // Handle game events
      if (isCorrect) {
        playSound("correct" as Parameters<typeof playSound>[0]);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        gameRewards.onCorrectAnswer(gameId, config.pointsPerCorrect);
        gameRewards.onRoundComplete(gameId, 0);
        gameState.processToolResult("advance_round", { roundCompleted: gameState.state.round - 1, pointsEarned: 15, feedback: "" });

        if (isCityExplorer && newCityId) {
          const city = CITIES.find(c => c.id === newCityId);
          if (city && typeof city.lat === "number" && typeof city.lng === "number" && !isNaN(city.lat) && !isNaN(city.lng)) {
            if (!revealedCitiesRef.current.includes(newCityId)) {
              setRevealedCities(prev => [...prev, newCityId]);
              discoveredCities.addCity(newCityId);
              setHighlightRegion(null);
              setFlyToCity(newCityId);
            }
          }
        }
      }

      if (turn.type === "game_over") {
        playSound("gameOver" as Parameters<typeof playSound>[0]);
        gameState.processToolResult("end_game", { reason: turn.reason, finalMessage: turn.message, totalScore: gameState.state.score, correctAnswers: gameState.state.correctAnswers, totalRounds: 5 });
      }

      // Update city tracking
      // After correct answer: targetCityId = next city (for hint + new currentCityId)
      // After wrong answer:   targetCityId = same city
      if (isCityExplorer) {
        if (isCorrect) {
          setCurrentCityId(targetCityId);  // advance to next city
        } else if (!currentCityId && newCityId) {
          setCurrentCityId(newCityId);     // first request — set from server
        }
      }

      // Update pending hint
      if (hint) {
        const newHintCityId = targetCityId ?? null;
        if (newHintCityId !== prevHintCityIdRef.current) {
          prevHintCityIdRef.current = newHintCityId;
        }
        setPendingHint({ hint, images: hintImages, targetCityId });
      }

      // After correct answer: trim history to just the new round's message
      if (isCorrect) {
        setMessages([assistantMsg]);
      } else {
        setMessages([...updatedMessages, assistantMsg]);
      }
    } catch (err) {
      console.error("[game] send error:", err);
      // Remove optimistic user message on error
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading, messages, gameId, currentCityId, isCityExplorer,
    discoveredCities.discoveredIds, discoveredCities.addCity,
    gameState, gameRewards, config.pointsPerCorrect,
    activeProfile, getContext, playSound,
    user, showVerificationModal,
  ]);

  // Auto-send "Start!" message
  useEffect(() => {
    if (gameStarted && !startSentRef.current) {
      startSentRef.current = true;
      playSound("gameStart" as Parameters<typeof playSound>[0]);
      void sendGameMessage("ابدأ!");
    }
  }, [gameStarted]); // eslint-disable-line react-hooks/exhaustive-deps

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
    textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
  }, [input]);

  // displayMessages — messages are already clean, no transformation needed
  const displayMessages = messages;

  const { shouldHide: shouldHideMsg, revealClass: getRevealClass, showTypingBubble } = useStaticReveal(status, displayMessages, chatSettings.displayMode);

  // Auto-read assistant messages when loading completes
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

  // Active options — last assistant message with options
  const activeOptions = useMemo<{
    messageId: string;
    options: string[];
    hint: string | undefined;
    hintImages: string[] | undefined;
    targetCityId: string | undefined;
    targetCityNameAr: string | undefined;
    hasHint: boolean;
  } | null>(() => {
    if (isLoading) return null;
    for (let i = displayMessages.length - 1; i >= 0; i--) {
      const msg = displayMessages[i];
      if (msg.role === "assistant" && msg.options?.length) {
        return {
          messageId: msg.id,
          options: msg.options,
          hint: msg.hint,
          hintImages: msg.hintImages,
          targetCityId: msg.targetCityId,
          targetCityNameAr: msg.targetCityNameAr,
          hasHint: !!msg.hint,
        };
      }
    }
    return null;
  }, [displayMessages, isLoading]);

  const hasActiveOptions = activeOptions !== null;

  const handleOptionClick = useCallback((optionText: string) => {
    if (isLoading) return;
    stopSpeaking();
    playSound("click");
    void sendGameMessage(optionText);
  }, [isLoading, playSound, sendGameMessage, stopSpeaking]);

  const handleHintClick = useCallback(() => {
    if (isLoading || !pendingHint) return;
    stopSpeaking();
    playSound("hint" as Parameters<typeof playSound>[0]);
    setShowPendingHint(true);

    if (isCityExplorer && pendingHint.targetCityId) {
      const city = CITIES.find(c => c.id === pendingHint.targetCityId);
      if (city && typeof city.lat === "number" && typeof city.lng === "number" && !isNaN(city.lat) && !isNaN(city.lng)) {
        setMapUncollapseTrigger(c => c + 1);
        setFlyToCity("");
        setTimeout(() => setFlyToCity(pendingHint.targetCityId!), 150);
      }
    }
  }, [isLoading, playSound, stopSpeaking, pendingHint, isCityExplorer]);

  const playerAge = activeProfile?.age;
  const isYoungKid = playerAge !== undefined && playerAge <= 7;
  const canSend = input.trim().length > 0 && !isLoading;

  const handleSubmit = useCallback((event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    stopSpeaking();
    setInput("");
    playSound("click");
    void sendGameMessage(trimmed);
  }, [input, isLoading, playSound, sendGameMessage, stopSpeaking]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────

  if (!isLoaded) return null;

  if (profiles.length === 0) {
    return (
      <ProfileSetup
        onComplete={(data) => { createProfile(data); }}
        existingProfiles={profiles}
      />
    );
  }

  if (activeProfile && !activeProfile.name) {
    return (
      <ProfileSetup
        onComplete={(data) => { updateProfile(activeProfile.id, data); }}
        existingProfiles={profiles}
      />
    );
  }

  if (!activeProfile) return null;

  if (!gameStarted) {
    setGameStarted(true);
  }

  if (gameState.state.status === "finished" && gameState.summary) {
    return (
      <GameOverScreen
        summary={gameState.summary}
        onPlayAgain={() => {
          startSentRef.current = false;
          prevMsgCountRef.current = 0;
          setMessages([]);
          gameState.resetGame();
          setGameStarted(false);
          setCurrentCityId(null);
          prevHintCityIdRef.current = null;
          setPendingHint(null);
          setShowPendingHint(false);
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
      <div className="relative flex h-dvh flex-col overflow-hidden">
        {/* Game header */}
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

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Map panel — mobile only */}
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

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
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
                      isStreaming={false}
                      imageResults={null}
                      isSpeaking={currentMessageId === msg.id}
                      onSpeak={() => speakMessage(msg)}
                      onStopSpeaking={stopSpeaking}
                      textStyle={textStyle}
                      {...(reveal ? { className: reveal } : {})}
                    />
                  );
                })}

                {/* Hint bubble — shown above options when player taps hint */}
                {showPendingHint && pendingHint && (
                  <div className="px-4 py-3 rounded-2xl shadow-md bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 animate-pop-in">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">💡</span>
                      <span className="font-bold text-sm text-yellow-700">تلميح مساعد</span>
                    </div>
                    <p className="text-base text-gray-700 leading-relaxed" dir="auto">
                      {pendingHint.hint}
                    </p>
                    {pendingHint.images && pendingHint.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {pendingHint.images.slice(0, 2).map((url, i) => (
                          <div key={i} className="relative rounded-xl overflow-hidden border-2 border-yellow-200">
                            <img src={url} alt="" className="w-full h-24 object-cover" loading="lazy" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Active city options */}
                {activeOptions && (
                  <CityOptionsBlock
                    options={activeOptions.options}
                    hasHint={activeOptions.hasHint}
                    onOptionClick={handleOptionClick}
                    onHintClick={handleHintClick}
                    hintAlreadyShown={showPendingHint}
                    targetCityNameAr={activeOptions.targetCityNameAr}
                  />
                )}

                {isLoading && (showTypingBubble || displayMessages[displayMessages.length - 1]?.role !== "assistant") && (
                  <GameTypingBubble />
                )}
              </div>
            </main>

            {/* Input area */}
            <div className="shrink-0 p-3 sm:p-4 z-20">
              <div className={`mx-auto flex flex-col gap-2 ${isCityExplorer ? "max-w-3xl" : "max-w-2xl"}`}>
                {tokenQuota.isBlocked ? (
                  <MedhatBlockedMessage className="mx-2 mb-2" />
                ) : (
                <form onSubmit={(event) => void handleSubmit(event)}>
                  <div className={`flex items-end gap-2 sm:gap-3 rounded-[2rem] bg-white/90 backdrop-blur-xl border border-white/50 p-2 sm:p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all focus-within:shadow-[0_8px_32px_rgba(108,92,231,0.2)] focus-within:bg-white ${hasActiveOptions ? "opacity-90 grayscale-[0.5]" : ""}`}>
                    {isYoungKid && (
                      <div className="shrink-0">
                        <SpeechInput
                          onTranscript={(text) => setInput(prev => prev ? prev + " " + text : text)}
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

                    {!isYoungKid && (
                      <div className="shrink-0">
                        <SpeechInput
                          onTranscript={(text) => setInput(prev => prev ? prev + " " + text : text)}
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
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop map panel */}
        {isCityExplorer && (
          <div className="hidden md:block absolute top-[60px] right-3 w-[25%] min-w-[200px] max-w-[350px] h-[70%] z-10" style={{ marginBlockStart: "5rem" }}>
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

        <Confetti show={showConfetti} variant="celebration" />
      </div>
    </AnimatedBackground>
  );
}

// ── City Options Block ─────────────────────────────────────────────────

const NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];

function CityOptionsBlock({
  options, hasHint, onOptionClick, onHintClick, hintAlreadyShown = false, targetCityNameAr,
}: {
  options: string[];
  hasHint: boolean;
  onOptionClick: (text: string) => void;
  onHintClick: () => void;
  hintAlreadyShown?: boolean;
  targetCityNameAr?: string;
}) {
  const [wrongOption, setWrongOption] = useState<string | null>(null);

  const handleClick = (option: string) => {
    if (targetCityNameAr && option !== targetCityNameAr) {
      setWrongOption(option);
      setTimeout(() => setWrongOption(null), 600);
      return;
    }
    onOptionClick(option);
  };

  return (
    <div className="flex flex-col gap-3 animate-pop-in my-2">
      <div className="text-center text-sm text-[var(--kids-purple)] font-bold opacity-80 mb-1">
        اختار الإجابة الصحيحة 👇
      </div>
      <div className="grid gap-3">
        {options.map((option, i) => {
          const isWrong = wrongOption === option;
          return (
            <button
              key={i}
              onClick={() => handleClick(option)}
              disabled={!!wrongOption}
              className={`group relative flex items-center gap-3 px-5 py-4 rounded-3xl text-right transition-all shadow-md border-2 overflow-hidden ${
                isWrong
                  ? "animate-shake bg-red-100 border-red-400 text-red-700 cursor-not-allowed"
                  : "bg-white border-[var(--kids-purple)]/20 text-gray-800 hover:bg-purple-50 hover:border-[var(--kids-purple)] hover:scale-[1.02] hover:shadow-lg active:scale-95 cursor-pointer"
              }`}
              dir="auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--kids-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-2xl shrink-0 filter drop-shadow-sm">{NUMBER_EMOJIS[i]}</span>
              <span className="text-base sm:text-lg font-bold leading-relaxed">{option}</span>
            </button>
          );
        })}
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
