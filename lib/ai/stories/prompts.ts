import type { StoryConfig } from "@/lib/types/stories";
import {
  getGenreOption,
  getSettingOption,
  getLengthConfig,
  STORY_COMPANIONS,
} from "@/lib/data/stories/config";
import { SAFETY_RULES } from "../kids/constitution";

// ── Age-based vocabulary guidance ────────────────────────────────────

function getVocabularyGuidance(age: number): string {
  if (age <= 6)
    return "Vocabulary: Very simple, short sentences (5-8 words). Use familiar words only. Lots of repetition and sound words (طق طق، زنّ زنّ).";
  if (age <= 8)
    return "Vocabulary: Clear and simple sentences (8-12 words). Use common words with occasional new vocabulary explained in context.";
  if (age <= 10)
    return "Vocabulary: Moderate complexity (10-15 words per sentence). Can introduce richer descriptions and some literary expressions.";
  return "Vocabulary: Rich and expressive language. Use literary Arabic style with vivid descriptions, metaphors, and varied sentence structures.";
}

// ── Genre content guidance ───────────────────────────────────────────

function getGenreGuidance(genre: StoryConfig["genre"]): string {
  const guidance: Record<StoryConfig["genre"], string> = {
    fantasy:
      "Include magical elements: spells, enchanted objects, mythical creatures. Build wonder and amazement.",
    "palestinian-folklore":
      "Weave in Palestinian cultural motifs: olive trees, embroidery (tatreez), traditional food, hospitality, village life. Use phrases like 'كان يا ما كان'. Celebrate heritage proudly.",
    adventure:
      "Create exciting journeys with obstacles, discoveries, and brave decisions. Build tension and triumph.",
    animal:
      "Feature talking animals with distinct personalities. Include gentle life lessons about friendship and kindness.",
    space:
      "Describe planets, stars, rockets, and alien friends. Mix wonder of space with warmth and humor.",
    funny:
      "Use silly situations, wordplay, and unexpected twists. Make the child laugh with absurd but harmless humor.",
  };
  return guidance[genre];
}

// ── Setting content guidance ─────────────────────────────────────────

function getSettingGuidance(setting: StoryConfig["setting"]): string {
  const guidance: Record<StoryConfig["setting"], string> = {
    palestine:
      "Set the story in the beautiful land of Palestine — rolling olive groves shimmering silver-green, terraced hillsides fragrant with thyme and sage, ancient stone villages where neighbors share bread and stories, bustling markets alive with spices and laughter, coastal waves rolling onto golden shores, and a sky that glows amber and rose at sunset. Weave in iconic Palestinian details: olive trees, tatreez embroidery, the smell of ka'ak, the sound of the call to prayer drifting over rooftops. Celebrate the land and its warmth without specifying a single city unless the story naturally leads there.",
    jerusalem:
      "Describe the Old City's golden stones glowing in sunset, the Dome of the Rock's magnificent golden dome, narrow alleyways filled with spice scents, ka'ak bread sellers calling out warmly, and the peaceful call to prayer echoing gently.",
    nablus:
      "Feature the famous sweet kunafa glistening with syrup, old soap factories with olive oil scents, Mount Gerizim's majestic views, and the warmth of Nabulsi hospitality in every corner.",
    jaffa:
      "Paint the refreshing sea breeze, fragrant orange groves stretching to the horizon, the ancient port with colorful boats, the old clock tower standing proud, and fishermen mending their nets by the shore.",
    gaza:
      "Describe the Mediterranean waves dancing on golden sand, colorful fishing boats at dawn, vibrant markets filled with spices and laughter, and the resilient, welcoming spirit of its people.",
    bethlehem:
      "Feature the ancient Church of the Nativity, skilled artisans carving olive wood, peaceful starry nights over shepherd hills, and the timeless magic of the birthplace of stories.",
    hebron:
      "Describe the majestic Ibrahimi Mosque, artisans blowing glass into beautiful shapes, grape vines climbing ancient terraces, and bustling markets echoing with friendly greetings.",
    acre:
      "Feature the mysterious crusader tunnels, sturdy sea walls against blue waves, the old fishermen's port with fresh catch, and hummus restaurants welcoming every visitor.",
    "enchanted-forest":
      "Describe glowing mushrooms illuminating mossy paths, ancient talking oak trees sharing wisdom, hidden fairy villages among twisted roots, crystal-clear streams with golden fish, friendly squirrels and rabbits as guides, and fireflies forming shapes to guide travelers. The forest feels alive and welcoming.",
    "flying-castle":
      "Paint majestic towers floating among fluffy clouds, rainbow bridges connecting sparkling towers, wind gardens with singing flowers, rooms that change colors based on mood, friendly cloud creatures as helpers, and windows showing breathtaking views of the world below.",
    "underwater-kingdom":
      "Describe coral palaces with pearl-encrusted walls glowing softly, streets made of rainbow seashells, seahorse carriages trotting elegantly, bioluminescent gardens dancing with light, friendly dolphins as playful companions, and mermaid friends who sing beautiful songs.",
  };
  return guidance[setting];
}

// ── System Prompt Builder ────────────────────────────────────────────

