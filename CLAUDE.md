# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Build for production
npm start            # Start production server (after build)
npm run lint         # Run ESLint
npm run lint -- app/ # Lint specific directory
```

## Environment Setup

Create a `.env.local` file with required API keys:

```env
OPENAI_API_KEY=sk-...           # Required: OpenAI API key for all features
OPENROUTER_API_KEY=sk-...       # Optional: For alternate provider
```

Optional per-feature model configuration (defaults to `gpt-5-mini`):
- `MAIN_CHAT_PROVIDER`, `MAIN_CHAT_MODEL`, `MAIN_CHAT_MODEL_OR`
- `CITY_EXPLORE_PROVIDER`, `CITY_EXPLORE_MODEL`, `CITY_EXPLORE_MODEL_OR`
- `STORIES_PROVIDER`, `STORIES_MODEL`, `STORIES_MODEL_OR`

Set `ENABLE_STREAMING=false` to disable streaming (rarely needed).

## Project Architecture

### Overview

**PS-Kids** is a Next.js bilingual (Arabic/English) educational app for children aged 7-12, focused on Palestinian geography and culture. It features:
- Main chat with AI mascot Medhat
- 13 AI-powered games (city exploration, quizzes, riddles, etc.)
- Story generation with images
- World explorer with interactive globe
- Multi-profile system with personalization (avatars, colors, text settings)

**Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS, Vercel AI SDK v6 (with streaming), Leaflet/React-Globe for maps.

### High-Level Directory Structure

```
app/
  api/
    chat/                  # Main chat endpoint (Medhat)
    games/chat/            # Game endpoint (city explorer, quizzes, etc.)
    stories/chat/          # Story generation endpoint
    world-explorer/chat/   # Globe interaction endpoint
    images/, tts/, geocode/ # Supporting endpoints
  components/
    kids/                  # Kids UI (chat, games, profiles, settings, globe)
    layout.tsx             # Root layout (RTL-first, fonts, context providers)
  chat/, [kids/]page.tsx   # Main pages

lib/
  ai/
    config.ts              # Model instance getters (feature-scoped)
    cache.ts               # Prompt caching setup
    tools.ts               # Shared tools (image_search, location_search)
    main/
      index.ts, chat.ts    # Main chat system prompt & logic
    kids/
      index.ts, character.ts, constitution.ts  # Medhat personality & rules
    games/
      city-explorer/       # City guessing game logic
    world-explorer/        # Globe interaction logic
    stories/
      prompts.ts, tools.ts # Story generation

  hooks/
    useChat*, useGame*, useProfile*, useText* etc.  # State & context management

  types/
    games.ts, stories.ts, text-settings.ts, globe-settings.ts  # Type defs

  data/
    games/, cities.ts, countries.ts  # Game configs & geo data

  services/
    images/, maps/, multi-image-search.ts  # External service integrations
