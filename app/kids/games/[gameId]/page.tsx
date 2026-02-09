"use client";

import { useParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef, useMemo, FormEvent, KeyboardEvent, useCallback } from "react";
import { GameId, GameDifficulty, GameConfig } from "@/lib/types/games";
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
import GameChatBubble, { GameTypingBubble } from "../../../components/kids/games/GameChatBubble";
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
      let hintData: { hint: string; hintNumber: number } | null = null;

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
                isSpeaking={currentMessageId === msg.id}
                onSpeak={() => speakMessage(msg)}
                onStopSpeaking={stopSpeaking}
              />
            ))}

            {isLoading &&
              displayMessages[displayMessages.length - 1]?.role !== "assistant" && (
                <GameTypingBubble />
              )}
          </div>
        </main>

        {/* Input area */}
        <div className="shrink-0 border-t-2 border-[var(--kids-yellow)]/30 bg-white/90 backdrop-blur-sm px-4 py-3">
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="mx-auto max-w-2xl"
          >
            <div className="flex items-end gap-3 rounded-2xl border-2 border-[var(--kids-purple)]/30 bg-white px-3 py-2 shadow-md focus-within:border-[var(--kids-purple)] transition-colors">
              <textarea
                ref={textareaRef}
                className="min-h-[36px] flex-1 resize-none bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none leading-5"
                placeholder="اكتب جوابك هنا... ✍️"
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
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--kids-green)] text-white text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shadow-md"
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
