"use client";

import { RefObject } from "react";
import { ChatMessage, ImageResult } from "@/lib/types";
import KidsChatBubble, { TypingBubble } from "./KidsChatBubble";
import QuickReplyChips from "./games/QuickReplyChips";
import type { QuickReplyData, SuggestionChip } from "./games/QuickReplyChips";
import type { MessageDisplayMode } from "@/lib/types/chat-settings";
import { useStaticReveal } from "@/lib/hooks/useStaticReveal";

/**
 * Props for the ChatMessages component
 */
interface ChatMessagesProps {
  messages: ChatMessage[];
  persistedImages: Record<string, ImageResult[]>;
  status: string;
  isLoading: boolean;
  directImagesLoading: boolean;
  activeQuickReplies: QuickReplyData | null;
  currentMessageId: string | null;
  textStyle: { fontFamily: string; fontSize: string };
  displayMode?: MessageDisplayMode;
  onChipClick: (chip: SuggestionChip) => void;
  onSpeak: (message: ChatMessage) => void;
  onStopSpeaking: () => void;
  chatContainerRef: RefObject<HTMLDivElement | null>;
}

/**
 * Chat messages list component.
 * Renders messages, loading indicators, and quick reply chips.
 */
export default function ChatMessages({
  messages,
  persistedImages,
  status,
  isLoading,
  directImagesLoading,
  activeQuickReplies,
  currentMessageId,
  textStyle,
  displayMode = "streaming",
  onChipClick,
  onSpeak,
  onStopSpeaking,
  chatContainerRef,
}: ChatMessagesProps) {
  const { shouldHide, revealClass, showTypingBubble } = useStaticReveal(status, messages, displayMode);

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-3 py-3 scroll-smooth" ref={chatContainerRef}>
      <div className="mx-auto max-w-2xl flex flex-col gap-4 pb-4">
        {messages.map((message, index) => {
          if (shouldHide(index, message.role)) return null;
          const extra = persistedImages[message.id];
          const displayMessage = extra?.length
            ? { ...message, images: [...(message.images ?? []), ...extra] }
            : message;
          const reveal = revealClass(message.id);
          return (
            <KidsChatBubble
              key={message.id}
              message={displayMessage}
              isStreaming={
                status === "streaming" &&
                index === messages.length - 1 &&
                message.role === "assistant"
              }
              isSpeaking={currentMessageId === message.id}
              onSpeak={() => onSpeak(message)}
              onStopSpeaking={onStopSpeaking}
              textStyle={textStyle}
              {...(reveal ? { className: reveal } : {})}
            />
          );
        })}

        {/* Direct images loading indicator */}
        {directImagesLoading && (
          <div className="flex justify-center py-4 animate-fade-in">
            <div className="flex items-center gap-2 text-blue-500 font-bold">
              <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
              <span>جاري تحميل الصور...</span>
            </div>
          </div>
        )}

        {/* Quick reply chips */}
        {activeQuickReplies && !isLoading && (
          <QuickReplyChips
            data={activeQuickReplies}
            onChipClick={onChipClick}
            onHintClick={() => { }}
            disabled={isLoading}
          />
        )}

        {/* Typing indicator */}
        {isLoading && (showTypingBubble || messages[messages.length - 1]?.role !== "assistant") && (
          <TypingBubble />
        )}
      </div>
    </main>
  );
}