"use client";

import { ChatMessage } from "@/lib/types";
import dynamic from "next/dynamic";
import LocationInfo from "./LocationInfo";
import ImageGallery from "./ImageGallery";
import { useMemo, useCallback, useState } from "react";

/**
 * Detect if text is primarily Arabic/RTL
 */
function isArabicText(text: string): boolean {
  if (!text) return false;
  const arabicChars = text.match(/[\u0600-\u06FF]/g) || [];
  const latinChars = text.match(/[a-zA-Z]/g) || [];
  return arabicChars.length > latinChars.length;
}

// Dynamically import components to avoid SSR issues
const MapCard = dynamic(() => import("./MapCard"), {
  ssr: false,
  loading: () => (
    <div className="h-[150px] bg-gradient-to-br from-[var(--card-bg)] to-[var(--background-secondary)] rounded-xl animate-pulse flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
    </div>
  ),
});

const VideoPlayer = dynamic(() => import("./VideoPlayer"), {
  ssr: false,
  loading: () => (
    <div className="h-[180px] bg-gradient-to-br from-[var(--card-bg)] to-[var(--background-secondary)] rounded-xl animate-pulse flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[var(--ps-red)]/30 border-t-[var(--ps-red)] rounded-full animate-spin" />
    </div>
  ),
});

const NewsCard = dynamic(() => import("./NewsCard"), { ssr: false });
const Timeline = dynamic(() => import("./Timeline"), { ssr: false });

type ChatBubbleProps = {
  message: ChatMessage;
  isStreaming?: boolean;
};

// Copy button component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-[var(--accent-light)] text-[var(--foreground-secondary)] hover:text-[var(--accent)]"
      title={copied ? "تم النسخ!" : "نسخ النص"}
    >
      {copied ? (
        <svg className="w-4 h-4 text-[var(--ps-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

// Enhanced markdown renderer with support for tables, numbered lists, headers
function renderContent(content: string, isRTL: boolean) {
  if (!content) return null;

  const lines = content.split("\n");
  let inCodeBlock = false;
  let codeContent = "";
  let codeLanguage = "";
  const elements: (React.ReactNode | null)[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = (key: string) => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(" ");
      elements.push(
        <p key={key} className="mb-4 last:mb-0 text-[16px] leading-[1.8] text-[var(--foreground)]">
          <span dangerouslySetInnerHTML={{ __html: processInlineMarkdown(text) }} />
        </p>
      );
      currentParagraph = [];
    }
  };

  lines.forEach((line, i) => {
    // Handle code blocks
    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        flushParagraph(`para-${i}`);
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
        codeContent = "";
        return;
      } else {
        inCodeBlock = false;
        const finalCode = codeContent;
        elements.push(
          <pre key={`code-${i}`} className="my-5 p-4 rounded-xl bg-[#1a1a1a] border border-[var(--border-color)] overflow-x-auto">
            {codeLanguage && (
              <div className="text-[11px] text-[var(--foreground-secondary)] mb-3 uppercase tracking-wider font-medium">{codeLanguage}</div>
            )}
            <code className="text-[14px] font-mono text-[#e0e0e0] leading-relaxed whitespace-pre">{finalCode}</code>
          </pre>
        );
        return;
      }
    }

    if (inCodeBlock) {
      codeContent += (codeContent ? "\n" : "") + line;
      return;
    }

    // Empty line - flush paragraph
    if (line.trim() === "") {
      flushParagraph(`para-${i}`);
      return;
    }

    // Handle headers
    if (line.startsWith("### ")) {
      flushParagraph(`para-${i}`);
      elements.push(
        <h3 key={`h3-${i}`} className="text-[17px] font-bold text-[var(--foreground)] mt-6 mb-3">
          {line.slice(4)}
        </h3>
      );
      return;
    }
    if (line.startsWith("## ")) {
      flushParagraph(`para-${i}`);
      elements.push(
        <h2 key={`h2-${i}`} className="text-[19px] font-bold text-[var(--foreground)] mt-7 mb-3">
          {line.slice(3)}
        </h2>
      );
      return;
    }
    if (line.startsWith("# ")) {
      flushParagraph(`para-${i}`);
      elements.push(
        <h1 key={`h1-${i}`} className="text-[22px] font-bold text-[var(--foreground)] mt-7 mb-4">
          {line.slice(2)}
        </h1>
      );
      return;
    }

    // Handle numbered lists with better styling
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      flushParagraph(`para-${i}`);
      elements.push(
        <div key={`ol-${i}`} className="flex gap-4 my-3 py-2 px-3 rounded-lg bg-[var(--background)]/50 border-r-3 border-[var(--accent)]">
          <span className="text-[var(--accent)] font-bold text-[18px] min-w-[2rem]">{numberedMatch[1]}.</span>
          <span className="flex-1 text-[16px] leading-[1.8] text-[var(--foreground)]" dangerouslySetInnerHTML={{ __html: processInlineMarkdown(numberedMatch[2]) }} />
        </div>
      );
      return;
    }

    // Handle bullet lists
    if (line.trim().startsWith("- ") || line.trim().startsWith("• ") || line.trim().startsWith("* ")) {
      flushParagraph(`para-${i}`);
      const bulletContent = line.replace(/^[\s]*[-•*]\s+/, "");
      elements.push(
        <div key={`ul-${i}`} className="flex gap-3 my-2 pr-2">
          <span className="text-[var(--accent)] text-lg mt-0.5">●</span>
          <span className="flex-1 text-[16px] leading-[1.8] text-[var(--foreground)]" dangerouslySetInnerHTML={{ __html: processInlineMarkdown(bulletContent) }} />
        </div>
      );
      return;
    }

    // Handle horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      flushParagraph(`para-${i}`);
      elements.push(<hr key={`hr-${i}`} className="my-6 border-[var(--border-color)]" />);
      return;
    }

    // Regular text - add to current paragraph
    currentParagraph.push(line);
  });

  // Flush any remaining paragraph
  flushParagraph("para-final");

  return elements;
}

