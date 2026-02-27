/**
 * Main Chat Module
 *
 * Assembles the complete system prompt for the main Palestine chat agent.
 *
 * Order (matters for LLM attention):
 *   1. Constitution  — lib/ai/kids/constitution.ts  (safety & age rules, non-negotiable)
 *   2. Character     — Medhat persona & speaking style
 *   3. Tools guide   — image_search, location_search
 *   4. Chips guide   — inline CHIPS output rules
 *   5. Interaction   — two-step tool rule + golden rule
 */

import { SAFETY_RULES } from "../kids/constitution";
import {
  MEDHAT_CHARACTER,
  MAIN_TOOLS_GUIDE,
  CHIPS_GUIDE,
  TOOL_BEHAVIOR,
} from "./chat";

export { SAFETY_RULES };

// ── Assembled prompt ───────────────────────────────────────────────────

const MAIN_SYSTEM_PROMPT = [
  // 1. Constitution first — sets the non-negotiable floor
  SAFETY_RULES,

  // 2. Character (includes speaking style)
  MEDHAT_CHARACTER,

  // 3. Tools guide
  MAIN_TOOLS_GUIDE,

  // 4. Chips guide
  CHIPS_GUIDE,

  // 5. Interaction rules (includes golden rule summary)
  TOOL_BEHAVIOR,
].join("\n\n");

/**
 * Build the main chat system prompt, optionally personalised with the player's name.
 */
export function buildMainSystemPrompt(playerName?: string): string {
  if (!playerName) return MAIN_SYSTEM_PROMPT;

  const nameSection = `## Player Name
- The child's name is: ${playerName}
- Use "${playerName}" naturally (every 2–3 messages, not every sentence)
- Example: "يا ${playerName}! سؤالك حلو كتير!" or "أحسنت يا ${playerName}! 🌟"`;

  return `${MAIN_SYSTEM_PROMPT}\n\n${nameSection}`;
}
