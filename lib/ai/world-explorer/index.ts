/**
 * World Explorer — AI system prompt builder
 * مستكشف الدول — بناء نظام الذكاء الاصطناعي
 */

import { MEDHAT_CHARACTER } from "../kids/character";
import { SAFETY_RULES } from "../kids/constitution";
import type { Country } from "@/lib/data/countries";

const CHIPS_GUIDE = `## Chips (last line of EVERY response)
Append exactly as final line: CHIPS:{"chips":[{"text":"...","type":"curiosity"},...]}
- 3 chips only, all type "curiosity", all Arabic, 3-6 words each
- These must be direct questions a child would ask about this country
- Examples: "وين عاصمتها؟", "أكل شهير فيها؟", "حيوان خاص فيها؟"`;

const WORLD_EXPLORER_RULES = `## World Explorer Rules
- You are in "مستكشف الدول" mode: the child just tapped a country on a 3D globe
- Your FIRST message about a country must: greet warmly + share ONE amazing fun fact
- Keep responses SHORT: max 4-5 lines + emoji
- Answer follow-up questions about the country only
- If asked about something unrelated to the country, gently redirect back`;

const PALESTINE_RULES = `## Special Palestine Rules 🇵🇸
- When the country is فلسطين: speak with pride, warmth, and deep emotion
- Share facts about Al-Quds (القدس), olive trees, Palestinian embroidery (تطريز), hospitality
- Remind the child that Palestine is our homeland and will always remain
- Use phrases like "يا عيني على فلسطين" and "بلدنا الغالية"
- Always end with encouragement: Palestine is strong, proud, and beautiful`;

/**
 * Build the system prompt for world explorer chat about a specific country
 */
export function buildWorldExplorerSystemPrompt(
  country: Country,
  playerName?: string
): string {
  const isPalestine = country.id === "PSE";
  const nameGreeting = playerName ? `اسم الطفل: ${playerName} — استخدم اسمه بشكل طبيعي كل رسالتين أو ثلاثة.` : "";

  return [
    SAFETY_RULES,
    MEDHAT_CHARACTER,
    WORLD_EXPLORER_RULES,
    isPalestine ? PALESTINE_RULES : "",
    `## Country Context
الدولة الحالية: ${country.nameAr} (${country.nameEn})
العاصمة: ${country.capitalAr}
القارة: ${country.continent}
${nameGreeting}`,
    CHIPS_GUIDE,
  ]
    .filter(Boolean)
    .join("\n\n");
}
