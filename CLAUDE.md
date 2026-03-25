# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev          # Start Next.js dev server at http://localhost:3000
                     # Requires NestJS backend running at http://localhost:3001
npm run build        # Build for production
npm start            # Start production server (after build)
npm run lint         # Run ESLint
npm run lint -- app/ # Lint specific directory
```

## Environment Setup

Create a `.env.local` file with the following variables:

```env
# Backend (NestJS) — required for all features
BACKEND_URL=http://localhost:3001

# Image search providers (optional — disable all with ENABLE_IMAGES=false)
UNSPLASH_API_KEY=...                 # Unsplash API key
PEXELS_API_KEY=...                   # Pexels API key
WIKIMEDIA_API_KEY=...                # Wikimedia Commons (optional)

# OAuth (optional — for Google sign-in)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...     # Public Google OAuth client ID
GOOGLE_CLIENT_SECRET=...             # Backend uses this

# Site configuration (for SEO, canonical links)
NEXT_PUBLIC_SITE_URL=https://ps-kids.school
```

## Project Architecture

### Overview

**PS-Kids** is a Next.js + NestJS bilingual (Arabic/English) educational platform for children aged 7-12, focused on Palestinian geography and culture.

**Frontend Features**:
- Multi-profile system with authentication (email, Google OAuth)
- Main chat interface with AI mascot Medhat
- City explorer game (guessing cities with AI hints)
- Story generation with AI-generated images
- World explorer with interactive globe
- Customizable text settings (4 font families, 3 sizes)
- Web Audio API sound system (no audio files)

**Tech Stack**:
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Sonner (toasts)
- **Backend**: NestJS (separate repository) — handles AI, auth, profiles, game sessions, persistence
- **Maps**: Leaflet (city explorer), React-Globe.GL (world explorer)
- **Media**: Multi-source image search (Unsplash, Pexels, Wikimedia, OpenVerse), YouTube integration
- **Auth**: JWT (accessToken/refreshToken cookies), Google OAuth

### High-Level Directory Structure

```
app/
  api/
    auth/                  # OAuth & token management (proxy to NestJS backend)
      login/, register/, logout/, google/, refresh/, verify-email/
    chat/                  # Main chat endpoint (proxy to backend /ai/chat)
    games/                 # Game endpoints (proxy to backend /games/*)
    profiles/              # Profile CRUD (proxy to backend /profiles/*)
    images/, tts/, geocode/ # Supporting endpoints
    backend/[...path]/     # Catch-all proxy route to NestJS
  components/
    ClientProviders.tsx    # Auth/theme context wrapping
    JsonLd.tsx             # SEO structured data
    kids/                  # Kids-specific UI components
      - Chat, games, profiles, settings, globe
  auth/                    # Auth pages (login, register, verify-email, forgot-password)
  kids/                    # Protected kids app routes
  chat/, page.tsx          # Landing & main pages