// Process inline markdown (bold, italic, links, code)
function processInlineMarkdown(text: string): string {
  let processed = text;

  // Bold text
  processed = processed.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-semibold text-[var(--foreground)]">$1</strong>'
  );

  // Italic text
  processed = processed.replace(
    /\*(.+?)\*/g,
    '<em class="italic text-[var(--foreground-secondary)]">$1</em>'
  );

  // Links
  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[var(--accent)] hover:underline font-medium">$1</a>'
  );

  // Inline code
  processed = processed.replace(
    /`([^`]+)`/g,
    '<code class="bg-[var(--background-secondary)] px-1.5 py-0.5 rounded text-[var(--accent)] text-[13px] font-mono">$1</code>'
  );

  return processed;
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
    pending: { bg: "bg-[var(--foreground-secondary)]/20", text: "text-[var(--foreground-secondary)]", icon: "○", label: "انتظار", animate: false },
    running: { bg: "bg-amber-500/20", text: "text-amber-500", icon: "◐", label: "جاري", animate: true },
    completed: { bg: "bg-[var(--ps-green)]/20", text: "text-[var(--ps-green)]", icon: "✓", label: "تم", animate: false },
    error: { bg: "bg-[var(--ps-red)]/20", text: "text-[var(--ps-red)]", icon: "✕", label: "خطأ", animate: false },
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
      <span className="w-2 h-2 bg-[var(--ps-green)] rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-[var(--ps-green)] rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-[var(--ps-green)] rounded-full animate-bounce" />
    </div>
  );
}

export default function ChatBubble({ message, isStreaming }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const isTyping = message.content === "...";

  // Detect if content is Arabic for RTL support
  const isRTL = useMemo(() => isArabicText(message.content), [message.content]);

  const hasMedia =
    (message.images && message.images.length > 0) ||
    message.location ||
    message.mapData ||
    message.video ||
    message.news ||
    message.timeline;

  // User message - clean and simple
  if (isUser) {
    return (
      <div className="flex w-full justify-end animate-fade-in-up">
        <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-br-md bg-[var(--accent)] px-5 py-4 text-white shadow-md">
          <div
            className={`text-[16px] leading-[1.7] ${isRTL ? "text-right" : ""}`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // Assistant message - clean and readable like ChatGPT
  return (
    <div className="flex w-full animate-fade-in-up group">
      <div className="flex-1 min-w-0">
        {isTyping ? (
          <div className="inline-block">
            <TypingIndicator />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Main Text Content */}
            <div
              className={`text-[var(--foreground)] ${isRTL ? "text-right" : ""}`}
              dir={isRTL ? "rtl" : "ltr"}
            >
              {renderContent(message.content, isRTL)}
              {isStreaming && (
                <span className="inline-block w-0.5 h-5 bg-[var(--accent)] mr-1 rounded-sm" style={{ animation: 'cursor-blink 1s infinite' }} />
              )}
            </div>

            {/* Media Section */}
            {hasMedia && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                {/* Video */}
                {message.video && (
                  <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)]">
                    <VideoPlayer video={message.video} />
                  </div>
                )}

                {/* Images */}
                {message.images && message.images.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] p-2">
                    <ImageGallery images={message.images} compact />
                  </div>
                )}

                {/* Map */}
                {message.location && (
                  <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)]">
                    <div className="p-3 border-b border-[var(--border-color)]">
                      <LocationInfo location={message.location} />
                    </div>
                    <div className="h-[180px]">
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
                  <div className="rounded-xl overflow-hidden border border-[var(--border-color)] h-[180px]">
                    <MapCard
                      coordinates={message.mapData.coordinates}
                      title="الموقع"
                      zoom={message.mapData.zoom}
                    />
                  </div>
                )}

                {/* News */}
                {message.news && message.news.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] p-3">
                    <p className="text-sm font-semibold text-[var(--foreground)] mb-2">📰 أخبار ذات صلة</p>
                    <NewsCard news={message.news} />
                  </div>
                )}

                {/* Timeline */}
                {message.timeline && message.timeline.length > 0 && (
                  <div className="sm:col-span-2 rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] p-3">
                    <p className="text-sm font-semibold text-[var(--foreground)] mb-3">📅 الجدول الزمني</p>
                    <Timeline events={message.timeline} />
                  </div>
                )}
              </div>
            )}

            {/* Web Search Results */}
            {message.webSearchResults && message.webSearchResults.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                <p className="text-sm font-semibold text-[var(--foreground)] mb-3">🔍 المصادر</p>
                <div className="flex flex-wrap gap-2">
                  {message.webSearchResults.slice(0, 4).map((result, idx) => (
                    <a
                      key={idx}
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--background)] px-4 py-2 text-sm hover:bg-[var(--accent-light)] transition-colors border border-[var(--border-color)]"
                    >
                      <span className="text-[var(--accent)]">↗</span>
                      <span className="text-[var(--foreground)] truncate max-w-[200px]">{result.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Copy button - appears on hover */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={message.content} />
            </div>

            {/* Debug Panel - Hidden by default */}
            {message.debug && message.debug.toolCalls.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-[var(--foreground-secondary)] hover:text-[var(--foreground)]">
                  ⚙ {message.debug.toolCalls.length} أدوات مستخدمة
                </summary>
                <div className="mt-2 space-y-2">
                  {message.debug.toolCalls.map((tool, idx) => (
                    <div key={idx} className="rounded-lg bg-[var(--background)] p-3 border border-[var(--border-color)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[var(--accent)] text-sm">{tool.toolName}</span>
                        <ToolStatusIndicator state={tool.state} />
                      </div>
                      <div className="text-xs font-mono text-[var(--foreground-secondary)] break-all">
                        {JSON.stringify(tool.input)}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