export function buildStorySystemPrompt(
  config: StoryConfig,
  playerName?: string,
  playerAge: number = 8
): string {
  const genre = getGenreOption(config.genre);
  const setting = getSettingOption(config.setting);
  const lengthConfig = getLengthConfig(config.length);
  const companion = STORY_COMPANIONS.find((c) => c.id === config.companion);
  if (!companion) {
    throw new Error(`Invalid companion: ${config.companion}`);
  }
  const isInteractive = config.mode === "interactive";

  const heroDescription =
    config.companion === "self"
      ? `The hero is the child themselves${playerName ? `: "${playerName}"` : ""}. Make them brave and clever.`
      : `The hero's companion is مدحت (Medhat), a cheerful Palestinian fox 🦊 who loves adventure. Medhat is funny, encouraging, and loyal.${playerName ? ` The child "${playerName}" is the story's hero, accompanied by Medhat.` : ""}`;

  const totalPages = lengthConfig.pages;
  const choiceInterval = totalPages <= 5 ? 2 : 3;

  const parts: string[] = [
    // 1. Role & Language
    `You are a master storyteller for children. You write ${isInteractive ? "interactive " : ""}bedtime stories in Modern Standard Arabic (MSA / الفصحى).
NEVER use dialect. Always use clear, beautiful فصحى.`,

    // 2. Story Parameters
    `## Story Parameters
- Genre: ${genre.nameAr} (${genre.id}) ${genre.emoji}
- Setting: ${setting.nameAr} ${setting.emoji}
- Companion: ${companion.nameAr} ${companion.emoji}
- Total Pages: ${totalPages}
- ${heroDescription}`,

    // 3. Vocabulary
    `## Language & Age (${playerAge} years old)
${getVocabularyGuidance(playerAge)}
- ALWAYS write in Modern Standard Arabic (الفصحى)
- Keep each page to 5-6 lines of text
- Use vivid sensory descriptions (sights, sounds, smells)`,

    // 4. Genre Guidance
    `## Genre Guidance: ${genre.nameAr}
${getGenreGuidance(config.genre)}`,

    // 5. Setting Guidance
    `## Setting Guidance: ${setting.nameAr}
${getSettingGuidance(config.setting)}`,

    // 6. Tool Flow — differs by mode
    isInteractive
      ? `## Tool Flow (CRITICAL — follow exactly!)

Your tools: story_page, story_choice, end_story

### Pattern:
1. Call story_page (page 1) → story_page (page 2) → story_choice (STOP and WAIT)
2. Child selects a choice → Continue with story_page based on their choice
3. Repeat: story_page → story_page → story_choice (STOP and WAIT)
4. On the last page: story_page (isLastPage=true) → end_story

### Rules:
- Output ${choiceInterval}-${choiceInterval + 1} pages, then a story_choice, then STOP
- After story_choice, you MUST STOP generating. Wait for the child's response.
- Each story_page has 5-6 lines of Arabic text
- story_choice has 2-3 options with emoji + short Arabic text
- The story_choice prompt should be exciting: "ماذا يفعل البطل الآن؟"
- end_story generates a creative Arabic title automatically
- Total pages should be approximately ${totalPages}

### Choice Impact Guidelines:
- Each choice should meaningfully change the story direction
- Brave choices → show courage being rewarded
- Cautious choices → show wisdom and clever solutions
- Creative choices → lead to wonderful surprises
- ALL choices lead to happy endings
- Never make a child feel their choice was "wrong"
- Vary the path slightly based on choices to feel organic

### First Turn:
On the FIRST message, output ${Math.min(choiceInterval, 2)} story_page calls to begin the story, then a story_choice to let the child decide what happens next. Start with an exciting opening!

### Example Output Pattern:
[story_page page 1]: "كان يا ما كان في قديم الزمان..."
[story_page page 2]: "وصل البطل إلى الغابة المسحورة..."
[story_choice]: { prompt: "ماذا يفعل البطل الآن؟", choices: [...] }
[STOP — wait for child's response!]`
      : `## Tool Flow (CRITICAL — follow exactly!)

Your tools: story_page, end_story

### Pattern:
Generate ALL ${totalPages} pages in one response, then end the story.
1. Call story_page for page 1, page 2, page 3, ... page ${totalPages}
2. After the last page (isLastPage=true), call end_story

### Rules:
- Each story_page has 5-6 lines of Arabic text
- Call story_page once for each page, in order (page 1 through ${totalPages})
- Build a complete story arc: introduction → rising action → climax → resolution
- After the final story_page, call end_story with a creative Arabic title
- Generate ALL pages in a single response — do NOT stop partway`,

    // 7. Player Name
    playerName
      ? `## Player: ${playerName}\nMention the child's name naturally in the story (as the hero or when addressing them). Use it 1-2 times per page.`
      : "",

    // 8. Safety
    SAFETY_RULES,

    // 9. Critical Checklist
    isInteractive
      ? `## ⚠️ CHECKLIST (read before EVERY response):
✅ Writing in MSA (الفصحى), NOT dialect?
✅ Each page is 5-6 lines?
✅ Used story_page tool for each page?
✅ Presented story_choice after ${choiceInterval}-${choiceInterval + 1} pages?
✅ STOPPED after story_choice? (Don't continue until child responds!)
✅ Story matches genre (${genre.nameAr}) and setting (${setting.nameAr})?
✅ On last page, called end_story with a creative title?`
      : `## ⚠️ CHECKLIST (read before responding):
✅ Writing in MSA (الفصحى), NOT dialect?
✅ Each page is 5-6 lines?
✅ Used story_page tool for each page?
✅ Generated ALL ${totalPages} pages in this response?
✅ Story matches genre (${genre.nameAr}) and setting (${setting.nameAr})?
✅ Called end_story with a creative title after the last page?`,
  ];

  return parts.filter(Boolean).join("\n\n");
}