lib/
  api/
    backend.ts             # DRY wrapper for NestJS calls — all requests use backendFetch()
    cookies.ts             # Token management (getAccessToken, setAuthCookies)
    games-backend.ts       # Game-specific backend calls
    settings-fetch.ts      # Settings/preferences backend calls

  hooks/
    useAuth.ts             # Auth state (login, logout, register, refresh)
    useProfiles.ts         # Multi-profile management (CRUD, sync from backend)
    useGameState.ts        # Game progress tracking
    useGameRewards.ts      # Points/stickers per profile
    useRewards.ts          # Overall rewards
    useStories.ts          # Story generation state
    useTextSettings.ts     # Font & size preferences (localStorage + backend sync)
    useMapSettings.ts      # Map/globe preferences
    useChatContext.ts      # Chat conversation history
    useSounds.ts           # Web Audio API sound effects
    useBackgroundMusic.ts  # Background music toggle
    useTokenQuota.ts       # Token usage limits

  context/
    auth-context.tsx       # Auth state provider (user, isAuthenticated, refresh)

  services/
    multi-image-search.ts  # Unified image search across multiple sources
    images/*.ts            # Individual image providers (unsplash, pexels, wikimedia, openverse)
    maps/*.ts              # Map services (geocoding, OSM, Google Maps)
    story-image-generation.ts # Image generation for stories
    video/youtube.ts       # YouTube search/embed

  data/
    games/                 # Game configurations, questions, difficulty settings
    cities.ts, countries.ts, country-details.ts # Geo data
    stickers.ts, kids-prompts.ts # Content data

  types/
    games.ts               # Game types (GameState, GameConfig, GameResponse)
    stories.ts, text-settings.ts, map-settings.ts, globe-settings.ts
    chat-settings.ts, types.ts # Shared types

  config/
    features.ts            # Feature flags (ENABLE_IMAGES, etc.)

  utils/
    sound-generator.ts     # Procedural sound synthesis
    messageConverter.ts    # UIMessage/SimpleMessage conversion
    language-detect.ts     # Language detection
    error-handler.ts       # Error handling utilities
```

### Key Architectural Patterns

#### 1. Frontend-Backend Communication (Critical)

**Architecture**: Next.js frontend is a **thin proxy** to NestJS backend. Client never calls backend directly.

**Pattern**:
```ts
// lib/api/backend.ts — DRY wrapper for all backend calls
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';

export async function backendFetch<T>(path: string, options: BackendFetchOptions): Promise<T> {
  // Adds Content-Type, Authorization headers
  // Handles both JSON and text responses
  // Wraps errors in BackendError with status + body
}

// Usage in API routes:
const data = await backendFetch('/profiles', { accessToken, method: 'GET' });
```

**API Routes as Proxies**:
- `app/api/chat/route.ts` → calls `backendFetch('/ai/chat', ...)`
- `app/api/games/chat/route.ts` → calls `backendFetch('/games/chat', ...)`
- `app/api/profiles/[id]/route.ts` → calls `backendFetch('/profiles/:id', ...)`

**Why proxy through Next.js**?
- All requests authenticated with JWT (accessToken in cookies)
- Profile context passed via headers (`X-Profile-Id`)
- Centralized error handling
- Consistent request/response format

#### 2. Authentication Flow (JWT + OAuth)

**Token Management**:
```ts
// lib/api/cookies.ts
getAccessToken() → reads httpOnly cookie 'accessToken'
setAuthCookies(access, refresh) → sets both cookies (httpOnly, sameSite=strict)
clearAuthCookies() → clears tokens on logout
```

**Auth Routes**:
- `POST /api/auth/login` → calls backend, sets cookies
- `POST /api/auth/register` → creates account on backend
- `POST /api/auth/google/callback` → OAuth callback, exchanges code for tokens
- `POST /api/auth/refresh` → refreshes expired accessToken with refreshToken

**Client Hook**:
```ts
const { user, isAuthenticated, login, logout, refresh, error, isPending } = useAuth();
```

On login → `prefetchProfiles()` syncs all backend profiles to localStorage under `falastin_profiles`.

#### 3. Multi-Profile System

**State Flow**:
- Backend stores profiles (id, name, age, avatar, color, settings, created_at)
- On login → profiles fetched + cached in localStorage (`falastin_profiles`)
- `useProfiles()` hook reads/writes both localStorage + backend
- Current active profile in `activeProfileId`

**Per-Profile Persistence**:
- Game progress: `falastin_discovered_cities_${profileId}`
- Rewards/points: `falastin_rewards_${profileId}`
- Settings synced to backend

**Profile Selection**:
- ProfileSwitcher pill in header
- ProfileSetup wizard (name → age → avatar → color)
- Each profile can have unique settings, game progress, rewards

#### 4. API Route Patterns

**All API routes**:
1. Extract accessToken from cookies
2. Check authentication (return 401 if missing)
3. Get profileId from `X-Profile-Id` header (optional, passed by client)
4. Call `backendFetch()` with accessToken + headers
5. Return response or error

**Example** (`app/api/chat/route.ts`):
```ts
export async function POST(req: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const profileId = req.headers.get("x-profile-id");

  const result = await backendFetch("/ai/chat", {
    method: "POST",
    body: JSON.stringify(body),
    accessToken,
    headers: profileId ? { "X-Profile-Id": profileId } : {},
  });

  return Response.json(result);
}
```

#### 5. Image Search Integration

**Multi-Source Search** (`lib/services/multi-image-search.ts`):
- Queries Unsplash, Pexels, Wikimedia, OpenVerse in parallel
- Fallback strategy: if one source fails, tries the next
- Optional kid-safe filtering (removes adult content)
- Returns first N results across all sources

**Feature Flag**:
- Set `ENABLE_IMAGES=false` to disable all image fetching
- Used in games for hint images, stories, profile avatars

#### 6. Game Architecture

**Game Session Flow**:
1. User selects game + difficulty from `/kids/games`
2. Client creates game session via backend (`POST /games/sessions`)
3. Session ID stored in `useGameState()` hook
4. Each turn → `POST /api/games/chat` with messages + sessionId
5. Backend AI generates hint + options, returns as `GameResponse`
6. Client displays options, waits for next user action
7. On correct answer → `advance_round()` tool, points awarded
8. On finish → session ends, stickers/bonuses unlocked

**Hint Pre-computation**:
- Backend pre-fetches hint images in parallel (3s timeout)
- Images embedded in game turn response
- Client displays hint + images on hint button click

#### 7. Settings & Preferences

**Text Settings** (`lib/hooks/useTextSettings.ts`):
- Font family: noto-sans-arabic (default), cairo, tajawal, changa
- Font size: small (14px), medium (17px), large (21px)
- Stored in: localStorage `falastin_kids_text_settings` + backend
- Applied globally via CSS var: `font-family: var(--font-${family})`

**Map Settings** (`lib/hooks/useMapSettings.ts`):
- Zoom level, layer type, center coordinates
- Per-profile, synced to backend

**Chat Settings** (`lib/hooks/useChatContext.ts`):
- Message history (last 3 for context)
- Dialect preference (Arabic/English)
- Per-profile localStorage: `falastin_kids_chat_context_${profileId}`

#### 8. Sound System (No Audio Files)

**Web Audio API** (`lib/hooks/useSounds.ts`):
- Procedural sound generation via oscillators
- Singleton AudioContext pattern
- Game sounds: correct/wrong/level-up/bonus
- Background music: toggle via `useBackgroundMusic()` hook

**Audio Context Lifetime**:
- Single shared context across app
- Created on first sound play (not in layout, avoids startup overhead)
- Reused for all subsequent sounds

#### 9. State Management

**localStorage** (client-only, prefixed `falastin_`):
- `falastin_profiles` — All profiles + active profile ID
- `falastin_kids_text_settings` — Font/size preferences
- `falastin_kids_chat_context_${profileId}` — Chat history per profile
- `falastin_rewards_${profileId}` — Points per profile
- `falastin_discovered_cities_${profileId}` — Game progress per profile

**Context Providers** (`app/components/ClientProviders.tsx`):
- `AuthContext` — User, tokens, auth methods
- `ThemeContext` — Dark/light mode
- Wrapped at root layout

**Backend State** (persisted):
- Profiles, settings, game sessions, story history, rewards
- All mutations go through API routes

### File Conventions

#### Page Routes
- `/` — Landing page
- `/auth/login` — Login form
- `/auth/register` — Registration form
- `/auth/verify-email` — Email verification
- `/auth/forgot-password` — Password reset
- `/chat` — Main chat with Medhat (requires auth)
- `/kids` — Kids hub/home (protected)
- `/kids/games` — Game selection & difficulty
- `/kids/games/[gameId]` — Individual game page
- `/kids/games/stories` — Story generation hub
- `/kids/games/stories/create` — Story creator
- `/kids/world-explorer` — Interactive globe
- `/kids/settings` — Customization (text, map settings)

#### Component Naming
- `Kids*` — Kids-specific UI (e.g., `KidsChatBubble`)
- `Game*` — Game-specific UI (e.g., `GameChatBubble`)
- Auth components in `/app/auth/` (login, register forms)
- Shared UI in `app/components/`

#### Hook Naming
- `use*Settings` — Preferences (text, map, chat, globe)
- `use*State` — Game/feature state (useGameState, useStories)
- `use*Context` — Context consumers (useAuthContext)
- `use*` — Utilities (useSounds, useBackgroundMusic, useSpeechRecognition)

### Testing & Debugging

**Dev Server Issues**:
- Ensure backend running: `BACKEND_URL=http://localhost:3001`
- Check browser DevTools → Network for proxy calls to `/api/*`
- Check backend logs for 4xx/5xx errors

**Debugging**:
- **localStorage**: DevTools → Application → Local Storage (search `falastin_`)
- **Cookies**: DevTools → Storage → Cookies (look for `accessToken`, `refreshToken`)
- **Console**: Check for API errors, auth failures, image search warnings
- **Network**: `/api/auth/*` should return tokens, `/api/chat` should proxy to backend

**Profile Issues**:
- Profiles out of sync? Check localStorage `falastin_profiles`
- Missing profiles? Clear localStorage, log out + log back in → triggers `prefetchProfiles()`

## Critical Behaviors to Preserve

1. **Always use `backendFetch()`** — Never fetch directly from NestJS in API routes. All requests must pass through this wrapper.

2. **Token handling in cookies** — accessToken/refreshToken stored as httpOnly (not readable by JS). Always extract via `getAccessToken()`.

3. **Profile context in headers** — Always pass `X-Profile-Id` header when game/settings calls need profile context.

4. **Multi-profile state keys** — State that's per-profile should use `_${profileId}` suffix in localStorage key.

5. **RTL-first layout** — Root `<html dir="rtl">`. Components must work in both RTL (Arabic) and LTR (English).

6. **Image search fallback** — Multi-source search should never throw; always has fallback to next source.

7. **Auth token refresh** — accessToken expires (~1h). Client should refresh before expiry via `useAuth().refresh()`.

## Important Notes

- **No secrets in code** — `.env.local` is gitignored. Backend URL and API keys are env vars only.
- **Mobile-first** — Design for tablets/phones (375×812 viewport). Test touch interactions.
- **Bilingual** — All user-facing text in both Arabic and English. Test both directions.
- **Performance** — Image search and hint generation can be slow. Pre-fetch in parallel (3s timeout).
- **SEO** — Root layout includes JSON-LD structured data, meta tags, open graph. Update `NEXT_PUBLIC_SITE_URL` for canonical links.

## Language Preferences

- **Planning Output**: All planning outputs and responses should be in Arabic