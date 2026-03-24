"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuthContext } from "@/lib/context/auth-context";
import EmailVerificationModal from "./EmailVerificationModal";

interface EmailVerificationContextValue {
  /** Show the verification modal in "blocked" mode (for LLM attempts) */
  showVerificationModal: () => void;
  /** Show the verification reminder modal once per session (for kids intro screen) */
  showVerificationReminder: () => void;
}

const EmailVerificationContext =
  createContext<EmailVerificationContextValue | null>(null);

const SESSION_KEY = "email_verify_reminded";

export function EmailVerificationGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, refresh } = useAuthContext();
  const [modalMode, setModalMode] = useState<"reminder" | "blocked" | null>(
    null
  );

  const showVerificationModal = useCallback(() => {
    setModalMode("blocked");
  }, []);

  const showVerificationReminder = useCallback(() => {
    if (!user || user.isEmailVerified) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    setModalMode("reminder");
    sessionStorage.setItem(SESSION_KEY, "1");
  }, [user]);

  const handleClose = useCallback(() => {
    setModalMode(null);
  }, []);

  const handleResend = useCallback(async () => {
    await fetch("/api/auth/resend-verification", { method: "POST" });
  }, []);

  return (
    <EmailVerificationContext.Provider value={{ showVerificationModal, showVerificationReminder }}>
      {children}
      {modalMode && user && !user.isEmailVerified && (
        <EmailVerificationModal
          mode={modalMode}
          email={user.email}
          onClose={handleClose}
          onResend={handleResend}
        />
      )}
    </EmailVerificationContext.Provider>
  );
}

export function useEmailVerification(): EmailVerificationContextValue {
  const ctx = useContext(EmailVerificationContext);
  if (!ctx)
    throw new Error(
      "useEmailVerification must be used within EmailVerificationGuard"
    );
  return ctx;
}
