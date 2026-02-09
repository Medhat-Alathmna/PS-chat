import { GameDifficulty } from "@/lib/types/games";

export type EmojiPuzzle = {
  id: string;
  emojis: string;
  answer: string;
  answerAr: string;
  hint: string;
  difficulty: GameDifficulty;
};

export const EMOJI_PUZZLES: EmojiPuzzle[] = [
  // ============ EASY ============
  { id: "ep1", emojis: "🧀 🍯 🟠 🍰", answer: "knafeh", answerAr: "كنافة", hint: "حلو نابلسي مشهور!", difficulty: "easy" },
  { id: "ep2", emojis: "🌊 🏖️ 🐟 🌅", answer: "gaza", answerAr: "غزة", hint: "مدينة على البحر!", difficulty: "easy" },
  { id: "ep3", emojis: "🕌 ✨ 🙏 🏛️", answer: "al-aqsa", answerAr: "المسجد الأقصى", hint: "مسجد مقدس بالقدس!", difficulty: "easy" },
  { id: "ep4", emojis: "🍊 🌊 ⛵ 🏙️", answer: "jaffa", answerAr: "يافا", hint: "عروس البحر!", difficulty: "easy" },
  { id: "ep5", emojis: "🌳 🫒 💚 🕊️", answer: "olive tree", answerAr: "شجرة زيتون", hint: "رمز فلسطين!", difficulty: "easy" },
  { id: "ep6", emojis: "💃 👫 🎵 👣", answer: "dabke", answerAr: "دبكة", hint: "رقصة شعبية!", difficulty: "easy" },
  { id: "ep7", emojis: "🧆 🫘 🥙 😋", answer: "falafel", answerAr: "فلافل", hint: "أقراص مقلية من الحمص!", difficulty: "easy" },
  { id: "ep8", emojis: "🍇 🏔️ 🏺 🏙️", answer: "hebron", answerAr: "الخليل", hint: "مدينة بالجبل!", difficulty: "easy" },
  { id: "ep9", emojis: "⭐ ⛪ 🪵 🎄", answer: "bethlehem", answerAr: "بيت لحم", hint: "مدينة المهد!", difficulty: "easy" },
  { id: "ep10", emojis: "🐫 🏜️ 🌴 🏛️", answer: "jericho", answerAr: "أريحا", hint: "أقدم مدينة بالعالم!", difficulty: "easy" },

  // ============ MEDIUM ============
  { id: "ep11", emojis: "🧼 🫒 🏔️ 🍰", answer: "nablus", answerAr: "نابلس", hint: "صابون وكنافة!", difficulty: "medium" },
  { id: "ep12", emojis: "🔑 🏠 ❤️ 🇵🇸", answer: "right of return", answerAr: "حق العودة", hint: "رمز الأمل!", difficulty: "medium" },
  { id: "ep13", emojis: "🧣 ⬜ ⬛ 🟩", answer: "keffiyeh", answerAr: "كوفية", hint: "غطاء رأس فلسطيني!", difficulty: "medium" },
  { id: "ep14", emojis: "🍗 🧅 🟤 🫓", answer: "musakhan", answerAr: "مسخن", hint: "دجاج وسماق!", difficulty: "medium" },
  { id: "ep15", emojis: "🍲 🔄 🍚 🥘", answer: "maqluba", answerAr: "مقلوبة", hint: "بنقلبها!", difficulty: "medium" },
  { id: "ep16", emojis: "🧵 👗 🔷 ❤️", answer: "tatreez", answerAr: "تطريز", hint: "فن على القماش!", difficulty: "medium" },
  { id: "ep17", emojis: "🏰 ⚓ 🌊 🛡️", answer: "acre", answerAr: "عكا", hint: "مدينة الأسوار!", difficulty: "medium" },
  { id: "ep18", emojis: "🎵 🪕 🎤 💃", answer: "dalona", answerAr: "دلعونا", hint: "أغنية شعبية!", difficulty: "medium" },
  { id: "ep19", emojis: "☕ 🏛️ 📚 🏙️", answer: "ramallah", answerAr: "رام الله", hint: "مدينة الثقافة!", difficulty: "medium" },
  { id: "ep20", emojis: "🫘 🫒 🍋 😋", answer: "hummus", answerAr: "حمص", hint: "أكلة عالمية!", difficulty: "medium" },

  // ============ HARD ============
  { id: "ep21", emojis: "🌀 🫕 ✋ 🍲", answer: "maftoul", answerAr: "مفتول", hint: "كسكس فلسطيني يدوي!", difficulty: "hard" },
  { id: "ep22", emojis: "📝 🕊️ 🌍 🇵🇸", answer: "mahmoud darwish", answerAr: "محمود درويش", hint: "شاعر فلسطين!", difficulty: "hard" },
  { id: "ep23", emojis: "🚪 🏰 8️⃣ 🕌", answer: "old city gates", answerAr: "أبواب البلدة القديمة", hint: "بالقدس 8 منهم!", difficulty: "hard" },
  { id: "ep24", emojis: "🌊 🧂 ⬇️ 🏜️", answer: "dead sea", answerAr: "البحر الميت", hint: "أخفض نقطة!", difficulty: "hard" },
  { id: "ep25", emojis: "🥟 🌙 🍯 🧀", answer: "qatayef", answerAr: "قطايف", hint: "حلو رمضاني!", difficulty: "hard" },
  { id: "ep26", emojis: "🪵 ⛪ 🌳 🎨", answer: "olive wood carving", answerAr: "نحت خشب الزيتون", hint: "حرفة بيت لحم!", difficulty: "hard" },
  { id: "ep27", emojis: "🦌 🏔️ 🌿 🇵🇸", answer: "palestinian gazelle", answerAr: "الغزال الفلسطيني", hint: "حيوان فلسطيني نادر!", difficulty: "hard" },
  { id: "ep28", emojis: "🐦 🎵 🌈 🌳", answer: "palestine sunbird", answerAr: "الحسون الفلسطيني", hint: "طائر فلسطين!", difficulty: "hard" },
  { id: "ep29", emojis: "💰 🏛️ 🗓️ 🇵🇸", answer: "palestinian pound", answerAr: "الجنيه الفلسطيني", hint: "عملة قديمة!", difficulty: "hard" },
  { id: "ep30", emojis: "✝️ 🚶 🕌 🏘️", answer: "via dolorosa", answerAr: "طريق الآلام", hint: "شارع مقدس بالقدس!", difficulty: "hard" },
];

export function getEmojiPuzzlesByDifficulty(difficulty: GameDifficulty): EmojiPuzzle[] {
  return EMOJI_PUZZLES.filter((p) => p.difficulty === difficulty);
}
