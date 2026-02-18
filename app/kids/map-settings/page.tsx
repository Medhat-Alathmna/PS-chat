"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MapSettingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/kids/settings?tab=map");
  }, [router]);
  return null;
}
