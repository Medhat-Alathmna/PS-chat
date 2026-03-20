/**
 * Collects all localStorage data and transforms it into the backend sync DTO.
 * Pure utility — no React dependencies. Safe to call from anywhere.
 */

import type { KidsProfile, ProfilesState } from "@/lib/types/games";
import type { TextSettings } from "@/lib/types/text-settings";
import type { MapSettings } from "@/lib/types/map-settings";
import type { ChatSettings } from "@/lib/types/chat-settings";
import type { GlobeSettings } from "@/lib/types/globe-settings";
import type { SavedStory } from "@/lib/types/stories";

// ── Sync DTO types (match NestJS SyncImportDto) ──

export interface SyncProfileDTO {
  id: string;
  name: string;
  age: number;
  avatar: string;
  color: string;
  createdAt: number;
}

export interface SyncRewardsDTO {
  points: number;
  messagesCount: number;
  lastRewardAt: number | null;
}

export interface SyncSettingsDTO {
  text?: TextSettings;
  map?: MapSettings;
  chat?: ChatSettings;
  globe?: GlobeSettings;
}

export interface SyncStoryDTO {
  id: string;
  genre: string;
  companion: string;
  length: string;
  mode: string;
  titleAr?: string;
  pages: SavedStory["pages"];
  choicePoints: SavedStory["choicePoints"];
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface SyncProfilePayload {
  profile: SyncProfileDTO;
  settings: SyncSettingsDTO;
  rewards: SyncRewardsDTO;
  unlockedStickers: string[];
  discoveredCityIds: string[];
  stories: SyncStoryDTO[];
  recentTopics: string[];
}

export interface SyncImportPayload {
  profiles: SyncProfilePayload[];
}

// ── Backend limits ──

const MAX_PROFILES = 10;
const MAX_STICKERS = 200;
const MAX_CITIES = 500;
const MAX_TOPICS = 5;

// ── Helpers ──

function safeParseJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function collectProfileData(profile: KidsProfile): SyncProfilePayload {
  const id = profile.id;

  // Rewards — split into rewards DTO + sticker IDs
  const rewardState = safeParseJSON<{
    points?: number;
    messagesCount?: number;
    lastRewardAt?: number | null;
    unlockedStickers?: { stickerId: string }[];
  }>(`falastin_kids_rewards_${id}`, {});

  const rewards: SyncRewardsDTO = {
    points: rewardState.points ?? 0,
    messagesCount: rewardState.messagesCount ?? 0,
    lastRewardAt: rewardState.lastRewardAt ?? null,
  };

  const unlockedStickers = (rewardState.unlockedStickers ?? [])
    .map((s) => s.stickerId)
    .filter(Boolean)
    .slice(0, MAX_STICKERS);

  // Chat context — extract recentTopics only
  const chatContext = safeParseJSON<{ recentTopics?: string[] }>(
    `falastin_kids_chat_context_${id}`,
    {}
  );
  const recentTopics = (chatContext.recentTopics ?? []).slice(0, MAX_TOPICS);

  // Discovered cities
  const discoveredCityIds = safeParseJSON<string[]>(
    `falastin_discovered_cities_${id}`,
    []
  ).slice(0, MAX_CITIES);

  // Stories — now managed via direct CRUD (useStories hook), no longer synced
  const stories: SyncStoryDTO[] = [];

  // Settings
  const settings: SyncSettingsDTO = {
    text: safeParseJSON<TextSettings | undefined>(
      `falastin_kids_text_settings_${id}`,
      undefined
    ),
    map: safeParseJSON<MapSettings | undefined>(
      `falastin_kids_map_settings_${id}`,
      undefined
    ),
    chat: safeParseJSON<ChatSettings | undefined>(
      `falastin_kids_chat_settings_${id}`,
      undefined
    ),
    globe: safeParseJSON<GlobeSettings | undefined>(
      `falastin_kids_globe_settings_${id}`,
      undefined
    ),
  };

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      age: profile.age,
      avatar: profile.avatar,
      color: profile.color,
      createdAt: profile.createdAt,
    },
    settings,
    rewards,
    unlockedStickers,
    discoveredCityIds,
    stories,
    recentTopics,
  };
}

// ── Main export ──

export function collectSyncPayload(): SyncImportPayload {
  if (typeof window === "undefined") return { profiles: [] };

  const profilesState = safeParseJSON<ProfilesState>(
    "falastin_profiles",
    { profiles: [], activeProfileId: null }
  );

  const profiles = (profilesState.profiles ?? [])
    .slice(0, MAX_PROFILES)
    .map(collectProfileData);

  return { profiles };
}
