"use client";

import { useParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef, useMemo, FormEvent, KeyboardEvent, useCallback } from "react";
import { GameId, GameDifficulty, GameConfig } from "@/lib/types/games";
import { ImageResult } from "@/lib/types";
import { getGameConfig, GAME_CONFIGS } from "@/lib/data/games";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useGameState } from "@/lib/hooks/useGameState";
import { useGameRewards } from "@/lib/hooks/useGameRewards";
import { useChatContext } from "@/lib/hooks/useChatContext";
import { useSounds } from "@/lib/hooks/useSounds";
import { useVoiceSynthesis } from "@/lib/hooks/useVoiceSynthesis";
import AnimatedBackground from "../../../components/kids/AnimatedBackground";
import ErrorBoundary from "../../../components/ErrorBoundary";
import ProfileSetup from "../../../components/kids/ProfileSetup";
import DifficultySelector from "../../../components/kids/games/DifficultySelector";
import GameHeader from "../../../components/kids/games/GameHeader";
import GameChatBubble, { GameTypingBubble, OptionsData } from "../../../components/kids/games/GameChatBubble";
import GameOverScreen from "../../../components/kids/games/GameOverScreen";
import Confetti from "../../../components/kids/Confetti";
import SpeechInput from "../../../components/kids/SpeechInput";
import dynamic from "next/dynamic";
import { CITIES, detectCityInText } from "@/lib/data/cities";

