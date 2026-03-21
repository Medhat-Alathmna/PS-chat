"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import type { Country } from "@/lib/data/countries";
import { COUNTRY_DETAILS } from "@/lib/data/country-details";
import { useTokenQuota } from "@/lib/hooks/useTokenQuota";
import MedhatBlockedMessage from "@/app/components/kids/MedhatBlockedMessage";

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
function formatPopulation(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} مليار`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)} مليون`;
  return n.toLocaleString("ar-EG");
}

function formatArea(km2: number): string {
  return `${km2.toLocaleString("ar-EG")} كم²`;
}

function parseChips(raw: unknown[]): string[] {
  return raw
    .map((c) => (typeof c === "string" ? c : (c as { text?: string })?.text ?? ""))
    .filter(Boolean);
}

// ── Constants ──────────────────────────────────────────────────────────────
const SNAP_HALF = 42;
const SNAP_FULL = 95;
const DRAG_THRESHOLD = 60;

const CONTINENT_AR: Record<string, string> = {
  africa: "أفريقيا",
  asia: "آسيا",
  europe: "أوروبا",
  americas: "الأمريكتان",
  oceania: "أوقيانوسيا",
};

const TOPIC_CHIPS = ["تاريخها", "ثقافتها وعاداتها", "أشهر معالمها", "حياة ناسها", "طبيعتها ومناخها", "اقتصادها وثرواتها", "أكلتها المشهورة", "فنونها وموسيقاها"];

// ── Component ──────────────────────────────────────────────────────────────
export default function CountrySheet({
  country,
  playerName,
  onClose,
  isOpen,
}: CountrySheetProps) {
  const tokenQuota = useTokenQuota();
  const [mode, setMode] = useState<"info" | "chat">("info");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(SNAP_HALF);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(SNAP_HALF);
  const sheetHeightRef = useRef(SNAP_HALF);
  const messagesRef = useRef<ChatMessage[]>([]);
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

  // ── Reset to info card when country changes ────────────────────────────
  useEffect(() => {
    if (!country?.id || !isOpen) return;
    setMessages([]);
    setInput("");
    setMode("info");
    setSheetHeight(SNAP_HALF);
  }, [country?.id, isOpen]);

  // ── Send message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !country || loading) return;
      const userMsg: ChatMessage = { role: "user", text: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
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
        if (res.status === 429) {
          const body = await res.json().catch(() => null);
          if (body?.quota) tokenQuota.updateFromResponse(body.quota);
          else tokenQuota.refresh();
          return;
        }
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
    [country, loading, playerName]
  );

  // ── Topic chip → switch to chat mode ──────────────────────────────────
  const handleTopicChip = useCallback(
    (chip: string) => {
      setMode("chat");
      sendMessage(chip);
    },
    [sendMessage]
  );

  // ── Touch drag on the handle ───────────────────────────────────────────
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    dragStartY.current = clientY;
    dragStartHeight.current = sheetHeightRef.current;
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    const deltaY = dragStartY.current - clientY;
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

  // Attach window-level mouse listeners while dragging
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

  const isPalestine = country.id === "PSE";
  const isInfo = mode === "info";

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


        {isInfo ? (
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <InfoCard country={country} onTopicChip={handleTopicChip} />
          </div>
        ) : (
          <>
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
            {tokenQuota.isBlocked ? (
              <MedhatBlockedMessage className="mx-4 mb-3" />
            ) : (
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={() => sendMessage(input)}
                disabled={loading}
                inputRef={inputRef}
              />
            )}
          </>
        )}

        <style>{auroraStyle}</style>
      </div>
    );
  }

  // ── Mobile bottom sheet ────────────────────────────────────────────────
  return (
    <>
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
            style={{ width: 40, height: 4, background: "rgba(255,255,255,0.2)" }}
          />
        </div>


        {isInfo ? (
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <InfoCard country={country} onTopicChip={handleTopicChip} />
          </div>
        ) : (
          <>
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
            {tokenQuota.isBlocked ? (
              <MedhatBlockedMessage className="mx-4 mb-3" />
            ) : (
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={() => sendMessage(input)}
                disabled={loading}
                inputRef={inputRef}
              />
            )}
          </>
        )}
      </div>

      <style>{auroraStyle}</style>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function InfoCard({
  country,
  onTopicChip,
}: {
  country: Country;
  onTopicChip: (chip: string) => void;
}) {
  const details = COUNTRY_DETAILS[country.id];

  return (
    <div className="flex flex-col gap-4 pt-2" style={{ direction: "rtl" }}>
      {/* Flag hero */}
      <div className="flex flex-col items-center gap-2 py-3">
        <div
          className="flex items-center justify-center rounded-2xl overflow-hidden"
          style={{
            width: 120,
            height: 80,
            boxShadow: "0 0 32px rgba(165,94,234,0.3), 0 4px 24px rgba(0,0,0,0.5)",
            border: "2px solid rgba(255,255,255,0.15)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w320/${country.code.toLowerCase()}.png`}
            srcSet={`https://flagcdn.com/w640/${country.code.toLowerCase()}.png 2x`}
            width={120}
            height={80}
            alt={country.nameEn}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
        <p className="text-sm text-white/50 font-medium" dir="rtl">{country.nameAr}</p>
      </div>

      {/* Country details — 2-column grid */}
      <div className="grid grid-cols-2 gap-2">
        <InfoCell icon="🏛️" label="العاصمة" value={country.capitalAr} />
        <InfoCell icon="🌍" label="القارة" value={CONTINENT_AR[country.continent] ?? country.continent} />
        {details?.population && <InfoCell icon="👥" label="عدد السكان" value={formatPopulation(details.population)} />}
        {details?.area       && <InfoCell icon="📐" label="المساحة"    value={formatArea(details.area)} />}
        {details?.religion   && <InfoCell icon="🕌" label="الديانة"    value={details.religion} />}
        {details?.language   && <InfoCell icon="🗣️" label="اللغة"      value={details.language} />}
        {details?.currency   && <InfoCell icon="💰" label="العملة"     value={details.currency} />}
      </div>

      {/* Topic chips */}
      <div>
        <p className="text-xs text-white/40 mb-2.5 font-medium">
          تحدث مع مدحت 🦁 عن:
        </p>
        <div className="flex flex-wrap gap-2">
          {TOPIC_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => onTopicChip(chip)}
              className="text-sm px-4 py-2 rounded-full font-medium transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, rgba(165,94,234,0.25), rgba(84,160,255,0.15))",
                border: "1px solid rgba(165,94,234,0.4)",
                color: "rgba(255,255,255,0.88)",
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoCell({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-xl px-3 py-2"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span className="text-xs text-white/45 flex items-center gap-1">
        {icon} {label}
      </span>
      <span className="text-sm text-white font-semibold leading-snug">{value}</span>
    </div>
  );
}

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
          whiteSpace: "pre-wrap",
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
        backgroundImage: isPalestine
          ? "linear-gradient(90deg, #2D7D46, #4ECDC4, #2D7D46)"
          : "linear-gradient(90deg, #A55EEA, #54A0FF, #4ECDC4, #A55EEA)",
        backgroundSize: "200% 100%",
        animation: "aurora 3s linear infinite",
      }}
    />
  );
}


// ── Shared styles ──────────────────────────────────────────────────────────
const auroraStyle = `
  @keyframes aurora {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
`;
