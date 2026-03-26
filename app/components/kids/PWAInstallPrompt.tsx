"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import { usePWAInstall } from "@/lib/hooks/usePWAInstall";

export default function PWAInstallPrompt() {
  const { showPrompt, isIOS, install, dismiss } = usePWAInstall();

  if (!showPrompt) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[55]"
        onClick={dismiss}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[56] bg-white rounded-t-3xl shadow-2xl"
        style={{
          animation: "pwaSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          maxWidth: "480px",
          margin: "0 auto",
        }}
        dir="rtl"
      >
        <div className="px-6 pt-5 pb-8">
          {/* Handle bar */}
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

          {/* Icon + text */}
          <div className="flex items-center gap-4 mb-5">
            <Image
              src="/pss.webp"
              alt="PS Kids"
              width={64}
              height={64}
              className="rounded-2xl shadow-md flex-shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-bold text-lg text-gray-800">
                ثبّت PS Kids!
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                تعلّم والعب بشكل أسرع من شاشتك الرئيسية
              </p>
            </div>
          </div>

          {isIOS ? (
            /* iOS: manual instructions */
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <p className="text-sm text-gray-700 mb-3 font-medium">
                لتثبيت التطبيق على جهازك:
              </p>
              <div className="flex items-start gap-3 mb-2.5">
                <span className="text-lg leading-none mt-0.5">
                  {/* Share icon (iOS) */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>
                <p className="text-sm text-gray-600">
                  اضغط على زر <span className="font-bold text-blue-500">المشاركة</span> في الأسفل
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg leading-none mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </span>
                <p className="text-sm text-gray-600">
                  ثم اختر <span className="font-bold text-blue-500">إضافة إلى الشاشة الرئيسية</span>
                </p>
              </div>
            </div>
          ) : null}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={dismiss}
              className="flex-1 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-sm transition-colors active:scale-95"
            >
              لاحقاً
            </button>
            {!isIOS && (
              <button
                onClick={install}
                className="flex-1 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, var(--kids-purple, #A55EEA) 0%, #54A0FF 100%)",
                }}
              >
                ثبّت التطبيق
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pwaSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>,
    document.body
  );
}
