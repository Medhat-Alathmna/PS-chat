import { Sticker } from "@/lib/types";

/**
 * Palestinian stickers collection for kids
 * Categories: cities, food, heritage
 */
export const ALL_STICKERS: Sticker[] = [
  // ============================================
  // CITIES - مدن فلسطين
  // ============================================
  {
    id: "city-jerusalem",
    name: "Jerusalem",
    nameAr: "القدس",
    emoji: "🕌",
    category: "cities",
    description: "The holy city",
    descriptionAr: "المدينة المقدسة",
  },
  {
    id: "city-gaza",
    name: "Gaza",
    nameAr: "غزة",
    emoji: "🌊",
    category: "cities",
    description: "City by the sea",
    descriptionAr: "مدينة البحر",
  },
  {
    id: "city-ramallah",
    name: "Ramallah",
    nameAr: "رام الله",
    emoji: "🏛️",
    category: "cities",
    description: "City of culture",
    descriptionAr: "مدينة الثقافة",
  },
  {
    id: "city-nablus",
    name: "Nablus",
    nameAr: "نابلس",
    emoji: "🏔️",
    category: "cities",
    description: "Mountain city of knafeh",
    descriptionAr: "مدينة الكنافة الجبلية",
  },
  {
    id: "city-hebron",
    name: "Hebron",
    nameAr: "الخليل",
    emoji: "🏺",
    category: "cities",
    description: "City of glass and ceramics",
    descriptionAr: "مدينة الزجاج والخزف",
  },
  {
    id: "city-bethlehem",
    name: "Bethlehem",
    nameAr: "بيت لحم",
    emoji: "⭐",
    category: "cities",
    description: "City of peace",
    descriptionAr: "مدينة السلام",
  },
  {
    id: "city-jaffa",
    name: "Jaffa",
    nameAr: "يافا",
    emoji: "🍊",
    category: "cities",
    description: "Bride of the sea",
    descriptionAr: "عروس البحر",
  },
  {
    id: "city-acre",
    name: "Acre",
    nameAr: "عكا",
    emoji: "⚓",
    category: "cities",
    description: "Historic port city",
    descriptionAr: "مدينة الميناء التاريخية",
  },

  // ============================================
  // FOOD - الطعام الفلسطيني
  // ============================================
  {
    id: "food-knafeh",
    name: "Knafeh",
    nameAr: "كنافة",
    emoji: "🧁",
    category: "food",
    description: "Sweet cheese dessert",
    descriptionAr: "حلوى الجبنة اللذيذة",
  },
  {
    id: "food-musakhan",
    name: "Musakhan",
    nameAr: "مسخن",
    emoji: "🍗",
    category: "food",
    description: "Chicken with sumac bread",
    descriptionAr: "دجاج مع خبز السماق",
  },
  {
    id: "food-maqluba",
    name: "Maqluba",
    nameAr: "مقلوبة",
    emoji: "🍲",
    category: "food",
    description: "Upside-down rice dish",
    descriptionAr: "طبق الأرز المقلوب",
  },
  {
    id: "food-falafel",
    name: "Falafel",
    nameAr: "فلافل",
    emoji: "🧆",
    category: "food",
    description: "Delicious chickpea balls",
    descriptionAr: "كرات الحمص اللذيذة",
  },
  {
    id: "food-hummus",
    name: "Hummus",
    nameAr: "حمص",
    emoji: "🫘",
    category: "food",
    description: "Creamy chickpea dip",
    descriptionAr: "غموس الحمص الكريمي",
  },
  {
    id: "food-olive-oil",
    name: "Olive Oil",
    nameAr: "زيت زيتون",
    emoji: "🫒",
    category: "food",
    description: "Liquid gold of Palestine",
    descriptionAr: "ذهب فلسطين السائل",
  },

  // ============================================
  // HERITAGE - التراث الفلسطيني
  // ============================================
  {
    id: "heritage-keffiyeh",
    name: "Keffiyeh",
    nameAr: "كوفية",
    emoji: "🧣",
    category: "heritage",
    description: "Symbol of Palestine",
    descriptionAr: "رمز فلسطين",
  },
  {
    id: "heritage-thobe",
    name: "Embroidered Dress",
    nameAr: "ثوب مطرز",
    emoji: "👗",
    category: "heritage",
    description: "Traditional embroidered dress",
    descriptionAr: "الثوب الفلسطيني المطرز",
  },
  {
    id: "heritage-dabke",
    name: "Dabke",
    nameAr: "دبكة",
    emoji: "💃",
    category: "heritage",
    description: "Traditional folk dance",
    descriptionAr: "الرقصة الشعبية التقليدية",
  },
  {
    id: "heritage-olive",
    name: "Olive Tree",
    nameAr: "شجرة زيتون",
    emoji: "🌳",
    category: "heritage",
    description: "Symbol of steadfastness",
    descriptionAr: "رمز الصمود",
  },
  {
    id: "heritage-key",
    name: "Key of Return",
    nameAr: "مفتاح العودة",
    emoji: "🔑",
    category: "heritage",
    description: "Symbol of hope and return",
    descriptionAr: "رمز الأمل والعودة",
  },
  {
    id: "heritage-flag",
    name: "Palestine Flag",
    nameAr: "علم فلسطين",
    emoji: "🇵🇸",
    category: "heritage",
    description: "Our beloved flag",
    descriptionAr: "علمنا الحبيب",
  },
];

// Get stickers by category
export function getStickersByCategory(category: string): Sticker[] {
  return ALL_STICKERS.filter((s) => s.category === category);
}

// Get sticker by ID
export function getStickerById(id: string): Sticker | undefined {
  return ALL_STICKERS.find((s) => s.id === id);
}

// Get random sticker
export function getRandomSticker(excludeIds: string[] = []): Sticker | null {
  const available = ALL_STICKERS.filter((s) => !excludeIds.includes(s.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}
