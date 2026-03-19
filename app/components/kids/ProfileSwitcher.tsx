"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { KidsProfile, ProfileColor } from "@/lib/types/games";

const COLOR_HEX: Record<ProfileColor, string> = {
  purple: "#6C5CE7",
  green: "#00B894",
  blue: "#0984E3",
  orange: "#FF9F43",
  pink: "#FD79A8",
  red: "#EE2A35",
};

interface ProfileSwitcherProps {
  profiles: KidsProfile[];
  activeProfile: KidsProfile;
  onSwitch: (id: string) => void;
  onAddNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ProfileSwitcher({
  profiles,
  activeProfile,
  onSwitch,
  onAddNew,
  onEdit,
  onDelete,
}: ProfileSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const accentColor = COLOR_HEX[activeProfile.color];

  const modal = open && (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={() => { setOpen(false); setConfirmDeleteId(null); }}
        style={{ animation: "fadeIn 0.2s ease" }}
      />

      {/* Modal — centered, 50% width on desktop, 90% on mobile */}
      <div
        className="fixed top-1/2 left-1/2 z-50 bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{
          width: "min(50%, 360px)",
          minWidth: "280px",
          maxHeight: "80vh",
          transform: "translate(-50%, -50%)",
          animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
          style={{ background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)` }}
        >
          <span className="font-bold text-base text-gray-700">اختر لاعباً</span>
          <button
            onClick={() => { setOpen(false); setConfirmDeleteId(null); }}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Profile list */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 130px)" }}>
          {profiles.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-4 py-3 transition-colors border-b border-gray-50 last:border-0 ${
                p.id === activeProfile.id ? "bg-opacity-10" : "hover:bg-gray-50"
              }`}
              style={
                p.id === activeProfile.id
                  ? { background: `${COLOR_HEX[p.color]}12` }
                  : {}
              }
            >
              <button
                onClick={() => {
                  onSwitch(p.id);
                  setOpen(false);
                }}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <span className="text-3xl shrink-0">{p.avatar}</span>
                <div className="flex-1 min-w-0 text-right">
                  <div
                    className="font-bold text-sm truncate"
                    style={{ color: COLOR_HEX[p.color] }}
                  >
                    {p.name || "بطل"}
                  </div>
                  <div className="text-xs text-gray-400">{p.age} سنين</div>
                </div>
                {p.id === activeProfile.id && (
                  <span
                    className="text-sm shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white"
                    style={{ background: COLOR_HEX[p.color] }}
                  >
                    ✓
                  </span>
                )}
              </button>

              {/* Edit / Delete */}
              {confirmDeleteId === p.id ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-red-500 font-bold">تأكيد؟</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(p.id);
                      setConfirmDeleteId(null);
                      setOpen(false);
                    }}
                    className="w-8 h-8 rounded-xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white text-sm font-bold transition-colors"
                    title="نعم، احذف"
                  >
                    ✓
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(null);
                    }}
                    className="w-8 h-8 rounded-xl bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-bold transition-colors"
                    title="إلغاء"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(p.id);
                      setOpen(false);
                    }}
                    className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm transition-colors"
                    title="تعديل"
                  >
                    ✏️
                  </button>
                  {profiles.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(p.id);
                      }}
                      className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center text-sm transition-colors"
                      title="حذف"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add new */}
        {profiles.length < 6 && (
          <button
            onClick={() => {
              onAddNew();
              setOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 border-t border-gray-100 text-sm font-bold hover:opacity-80 transition-opacity"
            style={{ color: accentColor }}
          >
            <span>➕</span>
            <span>إضافة لاعب جديد</span>
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );

  return (
    <>
      {/* Trigger pill */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all border-2"
        style={{ borderColor: accentColor }}
      >
        <span className="text-base sm:text-lg">{activeProfile.avatar}</span>
        <span
          className="font-bold text-xs sm:text-sm max-w-[80px] truncate hidden sm:block"
          style={{ color: accentColor }}
        >
          {activeProfile.name || "بطل"}
        </span>
        <span className={`text-[10px] sm:text-xs text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {typeof window !== "undefined" && createPortal(modal, document.body)}
    </>
  );
}
