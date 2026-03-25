"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/context/auth-context";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuthContext();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("رابط التفعيل غير صالح — لا يوجد رمز تحقق.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus("success");
          setMessage(data.message ?? "تم تفعيل بريدك الإلكتروني بنجاح!");
          // Refresh the access token first (so JWT contains isEmailVerified: true),
          // then re-read the new token into auth context.
          await fetch("/api/auth/refresh", { method: "POST" });
          await refresh();
        } else {
          setStatus("error");
          setMessage(data.message ?? "رمز التحقق غير صالح أو منتهي الصلاحية");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("حدث خطأ، حاول مرة أخرى");
      });
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = useCallback(async () => {
    setResending(true);
    try {
      await fetch("/api/auth/resend-verification", { method: "POST" });
      setResent(true);
    } finally {
      setResending(false);
    }
  }, []);

  return (
    <div
      dir="rtl"
      className="relative min-h-dvh flex items-center justify-center p-4"
    >
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8 text-center">
          {/* Icon */}
          <div className="text-6xl mb-4">
            {status === "loading"
              ? "⏳"
              : status === "success"
                ? "✅"
                : "❌"}
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            {status === "loading"
              ? "جاري التحقق..."
              : status === "success"
                ? "تم التفعيل!"
                : "فشل التفعيل"}
          </h1>

          {/* Message */}
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {status === "loading"
              ? "يتم التحقق من رمز التفعيل..."
              : message}
          </p>

          {/* Loading spinner */}
          {status === "loading" && (
            <div className="flex justify-center mb-4">
              <span className="inline-block w-8 h-8 border-3 border-[var(--kids-purple,#6C5CE7)]/30 border-t-[var(--kids-purple,#6C5CE7)] rounded-full animate-spin" />
            </div>
          )}

          {/* Success actions */}
          {status === "success" && (
            <button
              onClick={() => router.push("/chat")}
              className="w-full py-3 rounded-2xl bg-[var(--kids-purple,#6C5CE7)] hover:bg-[#5a4bd6] text-white font-bold text-sm transition-colors"
            >
              ابدأ المحادثة 🚀
            </button>
          )}

          {/* Error actions */}
          {status === "error" && (
            <div className="flex flex-col gap-3">
              {resent ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl py-3 px-4">
                  <p className="text-sm text-green-700 font-semibold">
                    تم إرسال رابط تفعيل جديد! تحقق من بريدك الإلكتروني 📬
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full py-3 rounded-2xl bg-[var(--kids-purple,#6C5CE7)] hover:bg-[#5a4bd6] text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {resending ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    "أعد إرسال رابط التفعيل"
                  )}
                </button>
              )}

              <button
                onClick={() => router.push("/auth/login")}
                className="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
              >
                عودة لتسجيل الدخول
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
