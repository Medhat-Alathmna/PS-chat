import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ألعاب تعليمية - Educational Games",
  description: "ألعاب تعليمية ممتعة للأطفال عن فلسطين - Fun educational games for kids about Palestine",
  alternates: { canonical: "/kids/games" },
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