```

### Key Architectural Patterns

#### 1. AI Model Management (`lib/ai/config.ts`)

Each feature gets its own model instance getter:
- `getMainChatModelInstance()` — Main chat with Medhat
- `getCityExploreModelInstance()` — City explorer game
- `getStoriesModelInstance()` — Story generation

**Never hardcode model names or API keys.** Use:
```ts
import { getMainChatModelInstance } from "@/lib/ai/config";
const model = getMainChatModelInstance(); // Returns provider(model) instance
```

Configuration flows through `.env.local` → `resolveFeature()` → per-feature getter. Allows swapping providers (OpenAI/OpenRouter) without code changes.

#### 2. Vercel AI SDK v6 Streaming Patterns

**Main Chat** (`app/api/chat/route.ts`):
- Uses `generateText()` + `convertToModelMessages()` (UIMessage format)
- Merges multiple concurrent streams via `mergeStreams()` (text + tools + chips)
- Extracts **Chips** (quick replies) from inline `\nCHIPS:{...}` marker at end of response

**Games** (`app/api/games/chat/route.ts`):
- Uses `generateObject()` for structured GameResponseSchema output
- Extracts **Game Turn** from inline `\nGAME_TURN:{...}` marker
- Pre-computes hint images, injects as `data-game-turn` stream chunk

**Never use `Output.object` for text-generation features** — reasoning models (gpt-5-mini) output only JSON when using Output.object, causing blank chat bubbles and lost conversational text.

#### 3. LocalStorage State Management

All client-side state persisted to localStorage with **`falastin_` prefix**:
- `falastin_profiles` — Multi-profile data (names, avatars, colors, ages)
- `falastin_discovered_cities` — Game progress per profile
- `falastin_kids_text_settings` — Font family & size choices
- `falastin_kids_map_settings` — Map zoom/layer preferences
- `falastin_kids_chat_context` — Chat conversation memory
- `falastin_rewards_${profileId}` — Points/stickers per profile

Custom hooks in `lib/hooks/` handle reads/writes (e.g., `useProfiles()`, `useGameState()`).

#### 4. Multi-Profile System (`lib/hooks/useProfiles.ts`)

Each profile has:
- `id` (UUID) — Profile identifier
- `name`, `age` — Player info
- `avatar`, `color` — Visual customization
- Per-profile state keys (game progress, rewards) use `_${profileId}` suffix

Hooks support optional `profileId` parameter:
```ts
const rewards = useRewards(currentProfileId);
const gameState = useGameState(gameId, currentProfileId);
```

Profiles managed via ProfileSetup wizard (4 steps: name → age → avatar → color) and ProfileSwitcher pill in header.

#### 5. Game Architecture

**Games System** (`lib/ai/games/city-explorer/index.ts`):
- **Tools only**: `advance_round`, `end_game` (check_answer/give_hint removed — hints pre-computed server-side)
- **Output format**: Model appends `\nGAME_TURN:{...}` with options array at end of response
- **Server injection**: API extracts GAME_TURN, fetches pre-computed hint + images, injects `data-game-turn` into stream
- **Client reads**: Looks for `{ type: "data-game-turn" }` in message.parts
- **Correct answer signal**: `advance_round` tool fires → client plays sound/confetti/points

Game configs stored in `lib/data/games/` with rules, questions, difficulty settings. Pre-computed hints in `buildPrecomputedHint()` strategy.

#### 6. Chat System Prompt

Split across modular files in `lib/ai/`:
- `main/index.ts` — Core system prompt for main chat
- `kids/constitution.ts` — Medhat personality rules
- `kids/character.ts` — Medhat background story
- `buildKidsSystemPrompt(playerName?)` — Assembles prompt with optional name injection

Similar structure for games in `buildGameSystemPrompt(difficulty, gameType, playerName?)`.

#### 7. Text Settings System (`lib/hooks/useTextSettings.ts`)

Offers 4 font families (selectable in `/kids/settings`):
- `noto-sans-arabic` (default) — CSS var `--font-arabic`
- `cairo`, `tajawal`, `changa` — CSS vars `--font-cairo`, etc. (loaded in `app/layout.tsx`)

3 text sizes: small=14px, medium=17px, large=21px.

Used in `KidsChatBubble` and `GameChatBubble` via `textStyle` prop:
```ts
const textSettings = useTextSettings();
const styles = getTextStyleValues(textSettings);
<KidsChatBubble textStyle={styles} />
```

#### 8. Sound & Audio System (`lib/hooks/useSounds.ts`)

- Web Audio API (no audio files) — oscillators generate sounds procedurally
- Singleton AudioContext pattern
- Background music toggle in root layout
- Game-specific sounds (correct/wrong/level-up) via `useSounds()` hook

#### 9. Image Search Integration (`lib/services/multi-image-search.ts`)

Queries multiple sources (Unsplash, Pexels, Wikimedia, OpenVerse) with fallback strategy. Optional kid-safe filtering via `searchImagesMultiSource(query, kidSafe: true)`.

#### 10. Chips (Quick Replies) System

- **Not a tool** — model appends `\nCHIPS:{...}` inline with text response
- Extracted server-side and written as `{ type: 'data-chips' }` stream chunk
- Client reads from `msg.parts`, displays as button row
- Uses normalized `chipSchema` for type safety

### File Conventions

#### Page Routes
- `/` — Landing
- `/chat` — Main chat with Medhat
- `/kids` — Kids hub
- `/kids/games` — Game selection
- `/kids/games/[gameId]` — Individual game page
- `/kids/world-explorer` — Globe interaction
- `/kids/settings` — Text & map settings
- `/kids/games/stories` — Story generation hub

#### Component Naming
- `Kids*` (e.g., `KidsChatBubble`) — Kids-specific UI
- `Game*` (e.g., `GameChatBubble`) — Game-specific UI
- Components in `app/components/kids/` use CSS variables `--kids-purple`, `--kids-green`, etc.

#### Hook Naming
- `use*Settings` — Preferences (text, map, globe, chat)
- `use*Context` — State/messaging context
- `use*State` — Game-specific state
- `use*Rewards` — Points/stickers
- `useSounds`, `useBackgroundMusic` — Audio

### Testing & Debugging

- **ESLint**: `npm run lint` — Check for code quality issues
- **Dev mode**: `npm run dev` — Full hot-reload, easier debugging
- **Network inspection**: Check `/api/*` route responses in DevTools Network tab
- **LocalStorage**: Inspect via DevTools Application → Local Storage (keys prefixed `falastin_`)
- **Console errors**: Check browser console for AI SDK or React errors

### Common Development Tasks

**Adding a new game**:
1. Create game config in `lib/data/games/`
2. Define rules/questions
3. Add game ID to enum in `lib/types/games.ts`
4. Create `lib/ai/games/[game-name]/index.ts` with system prompt + game logic
5. Link in `app/kids/games/[gameId]/page.tsx`

**Customizing Medhat personality**:
- Edit `lib/ai/kids/character.ts` (background story) or `constitution.ts` (behavioral rules)
- Re-inject into system prompt via `buildKidsSystemPrompt()`

**Adding text/map settings**:
- Define types in `lib/types/text-settings.ts` or `lib/types/map-settings.ts`
- Create hook in `lib/hooks/use[Feature]Settings.ts`
- Add UI components in `app/components/kids/settings/`
- Use storage key `falastin_kids_[feature]_settings`

## Critical Behaviors to Preserve

1. **Reasoning models don't work with Output.object** — Use inline markers (`\nCHIPS:{...}`) for chips/game turns instead, then extract server-side.

2. **Tool types as `Record<string, any>`** — Vercel AI SDK's `tool()` function returns different generics per tool, causing `Tool<never, never>` errors with strict typing. Keep as `Record<string, ReturnType<typeof tool>>`.

3. **Profile-aware hooks** — Always accept optional `profileId` parameter. Default to current profile from context.

4. **RTL-first layout** — Root `<html dir="rtl">`. Test both Arabic (RTL) and English (LTR) text rendering.

5. **Streaming must complete** — AI SDK v6 keeps streams open until all merged streams (text + tools/data chunks) and execute promises finish. Don't close streams early.

## Important Notes

- **No environment secrets in commits** — `.env.local` is gitignored.
- **Prompt caching**: `buildCacheOptions()` in `lib/ai/cache.ts` — use for long system prompts to reduce token costs.
- **Image preloading**: Game endpoint pre-fetches hint images in parallel (3s timeout) before streaming response.
- **Mobile-first**: App is RTL-first, designed for kids on tablets/phones. Test viewport at 375×812 (iPhone-size).
- **Create Component**: Always use front-end design skills when create new component.
