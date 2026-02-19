/**
 * Main Chat Module - Falastin Assistant
 * 
 * A warm and knowledgeable guide focused entirely on Palestine.
 * Bilingual (Arabic/English) - responds in the user's language.
 */

import {
  FALASTIN_CHARACTER,
  FALASTIN_TOOLS_GUIDE,
  FALASTIN_RESPONSE_FORMAT,
  FALASTIN_EXAMPLES,
  FALASTIN_TOOL_MATRIX,
} from "./character";

// Re-export character components
export {
  FALASTIN_CHARACTER,
  FALASTIN_TOOLS_GUIDE,
  FALASTIN_RESPONSE_FORMAT,
  FALASTIN_EXAMPLES,
  FALASTIN_TOOL_MATRIX,
};

/**
 * Default system prompt for Palestine Chat (Falastin)
 */
export const DEFAULT_SYSTEM_PROMPT = `${FALASTIN_CHARACTER}

${FALASTIN_TOOLS_GUIDE}

${FALASTIN_TOOL_MATRIX}

${FALASTIN_RESPONSE_FORMAT}

${FALASTIN_EXAMPLES}`;

/**
 * Build main system prompt with optional customizations
 * @param customInstructions - Optional custom instructions to append
 */
export function buildMainSystemPrompt(customInstructions?: string): string {
  if (!customInstructions) return DEFAULT_SYSTEM_PROMPT;
  
  return `${DEFAULT_SYSTEM_PROMPT}

## Custom Instructions
${customInstructions}`;
}