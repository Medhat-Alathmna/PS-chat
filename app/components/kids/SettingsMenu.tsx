"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import ProfileSwitcher from "./ProfileSwitcher";
import { KidsProfile } from "@/lib/types/games";
import { useAuth } from "@/lib/hooks/useAuth";

interface SettingsMenuProps {
  profiles: KidsProfile[];
  activeProfile: KidsProfile | null;
  onSwitch: (id: string) => void;
  onAddNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function SettingsMenu({
  profiles,
  activeProfile,
  onSwitch,
  onAddNew,
  onEdit,
  onDelete,
}: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout, isPending, user } = useAuth();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Settings button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/80 backdrop-blur-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl"
        aria-label="الإعدادات"
        title="الإعدادات"
      >
        <span className="text-xl sm:text-2xl">⚙️</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-white/50 overflow-hidden min-w-[280px]">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-[var(--kids-purple)] to-[var(--kids-blue)] text-white">
              <h3 className="font-bold text-sm" dir="rtl">الإعدادات</h3>
            </div>

            {/* Profile switcher */}
            <div className="p-3" dir="rtl">
              <p className="text-xs font-semibold text-gray-600 mb-2">الملف الشخصي</p>
              <ProfileSwitcher
                profiles={profiles}
                activeProfile={activeProfile!}
                onSwitch={(id) => {
                  onSwitch(id);
                  setIsOpen(false);
                }}
                onAddNew={() => {
                  onAddNew();
                  setIsOpen(false);
                }}
                onEdit={(id) => {
                  onEdit(id);
                  setIsOpen(false);
                }}
                onDelete={(id) => {
                  onDelete(id);
                  setIsOpen(false);
                }}
              />
            </div>

            {/* Logout button */}
            <div className="px-3 pb-3" dir="rtl">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setConfirmLogout(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
              >
                <span>🚪</span>
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout confirmation modal */}
      {confirmLogout && typeof window !== "undefined" && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setConfirmLogout(false)}
          />
          <div
            className="fixed top-1/2 left-1/2 z-50 bg-white rounded-3xl shadow-2xl overflow-hidden"
            style={{
              width: "min(90%, 340px)",
              transform: "translate(-50%, -50%)",
              animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            }}
            dir="rtl"
          >
            <div className="px-6 py-5 text-center">
              <div className="text-4xl mb-3">🚪</div>
              <h3 className="font-bold text-gray-800 text-base mb-1">تسجيل الخروج؟</h3>
              {user?.email && (
                <p className="text-xs text-gray-400 mb-2 truncate">{user.email}</p>
              )}
              <p className="text-xs text-gray-500 mb-5">
                سيتم مسح جميع بيانات الأطفال من هذا الجهاز
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmLogout(false)}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={logout}
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
      )}
    </div>
  );
}
