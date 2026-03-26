"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";

/* ─────────────────────────────────────────────
   Login / Register Page — Premium Kids Design
   ───────────────────────────────────────────── */

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");

  const { login, register, loginWithGoogle, isPending, error, clearError } =
    useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    clearError();
    setLocalError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (mode === "register") {
      if (password.length < 8) {
        setLocalError("كلمة المرور قصيرة — اكتب 8 حروف على الأقل 🔐");
        return;
      }
      if (password !== confirmPassword) {
        setLocalError("كلمتا المرور مختلفتان — تأكد من الكتابة بشكل صحيح 🔑");
        return;
      }
      const ok = await register(email, password);
      if (ok) router.push("/kids");
    } else {
      const ok = await login(email, password);
      if (ok) router.push("/kids");
    }
  };

  const displayError =
    localError ??
    error ??
    (oauthError ? "فشل تسجيل الدخول بـ Google" : null);

  return (
    <div
      dir="rtl"
      className="relative min-h-dvh flex items-center justify-center p-4 overflow-hidden"
    >
      {/* ── Floating background decorations ── */}
      <FloatingDecorations />

      {/* ── Main content ── */}
      <div className="relative z-10 w-full max-w-[420px]">
        {/* ── Branding header ── */}
        <header className="text-center mb-7">
          {/* Mascot */}
          <div
            className="animate-pop-in mx-auto mb-3 w-[76px] h-[76px] rounded-full
              flex items-center justify-center text-5xl
              bg-white/60 backdrop-blur-md shadow-lg shadow-purple-200/40
              border-2 border-white/70"
          >
            🦁
          </div>

          <h1
            className="animate-fade-in-up delay-100 text-[1.75rem] font-extrabold tracking-tight
              bg-gradient-to-l from-[var(--kids-purple)] via-[#7C3AED] to-[var(--kids-blue)]
              bg-clip-text text-transparent
              drop-shadow-[0_2px_12px_rgba(165,94,234,0.25)]"
            style={{ fontFamily: "var(--font-cairo)" }}
          >
            PS-Kids
          </h1>

          <p
            className="animate-fade-in-up delay-200 mt-1 text-[0.82rem] font-medium text-slate-500"
          >
            تعلّم مع مدحت&ensp;🦁
          </p>

          {/* Parent badge */}
          <span
            className="animate-fade-in delay-300 inline-block mt-2.5 text-[0.68rem]
              font-semibold text-[var(--kids-green)] bg-[var(--kids-green)]/10
              px-3 py-1 rounded-full border border-[var(--kids-green)]/20"
          >
            لولي الأمر
          </span>
        </header>

        {/* ── Glass card with gradient border ── */}
        <div
          className="animate-fade-in-up delay-200 rounded-[1.75rem] p-[1.5px]
            bg-gradient-to-br from-[var(--kids-purple)]/30 via-white/10 to-[var(--kids-green)]/25"
        >
          <div
            className="rounded-[1.625rem] bg-white/80 backdrop-blur-xl
              shadow-[0_8px_40px_rgba(165,94,234,0.12),0_2px_12px_rgba(0,0,0,0.06)]
              p-6 sm:p-8"
          >
            {/* ── Segmented toggle ── */}
            <SegmentedToggle mode={mode} setMode={setMode} />

            {/* ── Google OAuth ── */}
            <button
              type="button"
              onClick={loginWithGoogle}
              disabled={isPending}
              className="group w-full flex items-center justify-center gap-2.5
                py-3 px-4 rounded-2xl
                bg-white border border-slate-200/80 shadow-sm
                hover:shadow-md hover:border-slate-300 hover:scale-[1.02]
                active:scale-[0.98]
                transition-all duration-200 ease-out
                font-semibold text-sm text-slate-700
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                mt-5"
            >
              <span className="transition-transform duration-200 group-hover:scale-110">
                <GoogleIcon />
              </span>
              تسجيل الدخول بـ Google
            </button>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gradient-to-l from-slate-300/80 to-transparent" />
              <span className="text-[0.7rem] font-medium text-slate-400 select-none">
                أو
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-300/80 to-transparent" />
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <InputField
                id="email"
                type="email"
                label="البريد الإلكتروني"
                icon="✉️"
                value={email}
                onChange={setEmail}
                placeholder="example@email.com"
                dir="ltr"
                required
              />

              {/* Password */}
              <InputField
                id="password"
                type="password"
                label="كلمة المرور"
                icon="🔑"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                dir="ltr"
                required
                showToggle
              />

              {/* Forgot password link (login only) */}
              {mode === "login" && (
                <div className="text-left -mt-1">
                  <Link
                    href="/auth/forgot-password"
                    className="text-[0.78rem] font-medium text-[var(--kids-purple)] hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>
              )}

              {/* Password strength (register only) */}
              {mode === "register" && password.length > 0 && (
                <PasswordStrengthBar password={password} />
              )}

              {/* Confirm password (register only) */}
              {mode === "register" && (
                <div className="animate-fade-in-up">
                  <InputField
                    id="confirmPassword"
                    type="password"
                    label="تأكيد كلمة المرور"
                    icon="🔒"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="••••••••"
                    dir="ltr"
                    required
                    showToggle
                  />
                  {confirmPassword.length > 0 && (
                    <p
                      className={`text-xs px-1 mt-1 transition-colors ${
                        password === confirmPassword
                          ? "text-emerald-500"
                          : "text-red-400"
                      }`}
                    >
                      {password === confirmPassword
                        ? "✅ كلمتا المرور متطابقتان"
                        : "❌ كلمتا المرور مختلفتان"}
                    </p>
                  )}
                </div>
              )}

              {/* Error */}
              {displayError && (
                <div
                  role="alert"
                  className="animate-shake flex items-start gap-2
                    bg-red-50/80 backdrop-blur-sm border border-red-200/60
                    text-red-600 rounded-2xl px-4 py-3 text-[0.82rem]"
                >
                  <span className="shrink-0 text-sm mt-px">⚠️</span>
                  <span>{displayError}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 rounded-2xl font-bold text-white text-[0.92rem]
                  bg-gradient-to-l from-[var(--kids-purple)] to-[#7C3AED]
                  shadow-[0_4px_20px_rgba(165,94,234,0.35)]
                  hover:shadow-[0_6px_28px_rgba(165,94,234,0.5)]
                  hover:scale-[1.02] active:scale-[0.98]
                  transition-all duration-200 ease-out
                  disabled:opacity-55 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner />
                    جاري التحميل...
                  </span>
                ) : mode === "login" ? (
                  "دخول"
                ) : (
                  "إنشاء الحساب"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── Footer ── */}
        <p className="animate-fade-in delay-500 text-center text-[0.7rem] text-slate-400/90 mt-5 select-none">
          🔒&ensp;لولي الأمر فقط — يحمي بيانات أطفالك
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

/** Animated segmented control with sliding pill */
function SegmentedToggle({
  mode,
  setMode,
}: {
  mode: "login" | "register";
  setMode: (m: "login" | "register") => void;
}) {
  const isLogin = mode === "login";

  return (
    <div className="relative flex rounded-2xl bg-slate-100/80 p-1" dir="ltr">
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl
          bg-gradient-to-r from-[var(--kids-purple)] to-[#7C3AED]
          shadow-md shadow-purple-300/40
          transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
        style={{
          transform: isLogin ? "translateX(0%)" : "translateX(calc(100% + 4px))",
        }}
      />

      <button
        type="button"
        onClick={() => setMode("login")}
        className={`relative z-10 flex-1 py-2.5 text-[0.82rem] font-bold rounded-xl
          transition-colors duration-200
          ${isLogin ? "text-white" : "text-slate-500 hover:text-slate-700"}`}
      >
        تسجيل الدخول
      </button>

      <button
        type="button"
        onClick={() => setMode("register")}
        className={`relative z-10 flex-1 py-2.5 text-[0.82rem] font-bold rounded-xl
          transition-colors duration-200
          ${!isLogin ? "text-white" : "text-slate-500 hover:text-slate-700"}`}
      >
        إنشاء حساب
      </button>
    </div>
  );
}

/** Premium input field */
function InputField({
  id,
  type,
  label,
  icon,
  value,
  onChange,
  placeholder,
  dir,
  required,
  showToggle,
}: {
  id: string;
  type: string;
  label: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  dir?: string;
  required?: boolean;
  showToggle?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const actualType = showToggle ? (visible ? "text" : "password") : type;

  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-slate-600 mb-1.5"
      >
        <span className="text-xs">{icon}</span>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={actualType}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir={dir}
          className={`w-full px-4 py-3 rounded-2xl text-sm
            bg-slate-50/60 border-2 border-slate-200/70
            text-slate-800 placeholder:text-slate-400
            outline-none transition-all duration-200
            focus:border-[var(--kids-purple)]
            focus:bg-white
            focus:shadow-[0_0_0_4px_rgba(165,94,234,0.1)]
            ${showToggle ? "pl-10" : ""}`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 text-base leading-none"
            aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          >
            {visible ? "🙈" : "👁️"}
          </button>
        )}
      </div>
    </div>
  );
}

/** Password strength indicator (3 bars) */
function PasswordStrengthBar({ password }: { password: string }) {
  const { level, label, color } = useMemo(() => {
    const len = password.length;
    if (len >= 8) {
      const hasUpper = /[A-Z]/.test(password);
      const hasDigit = /\d/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);
      const variety = [hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
      if (variety >= 2) return { level: 3, label: "قوية", color: "bg-emerald-400" };
      return { level: 2, label: "متوسطة", color: "bg-amber-400" };
    }
    if (len >= 4) return { level: 1, label: "ضعيفة", color: "bg-red-400" };
    return { level: 1, label: "ضعيفة", color: "bg-red-400" };
  }, [password]);

  return (
    <div className="animate-fade-in flex items-center gap-2.5 px-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300
              ${i <= level ? color : "bg-slate-200"}`}
          />
        ))}
      </div>
      <span
        className={`text-[0.7rem] font-semibold transition-colors duration-300
          ${level >= 3 ? "text-emerald-500" : level >= 2 ? "text-amber-500" : "text-red-400"}`}
      >
        {label}
      </span>
    </div>
  );
}

/** Inline CSS spinner */
function LoadingSpinner() {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full
        border-2 border-white/30 border-t-white
        animate-spin"
    />
  );
}

/** Floating background blobs + sparkles */
function FloatingDecorations() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Large blobs */}
      <div
        className="absolute -top-16 -right-20 w-72 h-72 rounded-full animate-float
          bg-[var(--kids-purple)] opacity-[0.08] blur-3xl"
      />
      <div
        className="absolute top-1/3 -left-24 w-64 h-64 rounded-full animate-float delay-300
          bg-[var(--kids-green)] opacity-[0.1] blur-3xl"
      />
      <div
        className="absolute -bottom-10 right-10 w-56 h-56 rounded-full animate-float delay-100
          bg-[var(--kids-yellow)] opacity-[0.12] blur-2xl"
      />
      <div
        className="absolute top-10 left-1/3 w-40 h-40 rounded-full animate-float delay-500
          bg-[var(--kids-pink)] opacity-[0.07] blur-3xl"
      />

      {/* Sparkle dots */}
      <div className="absolute top-[15%] right-[12%] w-2 h-2 rounded-full bg-[var(--kids-yellow)] opacity-60 animate-twinkle" />
      <div className="absolute top-[25%] left-[18%] w-1.5 h-1.5 rounded-full bg-[var(--kids-purple)] opacity-50 animate-twinkle delay-200" />
      <div className="absolute bottom-[30%] right-[22%] w-2.5 h-2.5 rounded-full bg-[var(--kids-green)] opacity-40 animate-twinkle delay-400" />
      <div className="absolute bottom-[18%] left-[14%] w-2 h-2 rounded-full bg-[var(--kids-orange)] opacity-50 animate-twinkle delay-100" />
      <div className="absolute top-[60%] right-[40%] w-1.5 h-1.5 rounded-full bg-[var(--kids-blue)] opacity-40 animate-twinkle delay-300" />

      {/* Subtle geometric accent — diamond */}
      <div
        className="absolute top-[42%] right-[8%] w-6 h-6 rotate-45 rounded-sm
          border border-[var(--kids-purple)]/15 animate-float delay-200"
      />
      <div
        className="absolute bottom-[38%] left-[10%] w-4 h-4 rotate-45 rounded-sm
          border border-[var(--kids-green)]/15 animate-float delay-400"
      />
    </div>
  );
}

/** Google brand icon (official colors) */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
