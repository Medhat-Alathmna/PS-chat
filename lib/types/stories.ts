// ============================================
// STORY TYPE DEFINITIONS
// ============================================

export type StoryGenre =
  | "fantasy"
  | "palestinian-folklore"
  | "adventure"
  | "animal"
  | "space"
  | "funny";

export type StorySetting =
  | "palestine"
  | "enchanted-forest"
  | "flying-castle"
  | "underwater-kingdom";

export type StoryCompanion = "medhat" | "self";

export type StoryLength = "short" | "medium" | "long";

export type StoryLengthConfig = {
  id: StoryLength;
  pages: number;
  labelAr: string;
  descriptionAr: string;
  emoji: string;
};

export type StoryMode = "interactive" | "continuous";

export type GenreSetting = {
  id: string;
  nameAr: string;
  emoji: string;
};

export type StoryConfig = {
  genre: StoryGenre;
  setting?: StorySetting; // optional — kept for backward compat with saved stories
  companion: StoryCompanion;
  length: StoryLength;
  mode: StoryMode;
};

export type StoryPage = {
  pageNumber: number;
  text: string;
  imagePrompt?: string;
  heroDescription?: string;
  illustrate?: boolean;
  imageUrl?: string;
};

export type StoryChoice = {
  id: string;
  emoji: string;
  textAr: string;
};

export type StoryChoicePoint = {
  prompt: string;
  choices: StoryChoice[];
  selectedChoiceId?: string;
  afterPage: number;
};

export type SavedStory = {
  id: string;
  profileId: string;
  config: StoryConfig;
  titleAr?: string;
  pages: StoryPage[];
  choicePoints: StoryChoicePoint[];
  completed: boolean;
  createdAt: number;
  completedAt?: number;
};

export type WizardStep = "genre" | "companion" | "length" | "mode";

export type GenreOption = {
  id: StoryGenre;
  nameAr: string;
  descriptionAr: string;
  emoji: string;
  color: string;
  settings: GenreSetting[];
};
