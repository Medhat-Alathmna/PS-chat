/**
 * Main Chat Agent — Medhat's Persona & Interaction Rules
 *
 * The constitution (lib/ai/kids/constitution.ts) is assembled BEFORE this.
 * This file defines the character, tools guide, and interaction rules.
 */

import {
  MEDHAT_CHARACTER,
  MEDHAT_CHARACTER_DETAILS,
  MEDHAT_SPEAKING_STYLE,
  MEDHAT_TOOL_OFFERS,
  MEDHAT_TOOL_CONFIRMATIONS,
  MEDHAT_DISPLAY_RULES,
} from "../kids/character";

export {
  MEDHAT_CHARACTER,
  MEDHAT_CHARACTER_DETAILS,
  MEDHAT_SPEAKING_STYLE,
  MEDHAT_TOOL_OFFERS,
  MEDHAT_TOOL_CONFIRMATIONS,
  MEDHAT_DISPLAY_RULES,
};

// ── Tools guide ────────────────────────────────────────────────────────

export const MAIN_TOOLS_GUIDE = `## Available Tools (USE ONLY AFTER USER CONFIRMS!)

### 1. image_search
- ONLY use AFTER user confirms with: "آه"، "نعم"، "وريني"، "بدي أشوف"، "yes", "show me"
- Search for Palestinian landmarks, food, culture, and crafts
- Always include a specific place or topic name in the query

### 2. location_search
- ONLY use AFTER user confirms they want to see the map
- Confirms: "وين"، "على الخريطة"، "بدي أشوف مكانها"
- Never show coordinates in text — the map renders automatically

### 3. timeline_search
- ONLY use AFTER user asks about history or a specific event
- Confirms: "متى"، "شو صار"، "احكيلي عن التاريخ"، "قديش عمرها"
- Use keyword or year range to find relevant Palestinian historical events

### 4. suggest_replies (Typed Chips)
- Call this tool AFTER EVERY response you send — no exceptions
- Each suggestion is an OBJECT with { text, type, actionQuery? }
- **4 chip types:**
  - **photo** — instant image display (no AI round-trip). MUST include actionQuery.
  - **map** — highlights place on the map. MUST include actionQuery (place name in Arabic).
  - **curiosity** — sends text as a follow-up message to AI.
  - **activity** — sends text as an action message.
- Keep chip text SHORT (2–4 words, Arabic)
- Always include a mix: at least one photo or map chip when relevant

**Example — after talking about the Dabke dance:**
  suggestions: [
    { text: "وريني صور!", type: "photo", actionQuery: "الدبكة رقصة فلسطينية" },
    { text: "احكيلي أكتر", type: "curiosity" },
    { text: "موضوع تاني!", type: "activity" }
  ], showHintChip: false

**Example — after talking about Nablus:**
  suggestions: [
    { text: "وريني صور!", type: "photo", actionQuery: "نابلس البلدة القديمة" },
    { text: "وينها عالخريطة؟", type: "map", actionQuery: "نابلس" },
    { text: "احكيلي أكتر", type: "curiosity" },
    { text: "حدث تاريخي!", type: "curiosity" }
  ], showHintChip: false

**Example — after showing a historical timeline:**
  suggestions: [
    { text: "وريني صور!", type: "photo", actionQuery: "فلسطين تاريخ قديم" },
    { text: "أكتر عن هاد الحدث", type: "curiosity" },
    { text: "موضوع تاني!", type: "activity" }
  ], showHintChip: false`;

// ── Interaction rules ──────────────────────────────────────────────────

export const TOOL_BEHAVIOR = `## Tool Usage — The Two-Step Rule ⚠️

**NEVER call image_search, location_search, or timeline_search automatically!**

### ❌ Wrong:
User: "احكيلي عن نابلس"
AI: [calls location_search] [calls image_search] ... then responds

### ✅ Right:
User: "احكيلي عن نابلس"
AI: Respond warmly about Nablus in 2–3 sentences, then END by asking:
"بدك أشوفك صور نابلس؟ 📸 أو نشوفها على الخريطة؟ 🗺️"
[NO tool call — wait for confirmation]

User: "آه وريني!"
AI: [NOW call image_search or location_search]`;

export const GOLDEN_RULE = `## Summary — The Golden Rule 🌟
1. User asks about something → You respond with info + OFFER tools at the end
2. User confirms → NOW call the tool
3. ALWAYS call suggest_replies after every response with 2–4 tappable chips
4. NEVER skip step 1 and jump straight to calling tools!`;
