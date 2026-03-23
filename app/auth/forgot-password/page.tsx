"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("sent");
      } else {
        // Don't reveal if email exists — always show success-like message
        setStatus("sent");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      dir="rtl"
      className="relative min-h-dvh flex items-center justify-center p-4"
    >
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8 text-center">
          {/* Icon */}
          <div className="text-6xl mb-4">🔑</div>

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            نسيت كلمة المرور؟
          </h1>

          {status === "sent" ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-2xl py-4 px-4 mb-6">
                <p className="text-sm text-green-700 font-semibold leading-relaxed">
                  إذا كان البريد مسجلاً لدينا، ستصلك رسالة لإعادة تعيين كلمة
                  المرور 📬
                </p>
              </div>

              <button
                onClick={() => router.push("/auth/login")}
                className="w-full py-3 rounded-2xl bg-[var(--kids-purple,#6C5CE7)] hover:bg-[#5a4bd6] text-white font-bold text-sm transition-colors"
              >
                عودة لتسجيل الدخول
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50/60 border-2 border-slate-200/70 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[var(--kids-purple,#6C5CE7)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(165,94,234,0.1)]"
                />

                {status === "error" && (
                  <div className="bg-red-50/80 border border-red-200/60 text-red-600 rounded-2xl px-4 py-3 text-sm">
                    حدث خطأ، حاول مرة أخرى
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
                    "أرسل رابط إعادة التعيين"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/auth/login")}
                  className="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
                >
                  عودة لتسجيل الدخول
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
