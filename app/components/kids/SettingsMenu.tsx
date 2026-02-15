"use client";

import { useState, useRef, useEffect } from "react";
import ProfileSwitcher from "./ProfileSwitcher";
import { KidsProfile } from "@/lib/types/games";

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
  const menuRef = useRef<HTMLDivElement>(null);

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
          </div>
        </div>
      )}
    </div>
  );
}
