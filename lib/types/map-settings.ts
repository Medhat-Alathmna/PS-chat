// ============================================
// MAP SETTINGS TYPES
// ============================================

export type InfoDisplayMode = "popup" | "side-panel" | "flip-card" | "floating-bubble";

export type MarkerStyle = "pin" | "emoji" | "dot" | "flag";

export type MapTheme = "light" | "dark" | "satellite" | "watercolor";

export type AnimationLevel = "full" | "reduced" | "none";

export type MapSettings = {
  infoDisplayMode: InfoDisplayMode;
  markerStyle: MarkerStyle;
  mapTheme: MapTheme;
  showCityLabels: boolean;
  showRegionBorders: boolean;
  animationLevel: AnimationLevel;
};
