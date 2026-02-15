import { GameConfig, GameId } from "@/lib/types/games";

export const GAME_CONFIGS: Record<GameId, GameConfig> = {
  "city-explorer": {
    id: "city-explorer",
    name: "City Explorer",
    nameAr: "مستكشف المدن",
    emoji: "🗺️",
    category: "educational",
    color: "#0984E3",
    description: "Discover Palestinian cities from clues!",
    descriptionAr: "اكتشف مدن فلسطين من التلميحات!",
    rounds: 5,
    hasDifficulty: true,
    pointsPerCorrect: 15,
    bonusPoints: 25,
  },
};

export function getGameConfig(gameId: GameId): GameConfig {
  return GAME_CONFIGS[gameId];
}

export function getGamesByCategory(category: GameConfig["category"]): GameConfig[] {
  return Object.values(GAME_CONFIGS).filter((g) => g.category === category);
}

export function getAllGames(): GameConfig[] {
  return Object.values(GAME_CONFIGS);
}
