"use client";

import { useState, useRef, useEffect } from "react";
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
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const accentColor = COLOR_HEX[activeProfile.color];

  return (
    <div className="relative" ref={ref}>
      {/* Collapsed pill */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all border-2"
        style={{ borderColor: accentColor }}
      >
        <span className="text-lg">{activeProfile.avatar}</span>
        <span
          className="font-bold text-sm max-w-[80px] truncate"
          style={{ color: accentColor }}
        >
          {activeProfile.name || "بطل"}
        </span>
        <span className={`text-xs text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
          {/* Profile list */}
          <div className="max-h-60 overflow-y-auto">
            {profiles.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${
                  p.id === activeProfile.id
                    ? "bg-[var(--kids-purple)]/10"
                    : "hover:bg-gray-50"
                }`}
              >
                <button
                  onClick={() => {
                    onSwitch(p.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <span className="text-2xl shrink-0">{p.avatar}</span>
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
                    <span className="text-[var(--kids-green)] text-sm shrink-0">✓</span>
                  )}
                </button>

                {/* Edit / Delete */}
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(p.id);
                      setOpen(false);
                    }}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs transition-colors"
                    title="تعديل"
                  >
                    ✏️
                  </button>
                  {profiles.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(p.id);
                        setOpen(false);
                      }}
                      className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-xs transition-colors"
                      title="حذف"
                    >
                      🗑️
                    </button>
                  )}
                </div>
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
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-t border-gray-100 text-sm font-bold text-[var(--kids-purple)] hover:bg-[var(--kids-purple)]/5 transition-colors"
            >
              <span>➕</span>
              <span>إضافة لاعب جديد</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
