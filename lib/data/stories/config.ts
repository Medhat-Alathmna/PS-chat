import type {
  GenreOption,
  SettingOption,
  StoryCompanion,
  StoryGenre,
  StoryLength,
  StoryLengthConfig,
  StoryMode,
  StorySetting,
} from "@/lib/types/stories";

// ── Genres ───────────────────────────────────────────────────────────

export const STORY_GENRES: GenreOption[] = [
  {
    id: "fantasy",
    nameAr: "خيال",
    descriptionAr: "عوالم سحرية وأبطال خارقين",
    emoji: "🧙‍♂️",
    color: "#8B5CF6",
  },
  {
    id: "palestinian-folklore",
    nameAr: "تراث فلسطيني",
    descriptionAr: "حكايات من بلادنا الجميلة",
    emoji: "🏺",
    color: "#D97706",
  },
  {
    id: "adventure",
    nameAr: "مغامرة",
    descriptionAr: "رحلات مثيرة واكتشافات",
    emoji: "🗺️",
    color: "#059669",
  },
  {
    id: "animal",
    nameAr: "حيوانات",
    descriptionAr: "قصص حيوانات ظريفة",
    emoji: "🦁",
    color: "#EA580C",
  },
  {
    id: "space",
    nameAr: "فضاء",
    descriptionAr: "مغامرات بين النجوم والكواكب",
    emoji: "🚀",
    color: "#2563EB",
  },
  {
    id: "funny",
    nameAr: "مضحكة",
    descriptionAr: "قصص مضحكة وطريفة",
    emoji: "😂",
    color: "#E11D48",
  },
];

// ── Settings ──────────────────────────────────────────────────────────

export const STORY_SETTINGS: SettingOption[] = [
  // Palestine (generic — shown in wizard)
  {
    id: "palestine",
    nameAr: "فلسطين",
    descriptionAr: "بلادنا الجميلة الخضراء",
    emoji: "🇵🇸",
    category: "palestine",
  }, 
  // Fantasy
  {
    id: "enchanted-forest",
    nameAr: "الغابة المسحورة",
    descriptionAr: "غابة مليئة بالأسرار",
    emoji: "🌳",
    category: "fantasy",
  },
  {
    id: "flying-castle",
    nameAr: "القلعة الطائرة",
    descriptionAr: "قلعة تحلّق بين الغيوم",
    emoji: "🏰",
    category: "fantasy",
  },
  {
    id: "underwater-kingdom",
    nameAr: "مملكة تحت البحر",
    descriptionAr: "عالم ساحر تحت الماء",
    emoji: "🧜‍♀️",
    category: "fantasy",
  },
];

// ── Companions ────────────────────────────────────────────────────────

export const STORY_COMPANIONS: {
  id: StoryCompanion;
  nameAr: string;
  descriptionAr: string;
  emoji: string;
}[] = [
  {
    id: "medhat",
    nameAr: "مدحت",
    descriptionAr: "صديقك مدحت يرافقك بالمغامرة!",
    emoji: "🦊",
  },
  {
    id: "self",
    nameAr: "أنا البطل!",
    descriptionAr: "أنت بطل القصة!",
    emoji: "🌟",
  },
];

// ── Lengths ───────────────────────────────────────────────────────────

export const STORY_LENGTHS: StoryLengthConfig[] = [
  {
    id: "short",
    pages: 5,
    labelAr: "قصيرة",
    descriptionAr: "٥ صفحات",
    emoji: "📄",
  },
  {
    id: "medium",
    pages: 8,
    labelAr: "متوسطة",
    descriptionAr: "٨ صفحات",
    emoji: "📑",
  },
  {
    id: "long",
    pages: 12,
    labelAr: "طويلة",
    descriptionAr: "١٢ صفحة",
    emoji: "📚",
  },
];

// ── Modes ────────────────────────────────────────────────────────────

export const STORY_MODES: {
  id: StoryMode;
  nameAr: string;
  descriptionAr: string;
  emoji: string;
}[] = [
  {
    id: "interactive",
    nameAr: "تفاعلية",
    descriptionAr: "اختر ماذا يحدث في القصة!",
    emoji: "🎮",
  },
  {
    id: "continuous",
    nameAr: "متواصلة",
    descriptionAr: "اقرأ القصة كاملة دون توقف",
    emoji: "📖",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────

export function getGenreOption(id: StoryGenre): GenreOption {
  return STORY_GENRES.find((g) => g.id === id)!;
}

export function getSettingOption(id: StorySetting): SettingOption {
  return STORY_SETTINGS.find((s) => s.id === id) ?? STORY_SETTINGS[0];
}

export function getLengthConfig(id: StoryLength): StoryLengthConfig {
  return STORY_LENGTHS.find((l) => l.id === id)!;
}

export function getGenreEmoji(id: StoryGenre): string {
  return getGenreOption(id).emoji;
}
