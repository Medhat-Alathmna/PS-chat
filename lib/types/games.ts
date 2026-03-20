// ============================================
// GAME TYPE DEFINITIONS
// ============================================

export type GameId = "city-explorer";

export type GameCategory = "educational" | "classic" | "creative";

export type GameDifficulty = "easy" | "medium" | "hard";

export type GameStatus = "idle" | "selecting-difficulty" | "playing" | "finished";

export type GameConfig = {
  id: GameId;
  name: string;
  nameAr: string;
  emoji: string;
  category: GameCategory;
  color: string;
  description: string;
  descriptionAr: string;
  rounds: number | "endless";
  hasDifficulty: boolean;
  pointsPerCorrect: number;
  bonusPoints: number;
};

export type GameState = {
  gameId: GameId;
  score: number;
  round: number;
  totalRounds: number | "endless";
  correctAnswers: number;
  wrongAnswers: number;
  hintsUsed: number;
  status: GameStatus;
  difficulty?: GameDifficulty;
  startedAt: number;
  finishedAt?: number;
  /** Backend session ID — set after createGameSession succeeds, null when not authenticated */
  sessionId?: string | null;
};

export type GameSessionSummary = {
  gameId: GameId;
  score: number;
  correctAnswers: number;
  totalRounds: number;
  hintsUsed: number;
  difficulty?: GameDifficulty;
  duration: number;
  bonusEarned: boolean;
  stickerUnlocked: boolean;
};

export type ProfileAvatar = "🦁" | "🐯" | "🦊" | "🐼" | "🐸" | "🦋" | "🌻" | "🌟" | "🚀" | "🎨" | "⚽" | "🦄" | "🐬" | "🦅" | "🌈" | "🎵";

export type ProfileColor = "purple" | "green" | "blue" | "orange" | "pink" | "red";

export type KidsProfile = {
  id: string;
  name: string;
  age: number;
  avatar: ProfileAvatar;
  color: ProfileColor;
  createdAt: number;
};

export type ProfilesState = {
  profiles: KidsProfile[];
  activeProfileId: string | null;
};

export type KidsChatContext = {
  recentTopics: string[];
  lastUpdated: number;
};