const PalestineLeafletMap = dynamic(
  () => import("../../../components/kids/PalestineLeafletMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-sky-100/30 rounded-2xl">
        <div className="w-6 h-6 border-2 border-[var(--kids-purple)]/30 border-t-[var(--kids-purple)] rounded-full animate-spin" />
      </div>
    ),
  }
);

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
  const [mapExpanded, setMapExpanded] = useState(true);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startSentRef = useRef(false);

  // Profiles
  const {
    profiles,
    activeProfile,
    isLoaded,
    createProfile,
    updateProfile,
  } = useProfiles();

  const profileId = activeProfile?.id;

  const { soundEnabled, toggleSound, playSound } = useSounds();
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
  const gameState = useGameState(gameId, difficulty || undefined, profileId);
  const gameRewards = useGameRewards(profileId);

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
          },
        }),
      [gameId, difficulty, activeProfile, getContext]
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
                // Map: reveal city on correct answer
                if (isCityExplorer && toolPart.output.explanation) {
                  const cityId = detectCityInText(toolPart.output.explanation as string);
                  if (cityId && !revealedCities.includes(cityId)) {
                    setRevealedCities((prev) => [...prev, cityId]);
                    setHighlightRegion(null);
                  }
                }
              } else {
                playSound("wrong" as any);
                // Map: also reveal on incorrect (answer was shown)
                if (isCityExplorer && toolPart.output.explanation) {
                  const cityId = detectCityInText(toolPart.output.explanation as string);
                  if (cityId && !revealedCities.includes(cityId)) {
                    setRevealedCities((prev) => [...prev, cityId]);
                    setHighlightRegion(null);
                  }
                }
              }
            } else if (toolName === "give_hint") {
              playSound("hint" as any);
              // Map: highlight region on hint
              if (isCityExplorer && toolPart.output.hint) {
                const cityId = detectCityInText(toolPart.output.hint as string);
                if (cityId) {
                  setHighlightRegion(cityId);
                }
              }
            } else if (toolName === "advance_round") {
              playSound("correct" as any);
              gameRewards.onRoundComplete(
                gameId,
                (toolPart.output.pointsEarned as number) || config.pointsPerCorrect
              );
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

  // Resize textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
  }, [input]);

  // Convert messages for display
  const displayMessages = useMemo(() => {
    return aiMessages.map((msg) => {
      let textContent = "";
      let answerResult: { correct: boolean; explanation: string } | null = null;
      let hintData: { hint: string; hintNumber: number; images?: ImageResult[] } | null = null;
      let optionsData: OptionsData | null = null;

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
              hintData = {
                hint: toolPart.output.hint as string,
                hintNumber: toolPart.output.hintNumber as number,
                images: toolPart.output.images as ImageResult[] | undefined,
              };
            } else if (toolName === "present_options") {
              optionsData = {
                options: toolPart.output.options as string[],
                allowHint: toolPart.output.allowHint as boolean,
              };
            }
          }
        }
      }

      return {
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: textContent,
        answerResult,
        hintData,
        optionsData,
      };
    });
  }, [aiMessages]);

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
  // Skips hint exchanges (user "تلميح" + assistant hint response) so options stay active after hints
  const activeOptions = useMemo<{ messageId: string; data: OptionsData } | null>(() => {
    if (status === "streaming") return null;
    for (let i = displayMessages.length - 1; i >= 0; i--) {
      const msg = displayMessages[i];
      if (msg.role === "user") {
        const text = msg.content.trim();
        const isHint = text === "تلميح" || text.toLowerCase() === "hint";
        if (isHint) continue; // skip hint requests
        return null; // real answer — disable options
      }
      if (msg.role === "assistant") {
        if (msg.optionsData) return { messageId: msg.id, data: msg.optionsData };
        if (msg.hintData && !msg.optionsData) continue; // skip hint responses
      }
    }
    return null;
  }, [displayMessages, status]);

  const hasActiveOptions = activeOptions !== null;

  const handleOptionClick = useCallback(
    (optionNumber: number) => {
      if (isLoading) return;
      stopSpeaking();
      playSound("click");
      sendMessage({ text: String(optionNumber) });
    },
    [isLoading, playSound, sendMessage, stopSpeaking]
  );

  const handleHintClick = useCallback(() => {
    if (isLoading) return;
    stopSpeaking();
    playSound("click");
    sendMessage({ text: "تلميح" });
  }, [isLoading, playSound, sendMessage, stopSpeaking]);

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
          // Reset map state
          setRevealedCities([]);
          setHighlightRegion(null);
          setMapExpanded(true);
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
          <div className="mx-auto max-w-4xl">
            <GameHeader
              config={config}
              state={gameState.state}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
              onBack={() => router.push("/kids/games")}
              voiceEnabled={voiceEnabled}
              onToggleVoice={toggleVoice}
              isSpeaking={isSpeaking}
              voiceSupported={voiceSupported}
            />
          </div>
        </header>

        {/* Map panel for city-explorer */}
        {isCityExplorer && (
          <div className="shrink-0 px-3 z-10">
            <div className="mx-auto max-w-2xl">
              <button
                onClick={() => setMapExpanded((v) => !v)}
                className="flex items-center gap-2 text-sm font-bold text-[var(--kids-purple)] bg-white/80 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm mb-1 hover:bg-white transition-colors"
              >
                <span>{mapExpanded ? "▼" : "▶"}</span>
                <span>🗺️ خريطة فلسطين</span>
                <span className="text-xs font-normal text-gray-500">
                  {revealedCities.length}/{CITIES.length} مدن مكتشفة 🌟
                </span>
              </button>
              {mapExpanded && (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-1.5 shadow-md overflow-hidden animate-pop-in">
                  <PalestineLeafletMap
                    gameMode
                    revealedCities={revealedCities}
                    highlightRegion={highlightRegion || undefined}
                    className="h-36 sm:h-40"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4 scroll-smooth" ref={chatContainerRef}>
          <div className="mx-auto max-w-2xl flex flex-col gap-4 pb-4">
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
                hintData={msg.hintData}
                optionsData={msg.optionsData}
                isActiveOptions={false}
                onOptionClick={handleOptionClick}
                onHintClick={handleHintClick}
                isSpeaking={currentMessageId === msg.id}
                onSpeak={() => speakMessage(msg)}
                onStopSpeaking={stopSpeaking}
              />
            ))}

            {/* Active options — render prominently at bottom */}
            {activeOptions && (
              <ActiveOptionsBlock
                optionsData={activeOptions.data}
                onOptionClick={handleOptionClick}
                onHintClick={handleHintClick}
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
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="mx-auto max-w-2xl"
          >
            <div className={`flex items-end gap-2 sm:gap-3 rounded-[2rem] bg-white/90 backdrop-blur-xl border border-white/50 p-2 sm:p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all focus-within:shadow-[0_8px_32px_rgba(108,92,231,0.2)] focus-within:bg-white ${hasActiveOptions ? "opacity-90 grayscale-[0.5]" : ""}`}>

              <textarea
                ref={textareaRef}
                className="flex-1 max-h-[100px] resize-none bg-transparent text-base sm:text-lg text-gray-800 placeholder:text-gray-400 focus:outline-none leading-relaxed px-2 py-2"
                placeholder={hasActiveOptions ? "أو اكتب جوابك... ✍️" : "اكتب جوابك هنا... ✍️"}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={300}
                disabled={isLoading}
                dir="auto"
              />

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
          </form>
        </div>

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
}: {
  optionsData: OptionsData;
  onOptionClick: (n: number) => void;
  onHintClick: () => void;
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
            onClick={() => onOptionClick(i + 1)}
            className="group relative flex items-center gap-3 px-5 py-4 rounded-3xl text-right transition-all shadow-md bg-white border-2 border-[var(--kids-purple)]/20 text-gray-800 hover:bg-purple-50 hover:border-[var(--kids-purple)] hover:scale-[1.02] hover:shadow-lg active:scale-95 cursor-pointer overflow-hidden"
            dir="auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--kids-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-2xl shrink-0 filter drop-shadow-sm">{NUMBER_EMOJIS[i]}</span>
            <span className="text-base sm:text-lg font-bold leading-relaxed">{option}</span>
          </button>
        ))}
      </div>

      {optionsData.allowHint && (
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
