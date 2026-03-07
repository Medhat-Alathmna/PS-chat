import type {
  GenreOption,
  StoryCompanion,
  StoryGenre,
  StoryLength,
  StoryLengthConfig,
  StoryMode,
} from "@/lib/types/stories";

// ── Genres ───────────────────────────────────────────────────────────

export const STORY_GENRES: GenreOption[] = [
  {
    id: "fantasy",
    nameAr: "خيال",
    descriptionAr: "عوالم سحرية وأبطال خارقين",
    emoji: "🧙‍♂️",
    color: "#8B5CF6",
    settings: [
      { id: "enchanted-forest", nameAr: "الغابة المسحورة", emoji: "🌳" },
      { id: "flying-castle", nameAr: "القلعة الطائرة", emoji: "🏰" },
      { id: "underwater-kingdom", nameAr: "مملكة تحت البحر", emoji: "🧜" },
      { id: "magic-mountain", nameAr: "جبل السحرة", emoji: "⛰️" },
    ],
  },
  {
    id: "palestinian-folklore",
    nameAr: "تراث فلسطيني",
    descriptionAr: "حكايات من بلادنا الجميلة",
    emoji: "🏺",
    color: "#D97706",
    settings: [
      { id: "jerusalem", nameAr: "القدس العتيقة", emoji: "🕌" },
      { id: "nablus", nameAr: "نابلس", emoji: "🫙" },
      { id: "gaza", nameAr: "غزة على البحر", emoji: "🌊" },
      { id: "galilee", nameAr: "قرية جليلية", emoji: "🌿" },
      { id: "bethlehem", nameAr: "بيت لحم", emoji: "⭐" },
    ],
  },
  {
    id: "adventure",
    nameAr: "مغامرة",
    descriptionAr: "رحلات مثيرة واكتشافات",
    emoji: "🗺️",
    color: "#059669",
    settings: [
      { id: "mountains", nameAr: "الجبال الشاهقة", emoji: "⛰️" },
      { id: "jungle", nameAr: "الغابة الاستوائية", emoji: "🌴" },
      { id: "desert", nameAr: "الصحراء الواسعة", emoji: "🏜️" },
      { id: "mystery-island", nameAr: "الجزيرة الغامضة", emoji: "🏝️" },
    ],
  },
  {
    id: "animal",
    nameAr: "حيوانات",
    descriptionAr: "قصص حيوانات ظريفة",
    emoji: "🦁",
    color: "#EA580C",
    settings: [
      { id: "animal-forest", nameAr: "غابة الحيوانات", emoji: "🌲" },
      { id: "savanna", nameAr: "السافانا الأفريقية", emoji: "🦁" },
      { id: "ocean", nameAr: "المحيط الأزرق", emoji: "🐠" },
      { id: "rainforest", nameAr: "الغابة المطيرة", emoji: "🌧️" },
    ],
  },
  {
    id: "space",
    nameAr: "فضاء",
    descriptionAr: "مغامرات بين النجوم والكواكب",
    emoji: "🚀",
    color: "#2563EB",
    settings: [
      { id: "space-station", nameAr: "محطة الفضاء", emoji: "🛸" },
      { id: "mars", nameAr: "كوكب المريخ", emoji: "🔴" },
      { id: "moon", nameAr: "القمر", emoji: "🌙" },
      { id: "strange-planet", nameAr: "كوكب غريب", emoji: "🪐" },
    ],
  },
  {
    id: "funny",
    nameAr: "مضحكة",
    descriptionAr: "قصص مضحكة وطريفة",
    emoji: "😂",
    color: "#E11D48",
    settings: [
      { id: "funny-school", nameAr: "مدرسة مضحكة", emoji: "🏫" },
      { id: "busy-market", nameAr: "سوق صاخب", emoji: "🛍️" },
      { id: "colorful-city", nameAr: "مدينة الألوان", emoji: "🎨" },
      { id: "weird-village", nameAr: "القرية الغريبة", emoji: "🏘️" },
    ],
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

export function getLengthConfig(id: StoryLength): StoryLengthConfig {
  return STORY_LENGTHS.find((l) => l.id === id)!;
}

export function getGenreEmoji(id: StoryGenre): string {
  return getGenreOption(id).emoji;
}
