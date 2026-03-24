import type { Metadata } from "next";
import StoriesMusicProvider from "@/app/components/kids/stories/StoriesMusicProvider";

export const metadata: Metadata = {
  title: "احكيلي قصة - Story Time",
  description: "قصص تفاعلية للأطفال عن فلسطين - Interactive stories for kids about Palestine",
  alternates: { canonical: "/kids/games/stories" },
};

export default function StoriesLayout({ children }: { children: React.ReactNode }) {
  return <StoriesMusicProvider>{children}</StoriesMusicProvider>;
}
