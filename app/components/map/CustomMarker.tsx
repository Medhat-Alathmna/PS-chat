import { City } from "@/lib/data/cities";
import type { MarkerStyle } from "@/lib/types/map-settings";

export type MarkerState = "normal" | "highlighted" | "fogged" | "regionHint" | "revealed";

/**
 * Creates a custom map marker icon for a city.
 * Supports multiple visual styles: pin (default teardrop), emoji, dot, flag.
 * Game states (fogged, regionHint) always override the style to show "?".
 */
export function createCustomMarkerHTML(
  city: City,
  state: MarkerState = "normal",
  style: MarkerStyle = "pin",
  showLabel: boolean = true
): string {
  const { nameAr, color, emoji } = city;

  // Fogged state (for game mode) — always show "?" regardless of style
  if (state === "fogged") {
    return `
      <div class="custom-marker marker-fogged" style="width:26px;height:26px;">
        <div style="
          width:100%;
          height:100%;
          border-radius:50%;
          background:#D1D5DB;
          opacity:0.6;
          display:flex;
          align-items:center;
          justify-content:center;
          border:2px solid rgba(156,163,175,0.5);
          font-size:13px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">\u2753</div>
      </div>
    `;
  }

  // Region hint state (pulsing for game hints) — always show "?"
  if (state === "regionHint") {
    return `
      <div class="custom-marker marker-region-hint" style="width:32px;height:32px;">
        <div style="
          width:100%;
          height:100%;
          border-radius:50%;
          background:${color}80;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 0 0 4px ${color}40, 0 0 16px ${color}60;
          font-size:16px;
          animation: markerPulse 2s infinite;
        ">\u2753</div>
      </div>
    `;
  }

  const isHighlighted = state === "highlighted";
  const isRevealed = state === "revealed";

  const labelHTML = showLabel
    ? `<div style="
        margin-top: 2px;
        background: rgba(255,255,255,0.95);
        padding: 2px 6px;
        border-radius: 10px;
        font-size: ${isHighlighted ? 11 : 10}px;
        font-weight: 700;
        color: #374151;
        white-space: nowrap;
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        border: 1px solid rgba(0,0,0,0.1);
      ">${nameAr}</div>`
    : "";

  const stateClass = `${isHighlighted ? "marker-highlighted" : ""} ${isRevealed ? "marker-revealed" : ""}`;

  // --- Style: emoji ---
  if (style === "emoji") {
    const size = isHighlighted ? 38 : 32;
    return `
      <div class="custom-marker ${stateClass}"
           style="display:flex;flex-direction:column;align-items:center;transition:all 0.2s ease;">
        <div style="
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background:white;
          border:3px solid ${color};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:${isHighlighted ? 20 : 17}px;
          box-shadow: 0 3px 8px rgba(0,0,0,0.2);
        ">${emoji || nameAr.charAt(0)}</div>
        ${labelHTML}
      </div>
    `;
  }

  // --- Style: dot ---
  if (style === "dot") {
    const size = isHighlighted ? 24 : 20;
    return `
      <div class="custom-marker ${stateClass}"
           style="display:flex;flex-direction:column;align-items:center;transition:all 0.2s ease;">
        <div style="
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background:${color};
          border:2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        "></div>
        ${labelHTML}
      </div>
    `;
  }

  // --- Style: flag ---
  if (style === "flag") {
    const w = isHighlighted ? 28 : 24;
    const h = isHighlighted ? 21 : 18;
    const stripeH = h / 4;
    return `
      <div class="custom-marker ${stateClass}"
           style="display:flex;flex-direction:column;align-items:center;transition:all 0.2s ease;">
        <div style="
          width:${w}px;
          height:${h}px;
          border-radius:3px;
          overflow:hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          border:1px solid rgba(255,255,255,0.8);
          display:flex;
          flex-direction:column;
        ">
          <div style="height:${stripeH}px;background:#000"></div>
          <div style="height:${stripeH}px;background:#fff"></div>
          <div style="height:${stripeH}px;background:#009639"></div>
          <div style="height:${stripeH}px;background:#EE2A35"></div>
        </div>
        ${labelHTML}
      </div>
    `;
  }

  // --- Style: pin (default) ---
  const pinSize = isHighlighted ? 38 : 32;
  return `
    <div class="custom-marker ${stateClass}"
         style="
           width:${pinSize}px;
           height:${pinSize + 10}px;
           position:relative;
           display:flex;
           flex-direction:column;
           align-items:center;
           transition: all 0.2s ease;
         ">
      <svg width="${pinSize}" height="${pinSize}" viewBox="0 0 24 36" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.2));">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"
              fill="${color}"
              stroke="#fff"
              stroke-width="1.5"
              opacity="${isHighlighted ? 1 : 0.95}" />
        <circle cx="12" cy="12" r="6" fill="white" opacity="0.9" />
        <text x="12" y="16"
              font-size="8"
              font-weight="bold"
              text-anchor="middle"
              fill="${color}"
              font-family="Arial, sans-serif">
          ${nameAr.charAt(0)}
        </text>
      </svg>
      ${labelHTML}
    </div>
  `;
}

/**
 * Get marker size based on state and style
 */
export function getMarkerSize(state: MarkerState, style: MarkerStyle = "pin"): [number, number] {
  if (state === "fogged") return [26, 26];
  if (state === "regionHint") return [32, 32];

  const highlighted = state === "highlighted";

  switch (style) {
    case "emoji":
      return highlighted ? [38, 52] : [32, 46];
    case "dot":
      return highlighted ? [24, 38] : [20, 34];
    case "flag":
      return highlighted ? [28, 42] : [24, 38];
    case "pin":
    default:
      return highlighted ? [38, 48] : [32, 42];
  }
}

/**
 * Get marker anchor point (where the pin points to on the map)
 */
export function getMarkerAnchor(state: MarkerState, style: MarkerStyle = "pin"): [number, number] {
  if (state === "fogged") return [13, 13];
  if (state === "regionHint") return [16, 16];

  const highlighted = state === "highlighted";

  switch (style) {
    case "emoji":
      return highlighted ? [19, 19] : [16, 16];
    case "dot":
      return highlighted ? [12, 12] : [10, 10];
    case "flag":
      return highlighted ? [14, 10] : [12, 9];
    case "pin":
    default:
      return highlighted ? [19, 38] : [16, 32];
  }
}

/**
 * Get popup anchor (where popup appears relative to marker)
 */
export function getPopupAnchor(state: MarkerState, style: MarkerStyle = "pin"): [number, number] {
  if (state === "fogged" || state === "regionHint") return [0, -16];

  switch (style) {
    case "emoji":
      return [0, -20];
    case "dot":
      return [0, -14];
    case "flag":
      return [0, -14];
    case "pin":
    default:
      return [0, -36];
  }
}
