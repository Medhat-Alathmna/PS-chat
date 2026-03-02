/**
 * Fun question prompts for kids about Palestine
 * Used in the intro screen and as suggestions
 */

export type KidsPrompt = {
  id: string;
  text: string;
  textAr: string;
  emoji: string;
  category: "cities" | "food" | "history" | "culture" | "fun";
  color: string;
};

export const KIDS_PROMPTS: KidsPrompt[] = [
  // Cities
  {
    id: "p1",
    text: "Tell me about Jerusalem!",
    textAr: "احكيلي عن القدس!",
    emoji: "🕌",
    category: "cities",
    color: "#FFE66D",
  },
  {
    id: "p2",
    text: "What is Gaza like?",
    textAr: "كيف غزة؟",
    emoji: "🌊",
    category: "cities",
    color: "#54A0FF",
  },
  {
    id: "p3",
    text: "Tell me about Nablus",
    textAr: "احكيلي عن نابلس",
    emoji: "🏔️",
    category: "cities",
    color: "#4ECDC4",
  },

  // Food
  {
    id: "p4",
    text: "What is Knafeh?",
    textAr: "شو هي الكنافة؟",
    emoji: "🍰",
    category: "food",
    color: "#FF9F43",
  },
  {
    id: "p5",
    text: "What do Palestinians eat?",
    textAr: "شو بياكلوا الفلسطينية؟",
    emoji: "🍽️",
    category: "food",
    color: "#FF6B6B",
  },
  {
    id: "p6",
    text: "How is Musakhan made?",
    textAr: "كيف بنعمل المسخن؟",
    emoji: "🍗",
    category: "food",
    color: "#A55EEA",
  },

  // History
  {
    id: "p7",
    text: "What is the Nakba?",
    textAr: "شو هي النكبة؟",
    emoji: "📜",
    category: "history",
    color: "#4ECDC4",
  },
  {
    id: "p8",
    text: "Tell me about Al-Aqsa Mosque",
    textAr: "احكيلي عن المسجد الأقصى",
    emoji: "🕌",
    category: "history",
    color: "#FFE66D",
  },

  // Culture
  {
    id: "p9",
    text: "What is Dabke dance?",
    textAr: "شو هي الدبكة؟",
    emoji: "💃",
    category: "culture",
    color: "#FF9FF3",
  },
  {
    id: "p10",
    text: "What is the Keffiyeh?",
    textAr: "شو هي الكوفية؟",
    emoji: "🧣",
    category: "culture",
    color: "#009736",
  },
  {
    id: "p11",
    text: "Tell me about Palestinian embroidery",
    textAr: "احكيلي عن التطريز الفلسطيني",
    emoji: "🪡",
    category: "culture",
    color: "#EE2A35",
  },

  // Fun
  {
    id: "p12",
    text: "Tell me a Palestinian joke!",
    textAr: "احكيلي نكتة خليلية!",
    emoji: "😂",
    category: "fun",
    color: "#FFE66D",
  },
  {
    id: "p13",
    text: "What games do Palestinian kids play?",
    textAr: "شو ألعاب ولاد فلسطين؟",
    emoji: "🎮",
    category: "fun",
    color: "#54A0FF",
  },

];

// Get prompts by category
export function getPromptsByCategory(category: string): KidsPrompt[] {
  return KIDS_PROMPTS.filter((p) => p.category === category);
}

// Get random prompts
export function getRandomPrompts(count: number = 4): KidsPrompt[] {
  const shuffled = [...KIDS_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get prompt by ID
export function getPromptById(id: string): KidsPrompt | undefined {
  return KIDS_PROMPTS.find((p) => p.id === id);
}
