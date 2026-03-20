"use client";

import { createPortal } from "react-dom";

interface LogoutConfirmModalProps {
  email?: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmModal({
  email,
  isPending,
  onCancel,
  onConfirm,
}: LogoutConfirmModalProps) {
  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[59]"
        onClick={onCancel}
      />
      <div
        className="fixed top-1/2 left-1/2 z-[60] bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{
          width: "min(90%, 320px)",
          transform: "translate(-50%, -50%)",
          animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        dir="rtl"
      >
        <div className="px-6 py-5 text-center">
          <div className="text-4xl mb-3">🚪</div>
          <h3 className="font-bold text-gray-800 text-base mb-1">تسجيل الخروج؟</h3>
          {email && (
            <p className="text-xs text-gray-400 mb-2 truncate">{email}</p>
          )}
          <p className="text-xs text-gray-500 mb-5">
جميع بيانات الاطفال في هذا الحساب محفوظة سحابياً
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5"
            >
              {isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                "نعم، اخرج"
              )}
            </button>
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
