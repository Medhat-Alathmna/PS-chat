/**
 * Globe Settings Types
 * Customization options for the 3D world globe in /kids/world-explorer
 */

export type GlobeAppearance = "realistic" | "night" | "political" | "cartoon";
export type SpaceBackground = "stars-dense" | "stars-light" | "black";

export interface GlobeSettings {
  /** Visual style of the globe surface */
  appearance: GlobeAppearance;
  /** Auto-rotate the globe slowly */
  autoRotate: boolean;
  /** Rotation speed multiplier (0.1–2.0) */
  rotationSpeed: number;
  /** Show country name labels on the globe */
  showCountryLabels: boolean;
  /** Space/background style */
  spaceBackground: SpaceBackground;
}

export const DEFAULT_GLOBE_SETTINGS: GlobeSettings = {
  appearance: "political",
  autoRotate: true,
  rotationSpeed: 0.3,
  showCountryLabels: false,
  spaceBackground: "stars-dense",
};
