/**
 * Fun question prompts for kids about Palestine
 * Used in the intro screen and as suggestions
 */

export type KidsPrompt = {
  id: string;
  text: string;
  textAr: string;
  emoji: string;
  category: "cities" | "food" | "history" | "culture" | "fun" | "historical_figures" | "political_leaders";
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
    text: "Tell me about Nablus!",
    textAr: "احكيلي عن نابلس!",
    emoji: "🏔️",
    category: "cities",
    color: "#4ECDC4",
  },
  {
    id: "p3",
    text: "What is special about Jaffa?",
    textAr: "شو المميز في يافا؟",
    emoji: "🍊",
    category: "cities",
    color: "#FF9F43",
  },
  {
    id: "p4",
    text: "Tell me about Bethlehem!",
    textAr: "احكيلي عن بيت لحم!",
    emoji: "⭐",
    category: "cities",
    color: "#54A0FF",
  },
  {
    id: "p5",
    text: "What is Hebron famous for?",
    textAr: "شو مشهورة فيه الخليل؟",
    emoji: "🍇",
    category: "cities",
    color: "#9B59B6",
  },
  {
    id: "p6",
    text: "Tell me about Haifa!",
    textAr: "احكيلي عن حيفا!",
    emoji: "⛵",
    category: "cities",
    color: "#1ABC9C",
  },
  {
    id: "p7",
    text: "What is Ramallah like?",
    textAr: "كيف هي رام الله؟",
    emoji: "�️",
    category: "cities",
    color: "#3498DB",
  },

  // Food
  {
    id: "p8",
    text: "What is Knafeh?",
    textAr: "شو هي الكنافة؟",
    emoji: "�",
    category: "food",
    color: "#FF9F43",
  },
  {
    id: "p9",
    text: "What is Musakhan?",
    textAr: "شو هو المسخن؟",
    emoji: "🍗",
    category: "food",
    color: "#E67E22",
  },
  {
    id: "p10",
    text: "Tell me about Palestinian bread!",
    textAr: "احكيلي عن خبز الطابون!",
    emoji: "🫓",
    category: "food",
    color: "#F39C12",
  },
  {
    id: "p11",
    text: "What is Mansaf?",
    textAr: "شو هو المنسف؟",
    emoji: "🍚",
    category: "food",
    color: "#D4AC0D",
  },
  {
    id: "p12",
    text: "What sweets do Palestinians love?",
    textAr: "شو الحلويات اللي بيحبها الفلسطينيين؟",
    emoji: "�",
    category: "food",
    color: "#FF6B6B",
  },
  {
    id: "p13",
    text: "Tell me about Za'atar!",
    textAr: "احكيلي عن الزعتر!",
    emoji: "🌿",
    category: "food",
    color: "#27AE60",
  },

  // Culture & Heritage
  {
    id: "p14",
    text: "What is Dabke dance?",
    textAr: "شو هي الدبكة؟",
    emoji: "💃",
    category: "culture",
    color: "#FF9FF3",
  },
  {
    id: "p15",
    text: "What is the Keffiyeh?",
    textAr: "شو هي الكوفية؟",
    emoji: "🧣",
    category: "culture",
    color: "#009736",
  },
  {
    id: "p16",
    text: "Tell me about Palestinian embroidery!",
    textAr: "احكيلي عن التطريز الفلسطيني!",
    emoji: "🪡",
    category: "culture",
    color: "#EE2A35",
  },
  {
    id: "p17",
    text: "Tell me about Al-Aqsa Mosque",
    textAr: "احكيلي عن المسجد الأقصى",
    emoji: "🕌",
    category: "culture",
    color: "#FFE66D",
  },
  {
    id: "p18",
    text: "What are Palestinian folk stories?",
    textAr: "شو هي الحكايا الشعبية الفلسطينية؟",
    emoji: "📖",
    category: "culture",
    color: "#8E44AD",
  },
  {
    id: "p19",
    text: "Tell me about Palestinian traditional dress!",
    textAr: "احكيلي عن الثوب الفلسطيني!",
    emoji: "👗",
    category: "culture",
    color: "#C0392B",
  },
  {
    id: "p20",
    text: "What is the Palestinian flag?",
    textAr: "شو العلم الفلسطيني وشو الوانه؟",
    emoji: "🇵🇸",
    category: "culture",
    color: "#2C3E50",
  },
  {
    id: "p21",
    text: "Tell me about Palestinian music!",
    textAr: "احكيلي عن الموسيقى الفلسطينية!",
    emoji: "🎵",
    category: "culture",
    color: "#1ABC9C",
  },
  {
    id: "p22",
    text: "What Palestinian songs do kids sing?",
    textAr: "شو الأغاني اللي بيغنيها الأطفال الفلسطينيين؟",
    emoji: "🎤",
    category: "culture",
    color: "#F39C12",
  },

  // Nature & Seasons
  {
    id: "p23",
    text: "Tell me about the Olive harvest season!",
    textAr: "احكيلي عن موسم قطيف الزيتون!",
    emoji: "🫒",
    category: "fun",
    color: "#27AE60",
  },
  {
    id: "p24",
    text: "What birds live in Palestine?",
    textAr: "شو الطيور اللي بتعيش في فلسطين؟",
    emoji: "🦅",
    category: "fun",
    color: "#3498DB",
  },
  {
    id: "p25",
    text: "Tell me about the orange tree!",
    textAr: "احكيلي عن شجرة البرتقال!",
    emoji: "🍊",
    category: "fun",
    color: "#E67E22",
  },
  {
    id: "p26",
    text: "What flowers grow in Palestine?",
    textAr: "شو الزهور اللي بتطلع في فلسطين؟",
    emoji: "🌸",
    category: "fun",
    color: "#FF69B4",
  },

  // Fun & Play
  {
    id: "p27",
    text: "What games do Palestinian kids play?",
    textAr: "شو ألعاب أطفال فلسطين؟",
    emoji: "�",
    category: "fun",
    color: "#54A0FF",
  },
  {
    id: "p28",
    text: "Tell me a fun Palestinian riddle!",
    textAr: "احكيلي لغز فلسطيني ممتع!",
    emoji: "🧩",
    category: "fun",
    color: "#9B59B6",
  },
  {
    id: "p29",
    text: "Tell me a funny Palestinian joke!",
    textAr: "احكيلي نكتة فلسطينية مضحكة!",
    emoji: "😄",
    category: "fun",
    color: "#FFE66D",
  },
  {
    id: "p30",
    text: "How do Palestinian kids celebrate Eid?",
    textAr: "كيف بيحتفل أطفال فلسطين بالعيد؟",
    emoji: "🎉",
    category: "fun",
    color: "#FF9F43",
  },
  {
    id: "p31",
    text: "What is the Dead Sea?",
    textAr: "شو هو البحر الميت؟",
    emoji: "🌊",
    category: "fun",
    color: "#1ABC9C",
  },
  {
    id: "p32",
    text: "Tell me about Palestinian pottery!",
    textAr: "احكيلي عن الخزف الفلسطيني!",
    emoji: "🏺",
    category: "culture",
    color: "#E74C3C",
  },

  // Historical Figures
  {
    id: "h1",
    text: "Tell me about Ghassan Kanafani!",
    textAr: "احكيلي عن غسان كنفاني!",
    emoji: "📚",
    category: "historical_figures",
    color: "#8E44AD",
  },
  {
    id: "h3",
    text: "Tell me about Mahmoud Darwish!",
    textAr: "احكيلي عن محمود درويش!",
    emoji: "✍️",
    category: "historical_figures",
    color: "#3498DB",
  },
  {
    id: "h4",
    text: "Who was Samih Al-Qasim?",
    textAr: "من هو سميح القاسم؟",
    emoji: "🎭",
    category: "historical_figures",
    color: "#E67E22",
  },
  {
    id: "h5",
    text: "Tell me about Emile Habibi!",
    textAr: "احكيلي عن إميل حبيبي!",
    emoji: "📖",
    category: "historical_figures",
    color: "#27AE60",
  },

  // Political Leaders
  {
    id: "pl1",
    text: "Who was Yasser Arafat?",
    textAr: "من هو ياسر عرفات؟",
    emoji: "🤝",
    category: "political_leaders",
    color: "#009736",
  },
  {
    id: "pl2",
    text: "Tell me about Mahmoud Abbas!",
    textAr: "احكيلي عن محمود عباس!",
    emoji: "🏛️",
    category: "political_leaders",
    color: "#1ABC9C",
  },
  {
    id: "pl3",
    text: "Who was Ahmed Yassin?",
    textAr: "من هو أحمد ياسين؟",
    emoji: "👨‍💼",
    category: "political_leaders",
    color: "#34495E",
  },
  {
    id: "pl4",
    text: "Tell me about Hanan Ashrawi!",
    textAr: "احكيلي عن هناء الأشرواي!",
    emoji: "🎓",
    category: "political_leaders",
    color: "#F39C12",
  },
  {
    id: "pl5",
    text: "Who is Leila Khaled?",
    textAr: "من هي ليلى خالد؟",
    emoji: "💪",
    category: "political_leaders",
    color: "#FF9F43",
  },
];

