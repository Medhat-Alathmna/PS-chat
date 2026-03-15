"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import type { Country } from "@/lib/data/countries";
import { countryCodeToFlag } from "@/lib/data/countries";

// ── Types ──────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  chips?: string[];
}

interface CountrySheetProps {
  country: Country | null;
  playerName?: string;
  onClose: () => void;
  isOpen: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function parseChips(raw: unknown[]): string[] {
  return raw
    .map((c) => (typeof c === "string" ? c : (c as { text?: string })?.text ?? ""))
    .filter(Boolean);
}

// ── Constants ──────────────────────────────────────────────────────────────
const SNAP_HALF = 42;  // percent — default "half" position
const SNAP_FULL = 95;  // percent — full-screen position
const DRAG_THRESHOLD = 60; // px — how far to drag before snapping

// ── Component ──────────────────────────────────────────────────────────────
export default function CountrySheet({
  country,
  playerName,
  onClose,
  isOpen,
}: CountrySheetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(SNAP_HALF); // percent
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(SNAP_HALF);
  const sheetHeightRef = useRef(SNAP_HALF); // mirrors sheetHeight state, avoids stale closures in drag handlers
  const messagesRef = useRef<ChatMessage[]>([]); // mirrors messages state, avoids stale closures in sendMessage
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Detect mobile ──────────────────────────────────────────────────────
  useLayoutEffect(() => {
    let frameId: ReturnType<typeof requestAnimationFrame>;
    const check = () => setIsMobile(window.innerWidth < 768);
    const onResize = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  // Keep messagesRef in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // ── Auto-scroll on new messages ────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // ── Fetch Medhat intro when country changes ────────────────────────────
  useEffect(() => {
    if (!country || !isOpen) return;
    setMessages([]);
    setInput("");
    setSheetHeight(SNAP_HALF);

    let cancelled = false;
    const fetchIntro = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/world-explorer/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [],
            countryId: country.id,
            playerName,
          }),
        });
        if (cancelled) return;
        const data = await res.json();
        if (!cancelled && data.text) {
          setMessages([
            {
              role: "assistant",
              text: data.text,
              chips: Array.isArray(data.chips) ? parseChips(data.chips) : [],
            },
          ]);
        }
      } catch {
        if (!cancelled) {
          setMessages([
            {
              role: "assistant",
              text: `مرحبا! أنا مدحت 🦁 دعنا نستكشف ${country.nameAr} سوية! 🌍`,
            },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchIntro();
    return () => { cancelled = true; };
  }, [country?.id, isOpen, playerName]);

  // ── Send message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !country || loading) return;
      const userMsg: ChatMessage = { role: "user", text: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        // Use messagesRef to avoid stale closure; send simple CoreMessage format
        const history = [...messagesRef.current, userMsg].map((m) => ({
          role: m.role,
          content: m.text,
        }));

        const res = await fetch("/api/world-explorer/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            countryId: country.id,
            playerName,
          }),
        });
        const data = await res.json();
        if (data.text) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: data.text,
              chips: Array.isArray(data.chips) ? parseChips(data.chips) : [],
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "عذراً، حدث خطأ. حاول مرة ثانية! 😅" },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [country, loading, playerName]  // messagesRef used instead of messages to avoid stale closure
  );

  // ── Touch drag on the handle ───────────────────────────────────────────
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    dragStartY.current = clientY;
    dragStartHeight.current = sheetHeightRef.current;
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    const deltaY = dragStartY.current - clientY; // positive = dragging up
    const deltaPercent = (deltaY / window.innerHeight) * 100;
    const next = Math.min(SNAP_FULL, Math.max(5, dragStartHeight.current + deltaPercent));
    sheetHeightRef.current = next;
    setSheetHeight(next);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    const h = sheetHeightRef.current;
    const delta = h - dragStartHeight.current;
    const snapDown = -(DRAG_THRESHOLD / window.innerHeight) * 100 * 2;
    if (delta < snapDown) {
      if (h < 20) { onClose(); return; }
      sheetHeightRef.current = SNAP_HALF;
      setSheetHeight(SNAP_HALF);
    } else if (h > 70) {
      sheetHeightRef.current = SNAP_FULL;
      setSheetHeight(SNAP_FULL);
    } else {
      sheetHeightRef.current = SNAP_HALF;
      setSheetHeight(SNAP_HALF);
    }
  }, [onClose]);

  // Attach window-level mouse listeners while dragging so release outside handle works
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const onUp = () => handleDragEnd();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // ── Render ─────────────────────────────────────────────────────────────
  if (!isOpen || !country) return null;

  const flag = countryCodeToFlag(country.code);
  const isPalestine = country.id === "PSE";

  // ── Desktop side panel ─────────────────────────────────────────────────
  if (!isMobile) {
    return (
      <div
        className="fixed right-0 top-0 bottom-0 z-40 flex flex-col"
        style={{
          width: 340,
          background: "rgba(10, 8, 24, 0.97)",
          borderLeft: "1px solid rgba(165, 94, 234, 0.2)",
          backdropFilter: "blur(24px)",
        }}
      >
        <AuroraBorder isPalestine={isPalestine} />

        {/* Header */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <CountryInfo flag={flag} country={country} headingSize="text-lg" />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/60 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
          {isPalestine && <PalestineBadge />}
        </div>

        <div
          className="flex-shrink-0 mx-4 mb-3"
          style={{ height: 1, background: "rgba(255,255,255,0.08)" }}
        />

        {/* Chat messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 pb-2 space-y-3"
          style={{ direction: "rtl" }}
        >
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} onChipClick={sendMessage} />
          ))}
          {loading && <TypingIndicator />}
        </div>

        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => sendMessage(input)}
          disabled={loading}
          inputRef={inputRef}
        />

        <style>{auroraStyle}</style>
      </div>
    );
  }

  // ── Mobile bottom sheet ────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop (dim) */}
      {sheetHeight > 60 && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setSheetHeight(SNAP_HALF)}
        />
      )}

      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex flex-col rounded-t-3xl overflow-hidden"
        style={{
          height: `${sheetHeight}vh`,
          background: "rgba(10, 8, 24, 0.97)",
          backdropFilter: "blur(24px)",
          transition: isDragging ? "none" : "height 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          border: "1px solid rgba(165,94,234,0.2)",
          borderBottom: "none",
        }}
      >
        <AuroraBorder isPalestine={isPalestine} rounded />

        {/* Drag handle */}
        <div
          className="flex-shrink-0 flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={(e) => handleDragStart(e.clientY)}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
          onTouchEnd={handleDragEnd}
        >
          <div
            className="rounded-full"
            style={{
              width: 40,
              height: 4,
              background: "rgba(255,255,255,0.2)",
            }}
          />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/60 text-sm"
            >
              ✕
            </button>
            <CountryInfo flag={flag} country={country} headingSize="text-base" />
          </div>
          {isPalestine && <PalestineBadge className="mt-2" />}
        </div>

        <div
          className="flex-shrink-0 mx-4 mb-2"
          style={{ height: 1, background: "rgba(255,255,255,0.08)" }}
        />

        {/* Chat messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 pb-1 space-y-3"
          style={{ direction: "rtl" }}
        >
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} onChipClick={sendMessage} />
          ))}
          {loading && <TypingIndicator />}
        </div>

        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => sendMessage(input)}
          disabled={loading}
          inputRef={inputRef}
        />
      </div>

      <style>{auroraStyle}</style>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onChipClick,
}: {
  msg: ChatMessage;
  onChipClick: (text: string) => void;
}) {
  const isAssistant = msg.role === "assistant";

  return (
    <div className={`flex flex-col gap-1.5 ${isAssistant ? "items-start" : "items-end"}`}>
      {isAssistant && (
        <span className="text-xs text-white/40 mr-1" style={{ direction: "rtl" }}>
          مدحت 🦁
        </span>
      )}
      <div
        className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
        style={{
          background: isAssistant
            ? "linear-gradient(135deg, rgba(165,94,234,0.3), rgba(84,160,255,0.2))"
            : "linear-gradient(135deg, rgba(78,205,196,0.35), rgba(78,205,196,0.15))",
          border: isAssistant
            ? "1px solid rgba(165,94,234,0.35)"
            : "1px solid rgba(78,205,196,0.35)",
          color: "rgba(255,255,255,0.92)",
          direction: "rtl",
          textAlign: "right",
        }}
      >
        {msg.text}
      </div>

      {/* Chips */}
      {isAssistant && msg.chips && msg.chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-w-[90%]" style={{ direction: "rtl" }}>
          {msg.chips.map((chip, i) => (
            <button
              key={i}
              onClick={() => onChipClick(chip)}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-all active:scale-95 bg-white/[.08] border border-white/[.18] text-white/80 hover:bg-purple-500/25 hover:border-purple-500/50"
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-xs text-white/40" style={{ direction: "rtl" }}>
        مدحت 🦁
      </span>
      <div
        className="flex items-center gap-1.5 px-4 py-3 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(165,94,234,0.25), rgba(84,160,255,0.15))",
          border: "1px solid rgba(165,94,234,0.3)",
        }}
      >
        <span className="text-white/50 text-xs" style={{ direction: "rtl" }}>
          مدحت يفكر...
        </span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-purple-400 opacity-70"
            style={{
              animation: "bounce-dot 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
        <style>{`
          @keyframes bounce-dot {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
            40% { transform: translateY(-5px); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      className="flex-shrink-0 p-3 flex gap-2"
      style={{ direction: "rtl" }}
    >
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
        style={{
          background: "var(--kids-purple)",
          boxShadow: value.trim() ? "0 0 16px rgba(165,94,234,0.4)" : "none",
        }}
      >
        <svg
          className="w-4 h-4 text-white rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
        placeholder="اسأل مدحت سؤالاً..."
        disabled={disabled}
        dir="rtl"
        className="flex-1 px-4 py-2.5 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none transition-all disabled:opacity-50 bg-white/[.07] border border-white/[.12] focus:bg-white/10 focus:border-purple-500/40"
      />
    </div>
  );
}

// ── Shared header sub-components ───────────────────────────────────────────

function AuroraBorder({ isPalestine, rounded }: { isPalestine: boolean; rounded?: boolean }) {
  return (
    <div
      className={`h-0.5 w-full flex-shrink-0${rounded ? " rounded-t-3xl" : ""}`}
      style={{
        background: isPalestine
          ? "linear-gradient(90deg, #2D7D46, #4ECDC4, #2D7D46)"
          : "linear-gradient(90deg, #A55EEA, #54A0FF, #4ECDC4, #A55EEA)",
        backgroundSize: "200% 100%",
        animation: "aurora 3s linear infinite",
      }}
    />
  );
}

function PalestineBadge({ className }: { className?: string }) {
  return (
    <div
      className={`text-xs text-center py-1 px-3 rounded-full font-bold${className ? ` ${className}` : ""}`}
      style={{
        background: "linear-gradient(135deg, #2D7D46, #1a5c30)",
        color: "#a8f0be",
        border: "1px solid rgba(45,125,70,0.45)",
      }}
    >
      🇵🇸 بلادنا الحبيبة
    </div>
  );
}

function CountryInfo({ flag, country, headingSize = "text-lg" }: {
  flag: string;
  country: { nameAr: string; capitalAr: string };
  headingSize?: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-row-reverse">
      <span className="text-3xl leading-none">{flag}</span>
      <div className="text-right">
        <h2 className={`${headingSize} font-black text-white leading-tight`} dir="rtl">
          {country.nameAr}
        </h2>
        <p className="text-xs text-white/50" dir="rtl">🏛️ {country.capitalAr}</p>
      </div>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────
const auroraStyle = `
  @keyframes aurora {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
`;
