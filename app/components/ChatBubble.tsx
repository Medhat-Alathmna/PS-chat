import { ChatMessage } from "@/lib/types";
import dynamic from "next/dynamic";
import LocationInfo from "./LocationInfo";
import ImageGallery from "./ImageGallery";
import { useState, useMemo } from "react";

/**
 * Detect if text is primarily Arabic/RTL
 */
function isArabicText(text: string): boolean {
  if (!text) return false;
  // Arabic Unicode range: \u0600-\u06FF
  const arabicChars = text.match(/[\u0600-\u06FF]/g) || [];
  const latinChars = text.match(/[a-zA-Z]/g) || [];
  return arabicChars.length > latinChars.length;
}

// Dynamically import MapCard to avoid SSR issues with Leaflet
const MapCard = dynamic(() => import("./MapCard"), {
  ssr: false,
  loading: () => (
    <div className="h-[150px] bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-xl animate-pulse flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  ),
});

type ChatBubbleProps = {
  message: ChatMessage;
  isStreaming?: boolean;
};

// Enhanced markdown renderer
function renderContent(content: string) {
  if (!content) return null;

  const lines = content.split("\n");

  return lines.map((line, i) => {
    let processed = line.replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-emerald-300">$1</strong>'
    );

    processed = processed.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">$1</a>'
    );

    processed = processed.replace(
      /`([^`]+)`/g,
      '<code class="bg-zinc-800/80 px-1.5 py-0.5 rounded text-emerald-300 text-sm font-mono">$1</code>'
    );

    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      processed = processed.replace(
        /^(\s*)([-•])\s/,
        '$1<span class="text-emerald-500 mr-2">●</span>'
      );
    }

    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: processed }} />
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

// Tool status indicator
function ToolStatusIndicator({
  state,
}: {
  state: "pending" | "running" | "completed" | "error";
}) {
  const config: Record<
    string,
    { bg: string; text: string; icon: string; label: string; animate: boolean }
  > = {
    pending: { bg: "bg-zinc-700/50", text: "text-zinc-400", icon: "○", label: "انتظار", animate: false },
    running: { bg: "bg-amber-500/20", text: "text-amber-400", icon: "◐", label: "جاري", animate: true },
    completed: { bg: "bg-emerald-500/20", text: "text-emerald-400", icon: "✓", label: "تم", animate: false },
    error: { bg: "bg-red-500/20", text: "text-red-400", icon: "✕", label: "خطأ", animate: false },
  };

  const c = config[state];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${c.bg} ${c.text} ${c.animate ? "animate-pulse" : ""}`}>
      <span className={c.animate ? "animate-spin" : ""}>{c.icon}</span>
      {c.label}
    </span>
  );
}

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
    </div>
  );
}