// Get prompts by category
export function getPromptsByCategory(category: string): KidsPrompt[] {
  return KIDS_PROMPTS.filter((p) => p.category === category);
}

// Get random prompts — one per category, shuffled categories, up to `count`
export function getRandomPrompts(count: number = 4): KidsPrompt[] {
  const categories = Array.from(new Set(KIDS_PROMPTS.map((p) => p.category)));
  const shuffledCategories = categories.sort(() => Math.random() - 0.5).slice(0, count);
  return shuffledCategories.map((category) => {
    const inCategory = KIDS_PROMPTS.filter((p) => p.category === category);
    return inCategory[Math.floor(Math.random() * inCategory.length)];
  });
}

// Get prompt by ID
export function getPromptById(id: string): KidsPrompt | undefined {
  return KIDS_PROMPTS.find((p) => p.id === id);
}

// Get one prompt per category (one from each category without repetition)
export function getOnePromptPerCategory(): KidsPrompt[] {
  // Get all unique categories
  const categories = Array.from(
    new Set(KIDS_PROMPTS.map((p) => p.category))
  );

  // Get one random prompt from each category
  return categories.map((category) => {
    const promptsInCategory = KIDS_PROMPTS.filter((p) => p.category === category);
    // Get a random prompt from this category
    return promptsInCategory[Math.floor(Math.random() * promptsInCategory.length)];
  });
}
