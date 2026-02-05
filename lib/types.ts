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

export type ImageSource = "openverse" | "unsplash" | "pexels" | "wikimedia";

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
