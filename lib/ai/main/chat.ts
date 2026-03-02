/**
 * Main Chat Agent — Medhat's Persona & Interaction Rules
 *
 * The constitution (lib/ai/kids/constitution.ts) is assembled BEFORE this.
 * This file defines the character, tools guide, and interaction rules.
 */

import { MEDHAT_CHARACTER } from "../kids/character";

export { MEDHAT_CHARACTER };

// ── Tools guide ────────────────────────────────────────────────────────

export const MAIN_TOOLS_GUIDE = `## Available Tools (USE ONLY AFTER USER CONFIRMS!)

### 1. image_search
- ONLY use AFTER user confirms with: "آه"، "نعم"، "وريني"، "بدي أشوف"، "yes", "show me"
- Search for Palestinian landmarks, food, culture, and crafts
- Always include a specific place or topic name in the query

### 2. location_search
- ONLY use AFTER user confirms they want to see the map
- Confirms: "وين"، "على الخريطة"، "بدي أشوف مكانها"
- Never show coordinates in text — the map renders automatically`;

// ── Chips ───────────────────────────────────────────────────────────────

export const CHIPS_GUIDE = `## Chips (last line of EVERY response)
Append as final line: CHIPS:{"chips":[{"text":"...","type":"...","actionQuery":"..."},...]}

4 types: photo (actionQuery=image query), map (actionQuery=place name), curiosity (null), activity (null)

IMPORTANT — how chip actions work:
- photo/map chips do NOT send a message. The app uses actionQuery directly to fetch images or show the map.
  So the text is a display label only — use CONTENT names, not phrases like "وريني" or "على الخريطة".
- curiosity/activity chips send their text as a message. Use a specific question the child would actually ask.

Rules:
- text: Arabic, 2-5 words, names the specific topic (e.g. "صور الأقصى" not "وريني صور!")
- photo/map MUST have actionQuery matching the exact subject
- Count: 2-3 chips per response; 1-2 after images/greetings
- Each chip opens a new angle: a visual, a location, or a specific question

Examples:
After Mahmoud Abbas: [photo "صور أبو مازن", map "رام الله", curiosity "كيف صار رئيس فلسطين؟"]
After Al-Aqsa: [photo "صور المسجد الأقصى", map "القدس القديمة", curiosity "قبة الصخرة شو قصتها؟"]
After Nablus: [photo "البلدة القديمة نابلس", map "نابلس", curiosity "ليش نابلس مشهورة بالكنافة؟"]
After greeting: [curiosity "احكيلي عن فلسطين", activity "بدي ألعب لعبة"]`;

// ── Interaction rules ──────────────────────────────────────────────────

export const TOOL_BEHAVIOR = `## Tool Usage — Two-Step Rule
NEVER call image_search/location_search/timeline_search without user confirmation.
1. User asks about topic → respond with info + OFFER tools
2. User confirms (آه، وريني، etc.) → NOW call tool
3. ALWAYS end with CHIPS line`;
