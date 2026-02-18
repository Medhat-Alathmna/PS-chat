// ============================================
// TEXT SETTINGS TYPES
// ============================================

export type FontFamily = "noto-sans-arabic" | "cairo" | "tajawal" | "changa";

export type TextSize = "small" | "medium" | "large";

export type TextSettings = {
  fontFamily: FontFamily;
  textSize: TextSize;
};
