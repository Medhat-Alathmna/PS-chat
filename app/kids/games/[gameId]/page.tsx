"use client";

import { useParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef, useMemo, FormEvent, KeyboardEvent, useCallback } from "react";
import { GameId, GameDifficulty, GameConfig } from "@/lib/types/games";
import { ImageResult } from "@/lib/types";
import { getGameConfig, GAME_CONFIGS } from "@/lib/data/games";
import { useGameState } from "@/lib/hooks/useGameState";
import { useGameRewards } from "@/lib/hooks/useGameRewards";
import { useChatContext } from "@/lib/hooks/useChatContext";
import { useSounds } from "@/lib/hooks/useSounds";
import { useVoiceSynthesis } from "@/lib/hooks/useVoiceSynthesis";
import AnimatedBackground from "../../../components/kids/AnimatedBackground";
import ErrorBoundary from "../../../components/ErrorBoundary";
import AgeGate, { getKidsProfile, KidsProfile } from "../../../components/kids/AgeGate";
import DifficultySelector from "../../../components/kids/games/DifficultySelector";
import GameHeader from "../../../components/kids/games/GameHeader";
import GameChatBubble, { GameTypingBubble, OptionsData } from "../../../components/kids/games/GameChatBubble";
import GameOverScreen from "../../../components/kids/games/GameOverScreen";
import Confetti from "../../../components/kids/Confetti";
import SpeechInput from "../../../components/kids/SpeechInput";

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
  const [profile, setProfile] = useState<KidsProfile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [difficulty, setDifficulty] = useState<GameDifficulty | null>(
    config.hasDifficulty ? null : "medium"
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [input, setInput] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startSentRef = useRef(false);

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
  const { getContext } = useChatContext();
  const gameState = useGameState(gameId, difficulty || undefined);
  const gameRewards = useGameRewards();

  // Check profile
  useEffect(() => {
    setProfile(getKidsProfile());
    setProfileChecked(true);
  }, []);

  // Chat hook
  const {
    messages: aiMessages,
    sendMessage,
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
            kidsProfile: profile,
          },
        }),
      [gameId, difficulty, profile, getContext]
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
              } else {
                playSound("wrong" as any);
              }
            } else if (toolName === "give_hint") {
              playSound("hint" as any);
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

  if (!profileChecked) return null;

  if (!profile) {
    return <AgeGate onComplete={(p) => setProfile(p)} />;
  }

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
          gameState.resetGame(difficulty || undefined);
          setGameStarted(false);
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
        {/* Palestinian stripe */}
        <div className="kids-ps-stripe shrink-0" />

        {/* Game header */}
        <header className="shrink-0 px-4 py-2">
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
        </header>

        {/* Chat area */}
        <main className="flex-1 overflow-y-auto px-4 py-4" ref={chatContainerRef}>
          <div className="mx-auto max-w-2xl flex flex-col gap-3">
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

            {/* Active options — always rendered at the bottom of chat */}
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

        {/* Input area */}
        <div className={`shrink-0 border-t-2 border-[var(--kids-yellow)]/30 bg-white/90 backdrop-blur-sm px-4 transition-all ${hasActiveOptions ? "py-1.5" : "py-3"}`}>
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="mx-auto max-w-2xl"
          >
            <div className={`flex items-end gap-2 rounded-2xl border-2 border-[var(--kids-purple)]/30 bg-white px-3 shadow-md focus-within:border-[var(--kids-purple)] transition-all ${hasActiveOptions ? "py-1 gap-2" : "py-2 gap-3"}`}>
              <textarea
                ref={textareaRef}
                className={`flex-1 resize-none bg-transparent text-gray-700 placeholder:text-gray-400 focus:outline-none leading-5 transition-all ${hasActiveOptions ? "min-h-[28px] text-xs" : "min-h-[36px] text-sm"}`}
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
              <SpeechInput
                onTranscript={(text) => setInput((prev) => prev ? prev + " " + text : text)}
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={!canSend}
                className={`flex items-center justify-center rounded-xl bg-[var(--kids-green)] text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shadow-md ${hasActiveOptions ? "h-8 w-8 text-base" : "h-10 w-10 text-lg"}`}
                aria-label="إرسال"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "🚀"
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
    <div className="flex flex-col gap-2 animate-pop-in mr-10">
      {optionsData.options.map((option, i) => (
        <button
          key={i}
          onClick={() => onOptionClick(i + 1)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-right transition-all shadow-sm bg-purple-50 border-2 border-[var(--kids-purple)]/30 text-gray-700 hover:bg-purple-100 hover:border-[var(--kids-purple)] hover:scale-[1.02] active:scale-95 cursor-pointer"
          dir="auto"
        >
          <span className="text-lg shrink-0">{NUMBER_EMOJIS[i]}</span>
          <span className="leading-relaxed">{option}</span>
        </button>
      ))}
      {optionsData.allowHint && (
        <button
          onClick={() => onHintClick()}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium border-2 border-dashed border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-500 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-lg">💡</span>
          <span>تلميح</span>
        </button>
      )}
    </div>
  );
}
