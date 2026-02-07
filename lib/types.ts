// ============================================
// CHAT TYPES
// ============================================

export type Role = "system" | "user" | "assistant";

export type ToolCallInfo = {
  toolName: string;
  toolCallId: string;
  input: Record<string, unknown>;
  output?: unknown;
  state: "pending" | "running" | "completed" | "error";
};

export type WebSearchResultItem = {
  title: string;
  snippet: string;
  url: string;
  source: string;
};

export type DebugInfo = {
  messageId: string;
  toolCalls: ToolCallInfo[];
  processingTime?: number;
};

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  images?: ImageResult[];
  location?: LocationInfo;
  mapData?: MapData;
  webSearchResults?: WebSearchResultItem[];
  video?: VideoResult;
  news?: NewsItem[];
  timeline?: TimelineEvent[];
  debug?: DebugInfo;
};

export type ChatRequest = {
  messages: ChatMessage[];
  userMessage: string;
  config: {
    mode: "promptId" | "localPrompt";
    promptId?: string;
    systemPrompt?: string;
  };
};

// ============================================
// IMAGE TYPES
// ============================================

export type ImageSource = "pexels" | "unsplash" | "wikimedia" | "openverse";

export type ImageResult = {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  source: ImageSource;
  attribution?: string;
  license?: string;
  licenseUrl?: string;
  creator?: string;
  detailUrl?: string;
};

// ============================================
// LOCATION & MAP TYPES
// ============================================

export type Coordinates = {
  lat: number;
  lng: number;
};

export type LocationInfo = {
  name: string;
  coordinates: Coordinates;
  population?: number;
  area?: string;
  significance?: string;
  historicalInfo?: string;
};

export type MapData = {
  coordinates: Coordinates;
  zoom: number;
  markers?: MapMarker[];
};

export type MapMarker = {
  position: Coordinates;
  title: string;
  description?: string;
};

// ============================================
// VIDEO TYPES
// ============================================

export type VideoResult = {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  embedUrl: string;
  channelName?: string;
  duration?: string;
  viewCount?: string;
  publishedAt?: string;
};

// ============================================
// NEWS TYPES
// ============================================

export type NewsItem = {
  id: string;
  title: string;
  description?: string;
  url: string;
  source: string;
  imageUrl?: string;
  publishedAt: string;
  category?: string;
};

// ============================================
// TIMELINE TYPES
// ============================================

export type TimelineEvent = {
  id: string;
  year: number;
  title: string;
  description: string;
  category?: "political" | "cultural" | "military" | "social" | "other";
  imageUrl?: string;
  location?: string;
};

// ============================================
// TOOL & API RESPONSE TYPES
// ============================================

export type ToolResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  fallbackUsed?: boolean;
};

export type APIErrorResponse = {
  error: string;
  status: number;
  fallbackUsed?: boolean;
};

// ============================================
// OPENVERSE API TYPES (legacy - للتوافق)
// ============================================

export type OpenverseImage = {
  id?: string;
  title?: string;
  url?: string;
  thumbnail?: string;
  provider?: string;
  source?: string;
  foreign_landing_url?: string;
  attribution?: string;
  license?: string;
  license_url?: string;
  creator?: string;
  detail_url?: string;
};

export type OpenverseResponse = {
  results?: OpenverseImage[];
};

// ============================================
// KIDS APP TYPES
// ============================================

export type StickerCategory = "cities" | "food" | "heritage";

export type Sticker = {
  id: string;
  name: string;
  nameAr: string;
  emoji: string;
  category: StickerCategory;
  description?: string;
  descriptionAr?: string;
};

export type UnlockedSticker = {
  stickerId: string;
  unlockedAt: number;
};

export type RewardLevel = {
  id: string;
  name: string;
  nameAr: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
  color: string;
};

export type RewardState = {
  points: number;
  level: RewardLevel;
  messagesCount: number;
  unlockedStickers: UnlockedSticker[];
  lastRewardAt: number | null;
};

export type MascotState = "idle" | "thinking" | "happy" | "waving" | "celebrating";

export type SoundType = "pop" | "ding" | "coin" | "success" | "fanfare" | "click";
