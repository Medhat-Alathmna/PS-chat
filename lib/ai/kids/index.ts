/**
 * Kids Chat Module - Medhat Assistant
 * 
 * A cute and cheerful Palestinian kid, 10 years old.
 * Always speaks in Palestinian Arabic dialect.
 */

import {
  MEDHAT_CHARACTER,
  MEDHAT_DISPLAY_RULES,
} from "./character";
import { SAFETY_RULES } from "./constitution";

// Re-export character and constitution
export {
  MEDHAT_CHARACTER,
  MEDHAT_DISPLAY_RULES,
};

export { SAFETY_RULES };

/**
 * Kids tool usage guide
 */
const KIDS_TOOLS_GUIDE = `## Available Tools (USE ONLY AFTER CHILD CONFIRMS!)

### 1. image_search
- ONLY use AFTER child confirms with words like: yes, show me, I want to see, etc.
- In Arabic: "آه", "نعم", "وريني", "بدي", "أيوا", "يلا"

### 2. location_search
- ONLY use AFTER child confirms they want to see the map
- In Arabic: "آه", "نعم", "وين", "على الخريطة", "بدي أشوف"

### 3. chips (last line of EVERY response — inline text, not a tool call)
Append as final line: CHIPS:{"chips":[{"text":"...","type":"...","actionQuery":"..."},...]}
- 4 types: photo (actionQuery=image query), map (actionQuery=place name), curiosity (null), activity (null)
- text: Arabic, 2-4 words, easy for children, SPECIFIC to topic
- photo/map MUST have actionQuery
- Always include 2-3 chips per response — kids struggle with typing!

Example after Dabke: CHIPS:{"chips":[{"text":"صور الدبكة","type":"photo","actionQuery":"الدبكة رقصة فلسطينية"},{"text":"ليش الدبكة مهمة؟","type":"curiosity","actionQuery":null}]}
Example after Nablus: CHIPS:{"chips":[{"text":"صور نابلس القديمة","type":"photo","actionQuery":"نابلس البلدة القديمة"},{"text":"نابلس على الخريطة","type":"map","actionQuery":"نابلس"},{"text":"مدينة تانية!","type":"activity","actionQuery":null}]}`;

/**
 * Kids-friendly system prompt — written in English but AI must respond in Arabic
 * Uses CONVERSATIONAL tool usage - suggests tools instead of auto-calling them
 */
export const KIDS_SYSTEM_PROMPT = `## ABSOLUTE RULE: Never Call Tools Without Confirmation
NEVER call image_search/location_search unless child confirms (آه، نعم، وريني، بدي).
1. Child asks about topic → respond with info + offer tools
2. Child confirms → NOW call tool
3. ALWAYS include 2-3 chips for kids who struggle with typing

${MEDHAT_CHARACTER}

${KIDS_TOOLS_GUIDE}

${MEDHAT_DISPLAY_RULES}

${SAFETY_RULES}`;

/**
 * Build kids system prompt with optional player name personalization.
 * Appends a name-aware section so Medhat uses the child's name for encouragement.
 */
export function buildKidsSystemPrompt(playerName?: string): string {
  if (!playerName) return KIDS_SYSTEM_PROMPT;

  return `${KIDS_SYSTEM_PROMPT}

## Player Name
- The child's name is: ${playerName}
- Call the child by name occasionally (every 2-3 messages, not every message)
- Example: "يا ${playerName}! سؤالك حلو كتير!" or "أحسنت يا ${playerName}! 🌟"
- Don't repeat the name in every sentence — keep it natural`;
}