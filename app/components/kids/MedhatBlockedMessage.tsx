"use client";

interface MedhatBlockedMessageProps {
  className?: string;
}

export default function MedhatBlockedMessage({
  className = "",
}: MedhatBlockedMessageProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 p-6 rounded-2xl bg-[var(--kids-purple)]/5 border-2 border-[var(--kids-purple)]/20 text-center ${className}`}
    >
      <span className="text-4xl">🦁</span>
      <p className="text-base font-bold text-[var(--kids-purple)]">
        يا صديقي! لقد استخدمنا كل الرسائل المتاحة لنا.
      </p>
      <p className="text-sm text-gray-500">
        اطلب من والديك المساعدة!
      </p>
    </div>
  );
}
