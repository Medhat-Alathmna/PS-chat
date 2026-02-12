import { City } from "@/lib/data/cities";

export type MarkerState = "normal" | "highlighted" | "fogged" | "regionHint" | "revealed";

/**
 * Creates a custom modern map pin/marker icon for a city
 * Uses a teardrop/pin shape with the city color
 */
export function createCustomMarkerHTML(
  city: City,
  state: MarkerState = "normal"
): string {
  const { nameAr, color } = city;

  // Fogged state (for game mode)
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
        ">❓</div>
      </div>
    `;
  }

  // Region hint state (pulsing for game hints)
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
        ">❓</div>
      </div>
    `;
  }

  const isHighlighted = state === "highlighted";
  const isRevealed = state === "revealed";
  const pinSize = isHighlighted ? 38 : 32;
  const fontSize = isHighlighted ? 11 : 10;

  // Modern pin/marker design
  return `
    <div class="custom-marker ${isHighlighted ? "marker-highlighted" : ""} ${isRevealed ? "marker-revealed" : ""}"
         style="
           width:${pinSize}px;
           height:${pinSize + 10}px;
           position:relative;
           display:flex;
           flex-direction:column;
           align-items:center;
           transition: all 0.2s ease;
         ">
      <!-- Pin/Marker SVG -->
      <svg width="${pinSize}" height="${pinSize}" viewBox="0 0 24 36" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.2));">
        <!-- Main pin shape (teardrop) -->
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"
              fill="${color}"
              stroke="#fff"
              stroke-width="1.5"
              opacity="${isHighlighted ? 1 : 0.95}" />

        <!-- Inner circle -->
        <circle cx="12" cy="12" r="6" fill="white" opacity="0.9" />

        <!-- City initial or icon -->
        <text x="12" y="16"
              font-size="8"
              font-weight="bold"
              text-anchor="middle"
              fill="${color}"
              font-family="Arial, sans-serif">
          ${nameAr.charAt(0)}
        </text>
      </svg>

      <!-- City name label -->
      <div style="
        margin-top: 2px;
        background: rgba(255,255,255,0.95);
        padding: 2px 6px;
        border-radius: 10px;
        font-size: ${fontSize}px;
        font-weight: 700;
        color: #374151;
        white-space: nowrap;
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        border: 1px solid rgba(0,0,0,0.1);
      ">${nameAr}</div>
    </div>
  `;
}

/**
 * Get marker size based on state
 */
export function getMarkerSize(state: MarkerState): [number, number] {
  if (state === "fogged") return [26, 26];
  if (state === "regionHint") return [32, 32];
  if (state === "highlighted") return [38, 48]; // width, height (including label)
  return [32, 42]; // normal size
}

/**
 * Get marker anchor point (where the pin points to on the map)
 */
export function getMarkerAnchor(state: MarkerState): [number, number] {
  if (state === "fogged") return [13, 13];
  if (state === "regionHint") return [16, 16];
  if (state === "highlighted") return [19, 38]; // bottom center of pin
  return [16, 32]; // normal anchor
}

/**
 * Get popup anchor (where popup appears relative to marker)
 */
export function getPopupAnchor(state: MarkerState): [number, number] {
  if (state === "fogged" || state === "regionHint") return [0, -16];
  return [0, -36]; // above the pin
}
