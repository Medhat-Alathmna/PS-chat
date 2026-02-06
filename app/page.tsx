"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import IntroScreen from "./components/IntroScreen";
import ChatBubble from "./components/ChatBubble";
import ThemeToggle from "./components/ThemeToggle";
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
} from "@/lib/types";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai/config";

type Mode = "promptId" | "localPrompt";

export default function ChatPage() {
  const [mode, setMode] = useState<Mode>("localPrompt");
  const [started, setStarted] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState<string | null>(null);
  const [promptId, setPromptId] = useState("");
  const [input, setInput] = useState("");
  const [showDebug, setShowDebug] = useState(false); // Hidden by default

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const initialScrollRef = useRef(true);

  // Use the AI SDK useChat hook
  const {
    messages: aiMessages,
    sendMessage,
    status,
    error,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        config:
          mode === "promptId"
            ? { mode, promptId: promptId.trim() }
            : { mode, systemPrompt: DEFAULT_SYSTEM_PROMPT },
      },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Convert AI SDK messages to our ChatMessage format
  const messages = useMemo<ChatMessage[]>(() => {
    return aiMessages.map((msg) => {
      let images: ImageResult[] | undefined;
      let location: LocationInfo | undefined;
      let mapData: MapData | undefined;
      let webSearchResults: WebSearchResultItem[] | undefined;
      let video: VideoResult | undefined;
      let news: NewsItem[] | undefined;
      let timeline: TimelineEvent[] | undefined;
      let textContent = "";
      const toolCalls: ToolCallInfo[] = [];

      // Process message parts
      for (const part of msg.parts) {
        if (part.type === "text") {
          textContent += part.text;
        } else if (part.type.startsWith("tool-")) {
          const toolName = part.type.replace("tool-", "");
          const toolPart = part as {
            type: string;
            toolCallId: string;
            state: string;
            input?: Record<string, unknown>;
            output?: unknown;
          };

          // Add to tool calls for debug
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
        createdAt: Date.now(),
        images,
        location,
        mapData,
        webSearchResults,
        video,
        news,
        timeline,
        debug: showDebug
          ? {
              messageId: msg.id,
              toolCalls,
            }
          : undefined,
      };
    });
  }, [aiMessages, showDebug]);

  const canSend = input.trim().length > 0 && !isLoading;

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const behavior =
      initialScrollRef.current || messages.length <= 1 ? "auto" : "smooth";

    initialScrollRef.current = false;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!textareaRef.current) return;
    resizeTextarea(textareaRef.current);
  }, [input]);

  useEffect(() => {
    if (initialQuestion && started) {
      setInput(initialQuestion);
      setTimeout(() => {
        void handleSubmit();
      }, 500);
    }
  }, [initialQuestion, started]);

  const assistantTypingStub = useMemo<ChatMessage | null>(() => {
    if (!isLoading) return null;
    // Check if we already have a streaming message
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant" && lastMsg.content) {
      return null; // Already showing streaming content
    }
    return {
      id: "typing",
      role: "assistant",
      content: "...",
      createdAt: Date.now(),
    };
  }, [isLoading, messages]);

  const visibleMessages = useMemo(() => {
    return assistantTypingStub
      ? [...messages, assistantTypingStub]
      : messages.slice();
  }, [messages, assistantTypingStub]);

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    setInput("");

    // Send message using AI SDK
    sendMessage({
      text: trimmed,
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  if (!started) {
    return (
      <IntroScreen
        onSelect={(text) => {
          setInitialQuestion(text);
          setStarted(true);
        }}
      />
    );
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Palestinian Flag Stripe - Top */}
      <div className="h-1.5 w-full flex shrink-0">
        <div className="flex-1 bg-[var(--ps-black)]" />
        <div className="flex-1 bg-[var(--ps-white)]" />
        <div className="flex-1 bg-[var(--ps-green)]" />
        <div className="w-16 bg-[var(--ps-red)]" style={{ clipPath: "polygon(100% 0, 0 50%, 100% 100%)" }} />
      </div>

      <header className="relative border-b border-[var(--border-color)] bg-[var(--card-bg)] shrink-0">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="../pss.webp"
              alt="Palestine map"
              className="h-10 sm:h-12 drop-shadow-md"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
                فلسطين Chat
              </h1>
              <p className="text-xs text-[var(--foreground-secondary)]">
                مساعدك الذكي للتعرف على فلسطين
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col overflow-hidden min-h-0 bg-[var(--background-secondary)]">
        {/* Chat Messages Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
        >
          <div className="mx-auto max-w-3xl flex flex-col gap-6">
            {visibleMessages.map((message, index) => (
              <ChatBubble
                key={message.id}
                message={message}
                isStreaming={status === "streaming" && index === visibleMessages.length - 1 && message.role === "assistant"}
              />
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-4 sm:px-6">
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="mx-auto max-w-3xl"
          >
            <div className="flex items-end gap-3 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--background)] px-4 py-3 shadow-sm focus-within:border-[var(--accent)] transition-colors">
              <textarea
                ref={textareaRef}
                className="min-h-[24px] flex-1 resize-none bg-transparent text-base text-[var(--foreground)] placeholder:text-[var(--foreground-secondary)] focus:outline-none leading-6"
                placeholder="اسأل عن فلسطين..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={2000}
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={!canSend}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-white transition-all hover:bg-[var(--accent-hover)] hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                aria-label="إرسال"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-[var(--ps-red)]/10 border border-[var(--ps-red)]/30 px-4 py-3 text-sm text-[var(--ps-red)]">
                {error.message}
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

function resizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
}
