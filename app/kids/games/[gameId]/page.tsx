"use client";

import { useParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef, useMemo, FormEvent, KeyboardEvent, useCallback } from "react";
import { GameId, GameDifficulty, GameConfig } from "@/lib/types/games";
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
import AnimatedBackground from "../../../components/kids/AnimatedBackground";
import ErrorBoundary from "../../../components/ErrorBoundary";
import ProfileSetup from "../../../components/kids/ProfileSetup";
import DifficultySelector from "../../../components/kids/games/DifficultySelector";
import GameHeader from "../../../components/kids/games/GameHeader";
import GameChatBubble, { GameTypingBubble, OptionsData } from "../../../components/kids/games/GameChatBubble";
import GameOverScreen from "../../../components/kids/games/GameOverScreen";
import Confetti from "../../../components/kids/Confetti";
import SpeechInput from "../../../components/kids/SpeechInput";
import QuickReplyChips, { QuickReplyData, normalizeSuggestions } from "../../../components/kids/games/QuickReplyChips";
import type { SuggestionChip } from "../../../components/kids/games/QuickReplyChips";
import { CITIES, detectCityInText } from "@/lib/data/cities";
import ExpandableMap from "../../../components/kids/ExpandableMap";

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
  const [difficulty, setDifficulty] = useState<GameDifficulty | null>(
    config.hasDifficulty ? null : "medium"
  );
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

  // Pending hint state - hint is pre-generated with options but hidden until requested
  const [pendingHint, setPendingHint] = useState<{ hint: string; images?: ImageResult[]; targetCityId?: string } | null>(null);
  const [showPendingHint, setShowPendingHint] = useState(false);

  // Random seed so each session starts with a different city (not always Jerusalem)
  const [sessionSeed, setSessionSeed] = useState(() => Math.floor(Math.random() * 10000));

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startSentRef = useRef(false);

  // Auto-advance: after correct answer, auto-send "next question" so the AI presents the next city
  const autoAdvancePending = useRef(false);

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
  const gameState = useGameState(gameId, difficulty || undefined, profileId);
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
            difficulty: difficulty || "medium",
            chatContext: getContext(),
            kidsProfile: activeProfile,
            discoveredCityIds: isCityExplorer ? discoveredCities.discoveredIds : undefined,
            sessionSeed,
          },
        }),
      [gameId, difficulty, activeProfile, getContext, isCityExplorer, discoveredCities.discoveredIds]
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

            // Play sounds
            if (toolName === "check_answer") {
              if (toolPart.output.correct) {
                playSound("correct" as any);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 2000);
                gameRewards.onCorrectAnswer(
                  gameId,
                  (toolPart.output.pointsEarned as number) || config.pointsPerCorrect
                );
                // Schedule auto-advance to next question
                autoAdvancePending.current = true;
                // Map: reveal city on correct answer and auto-zoom to it
                if (isCityExplorer && toolPart.output.explanation) {
                  const cityId = detectCityInText(toolPart.output.explanation as string);
                  if (cityId && !revealedCities.includes(cityId)) {
                    // Verify city has valid coordinates
                    const city = CITIES.find((c) => c.id === cityId);
                    if (city && typeof city.lat === "number" && typeof city.lng === "number" && !isNaN(city.lat) && !isNaN(city.lng)) {
                      setRevealedCities((prev) => [...prev, cityId]);
                      setHighlightRegion(null);
                      setFlyToCity(cityId); // auto-zoom map to this city
                      discoveredCities.addCity(cityId); // persist across sessions
                    }
                  }
                }
              } else {
                playSound("wrong" as any);
                // Map: on wrong answer, do NOT reveal the city — let them keep trying!
                // Only reveal when answer is explicitly given up (handled by advance_round)
              }
            } else if (toolName === "give_hint") {
              playSound("hint" as any);
              if (isCityExplorer) {
                // Map: highlight region on hint
                if (toolPart.output.hint) {
                  const cityId = detectCityInText(toolPart.output.hint as string);
                  if (cityId) {
                    const city = CITIES.find((c) => c.id === cityId);
                    if (city && typeof city.lat === "number" && typeof city.lng === "number" && !isNaN(city.lat) && !isNaN(city.lng)) {
                      setHighlightRegion(cityId);
                    }
                  }
                }
                // On first hint: zoom map to target city
                if (toolPart.output.hintNumber === 1 && toolPart.output.targetCityId) {
                  const targetId = toolPart.output.targetCityId as string;
                  const city = CITIES.find((c) => c.id === targetId);
                  if (city && typeof city.lat === "number" && typeof city.lng === "number" && !isNaN(city.lat) && !isNaN(city.lng)) {
                    // Mobile: uncollapse map (without fullscreen)
                    setMapUncollapseTrigger((c) => c + 1);
                    // Zoom to the target city (both desktop & mobile)
                    setFlyToCity("");
                    setTimeout(() => setFlyToCity(targetId), 150);
                  }
                }
              }
            } else if (toolName === "advance_round") {
              // Check if check_answer(correct) already fired in the same message (avoids double sound/points)
              const hadCorrectAnswer = msg.parts.some((p) => {
                if (!p.type.startsWith("tool-")) return false;
                const tp = p as { type: string; output?: Record<string, unknown> };
                return tp.type.replace("tool-", "") === "check_answer" && tp.output?.correct === true;
              });

              if (!hadCorrectAnswer) {
                // Only play sound + award points if check_answer didn't already do it
                playSound("correct" as any);
              }
              gameRewards.onRoundComplete(
                gameId,
                hadCorrectAnswer ? 0 : ((toolPart.output.pointsEarned as number) || config.pointsPerCorrect)
              );
              // Map: also reveal city when advancing round (covers give-up case)
              if (isCityExplorer && toolPart.output.feedback) {
                const cityId = detectCityInText(toolPart.output.feedback as string);
                if (cityId && !revealedCities.includes(cityId)) {
                  const city = CITIES.find((c) => c.id === cityId);
                  if (city && typeof city.lat === "number" && typeof city.lng === "number" && !isNaN(city.lat) && !isNaN(city.lng)) {
                    setRevealedCities((prev) => [...prev, cityId]);
                    setHighlightRegion(null);
                    setFlyToCity(cityId);
                    discoveredCities.addCity(cityId);
                  }
                }
              }
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
    if (gameStarted && difficulty && !startSentRef.current) {
      startSentRef.current = true;
      playSound("gameStart" as any);
      sendMessage({ text: "ابدأ!" });
    }
  }, [gameStarted, difficulty, sendMessage, playSound]);

  // Auto-scroll
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [aiMessages, isLoading]);

  // Auto-advance to next question after correct answer
  useEffect(() => {
    if (status !== "ready" || !autoAdvancePending.current) return;
    autoAdvancePending.current = false;

    // Count advance_round calls to determine current round
    let advanceCount = 0;
    for (const msg of aiMessages) {
      if (msg.role !== "assistant") continue;
      for (const part of msg.parts) {
        if (part.type === "tool-invocation") {
          const tp = part as Record<string, unknown>;
          if (tp.toolName === "advance_round") advanceCount++;
        }
      }
    }

    // Don't auto-advance on last round — let AI call end_game
    const maxRounds = typeof config.rounds === "number" ? config.rounds : 99;
    if (advanceCount >= maxRounds - 1) return;

    const timer = setTimeout(() => {
      sendMessage({ text: "السؤال الجاي" });
    }, 1500);
    return () => clearTimeout(timer);
  }, [status, aiMessages, config.rounds, sendMessage]);

  // Resize textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
  }, [input]);

  // Convert messages for display
  // NOTE: give_hint data is extracted but NOT displayed in the message
  // Instead, it's stored as pendingHint and shown when the player taps the hint button
  const displayMessages = useMemo(() => {
    return aiMessages.filter((msg) => {
      // Hide auto-advance "next question" messages from display
      if (msg.role === "user") {
        const text = msg.parts
          .filter((p) => p.type === "text")
          .map((p) => (p as { type: "text"; text: string }).text)
          .join("")
          .trim();
        if (text === "السؤال الجاي") return false;
      }
      return true;
    }).map((msg) => {
      let textContent = "";
      let answerResult: { correct: boolean; explanation: string } | null = null;
      let hiddenHintData: { hint: string; images?: ImageResult[]; targetCityId?: string } | null = null;
      let optionsData: OptionsData | null = null;
      let suggestRepliesData: QuickReplyData | null = null;
      let imageResults: ImageResult[] | null = null;

      for (const part of msg.parts) {
        if (part.type === "text") {
          textContent += part.text;
        } else if (part.type.startsWith("tool-")) {
          const toolPart = part as {
            type: string;
            state: string;
            output?: Record<string, unknown>;
          };
          if (toolPart.state === "output-available" && toolPart.output) {
            const toolName = toolPart.type.replace("tool-", "");
            if (toolName === "check_answer") {
              answerResult = {
                correct: toolPart.output.correct as boolean,
                explanation: toolPart.output.explanation as string,
              };
            } else if (toolName === "give_hint") {
              // Store hint data but don't display it - will be shown on button click
              hiddenHintData = {
                hint: toolPart.output.hint as string,
                images: toolPart.output.images as ImageResult[] | undefined,
                targetCityId: toolPart.output.targetCityId as string | undefined,
              };
            } else if (toolName === "present_options") {
              optionsData = {
                options: toolPart.output.options as string[],
                allowHint: toolPart.output.allowHint as boolean,
              };
            } else if (toolName === "suggest_replies") {
              suggestRepliesData = {
                suggestions: normalizeSuggestions(toolPart.output.suggestions as unknown[]),
                showHintChip: toolPart.output.showHintChip as boolean,
              };
            } else if (toolName === "image_search") {
              const imgs = toolPart.output.images as ImageResult[] | undefined;
              if (imgs && imgs.length > 0) {
                imageResults = imgs;
              }
            }
          }
        }
      }

      return {
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: textContent,
        answerResult,
        hiddenHintData, // Not passed to GameChatBubble
        optionsData,
        suggestRepliesData,
        imageResults,
      };
    });
  }, [aiMessages]);

  // Extract pending hint from the last assistant message with options
  // The hint is pre-generated with give_hint but hidden until the player requests it
  useEffect(() => {
    if (status === "streaming") {
      // Clear pending hint when streaming new content
      setPendingHint(null);
      setShowPendingHint(false);
      return;
    }

    // Find the last assistant message with optionsData
    for (let i = displayMessages.length - 1; i >= 0; i--) {
      const msg = displayMessages[i];
      if (msg.role === "assistant" && msg.optionsData) {
        // Check if this message also has hidden hint data
        const hintMsg = msg as typeof msg & { hiddenHintData?: { hint: string; images?: ImageResult[]; targetCityId?: string } | null };
        if (hintMsg.hiddenHintData) {
          setPendingHint(hintMsg.hiddenHintData);
          return;
        }
      }
    }

    // No pending hint found
    setPendingHint(null);
    setShowPendingHint(false);
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

  // Find the active options data (from the last unanswered question)
  // Also keeps options active after wrong answers (check_answer correct:false)
  const activeOptions = useMemo<{ messageId: string; data: OptionsData; hasHint: boolean } | null>(() => {
    if (status === "streaming") return null;
    for (let i = displayMessages.length - 1; i >= 0; i--) {
      const msg = displayMessages[i];
      if (msg.role === "user") {
        // Check if this answer was wrong — if so, keep options active for retry
        const nextMsg = i + 1 < displayMessages.length ? displayMessages[i + 1] : null;
        if (nextMsg?.role === "assistant" && nextMsg.answerResult && !nextMsg.answerResult.correct) {
          continue; // wrong answer — keep looking back for options
        }
        return null; // correct answer or new question — disable options
      }
      if (msg.role === "assistant") {
        if (msg.optionsData) {
          const hintMsg = msg as typeof msg & { hiddenHintData?: { hint: string; images?: ImageResult[]; targetCityId?: string } | null };
          return {
            messageId: msg.id,
            data: msg.optionsData,
            hasHint: !!hintMsg.hiddenHintData
          };
        }
        if (msg.answerResult && !msg.answerResult.correct) continue; // skip wrong answer responses
      }
    }
    return null;
  }, [displayMessages, status]);

  // Find active quick reply suggestions (from the last assistant message with suggest_replies)
  const activeQuickReplies = useMemo<QuickReplyData | null>(() => {
    if (status === "streaming") return null;
    // Only show if the last message is from assistant (no user reply yet)
    const lastMsg = displayMessages[displayMessages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return null;
    return lastMsg.suggestRepliesData;
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

    // If we have a pending hint, show it directly without sending a message
    if (pendingHint) {
      setShowPendingHint(true);

      // Map: zoom to target city if available
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

  const handleChipClick = useCallback(
    (chip: SuggestionChip) => {
      if (isLoading) return;
      stopSpeaking();
      playSound("click");

      // Map chip — expand map + fly to city
      if (chip.type === "map") {
        if (chip.actionQuery) {
          const cityId = detectCityInText(chip.actionQuery);
          if (cityId) {
            const city = CITIES.find((c) => c.id === cityId);
            if (city && typeof city.lat === "number" && typeof city.lng === "number" && !isNaN(city.lat) && !isNaN(city.lng)) {
              setFlyToCity("");
              setMapExpandTrigger((c) => c + 1);
              setTimeout(() => setFlyToCity(cityId), 150);
              return;
            }
          }
        }
        // Fallback for map with no valid actionQuery — fly to last discovered city
        if (isCityExplorer) {
          const lastCity = revealedCities[revealedCities.length - 1];
          if (lastCity) {
            setFlyToCity("");
            setMapExpandTrigger((c) => c + 1);
            setTimeout(() => setFlyToCity(lastCity), 150);
          }
        }
        return;
      }

      // Photo/curiosity/activity — send as message in game context
      sendMessage({ text: chip.text });
    },
    [isLoading, playSound, sendMessage, stopSpeaking, isCityExplorer, revealedCities]
  );

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

  // Difficulty selection
  if (config.hasDifficulty && !difficulty) {
    return (
      <AnimatedBackground variant="sky" showClouds>
        <DifficultySelector
          onSelect={(d) => {
            setDifficulty(d);
            setGameStarted(true);
          }}
        />
      </AnimatedBackground>
    );
  }

  // Auto-start for games without difficulty
  if (!gameStarted && difficulty) {
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
          prevMsgCountRef.current = 0;
          setMessages([]); // Clear chat history so AI starts fresh
          gameState.resetGame(difficulty || undefined);
          setGameStarted(false);
          // Reset map state + new random seed for next session
          setSessionSeed(Math.floor(Math.random() * 10000));
          setRevealedCities([]);
          setHighlightRegion(null);
          setFlyToCity(null);
          if (config.hasDifficulty) {
            setDifficulty(null);
          } else {
            setGameStarted(true);
          }
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
            <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4 scroll-smooth" ref={chatContainerRef}>
              <div className={`mx-auto flex flex-col gap-4 pb-4 ${isCityExplorer ? "max-w-3xl" : "max-w-2xl"}`}>
                {displayMessages.map((msg, index) => (
                  <GameChatBubble
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    isStreaming={
                      status === "streaming" &&
                      index === displayMessages.length - 1 &&
                      msg.role === "assistant"
                    }
                    answerResult={msg.answerResult}
                    hintData={null}
                    optionsData={msg.optionsData}
                    isActiveOptions={false}
                    onOptionClick={handleOptionClick}
                    onHintClick={handleHintClick}
                    imageResults={msg.imageResults}
                    isSpeaking={currentMessageId === msg.id}
                    onSpeak={() => speakMessage(msg)}
                    onStopSpeaking={stopSpeaking}
                    textStyle={textStyle}
                  />
                ))}

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

                {/* Active options — render prominently at bottom (always visible for selection) */}
                {activeOptions && (
                  <ActiveOptionsBlock
                    optionsData={activeOptions.data}
                    onOptionClick={handleOptionClick}
                    onHintClick={handleHintClick}
                    hintAlreadyShown={showPendingHint}
                  />
                )}

                {/* Quick reply suggestions — below the last assistant message */}
                {activeQuickReplies && !isLoading && (
                  <QuickReplyChips
                    data={activeQuickReplies}
                    onChipClick={handleChipClick}
                    onHintClick={handleHintClick}
                    disabled={isLoading}
                  />
                )}

                {isLoading &&
                  displayMessages[displayMessages.length - 1]?.role !== "assistant" && (
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

function ActiveOptionsBlock({
  optionsData,
  onOptionClick,
  onHintClick,
  hintAlreadyShown = false,
}: {
  optionsData: OptionsData;
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
        {optionsData.options.map((option, i) => (
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

      {/* Only show hint button if hint is allowed AND not already shown */}
      {optionsData.allowHint && !hintAlreadyShown && (
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
