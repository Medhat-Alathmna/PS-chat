"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { MessageDisplayMode } from "@/lib/types/chat-settings";

/**
 * Shared hook for static (all-at-once) message reveal.
 * In static mode, hides the last assistant message while streaming
 * and reveals it with a fade-in animation when streaming completes.
 */
export function useStaticReveal(
  status: string,
  messages: { id: string; role: string }[],
  displayMode: MessageDisplayMode
) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const prevStatusRef = useRef(status);
  const isStatic = displayMode === "static";

  // When status transitions from streaming/submitted → ready in static mode,
  // reveal the last assistant message
  useEffect(() => {
    const wasStreaming =
      prevStatusRef.current === "streaming" || prevStatusRef.current === "submitted";
    const isReady = status === "ready";

    if (isStatic && wasStreaming && isReady) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant") {
        setRevealedIds((prev) => new Set(prev).add(lastMsg.id));
      }
    }

    prevStatusRef.current = status;
  }, [status, messages, isStatic]);

  /** Should this message be hidden? (Only hides the last assistant msg while streaming in static mode) */
  const shouldHide = useCallback(
    (index: number, role: string) => {
      if (!isStatic) return false;
      if (role !== "assistant") return false;
      // Only hide if it's the last message and we're actively streaming
      const isLast = index === messages.length - 1;
      const isStreaming = status === "streaming" || status === "submitted";
      return isLast && isStreaming;
    },
    [isStatic, messages.length, status]
  );

  /** Returns the reveal animation class for a just-revealed message, or empty string */
  const revealClass = useCallback(
    (id: string) => {
      if (!isStatic) return "";
      return revealedIds.has(id) ? "animate-fade-in-reveal" : "";
    },
    [isStatic, revealedIds]
  );

  /** Whether to show the typing bubble in static mode */
  const showTypingBubble = useMemo(() => {
    if (!isStatic) return false;
    return status === "streaming" || status === "submitted";
  }, [isStatic, status]);

  return { shouldHide, revealClass, showTypingBubble };
}
