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
import {
  ChatMessage,
  ImageResult,
  LocationInfo,
  MapData,
  ToolCallInfo,
  WebSearchResultItem,
} from "@/lib/types";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai/config";

type Mode = "promptId" | "localPrompt";

export default function ChatPage() {
  const [mode, setMode] = useState<Mode>("localPrompt");
  const [started, setStarted] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState<string | null>(null);
  const [promptId, setPromptId] = useState("");
  const [input, setInput] = useState("");
  const [showDebug, setShowDebug] = useState(true);

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
    <div
      className="relative flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100"
      style={{
        backgroundImage: `
      linear-gradient(rgba(0,0,0,0.7)),
      url('../pl.jpg')
    `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <header className="relative border-b border-white/5 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="../pss.webp"
              alt="Palestine map"
              className="h-8 logo-h drop-shadow-md"
            />
            <div>
              <p className="text-sm uppercase tracking-widest text-emerald-400">
                Falastin Assistant
              </p>
              <h1 className="text-2xl font-semibold">
                دردش مع مساعد متخصص في فلسطين
              </h1>
            </div>
          </div>
          {/* Debug Toggle */}
          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              showDebug
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {showDebug ? "Debug: ON" : "Debug: OFF"}
          </button>
        </div>
      </header>

      <main className="relative mx-auto flex h-full w-full max-w-7xl flex-1 flex-col overflow-hidden px-4 pb-6 pt-6 sm:px-6 lg:px-8 min-h-0">
        <section className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-3xl bg-zinc-950/70 shadow-2xl backdrop-blur">
          <div
            ref={chatContainerRef}
            className="flex flex-1 min-h-0 flex-col no-scrollbar overflow-y-auto px-4 py-6 sm:px-6"
          >
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
              {visibleMessages.map((message, index) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  isStreaming={status === "streaming" && index === visibleMessages.length - 1 && message.role === "assistant"}
                />
              ))}
            </div>
          </div>

          <footer className="px-4 py-4 sm:px-6">
            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="mx-auto flex w-full max-w-3xl flex-col gap-4"
            >
              <div className="flex items-end gap-3 rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 shadow-inner focus-within:border-emerald-500/60">
                <textarea
                  ref={textareaRef}
                  className="min-h-[44px] flex-1 resize-none bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                  placeholder="اكتب رسالتك هنا..."
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
                  className="flex h-12 min-w-[48px] items-center justify-center rounded-full bg-emerald-500 font-medium text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40 disabled:text-emerald-900/60"
                  aria-label="إرسال الرسالة"
                >
                  {isLoading ? (
                    <span className="animate-pulse text-sm font-semibold">
                      ...
                    </span>
                  ) : (
                    "إرسال"
                  )}
                </button>
              </div>

              {error ? (
                <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error.message}
                </p>
              ) : null}
            </form>
          </footer>
        </section>
      </main>
    </div>
  );
}

function resizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
}
