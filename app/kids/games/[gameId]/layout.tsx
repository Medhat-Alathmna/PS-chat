import type { Metadata } from "next";
import { GAME_CONFIGS } from "@/lib/data/games";
import { GameId } from "@/lib/types/games";

export async function generateMetadata({ params }: { params: Promise<{ gameId: string }> }): Promise<Metadata> {
  const { gameId } = await params;
  const config = GAME_CONFIGS[gameId as GameId];

  if (!config) {
    return { title: "لعبة غير موجودة" };
  }

  return {
    title: `${config.nameAr} ${config.emoji} - ${config.name}`,
    description: `${config.descriptionAr} - ${config.description}`,
    alternates: { canonical: `/kids/games/${gameId}` },
  };
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
