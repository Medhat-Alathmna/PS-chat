import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "مستكشف الدول - World Explorer",
  description: "استكشف دول العالم مع مدحت على الكرة الأرضية - Explore countries with Medhat on the globe",
  alternates: { canonical: "/kids/world-explorer" },
};

export default function WorldExplorerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
