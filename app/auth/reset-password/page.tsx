"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password.length < 8) {
      setLocalError("كلمة المرور قصيرة — اكتب 8 حروف على الأقل 🔐");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("كلمتا المرور مختلفتان — تأكد من الكتابة بشكل صحيح 🔑");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(
          data.message ?? "الرابط غير صالح أو منتهي الصلاحية"
        );
      }
    } catch {
      setStatus("error");
      setErrorMessage("حدث خطأ، حاول مرة أخرى");
    }
  };

  if (!token) {
    return (
      <div
        dir="rtl"
        className="relative min-h-dvh flex items-center justify-center p-4"
      >
        <div className="relative z-10 w-full max-w-[420px]">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              رابط غير صالح
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              لا يوجد رمز إعادة تعيين في هذا الرابط.
            </p>
            <button
              onClick={() => router.push("/auth/forgot-password")}
              className="w-full py-3 rounded-2xl bg-[var(--kids-purple,#6C5CE7)] hover:bg-[#5a4bd6] text-white font-bold text-sm transition-colors"
            >
              اطلب رابط جديد
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div
        dir="rtl"
        className="relative min-h-dvh flex items-center justify-center p-4"
      >
        <div className="relative z-10 w-full max-w-[420px]">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              تم تغيير كلمة المرور!
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full py-3 rounded-2xl bg-[var(--kids-purple,#6C5CE7)] hover:bg-[#5a4bd6] text-white font-bold text-sm transition-colors"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        dir="rtl"
        className="relative min-h-dvh flex items-center justify-center p-4"
      >
        <div className="relative z-10 w-full max-w-[420px]">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              فشل إعادة التعيين
            </h1>
            <p className="text-sm text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/auth/forgot-password")}
                className="w-full py-3 rounded-2xl bg-[var(--kids-purple,#6C5CE7)] hover:bg-[#5a4bd6] text-white font-bold text-sm transition-colors"
              >
                اطلب رابط جديد
              </button>
              <button
                onClick={() => router.push("/auth/login")}
                className="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
              >
                عودة لتسجيل الدخول
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="relative min-h-dvh flex items-center justify-center p-4"
    >
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            إعادة تعيين كلمة المرور
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            أدخل كلمة مرور جديدة لحسابك
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <div>
              <label className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-slate-600 mb-1.5">
                <span className="text-xs">🔑</span>
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm bg-slate-50/60 border-2 border-slate-200/70 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[var(--kids-purple,#6C5CE7)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(165,94,234,0.1)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 text-base leading-none"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {password.length > 0 && <PasswordStrengthBar password={password} />}

            <div>
              <label className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-slate-600 mb-1.5">
                <span className="text-xs">🔒</span>
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm bg-slate-50/60 border-2 border-slate-200/70 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[var(--kids-purple,#6C5CE7)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(165,94,234,0.1)]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 text-base leading-none"
                  aria-label={showConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showConfirm ? "🙈" : "👁️"}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p
                  className={`text-xs px-1 mt-1 transition-colors ${
                    password === confirmPassword ? "text-emerald-500" : "text-red-400"
                  }`}
                >
                  {password === confirmPassword
                    ? "✅ كلمتا المرور متطابقتان"
                    : "❌ كلمتا المرور مختلفتان"}
                </p>
              )}
            </div>

            {localError && (
              <div className="bg-red-50/80 border border-red-200/60 text-red-600 rounded-2xl px-4 py-3 text-sm flex items-start gap-2">
                <span className="shrink-0 mt-px">⚠️</span>
                <span>{localError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-2xl bg-[var(--kids-purple,#6C5CE7)] hover:bg-[#5a4bd6] text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                "تغيير كلمة المرور"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { level, label, color } = useMemo(() => {
    const len = password.length;
    if (len >= 8) {
      const hasUpper = /[A-Z]/.test(password);
      const hasDigit = /\d/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);
      const variety = [hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
      if (variety >= 2)
        return { level: 3, label: "قوية", color: "bg-emerald-400" };
      return { level: 2, label: "متوسطة", color: "bg-amber-400" };
    }
    if (len >= 4)
      return { level: 1, label: "ضعيفة", color: "bg-red-400" };
    return { level: 1, label: "ضعيفة", color: "bg-red-400" };
  }, [password]);

  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= level ? color : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <span
        className={`text-[0.7rem] font-semibold transition-colors duration-300 ${
          level >= 3
            ? "text-emerald-500"
            : level >= 2
              ? "text-amber-500"
              : "text-red-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
