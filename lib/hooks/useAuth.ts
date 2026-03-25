"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useAuthContext } from "@/lib/context/auth-context";

interface BackendProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  color: string;
  createdAt: string;
}

async function prefetchProfiles() {
  const res = await fetch("/api/profiles");
  if (!res.ok) return;
  const backendProfiles: BackendProfile[] = await res.json();
  const profiles = backendProfiles.map((p) => ({
    id: p.id,
    name: p.name,
    age: p.age,
    avatar: p.avatar,
    color: p.color,
    createdAt: new Date(p.createdAt).getTime(),
  }));
  const activeProfileId = profiles[0]?.id ?? null;
  localStorage.setItem(
    "falastin_profiles",
    JSON.stringify({ profiles, activeProfileId })
  );
}

export function useAuth() {
  const { user, isLoading, isAuthenticated, refresh, clearAuth } =
    useAuthContext();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setIsPending(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(
            data?.message ?? "فشل تسجيل الدخول، تحقق من البريد وكلمة المرور"
          );
          return false;
        }

        await refresh();
        await prefetchProfiles().catch(() => {});
        return true;
      } catch {
        setError("حدث خطأ، حاول مرة أخرى");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [refresh]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setIsPending(true);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data?.message ?? "فشل إنشاء الحساب");
          return false;
        }

        await refresh();
        await prefetchProfiles().catch(() => {});
        return true;
      } catch {
        setError("حدث خطأ، حاول مرة أخرى");
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    setIsPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // تسجيل الخروج المحلي حتى لو فشل الطلب
    } finally {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("falastin_"))
        .forEach((k) => localStorage.removeItem(k));
      clearAuth();
      router.push("/auth/login");
    }
  }, [clearAuth, router]);

  const loginWithGoogle = useCallback(() => {
    window.location.href = "/api/auth/google";
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    isPending,
    login,
    register,
    logout,
    loginWithGoogle,
    clearError: () => setError(null),
  };
}
