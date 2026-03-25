"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

const COOLDOWN_SECONDS = 60;

interface EmailVerificationModalProps {
  /** "reminder" allows closing; "blocked" only allows resend */
  mode: "reminder" | "blocked";
  email?: string;
  onClose: () => void;
  onResend: () => Promise<void>;
}

export default function EmailVerificationModal({
  mode,
  email,
  onClose,
  onResend,
}: EmailVerificationModalProps) {
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend();
      setCooldown(COOLDOWN_SECONDS);
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
          return prev - 1;
        });
      }, 1000);
    } finally {
      setIsResending(false);
    }
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[59]"
        onClick={mode === "reminder" ? onClose : undefined}
      />
      <div
        className="fixed top-1/2 left-1/2 z-[60] bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{
          width: "min(90%, 340px)",
          transform: "translate(-50%, -50%)",
          animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        dir="rtl"
      >
        <div className="px-6 py-6 text-center">
          <div className="text-5xl mb-3">✉️</div>
          <h3 className="font-bold text-gray-800 text-base mb-1">
            فعّل بريدك الإلكتروني
          </h3>
          {email && (
            <p className="text-xs text-gray-400 mb-2 truncate">{email}</p>
          )}
          <p className="text-sm text-gray-600 mb-5 leading-relaxed">
            {mode === "blocked"
              ? "لازم تفعّل بريدك الإلكتروني عشان تقدر تحكي مع مدهت وتستخدم الألعاب!"
              : "فعّل بريدك الإلكتروني عشان تقدر تستخدم كل ميزات التطبيق!"}
          </p>

          {cooldown > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl py-3 px-4 mb-4">
              <p className="text-sm text-green-700 font-semibold">
                تم إرسال رابط التفعيل! تحقق من بريدك الإلكتروني 📬
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              className="w-full py-2.5 rounded-2xl bg-[var(--kids-purple,#6C5CE7)] hover:bg-[#5a4bd6] text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {isResending ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : cooldown > 0 ? (
                `أعد الإرسال بعد ${cooldown} ثانية`
              ) : (
                "أعد إرسال رابط التفعيل"
              )}
            </button>

            {mode === "reminder" && (
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
              >
                لاحقاً
              </button>
            )}

            {mode === "blocked" && (
              <button
                onClick={onClose}
                className="w-full py-2 text-gray-400 text-xs hover:text-gray-600 transition-colors"
              >
                إغلاق
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>,
    document.body
  );
}
