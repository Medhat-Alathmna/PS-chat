export interface City {
  id: string;
  name: string;
  nameAr: string;
  emoji: string;
  /** SVG percentage position (legacy, used by CartoonPalestineMap) */
  x: number;
  y: number;
  /** Real geographic coordinates */
  lat: number;
  lng: number;
  color: string;
  fact: string;
}

export const CITIES: City[] = [
  {
    id: "jerusalem",
    name: "Jerusalem",
    nameAr: "القدس",
    emoji: "🕌",
    x: 48,
    y: 52,
    lat: 31.7683,
    lng: 35.2137,
    color: "#FFD700",
    fact: "أولى القبلتين وثالث الحرمين",
  },
  {
    id: "gaza",
    name: "Gaza",
    nameAr: "غزة",
    emoji: "🌊",
    x: 22,
    y: 72,
    lat: 31.5017,
    lng: 34.4668,
    color: "#54A0FF",
    fact: "مدينة على شاطئ البحر",
  },
  {
    id: "nablus",
    name: "Nablus",
    nameAr: "نابلس",
    emoji: "🏔️",
    x: 52,
    y: 32,
    lat: 32.2211,
    lng: 35.2544,
    color: "#4ECDC4",
    fact: "مشهورة بالكنافة اللذيذة!",
  },
  {
    id: "bethlehem",
    name: "Bethlehem",
    nameAr: "بيت لحم",
    emoji: "⭐",
    x: 50,
    y: 58,
    lat: 31.7054,
    lng: 35.2024,
    color: "#FF9FF3",
    fact: "مدينة السلام",
  },
  {
    id: "hebron",
    name: "Hebron",
    nameAr: "الخليل",
    emoji: "🏺",
    x: 52,
    y: 68,
    lat: 31.5326,
    lng: 35.0998,
    color: "#FF9F43",
    fact: "مشهورة بالزجاج والخزف",
  },
  {
    id: "ramallah",
    name: "Ramallah",
    nameAr: "رام الله",
    emoji: "🏛️",
    x: 48,
    y: 42,
    lat: 31.9038,
    lng: 35.2034,
    color: "#A55EEA",
    fact: "مدينة الثقافة والفن",
  },
  {
    id: "jaffa",
    name: "Jaffa",
    nameAr: "يافا",
    emoji: "🍊",
    x: 32,
    y: 38,
    lat: 32.0533,
    lng: 34.7553,
    color: "#FF6B6B",
    fact: "عروس البحر - مشهورة بالبرتقال",
  },
  {
    id: "acre",
    name: "Acre",
    nameAr: "عكا",
    emoji: "⚓",
    x: 38,
    y: 12,
    lat: 32.9226,
    lng: 35.0694,
    color: "#4ECDC4",
    fact: "مدينة الميناء التاريخية",
  },
];

/** Map city names (Arabic + English) to city IDs for text detection */
const CITY_NAME_MAP: Record<string, string> = {};
for (const city of CITIES) {
  CITY_NAME_MAP[city.nameAr] = city.id;
  CITY_NAME_MAP[city.name.toLowerCase()] = city.id;
}
// Additional Arabic variants
CITY_NAME_MAP["القدس الشريف"] = "jerusalem";
CITY_NAME_MAP["عكة"] = "acre";
CITY_NAME_MAP["الخليل"] = "hebron";
CITY_NAME_MAP["رام الله"] = "ramallah";
CITY_NAME_MAP["بيت لحم"] = "bethlehem";

/** Scan text for a city name and return its ID */
export function detectCityInText(text: string): string | null {
  for (const [name, id] of Object.entries(CITY_NAME_MAP)) {
    if (text.includes(name)) return id;
  }
  return null;
}
