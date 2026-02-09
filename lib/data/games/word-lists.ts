/**
 * Palestine-related Arabic words for word chain validation
 * Organized by category for variety
 */

export type WordEntry = {
  word: string;
  meaning: string;
  category: string;
};

export const WORD_LISTS: WordEntry[] = [
  // Cities
  { word: "قدس", meaning: "القدس - Jerusalem", category: "cities" },
  { word: "غزة", meaning: "غزة - Gaza", category: "cities" },
  { word: "نابلس", meaning: "نابلس - Nablus", category: "cities" },
  { word: "خليل", meaning: "الخليل - Hebron", category: "cities" },
  { word: "يافا", meaning: "يافا - Jaffa", category: "cities" },
  { word: "عكا", meaning: "عكا - Acre", category: "cities" },
  { word: "أريحا", meaning: "أريحا - Jericho", category: "cities" },
  { word: "رام الله", meaning: "رام الله - Ramallah", category: "cities" },
  { word: "بيت لحم", meaning: "بيت لحم - Bethlehem", category: "cities" },
  { word: "جنين", meaning: "جنين - Jenin", category: "cities" },
  { word: "طولكرم", meaning: "طولكرم - Tulkarm", category: "cities" },
  { word: "صفد", meaning: "صفد - Safed", category: "cities" },
  { word: "حيفا", meaning: "حيفا - Haifa", category: "cities" },
  { word: "اللد", meaning: "اللد - Lod", category: "cities" },
  { word: "الرملة", meaning: "الرملة - Ramle", category: "cities" },

  // Food
  { word: "كنافة", meaning: "كنافة - Knafeh", category: "food" },
  { word: "حمص", meaning: "حمص - Hummus", category: "food" },
  { word: "فلافل", meaning: "فلافل - Falafel", category: "food" },
  { word: "مقلوبة", meaning: "مقلوبة - Maqluba", category: "food" },
  { word: "مسخن", meaning: "مسخن - Musakhan", category: "food" },
  { word: "زعتر", meaning: "زعتر - Za'atar", category: "food" },
  { word: "سماق", meaning: "سماق - Sumac", category: "food" },
  { word: "تمر", meaning: "تمر - Dates", category: "food" },
  { word: "زيتون", meaning: "زيتون - Olives", category: "food" },
  { word: "مفتول", meaning: "مفتول - Maftoul", category: "food" },
  { word: "قطايف", meaning: "قطايف - Qatayef", category: "food" },
  { word: "طحينة", meaning: "طحينة - Tahini", category: "food" },
  { word: "لبنة", meaning: "لبنة - Labneh", category: "food" },
  { word: "خبز", meaning: "خبز - Bread", category: "food" },
  { word: "زيت", meaning: "زيت - Oil", category: "food" },

  // Culture
  { word: "دبكة", meaning: "دبكة - Dabke dance", category: "culture" },
  { word: "كوفية", meaning: "كوفية - Keffiyeh", category: "culture" },
  { word: "تطريز", meaning: "تطريز - Embroidery", category: "culture" },
  { word: "ثوب", meaning: "ثوب - Traditional dress", category: "culture" },
  { word: "عود", meaning: "عود - Oud instrument", category: "culture" },
  { word: "شعر", meaning: "شعر - Poetry", category: "culture" },
  { word: "صابون", meaning: "صابون - Soap", category: "culture" },
  { word: "فخار", meaning: "فخار - Pottery", category: "culture" },
  { word: "زجاج", meaning: "زجاج - Glass", category: "culture" },
  { word: "مفتاح", meaning: "مفتاح - Key (of return)", category: "culture" },

  // Nature
  { word: "بحر", meaning: "بحر - Sea", category: "nature" },
  { word: "جبل", meaning: "جبل - Mountain", category: "nature" },
  { word: "نهر", meaning: "نهر - River", category: "nature" },
  { word: "شجرة", meaning: "شجرة - Tree", category: "nature" },
  { word: "وردة", meaning: "وردة - Flower", category: "nature" },
  { word: "غزال", meaning: "غزال - Gazelle", category: "nature" },
  { word: "حسون", meaning: "حسون - Goldfinch", category: "nature" },
  { word: "نجمة", meaning: "نجمة - Star", category: "nature" },
  { word: "قمر", meaning: "قمر - Moon", category: "nature" },
  { word: "شمس", meaning: "شمس - Sun", category: "nature" },
];

export function getWordsByCategory(category: string): WordEntry[] {
  return WORD_LISTS.filter((w) => w.category === category);
}

export function getStarterWords(count: number): WordEntry[] {
  const shuffled = [...WORD_LISTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