export default function ChatBubble({ message, isStreaming }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const isTyping = message.content === "...";
  const [showDebug, setShowDebug] = useState(false);

  // Detect if content is Arabic for RTL support
  const isRTL = useMemo(() => isArabicText(message.content), [message.content]);

  const hasMedia =
    (message.images && message.images.length > 0) ||
    message.location ||
    message.mapData;

  // User message - simple bubble
  if (isUser) {
    return (
      <div className="flex w-full items-start gap-3 flex-row-reverse">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-sm font-bold shadow-lg">
          أنت
        </div>
        <div className="max-w-[70%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-emerald-500/90 to-emerald-600/90 px-4 py-3 text-white shadow-xl">
          <div
            className={`text-[15px] leading-relaxed whitespace-pre-wrap ${isRTL ? "text-right" : ""}`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {renderContent(message.content)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-white/60">
            <span>
              {new Intl.DateTimeFormat("ar", { hour: "2-digit", minute: "2-digit" }).format(message.createdAt)}
            </span>
            <span className="text-emerald-200">✓✓</span>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message - split layout
  return (
    <div className="flex w-full items-start gap-3">
      {/* Avatar */}
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 text-emerald-400 text-sm font-bold shadow-lg ring-1 ring-white/10">
        ف
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-zinc-900" />
      </div>

      {/* Message Container - Full Width */}
      <div className="flex-1 min-w-0">
        {isTyping ? (
          <div className="inline-block rounded-2xl rounded-tl-sm bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 px-4 py-3 ring-1 ring-white/5">
            <TypingIndicator />
          </div>
        ) : (
          <div className={`rounded-2xl rounded-tl-sm bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 ring-1 ring-white/5 shadow-xl overflow-hidden ${hasMedia ? "" : "inline-block"}`}>
            {/* Split Layout: Text Left, Media Right */}
            {hasMedia ? (
              <div className="flex flex-col lg:flex-row">
                {/* Left: Text Content (Streaming) */}
                <div className={`flex-1 p-4 lg:border-r lg:border-white/5 ${isRTL ? "lg:border-r-0 lg:border-l lg:order-2" : ""}`}>
                  <div
                    className={`text-[15px] leading-relaxed text-zinc-100 whitespace-pre-wrap ${isRTL ? "text-right" : ""}`}
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    {renderContent(message.content)}
                    {isStreaming && (
                      <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1" />
                    )}
                  </div>

                  {/* Web Search Results */}
                  {message.webSearchResults && message.webSearchResults.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <p className="text-xs font-medium text-zinc-400 mb-2">🔍 مصادر</p>
                      <div className="space-y-1.5">
                        {message.webSearchResults.slice(0, 2).map((result, idx) => (
                          <a
                            key={idx}
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-lg bg-zinc-800/50 p-2 hover:bg-zinc-700/50 transition-colors"
                          >
                            <p className="text-emerald-400 text-xs font-medium truncate">{result.title}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-3 text-[11px] text-zinc-500">
                    {new Intl.DateTimeFormat("ar", { hour: "2-digit", minute: "2-digit" }).format(message.createdAt)}
                  </div>
                </div>

                {/* Right: Media Content (or Left when RTL) */}
                <div className={`lg:w-72 xl:w-80 shrink-0 p-3 bg-zinc-900/50 space-y-3 ${isRTL ? "lg:order-1" : ""}`}>
                  {/* Images */}
                  {message.images && message.images.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-zinc-500 mb-2 uppercase tracking-wider">صور</p>
                      <ImageGallery images={message.images} compact />
                    </div>
                  )}

                  {/* Map - 50% smaller */}
                  {message.location && (
                    <div>
                      <p className="text-[10px] font-medium text-zinc-500 mb-2 uppercase tracking-wider">الموقع</p>
                      <LocationInfo location={message.location} />
                      <div className="mt-2 rounded-lg overflow-hidden ring-1 ring-white/10 h-[150px]">
                        <MapCard
                          coordinates={message.location.coordinates}
                          title={message.location.name}
                          description={message.location.significance}
                        />
                      </div>
                    </div>
                  )}

                  {/* Map without location */}
                  {message.mapData && !message.location && (
                    <div>
                      <p className="text-[10px] font-medium text-zinc-500 mb-2 uppercase tracking-wider">الخريطة</p>
                      <div className="rounded-lg overflow-hidden ring-1 ring-white/10 h-[150px]">
                        <MapCard
                          coordinates={message.mapData.coordinates}
                          title="الموقع"
                          zoom={message.mapData.zoom}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* No Media - Simple Text */
              <div className="p-4">
                <div
                  className={`text-[15px] leading-relaxed text-zinc-100 whitespace-pre-wrap ${isRTL ? "text-right" : ""}`}
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  {renderContent(message.content)}
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1" />
                  )}
                </div>
                <div className="mt-3 text-[11px] text-zinc-500">
                  {new Intl.DateTimeFormat("ar", { hour: "2-digit", minute: "2-digit" }).format(message.createdAt)}
                </div>
              </div>
            )}

            {/* Debug Panel */}
            {message.debug && message.debug.toolCalls.length > 0 && (
              <div className="border-t border-white/5 p-3">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex w-full items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2 text-xs hover:bg-zinc-700/50 transition-colors"
                >
                  <span className="text-zinc-400">⚙ {message.debug.toolCalls.length} أداة</span>
                  <span className={`text-zinc-500 transition-transform ${showDebug ? "rotate-180" : ""}`}>▼</span>
                </button>

                {showDebug && (
                  <div className="mt-2 space-y-2">
                    {message.debug.toolCalls.map((tool, idx) => (
                      <div key={idx} className="rounded-lg bg-zinc-900/80 p-2.5 ring-1 ring-white/5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-emerald-400 text-xs">{tool.toolName}</span>
                          <ToolStatusIndicator state={tool.state} />
                        </div>
                        <div className="text-[10px] font-mono text-amber-300/80 break-all">
                          {JSON.stringify(tool.input)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
