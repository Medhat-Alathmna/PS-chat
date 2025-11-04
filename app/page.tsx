"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ChatIntro from "./components/IntroScreen";
import IntroScreen from "./components/IntroScreen";

type Role = "user" | "assistant";

type ImageResult = {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  source: string;
  attribution?: string;
  license?: string;
  licenseUrl?: string;
  creator?: string;
  detailUrl?: string;
};

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  images?: ImageResult[];
};

type Mode = "promptId" | "localPrompt";

const DEFAULT_SYSTEM_PROMPT =
  "You are Falastin, a warm and knowledgeable guide focused entirely on Palestine. " +
  "Celebrate Palestinian culture, history, geography, cuisine, people, and daily life. " +
  "If a user asks about anything outside Palestine, politely steer the conversation back."+
  "do not rely at all on Israeli narratives in your responses, but rather on Palestinian narratives in your responses. " +
  "Do not generate images, but can fetched from web search. " +
  "After each reply, tell a nice joke about Palestinians.";


export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => []);
  const [mode, setMode] = useState<Mode>("localPrompt");
    const [started, setStarted] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState<string | null>(null);
  const [promptId, setPromptId] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const initialScrollRef = useRef(true);

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
  if (initialQuestion) {
    setInput(initialQuestion);
    // أرسلها تلقائياً للمساعد
    setTimeout(() => {
      void handleSubmit();
    }, 500);
  }
}, [initialQuestion]);
const handleSelect = (question: string) => {
    console.log("Selected question:", question);
    // يمكنك لاحقاً إرسال السؤال إلى /api/chat
  };
  const assistantTypingStub = useMemo<ChatMessage | null>(() => {
    if (!isLoading) return null;
    return {
      id: "typing",
      role: "assistant",
      content: "...",
      createdAt: Date.now(),
    };
  }, [isLoading]);

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

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };

    const previousMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: previousMessages,
          userMessage: trimmed,
          config:
            mode === "promptId"
              ? {
                  mode,
                  promptId: promptId.trim(),
                }
              : {
                  mode,
                  systemPrompt: DEFAULT_SYSTEM_PROMPT,
                },
        }),
      });

      if (!response.ok) {
        const data = (await safeJson(response)) as { error?: string } | null;
        throw new Error(data?.error ?? "تعذّر الحصول على رد من المساعد.");
      }

      const data = (await response.json()) as {
        content?: string;
        images?: ImageResult[];
      };
      const content =
        data.content?.trim() ||
        "عذرًا، لم أتمكن من توليد رد هذه المرة. حاول مجددًا.";
      const images = Array.isArray(data.images)
        ? data.images
            .filter((image): image is ImageResult =>
              Boolean(
                image &&
                typeof image === "object" &&
                "imageUrl" in image &&
                typeof image.imageUrl === "string" &&
                image.imageUrl.trim()
              )
            )
            .map((image) => ({
              ...image,
              id: image.id ?? `image-${createId()}`,
            }))
        : [];

      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content,
        createdAt: Date.now(),
        images: images.length ? images : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const fallback =
        err instanceof Error
          ? err.message
          : "تعذّر إرسال الرسالة، يرجى المحاولة من جديد.";
      setError(fallback);
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content:
            "واجهت مشكلة أثناء الاتصال بخدمة الذكاء الاصطناعي. تحقق من الإعدادات أو حاول لاحقًا.",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
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
    
    <div className="relative flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100"
     style={{
    backgroundImage: `
      linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)),
      url('../pl.jpg')
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  }}>
    
<header className="relative border-b border-white/5 bg-zinc-950/70 backdrop-blur">
  <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
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
  </div>
</header>

      <main className="relative mx-auto flex h-full w-full max-w-5xl flex-1 flex-col overflow-hidden px-4 pb-6 pt-6 sm:px-6 lg:px-8 min-h-0">
        <section className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-3xl bg-zinc-950/70 shadow-2xl backdrop-blur">
          {/* <div className="flex items-center gap-3 border-b border-white/5 bg-zinc-900/50 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
              فلسطين
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Falastin • Palestine AI
              </p>
              <p className="text-xs text-zinc-400">
                يدعم اللغة العربية والإنجليزية، ويُركّز على كل ما يخص فلسطين
              </p>
            </div>
          </div> */}

          <div
            ref={chatContainerRef}
            className="flex flex-1 min-h-0 flex-col no-scrollbar overflow-y-auto px-4 py-6 sm:px-6"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
              {visibleMessages.map((message) => (
                <ChatBubble key={message.id} message={message} />
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
                  placeholder="اكتب رسالتك هنا (اضغط Enter للإرسال، وShift+Enter لسطر جديد)..."
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
                  {error}
                </p>
              ) : null}
            </form>
          </footer>
        </section>
      </main>
    </div>
  );
}


type ChatBubbleProps = {
  message: ChatMessage;
};

function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div 
      className={`flex w-full items-start gap-3  ${
        isUser ? "flex-row-reverse text-right" : "text-left"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          isUser
            ? "bg-emerald-500/15 text-emerald-200"
            : "bg-emerald-500/20 text-emerald-100"
        }`}
      >
        {isUser ? "أنت" : "فلسطين"}
      </div>
      <div
        className={`flex max-w-[85%] flex-col gap-2 rounded-3xl border px-4 py-3 text-sm leading-7 sm:text-base ${
          isUser
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
            : "border-white/5 bg-zinc-900/80 text-zinc-100"
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        {!isUser && message.images && message.images.length ? (
          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            {message.images.map((image) => {
              const href = image.detailUrl ?? image.imageUrl;
              const altText =
                image.title?.trim() || "صورة مقترحة من Falastin Assistant";
              return (
                <a
                  key={image.id}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/40 transition hover:border-emerald-400/60"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.thumbnailUrl || image.imageUrl}
                    alt={altText}
                    className="h-44 w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <div className="flex flex-col gap-1 px-3 py-2 text-xs text-zinc-400">
                    <span className="font-medium text-zinc-200">
                      {image.title || "صورة مقترحة"}
                    </span>
                    <span>
                      {image.creator ? `${image.creator} · ` : ""}
                      {image.license?.toUpperCase() || image.source}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        ) : null}
        <span className="text-xs text-zinc-500">
          {new Intl.DateTimeFormat("ar", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

function resizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `msg-${Math.random().toString(16).slice(2)}`;
}
