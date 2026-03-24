import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الإعدادات - Settings",
  description: "تخصيص إعدادات التطبيق - Customize your app settings",
  alternates: { canonical: "/kids/settings" },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
