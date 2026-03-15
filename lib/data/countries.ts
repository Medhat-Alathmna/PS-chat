/**
 * World Countries Data
 * 195 countries + Palestine with Arabic names, capitals, and coordinates.
 * GeoJSON borders sourced from lib/data/countries geo json/countries.geo.json
 */

export type Continent =
  | "africa"
  | "asia"
  | "europe"
  | "americas"
  | "oceania";

export interface Country {
  /** ISO 3166-1 alpha-3 — matches GeoJSON feature.properties.code */
  id: string;
  /** ISO 3166-1 alpha-2 — used to derive flag emoji */
  code: string;
  nameAr: string;
  nameEn: string;
  capitalAr: string;
  lat: number;
  lng: number;
  /** Precise latitude of the capital city */
  capitalLat: number;
  /** Precise longitude of the capital city */
  capitalLng: number;
  continent: Continent;
}

/** Convert ISO alpha-2 code to a flag emoji */
export function countryCodeToFlag(alpha2: string): string {
  return alpha2
    .toUpperCase()
    .replace(/./g, (c) =>
      String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)
    );
}

export const COUNTRIES: Country[] = [
  // ── Africa ──────────────────────────────────────────────────────────
  { id: "DZA", code: "DZ", nameAr: "الجزائر",              nameEn: "Algeria",                  capitalAr: "الجزائر العاصمة", lat: 28.0,  lng: 3.0,    capitalLat: 36.74,  capitalLng:  3.06,  continent: "africa" },
  { id: "AGO", code: "AO", nameAr: "أنغولا",               nameEn: "Angola",                   capitalAr: "لواندا",          lat: -11.2, lng: 17.9,   capitalLat: -8.84,  capitalLng: 13.23,  continent: "africa" },
  { id: "BEN", code: "BJ", nameAr: "بنين",                 nameEn: "Benin",                    capitalAr: "بورتو نوفو",      lat: 9.3,   lng: 2.3,    capitalLat:  6.37,  capitalLng:  2.42,  continent: "africa" },
  { id: "BWA", code: "BW", nameAr: "بوتسوانا",             nameEn: "Botswana",                 capitalAr: "غابورون",         lat: -22.3, lng: 24.7,   capitalLat: -24.66, capitalLng: 25.91,  continent: "africa" },
  { id: "BFA", code: "BF", nameAr: "بوركينا فاسو",         nameEn: "Burkina Faso",             capitalAr: "واغادوغو",        lat: 12.4,  lng: -1.6,   capitalLat: 12.37,  capitalLng: -1.52,  continent: "africa" },
  { id: "BDI", code: "BI", nameAr: "بوروندي",              nameEn: "Burundi",                  capitalAr: "غيتيغا",          lat: -3.4,  lng: 29.9,   capitalLat: -3.43,  capitalLng: 29.93,  continent: "africa" },
  { id: "CPV", code: "CV", nameAr: "الرأس الأخضر",         nameEn: "Cape Verde",               capitalAr: "براييا",          lat: 15.1,  lng: -23.6,  capitalLat: 14.93,  capitalLng: -23.51, continent: "africa" },
  { id: "CMR", code: "CM", nameAr: "الكاميرون",            nameEn: "Cameroon",                 capitalAr: "ياوندي",          lat: 3.9,   lng: 11.5,   capitalLat:  3.87,  capitalLng: 11.52,  continent: "africa" },
  { id: "CAF", code: "CF", nameAr: "أفريقيا الوسطى",      nameEn: "Central African Republic", capitalAr: "بانغي",           lat: 6.6,   lng: 20.9,   capitalLat:  4.36,  capitalLng: 18.56,  continent: "africa" },
  { id: "TCD", code: "TD", nameAr: "تشاد",                 nameEn: "Chad",                     capitalAr: "إنجامينا",        lat: 15.5,  lng: 18.7,   capitalLat: 12.11,  capitalLng: 15.04,  continent: "africa" },
  { id: "COM", code: "KM", nameAr: "جزر القمر",            nameEn: "Comoros",                  capitalAr: "موروني",          lat: -11.7, lng: 43.3,   capitalLat: -11.70, capitalLng: 43.25,  continent: "africa" },
  { id: "COD", code: "CD", nameAr: "الكونغو الديمقراطية", nameEn: "DR Congo",                 capitalAr: "كينشاسا",         lat: -4.0,  lng: 21.8,   capitalLat: -4.32,  capitalLng: 15.32,  continent: "africa" },
  { id: "COG", code: "CG", nameAr: "الكونغو",              nameEn: "Congo",                    capitalAr: "برازافيل",        lat: -0.7,  lng: 15.0,   capitalLat: -4.27,  capitalLng: 15.27,  continent: "africa" },
  { id: "CIV", code: "CI", nameAr: "ساحل العاج",           nameEn: "Ivory Coast",              capitalAr: "يامسوكرو",        lat: 7.5,   lng: -5.6,   capitalLat:  6.82,  capitalLng: -5.28,  continent: "africa" },
  { id: "DJI", code: "DJ", nameAr: "جيبوتي",               nameEn: "Djibouti",                 capitalAr: "جيبوتي",          lat: 11.8,  lng: 42.6,   capitalLat: 11.59,  capitalLng: 43.15,  continent: "africa" },
  { id: "EGY", code: "EG", nameAr: "مصر",                  nameEn: "Egypt",                    capitalAr: "القاهرة",         lat: 26.8,  lng: 30.8,   capitalLat: 30.06,  capitalLng: 31.25,  continent: "africa" },
  { id: "GNQ", code: "GQ", nameAr: "غينيا الاستوائية",    nameEn: "Equatorial Guinea",        capitalAr: "مالابو",          lat: 3.8,   lng: 8.7,    capitalLat:  3.75,  capitalLng:  8.78,  continent: "africa" },
  { id: "ERI", code: "ER", nameAr: "إريتريا",              nameEn: "Eritrea",                  capitalAr: "أسمرة",           lat: 15.2,  lng: 39.8,   capitalLat: 15.34,  capitalLng: 38.93,  continent: "africa" },
  { id: "SWZ", code: "SZ", nameAr: "إيسواتيني",            nameEn: "Eswatini",                 capitalAr: "مباباني",         lat: -26.5, lng: 31.5,   capitalLat: -26.32, capitalLng: 31.14,  continent: "africa" },
  { id: "ETH", code: "ET", nameAr: "إثيوبيا",              nameEn: "Ethiopia",                 capitalAr: "أديس أبابا",      lat: 9.1,   lng: 40.5,   capitalLat:  9.03,  capitalLng: 38.74,  continent: "africa" },
  { id: "GAB", code: "GA", nameAr: "الغابون",              nameEn: "Gabon",                    capitalAr: "ليبرفيل",         lat: -0.8,  lng: 11.6,   capitalLat:  0.39,  capitalLng:  9.45,  continent: "africa" },
  { id: "GMB", code: "GM", nameAr: "غامبيا",               nameEn: "Gambia",                   capitalAr: "بانجول",          lat: 13.5,  lng: -16.6,  capitalLat: 13.45,  capitalLng: -16.58, continent: "africa" },
  { id: "GHA", code: "GH", nameAr: "غانا",                 nameEn: "Ghana",                    capitalAr: "أكرا",            lat: 7.9,   lng: -1.0,   capitalLat:  5.56,  capitalLng: -0.20,  continent: "africa" },
  { id: "GIN", code: "GN", nameAr: "غينيا",                nameEn: "Guinea",                   capitalAr: "كوناكري",         lat: 11.0,  lng: -10.9,  capitalLat:  9.54,  capitalLng: -13.68, continent: "africa" },
  { id: "GNB", code: "GW", nameAr: "غينيا بيساو",          nameEn: "Guinea-Bissau",            capitalAr: "بيساو",           lat: 12.0,  lng: -15.2,  capitalLat: 11.86,  capitalLng: -15.60, continent: "africa" },
  { id: "KEN", code: "KE", nameAr: "كينيا",                nameEn: "Kenya",                    capitalAr: "نيروبي",          lat: 0.0,   lng: 37.9,   capitalLat: -1.29,  capitalLng: 36.82,  continent: "africa" },
  { id: "LSO", code: "LS", nameAr: "ليسوتو",               nameEn: "Lesotho",                  capitalAr: "ماسيرو",          lat: -29.6, lng: 28.2,   capitalLat: -29.32, capitalLng: 27.48,  continent: "africa" },
  { id: "LBR", code: "LR", nameAr: "ليبيريا",              nameEn: "Liberia",                  capitalAr: "مونروفيا",        lat: 6.4,   lng: -9.4,   capitalLat:  6.30,  capitalLng: -10.80, continent: "africa" },
  { id: "LBY", code: "LY", nameAr: "ليبيا",                nameEn: "Libya",                    capitalAr: "طرابلس",          lat: 26.3,  lng: 17.2,   capitalLat: 32.90,  capitalLng: 13.18,  continent: "africa" },
  { id: "MDG", code: "MG", nameAr: "مدغشقر",               nameEn: "Madagascar",               capitalAr: "أنتاناناريفو",    lat: -18.8, lng: 46.9,   capitalLat: -18.91, capitalLng: 47.54,  continent: "africa" },
  { id: "MWI", code: "MW", nameAr: "ملاوي",                nameEn: "Malawi",                   capitalAr: "ليلونغوي",        lat: -13.3, lng: 34.3,   capitalLat: -13.97, capitalLng: 33.79,  continent: "africa" },
  { id: "MLI", code: "ML", nameAr: "مالي",                 nameEn: "Mali",                     capitalAr: "باماكو",          lat: 17.6,  lng: -4.0,   capitalLat: 12.65,  capitalLng: -8.00,  continent: "africa" },
  { id: "MRT", code: "MR", nameAr: "موريتانيا",            nameEn: "Mauritania",               capitalAr: "نواكشوط",         lat: 21.0,  lng: -10.9,  capitalLat: 18.08,  capitalLng: -15.97, continent: "africa" },
  { id: "MUS", code: "MU", nameAr: "موريشيوس",             nameEn: "Mauritius",                capitalAr: "بورت لويس",       lat: -20.3, lng: 57.6,   capitalLat: -20.16, capitalLng: 57.49,  continent: "africa" },
  { id: "MAR", code: "MA", nameAr: "المغرب",               nameEn: "Morocco",                  capitalAr: "الرباط",          lat: 31.8,  lng: -7.1,   capitalLat: 34.02,  capitalLng: -6.85,  continent: "africa" },
  { id: "MOZ", code: "MZ", nameAr: "موزمبيق",              nameEn: "Mozambique",               capitalAr: "مابوتو",          lat: -18.7, lng: 35.5,   capitalLat: -25.97, capitalLng: 32.57,  continent: "africa" },
  { id: "NAM", code: "NA", nameAr: "ناميبيا",              nameEn: "Namibia",                  capitalAr: "ويندهوك",         lat: -22.0, lng: 17.1,   capitalLat: -22.56, capitalLng: 17.08,  continent: "africa" },
  { id: "NER", code: "NE", nameAr: "النيجر",               nameEn: "Niger",                    capitalAr: "نيامي",           lat: 16.1,  lng: 8.1,    capitalLat: 13.51,  capitalLng:  2.12,  continent: "africa" },
  { id: "NGA", code: "NG", nameAr: "نيجيريا",              nameEn: "Nigeria",                  capitalAr: "أبوجا",           lat: 9.1,   lng: 8.7,    capitalLat:  9.07,  capitalLng:  7.40,  continent: "africa" },
  { id: "RWA", code: "RW", nameAr: "رواندا",               nameEn: "Rwanda",                   capitalAr: "كيغالي",          lat: -1.9,  lng: 29.9,   capitalLat: -1.94,  capitalLng: 30.06,  continent: "africa" },
  { id: "STP", code: "ST", nameAr: "ساو تومي وبرينسيبي",  nameEn: "São Tomé and Príncipe",    capitalAr: "ساو تومي",        lat: 0.2,   lng: 6.6,    capitalLat:  0.34,  capitalLng:  6.73,  continent: "africa" },
  { id: "SEN", code: "SN", nameAr: "السنغال",              nameEn: "Senegal",                  capitalAr: "داكار",           lat: 14.5,  lng: -14.5,  capitalLat: 14.72,  capitalLng: -17.47, continent: "africa" },
  { id: "SLE", code: "SL", nameAr: "سيراليون",             nameEn: "Sierra Leone",             capitalAr: "فريتاون",         lat: 8.5,   lng: -11.8,  capitalLat:  8.49,  capitalLng: -13.23, continent: "africa" },
  { id: "SOM", code: "SO", nameAr: "الصومال",              nameEn: "Somalia",                  capitalAr: "مقديشو",          lat: 5.2,   lng: 46.2,   capitalLat:  2.05,  capitalLng: 45.34,  continent: "africa" },
  { id: "ZAF", code: "ZA", nameAr: "جنوب أفريقيا",        nameEn: "South Africa",             capitalAr: "بريتوريا",        lat: -29.0, lng: 25.1,   capitalLat: -25.75, capitalLng: 28.19,  continent: "africa" },
  { id: "SSD", code: "SS", nameAr: "جنوب السودان",         nameEn: "South Sudan",              capitalAr: "جوبا",            lat: 6.9,   lng: 31.3,   capitalLat:  4.86,  capitalLng: 31.60,  continent: "africa" },
  { id: "SDN", code: "SD", nameAr: "السودان",              nameEn: "Sudan",                    capitalAr: "الخرطوم",         lat: 12.9,  lng: 30.2,   capitalLat: 15.55,  capitalLng: 32.53,  continent: "africa" },
  { id: "TZA", code: "TZ", nameAr: "تنزانيا",              nameEn: "Tanzania",                 capitalAr: "دودوما",          lat: -6.4,  lng: 34.9,   capitalLat: -6.17,  capitalLng: 35.74,  continent: "africa" },
  { id: "TGO", code: "TG", nameAr: "توغو",                 nameEn: "Togo",                     capitalAr: "لومي",            lat: 8.0,   lng: 1.2,    capitalLat:  6.14,  capitalLng:  1.22,  continent: "africa" },
  { id: "TUN", code: "TN", nameAr: "تونس",                 nameEn: "Tunisia",                  capitalAr: "تونس",            lat: 33.9,  lng: 9.5,    capitalLat: 36.82,  capitalLng: 10.17,  continent: "africa" },
  { id: "UGA", code: "UG", nameAr: "أوغندا",               nameEn: "Uganda",                   capitalAr: "كمبالا",          lat: 1.4,   lng: 32.2,   capitalLat:  0.32,  capitalLng: 32.58,  continent: "africa" },
  { id: "ZMB", code: "ZM", nameAr: "زامبيا",               nameEn: "Zambia",                   capitalAr: "لوساكا",          lat: -13.1, lng: 27.9,   capitalLat: -15.41, capitalLng: 28.28,  continent: "africa" },
  { id: "ZWE", code: "ZW", nameAr: "زيمبابوي",             nameEn: "Zimbabwe",                 capitalAr: "هراري",           lat: -20.0, lng: 30.0,   capitalLat: -17.83, capitalLng: 31.05,  continent: "africa" },

  // ── Asia ────────────────────────────────────────────────────────────
  { id: "AFG", code: "AF", nameAr: "أفغانستان",            nameEn: "Afghanistan",              capitalAr: "كابول",           lat: 33.9,  lng: 67.7,   capitalLat: 34.52,  capitalLng: 69.18,  continent: "asia" },
  { id: "ARM", code: "AM", nameAr: "أرمينيا",              nameEn: "Armenia",                  capitalAr: "يريفان",          lat: 40.1,  lng: 45.0,   capitalLat: 40.18,  capitalLng: 44.51,  continent: "asia" },
  { id: "AZE", code: "AZ", nameAr: "أذربيجان",             nameEn: "Azerbaijan",               capitalAr: "باكو",            lat: 40.1,  lng: 47.6,   capitalLat: 40.41,  capitalLng: 49.87,  continent: "asia" },
  { id: "BHR", code: "BH", nameAr: "البحرين",              nameEn: "Bahrain",                  capitalAr: "المنامة",         lat: 26.0,  lng: 50.6,   capitalLat: 26.22,  capitalLng: 50.58,  continent: "asia" },
  { id: "BGD", code: "BD", nameAr: "بنغلاديش",             nameEn: "Bangladesh",               capitalAr: "دكا",             lat: 23.7,  lng: 90.4,   capitalLat: 23.72,  capitalLng: 90.41,  continent: "asia" },
  { id: "BTN", code: "BT", nameAr: "بوتان",                nameEn: "Bhutan",                   capitalAr: "تيمفو",           lat: 27.5,  lng: 90.4,   capitalLat: 27.47,  capitalLng: 89.64,  continent: "asia" },
  { id: "BRN", code: "BN", nameAr: "بروناي",               nameEn: "Brunei",                   capitalAr: "بندر سري بيغاوان",lat: 4.5,   lng: 114.7,  capitalLat:  4.94,  capitalLng: 114.94, continent: "asia" },
  { id: "KHM", code: "KH", nameAr: "كمبوديا",              nameEn: "Cambodia",                 capitalAr: "بنوم بنه",        lat: 12.6,  lng: 104.9,  capitalLat: 11.56,  capitalLng: 104.92, continent: "asia" },
  { id: "CHN", code: "CN", nameAr: "الصين",                nameEn: "China",                    capitalAr: "بكين",            lat: 35.9,  lng: 104.2,  capitalLat: 39.91,  capitalLng: 116.39, continent: "asia" },
  { id: "CYP", code: "CY", nameAr: "قبرص",                 nameEn: "Cyprus",                   capitalAr: "نيقوسيا",         lat: 35.1,  lng: 33.4,   capitalLat: 35.17,  capitalLng: 33.37,  continent: "asia" },
  { id: "GEO", code: "GE", nameAr: "جورجيا",               nameEn: "Georgia",                  capitalAr: "تبليسي",          lat: 41.7,  lng: 44.8,   capitalLat: 41.69,  capitalLng: 44.83,  continent: "asia" },
  { id: "IND", code: "IN", nameAr: "الهند",                nameEn: "India",                    capitalAr: "نيودلهي",         lat: 20.6,  lng: 79.0,   capitalLat: 28.61,  capitalLng: 77.21,  continent: "asia" },
  { id: "IDN", code: "ID", nameAr: "إندونيسيا",            nameEn: "Indonesia",                capitalAr: "جاكرتا",          lat: -5.4,  lng: 122.0,  capitalLat: -6.21,  capitalLng: 106.85, continent: "asia" },
  { id: "IRN", code: "IR", nameAr: "إيران",                nameEn: "Iran",                     capitalAr: "طهران",           lat: 32.4,  lng: 53.7,   capitalLat: 35.69,  capitalLng: 51.42,  continent: "asia" },
  { id: "IRQ", code: "IQ", nameAr: "العراق",               nameEn: "Iraq",                     capitalAr: "بغداد",           lat: 33.2,  lng: 43.7,   capitalLat: 33.34,  capitalLng: 44.40,  continent: "asia" },
  { id: "JPN", code: "JP", nameAr: "اليابان",              nameEn: "Japan",                    capitalAr: "طوكيو",           lat: 36.2,  lng: 138.3,  capitalLat: 35.69,  capitalLng: 139.69, continent: "asia" },
  { id: "JOR", code: "JO", nameAr: "الأردن",               nameEn: "Jordan",                   capitalAr: "عمان",            lat: 31.2,  lng: 36.5,   capitalLat: 31.95,  capitalLng: 35.93,  continent: "asia" },
  { id: "KAZ", code: "KZ", nameAr: "كازاخستان",            nameEn: "Kazakhstan",               capitalAr: "أستانا",          lat: 48.2,  lng: 66.9,   capitalLat: 51.19,  capitalLng: 71.45,  continent: "asia" },
  { id: "KWT", code: "KW", nameAr: "الكويت",               nameEn: "Kuwait",                   capitalAr: "مدينة الكويت",    lat: 29.3,  lng: 47.5,   capitalLat: 29.37,  capitalLng: 47.98,  continent: "asia" },
  { id: "KGZ", code: "KG", nameAr: "قيرغيزستان",           nameEn: "Kyrgyzstan",               capitalAr: "بيشكيك",          lat: 41.2,  lng: 74.8,   capitalLat: 42.87,  capitalLng: 74.60,  continent: "asia" },
  { id: "LAO", code: "LA", nameAr: "لاوس",                 nameEn: "Laos",                     capitalAr: "فيينتيان",        lat: 18.0,  lng: 103.0,  capitalLat: 17.97,  capitalLng: 102.61, continent: "asia" },
  { id: "LBN", code: "LB", nameAr: "لبنان",                nameEn: "Lebanon",                  capitalAr: "بيروت",           lat: 33.9,  lng: 35.9,   capitalLat: 33.89,  capitalLng: 35.50,  continent: "asia" },
  { id: "MYS", code: "MY", nameAr: "ماليزيا",              nameEn: "Malaysia",                 capitalAr: "كوالالمبور",      lat: 3.1,   lng: 113.9,  capitalLat:  3.14,  capitalLng: 101.69, continent: "asia" },
  { id: "MDV", code: "MV", nameAr: "جزر المالديف",         nameEn: "Maldives",                 capitalAr: "مالي",            lat: 3.2,   lng: 73.2,   capitalLat:  4.17,  capitalLng: 73.51,  continent: "asia" },
  { id: "MNG", code: "MN", nameAr: "منغوليا",              nameEn: "Mongolia",                 capitalAr: "أولان باتور",     lat: 46.9,  lng: 103.8,  capitalLat: 47.91,  capitalLng: 106.89, continent: "asia" },
  { id: "MMR", code: "MM", nameAr: "ميانمار",              nameEn: "Myanmar",                  capitalAr: "نيبيداو",         lat: 19.2,  lng: 96.0,   capitalLat: 19.76,  capitalLng: 96.07,  continent: "asia" },
  { id: "NPL", code: "NP", nameAr: "نيبال",                nameEn: "Nepal",                    capitalAr: "كاتماندو",        lat: 28.4,  lng: 84.1,   capitalLat: 27.71,  capitalLng: 85.31,  continent: "asia" },
  { id: "PRK", code: "KP", nameAr: "كوريا الشمالية",      nameEn: "North Korea",              capitalAr: "بيونغ يانغ",      lat: 40.3,  lng: 127.5,  capitalLat: 39.02,  capitalLng: 125.75, continent: "asia" },
  { id: "OMN", code: "OM", nameAr: "عُمان",                nameEn: "Oman",                     capitalAr: "مسقط",            lat: 21.5,  lng: 55.9,   capitalLat: 23.61,  capitalLng: 58.59,  continent: "asia" },
  { id: "PAK", code: "PK", nameAr: "باكستان",              nameEn: "Pakistan",                 capitalAr: "إسلام آباد",      lat: 30.4,  lng: 69.3,   capitalLat: 33.72,  capitalLng: 73.06,  continent: "asia" },
  /** Palestine — shown with 1948 historical borders */
  { id: "PSE", code: "PS", nameAr: "فلسطين",               nameEn: "Palestine",                capitalAr: "القدس",           lat: 31.9,  lng: 35.2,   capitalLat: 31.78,  capitalLng: 35.22,  continent: "asia" },
  { id: "PHL", code: "PH", nameAr: "الفلبين",              nameEn: "Philippines",              capitalAr: "مانيلا",          lat: 13.0,  lng: 122.0,  capitalLat: 14.60,  capitalLng: 120.98, continent: "asia" },
  { id: "QAT", code: "QA", nameAr: "قطر",                  nameEn: "Qatar",                    capitalAr: "الدوحة",          lat: 25.3,  lng: 51.2,   capitalLat: 25.29,  capitalLng: 51.53,  continent: "asia" },
  { id: "SAU", code: "SA", nameAr: "المملكة العربية السعودية", nameEn: "Saudi Arabia",         capitalAr: "الرياض",          lat: 23.9,  lng: 45.1,   capitalLat: 24.69,  capitalLng: 46.72,  continent: "asia" },
  { id: "SGP", code: "SG", nameAr: "سنغافورة",             nameEn: "Singapore",                capitalAr: "سنغافورة",        lat: 1.4,   lng: 103.8,  capitalLat:  1.36,  capitalLng: 103.82, continent: "asia" },
  { id: "KOR", code: "KR", nameAr: "كوريا الجنوبية",      nameEn: "South Korea",              capitalAr: "سيول",            lat: 36.6,  lng: 127.9,  capitalLat: 37.55,  capitalLng: 126.99, continent: "asia" },
  { id: "LKA", code: "LK", nameAr: "سريلانكا",             nameEn: "Sri Lanka",                capitalAr: "سري جايوارديناي",lat: 7.9,   lng: 80.8,   capitalLat:  6.89,  capitalLng: 79.90,  continent: "asia" },
  { id: "SYR", code: "SY", nameAr: "سوريا",                nameEn: "Syria",                    capitalAr: "دمشق",            lat: 34.8,  lng: 38.0,   capitalLat: 33.51,  capitalLng: 36.29,  continent: "asia" },
  { id: "TJK", code: "TJ", nameAr: "طاجيكستان",            nameEn: "Tajikistan",               capitalAr: "دوشنبه",          lat: 38.9,  lng: 71.3,   capitalLat: 38.56,  capitalLng: 68.77,  continent: "asia" },
  { id: "THA", code: "TH", nameAr: "تايلاند",              nameEn: "Thailand",                 capitalAr: "بانكوك",          lat: 15.9,  lng: 101.0,  capitalLat: 13.75,  capitalLng: 100.52, continent: "asia" },
  { id: "TLS", code: "TL", nameAr: "تيمور الشرقية",       nameEn: "Timor-Leste",              capitalAr: "ديلي",            lat: -8.8,  lng: 125.7,  capitalLat: -8.56,  capitalLng: 125.58, continent: "asia" },
  { id: "TUR", code: "TR", nameAr: "تركيا",                nameEn: "Turkey",                   capitalAr: "أنقرة",           lat: 38.9,  lng: 35.2,   capitalLat: 39.92,  capitalLng: 32.85,  continent: "asia" },
  { id: "TKM", code: "TM", nameAr: "تركمانستان",           nameEn: "Turkmenistan",             capitalAr: "عشق آباد",        lat: 38.9,  lng: 59.6,   capitalLat: 37.95,  capitalLng: 58.38,  continent: "asia" },
  { id: "ARE", code: "AE", nameAr: "الإمارات العربية المتحدة", nameEn: "UAE",                  capitalAr: "أبوظبي",          lat: 23.4,  lng: 53.8,   capitalLat: 24.45,  capitalLng: 54.38,  continent: "asia" },
  { id: "UZB", code: "UZ", nameAr: "أوزبكستان",            nameEn: "Uzbekistan",               capitalAr: "طشقند",           lat: 41.4,  lng: 64.6,   capitalLat: 41.30,  capitalLng: 69.27,  continent: "asia" },
  { id: "VNM", code: "VN", nameAr: "فيتنام",               nameEn: "Vietnam",                  capitalAr: "هانوي",           lat: 14.1,  lng: 108.3,  capitalLat: 21.03,  capitalLng: 105.85, continent: "asia" },
  { id: "YEM", code: "YE", nameAr: "اليمن",                nameEn: "Yemen",                    capitalAr: "صنعاء",           lat: 15.6,  lng: 47.8,   capitalLat: 15.36,  capitalLng: 44.21,  continent: "asia" },

  // ── Europe ──────────────────────────────────────────────────────────
  { id: "ALB", code: "AL", nameAr: "ألبانيا",              nameEn: "Albania",                  capitalAr: "تيرانا",          lat: 41.2,  lng: 20.2,   capitalLat: 41.33,  capitalLng: 19.82,  continent: "europe" },
  { id: "AND", code: "AD", nameAr: "أندورا",               nameEn: "Andorra",                  capitalAr: "أندورا لا فيلا", lat: 42.5,  lng: 1.5,    capitalLat: 42.51,  capitalLng:  1.52,  continent: "europe" },
  { id: "AUT", code: "AT", nameAr: "النمسا",               nameEn: "Austria",                  capitalAr: "فيينا",           lat: 47.5,  lng: 14.6,   capitalLat: 48.21,  capitalLng: 16.37,  continent: "europe" },
  { id: "BLR", code: "BY", nameAr: "بيلاروسيا",            nameEn: "Belarus",                  capitalAr: "مينسك",           lat: 53.7,  lng: 27.9,   capitalLat: 53.90,  capitalLng: 27.57,  continent: "europe" },
  { id: "BEL", code: "BE", nameAr: "بلجيكا",               nameEn: "Belgium",                  capitalAr: "بروكسل",          lat: 50.5,  lng: 4.5,    capitalLat: 50.85,  capitalLng:  4.35,  continent: "europe" },
  { id: "BIH", code: "BA", nameAr: "البوسنة والهرسك",      nameEn: "Bosnia and Herzegovina",   capitalAr: "سراييفو",         lat: 44.2,  lng: 17.7,   capitalLat: 43.85,  capitalLng: 18.40,  continent: "europe" },
  { id: "BGR", code: "BG", nameAr: "بلغاريا",              nameEn: "Bulgaria",                 capitalAr: "صوفيا",           lat: 42.7,  lng: 25.5,   capitalLat: 42.70,  capitalLng: 23.32,  continent: "europe" },
  { id: "HRV", code: "HR", nameAr: "كرواتيا",              nameEn: "Croatia",                  capitalAr: "زغرب",            lat: 45.1,  lng: 15.2,   capitalLat: 45.81,  capitalLng: 15.98,  continent: "europe" },
  { id: "CZE", code: "CZ", nameAr: "التشيك",               nameEn: "Czech Republic",           capitalAr: "براغ",            lat: 49.8,  lng: 15.5,   capitalLat: 50.09,  capitalLng: 14.42,  continent: "europe" },
  { id: "DNK", code: "DK", nameAr: "الدنمارك",             nameEn: "Denmark",                  capitalAr: "كوبنهاغن",        lat: 56.3,  lng: 10.0,   capitalLat: 55.68,  capitalLng: 12.57,  continent: "europe" },
  { id: "EST", code: "EE", nameAr: "إستونيا",              nameEn: "Estonia",                  capitalAr: "تالين",           lat: 58.6,  lng: 25.0,   capitalLat: 59.44,  capitalLng: 24.75,  continent: "europe" },
  { id: "FIN", code: "FI", nameAr: "فنلندا",               nameEn: "Finland",                  capitalAr: "هلسنكي",          lat: 61.9,  lng: 25.7,   capitalLat: 60.17,  capitalLng: 24.94,  continent: "europe" },
  { id: "FRA", code: "FR", nameAr: "فرنسا",                nameEn: "France",                   capitalAr: "باريس",           lat: 46.2,  lng: 2.2,    capitalLat: 48.86,  capitalLng:  2.35,  continent: "europe" },
  { id: "DEU", code: "DE", nameAr: "ألمانيا",              nameEn: "Germany",                  capitalAr: "برلين",           lat: 51.2,  lng: 10.5,   capitalLat: 52.52,  capitalLng: 13.41,  continent: "europe" },
  { id: "GRC", code: "GR", nameAr: "اليونان",              nameEn: "Greece",                   capitalAr: "أثينا",           lat: 39.1,  lng: 22.0,   capitalLat: 37.97,  capitalLng: 23.73,  continent: "europe" },
  { id: "HUN", code: "HU", nameAr: "المجر",                nameEn: "Hungary",                  capitalAr: "بودابست",         lat: 47.2,  lng: 19.5,   capitalLat: 47.50,  capitalLng: 19.04,  continent: "europe" },
  { id: "ISL", code: "IS", nameAr: "آيسلندا",              nameEn: "Iceland",                  capitalAr: "ريكيافيك",        lat: 64.6,  lng: -17.9,  capitalLat: 64.13,  capitalLng: -21.90, continent: "europe" },
  { id: "IRL", code: "IE", nameAr: "أيرلندا",              nameEn: "Ireland",                  capitalAr: "دبلن",            lat: 53.4,  lng: -8.2,   capitalLat: 53.33,  capitalLng: -6.25,  continent: "europe" },
  { id: "ITA", code: "IT", nameAr: "إيطاليا",              nameEn: "Italy",                    capitalAr: "روما",            lat: 41.9,  lng: 12.6,   capitalLat: 41.90,  capitalLng: 12.50,  continent: "europe" },
  { id: "LVA", code: "LV", nameAr: "لاتفيا",               nameEn: "Latvia",                   capitalAr: "ريغا",            lat: 56.9,  lng: 24.6,   capitalLat: 56.95,  capitalLng: 24.11,  continent: "europe" },
  { id: "LIE", code: "LI", nameAr: "ليختنشتاين",           nameEn: "Liechtenstein",            capitalAr: "فادوز",           lat: 47.1,  lng: 9.6,    capitalLat: 47.14,  capitalLng:  9.52,  continent: "europe" },
  { id: "LTU", code: "LT", nameAr: "ليتوانيا",             nameEn: "Lithuania",                capitalAr: "فيلنيوس",         lat: 55.2,  lng: 23.9,   capitalLat: 54.69,  capitalLng: 25.28,  continent: "europe" },
  { id: "LUX", code: "LU", nameAr: "لوكسمبورغ",            nameEn: "Luxembourg",               capitalAr: "مدينة لوكسمبورغ",lat: 49.8,  lng: 6.1,    capitalLat: 49.61,  capitalLng:  6.13,  continent: "europe" },
  { id: "MLT", code: "MT", nameAr: "مالطا",                nameEn: "Malta",                    capitalAr: "فاليتا",          lat: 35.9,  lng: 14.5,   capitalLat: 35.90,  capitalLng: 14.51,  continent: "europe" },
  { id: "MDA", code: "MD", nameAr: "مولدوفا",              nameEn: "Moldova",                  capitalAr: "كيشيناو",         lat: 47.2,  lng: 28.5,   capitalLat: 47.00,  capitalLng: 28.86,  continent: "europe" },
  { id: "MCO", code: "MC", nameAr: "موناكو",               nameEn: "Monaco",                   capitalAr: "موناكو",          lat: 43.7,  lng: 7.4,    capitalLat: 43.73,  capitalLng:  7.42,  continent: "europe" },
  { id: "MNE", code: "ME", nameAr: "الجبل الأسود",         nameEn: "Montenegro",               capitalAr: "بودغوريتسا",      lat: 42.7,  lng: 19.4,   capitalLat: 42.44,  capitalLng: 19.26,  continent: "europe" },
  { id: "NLD", code: "NL", nameAr: "هولندا",               nameEn: "Netherlands",              capitalAr: "أمستردام",        lat: 52.1,  lng: 5.3,    capitalLat: 52.37,  capitalLng:  4.90,  continent: "europe" },
  { id: "MKD", code: "MK", nameAr: "مقدونيا الشمالية",    nameEn: "North Macedonia",          capitalAr: "سكوبيه",          lat: 41.6,  lng: 21.7,   capitalLat: 42.00,  capitalLng: 21.43,  continent: "europe" },
  { id: "NOR", code: "NO", nameAr: "النرويج",              nameEn: "Norway",                   capitalAr: "أوسلو",           lat: 60.5,  lng: 8.5,    capitalLat: 59.91,  capitalLng: 10.75,  continent: "europe" },
  { id: "POL", code: "PL", nameAr: "بولندا",               nameEn: "Poland",                   capitalAr: "وارسو",           lat: 51.9,  lng: 19.1,   capitalLat: 52.23,  capitalLng: 21.01,  continent: "europe" },
  { id: "PRT", code: "PT", nameAr: "البرتغال",             nameEn: "Portugal",                 capitalAr: "لشبونة",          lat: 39.4,  lng: -8.2,   capitalLat: 38.72,  capitalLng: -9.14,  continent: "europe" },
  { id: "ROU", code: "RO", nameAr: "رومانيا",              nameEn: "Romania",                  capitalAr: "بوخارست",         lat: 45.9,  lng: 24.9,   capitalLat: 44.44,  capitalLng: 26.10,  continent: "europe" },
  { id: "RUS", code: "RU", nameAr: "روسيا",                nameEn: "Russia",                   capitalAr: "موسكو",           lat: 61.5,  lng: 105.3,  capitalLat: 55.75,  capitalLng: 37.62,  continent: "europe" },
  { id: "SMR", code: "SM", nameAr: "سان مارينو",           nameEn: "San Marino",               capitalAr: "سان مارينو",      lat: 43.9,  lng: 12.5,   capitalLat: 43.94,  capitalLng: 12.44,  continent: "europe" },
  { id: "SRB", code: "RS", nameAr: "صربيا",                nameEn: "Serbia",                   capitalAr: "بلغراد",          lat: 44.0,  lng: 21.0,   capitalLat: 44.80,  capitalLng: 20.47,  continent: "europe" },
  { id: "SVK", code: "SK", nameAr: "سلوفاكيا",             nameEn: "Slovakia",                 capitalAr: "براتيسلافا",      lat: 48.7,  lng: 19.7,   capitalLat: 48.15,  capitalLng: 17.12,  continent: "europe" },
  { id: "SVN", code: "SI", nameAr: "سلوفينيا",             nameEn: "Slovenia",                 capitalAr: "ليوبليانا",       lat: 46.1,  lng: 14.8,   capitalLat: 46.05,  capitalLng: 14.51,  continent: "europe" },
  { id: "ESP", code: "ES", nameAr: "إسبانيا",              nameEn: "Spain",                    capitalAr: "مدريد",           lat: 40.5,  lng: -3.7,   capitalLat: 40.42,  capitalLng: -3.70,  continent: "europe" },
  { id: "SWE", code: "SE", nameAr: "السويد",               nameEn: "Sweden",                   capitalAr: "ستوكهولم",        lat: 60.1,  lng: 18.6,   capitalLat: 59.33,  capitalLng: 18.07,  continent: "europe" },
  { id: "CHE", code: "CH", nameAr: "سويسرا",               nameEn: "Switzerland",              capitalAr: "برن",             lat: 46.8,  lng: 8.2,    capitalLat: 46.95,  capitalLng:  7.45,  continent: "europe" },
  { id: "UKR", code: "UA", nameAr: "أوكرانيا",             nameEn: "Ukraine",                  capitalAr: "كييف",            lat: 48.4,  lng: 31.2,   capitalLat: 50.45,  capitalLng: 30.52,  continent: "europe" },
  { id: "GBR", code: "GB", nameAr: "المملكة المتحدة",      nameEn: "United Kingdom",           capitalAr: "لندن",            lat: 55.4,  lng: -3.4,   capitalLat: 51.51,  capitalLng: -0.13,  continent: "europe" },
  { id: "VAT", code: "VA", nameAr: "الفاتيكان",            nameEn: "Vatican City",             capitalAr: "الفاتيكان",       lat: 41.9,  lng: 12.5,   capitalLat: 41.90,  capitalLng: 12.45,  continent: "europe" },
  { id: "XKX", code: "XK", nameAr: "كوسوفو",               nameEn: "Kosovo",                   capitalAr: "بريشتينا",        lat: 42.6,  lng: 20.9,   capitalLat: 42.67,  capitalLng: 21.17,  continent: "europe" },

  // ── Americas ────────────────────────────────────────────────────────
  { id: "ATG", code: "AG", nameAr: "أنتيغوا وبربودا",      nameEn: "Antigua and Barbuda",      capitalAr: "سانت جونز",       lat: 17.1,  lng: -61.8,  capitalLat: 17.12,  capitalLng: -61.85, continent: "americas" },
  { id: "ARG", code: "AR", nameAr: "الأرجنتين",            nameEn: "Argentina",                capitalAr: "بوينس آيريس",     lat: -38.4, lng: -63.6,  capitalLat: -34.61, capitalLng: -58.38, continent: "americas" },
  { id: "BHS", code: "BS", nameAr: "جزر البهاما",          nameEn: "Bahamas",                  capitalAr: "ناساو",           lat: 25.0,  lng: -78.0,  capitalLat: 25.08,  capitalLng: -77.35, continent: "americas" },
  { id: "BRB", code: "BB", nameAr: "بربادوس",              nameEn: "Barbados",                 capitalAr: "بريدجتاون",       lat: 13.2,  lng: -59.5,  capitalLat: 13.10,  capitalLng: -59.62, continent: "americas" },
  { id: "BLZ", code: "BZ", nameAr: "بليز",                 nameEn: "Belize",                   capitalAr: "بلموبان",         lat: 17.2,  lng: -88.7,  capitalLat: 17.25,  capitalLng: -88.77, continent: "americas" },
  { id: "BOL", code: "BO", nameAr: "بوليفيا",              nameEn: "Bolivia",                  capitalAr: "سوكري",           lat: -16.3, lng: -63.6,  capitalLat: -19.03, capitalLng: -65.26, continent: "americas" },
  { id: "BRA", code: "BR", nameAr: "البرازيل",             nameEn: "Brazil",                   capitalAr: "برازيليا",        lat: -10.8, lng: -53.1,  capitalLat: -15.78, capitalLng: -47.92, continent: "americas" },
  { id: "CAN", code: "CA", nameAr: "كندا",                 nameEn: "Canada",                   capitalAr: "أوتاوا",          lat: 60.0,  lng: -96.0,  capitalLat: 45.42,  capitalLng: -75.69, continent: "americas" },
  { id: "CHL", code: "CL", nameAr: "تشيلي",                nameEn: "Chile",                    capitalAr: "سانتياغو",        lat: -35.7, lng: -71.5,  capitalLat: -33.46, capitalLng: -70.65, continent: "americas" },
  { id: "COL", code: "CO", nameAr: "كولومبيا",             nameEn: "Colombia",                 capitalAr: "بوغوتا",          lat: 4.1,   lng: -72.4,  capitalLat:  4.71,  capitalLng: -74.07, continent: "americas" },
  { id: "CRI", code: "CR", nameAr: "كوستاريكا",            nameEn: "Costa Rica",               capitalAr: "سان خوسيه",       lat: 9.7,   lng: -83.8,  capitalLat:  9.93,  capitalLng: -84.08, continent: "americas" },
  { id: "CUB", code: "CU", nameAr: "كوبا",                 nameEn: "Cuba",                     capitalAr: "هافانا",          lat: 21.5,  lng: -79.5,  capitalLat: 23.13,  capitalLng: -82.38, continent: "americas" },
  { id: "DMA", code: "DM", nameAr: "دومينيكا",             nameEn: "Dominica",                 capitalAr: "روسو",            lat: 15.4,  lng: -61.4,  capitalLat: 15.30,  capitalLng: -61.39, continent: "americas" },
  { id: "DOM", code: "DO", nameAr: "الدومينيكان",          nameEn: "Dominican Republic",       capitalAr: "سانتو دومينغو",   lat: 18.7,  lng: -70.2,  capitalLat: 18.47,  capitalLng: -69.90, continent: "americas" },
  { id: "ECU", code: "EC", nameAr: "الإكوادور",            nameEn: "Ecuador",                  capitalAr: "كيتو",            lat: -1.8,  lng: -78.2,  capitalLat: -0.22,  capitalLng: -78.51, continent: "americas" },
  { id: "SLV", code: "SV", nameAr: "السلفادور",            nameEn: "El Salvador",              capitalAr: "سان سلفادور",     lat: 13.8,  lng: -88.9,  capitalLat: 13.69,  capitalLng: -89.19, continent: "americas" },
  { id: "GRD", code: "GD", nameAr: "غرينادا",              nameEn: "Grenada",                  capitalAr: "سانت جورجز",      lat: 12.1,  lng: -61.7,  capitalLat: 12.05,  capitalLng: -61.75, continent: "americas" },
  { id: "GTM", code: "GT", nameAr: "غواتيمالا",            nameEn: "Guatemala",                capitalAr: "مدينة غواتيمالا", lat: 15.8,  lng: -90.2,  capitalLat: 14.64,  capitalLng: -90.51, continent: "americas" },
  { id: "GUY", code: "GY", nameAr: "غويانا",               nameEn: "Guyana",                   capitalAr: "جورج تاون",       lat: 4.9,   lng: -58.9,  capitalLat:  6.80,  capitalLng: -58.16, continent: "americas" },
  { id: "HTI", code: "HT", nameAr: "هايتي",                nameEn: "Haiti",                    capitalAr: "بور-أو-برانس",    lat: 19.1,  lng: -72.3,  capitalLat: 18.54,  capitalLng: -72.34, continent: "americas" },
  { id: "HND", code: "HN", nameAr: "هندوراس",              nameEn: "Honduras",                 capitalAr: "تيغوسيغالبا",     lat: 15.2,  lng: -86.2,  capitalLat: 14.08,  capitalLng: -87.21, continent: "americas" },
  { id: "JAM", code: "JM", nameAr: "جامايكا",              nameEn: "Jamaica",                  capitalAr: "كينغستون",        lat: 18.1,  lng: -77.3,  capitalLat: 17.99,  capitalLng: -76.79, continent: "americas" },
  { id: "MEX", code: "MX", nameAr: "المكسيك",              nameEn: "Mexico",                   capitalAr: "مدينة مكسيكو",    lat: 23.6,  lng: -102.6, capitalLat: 19.43,  capitalLng: -99.13, continent: "americas" },
  { id: "NIC", code: "NI", nameAr: "نيكاراغوا",            nameEn: "Nicaragua",                capitalAr: "ماناغوا",         lat: 12.9,  lng: -85.2,  capitalLat: 12.13,  capitalLng: -86.28, continent: "americas" },
  { id: "PAN", code: "PA", nameAr: "بنما",                 nameEn: "Panama",                   capitalAr: "مدينة بنما",      lat: 8.5,   lng: -80.8,  capitalLat:  8.99,  capitalLng: -79.52, continent: "americas" },
  { id: "PRY", code: "PY", nameAr: "باراغواي",             nameEn: "Paraguay",                 capitalAr: "أسونسيون",        lat: -23.4, lng: -58.4,  capitalLat: -25.29, capitalLng: -57.65, continent: "americas" },
  { id: "PER", code: "PE", nameAr: "بيرو",                 nameEn: "Peru",                     capitalAr: "ليما",            lat: -9.2,  lng: -75.0,  capitalLat: -12.05, capitalLng: -77.04, continent: "americas" },
  { id: "KNA", code: "KN", nameAr: "سانت كيتس ونيفيس",    nameEn: "Saint Kitts and Nevis",    capitalAr: "باستير",          lat: 17.4,  lng: -62.8,  capitalLat: 17.30,  capitalLng: -62.72, continent: "americas" },
  { id: "LCA", code: "LC", nameAr: "سانت لوسيا",           nameEn: "Saint Lucia",              capitalAr: "كاستريز",         lat: 13.9,  lng: -60.9,  capitalLat: 14.01,  capitalLng: -60.99, continent: "americas" },
  { id: "VCT", code: "VC", nameAr: "سانت فنسنت",           nameEn: "Saint Vincent and Grenadines", capitalAr: "كينغستاون",  lat: 13.3,  lng: -61.2,  capitalLat: 13.16,  capitalLng: -61.22, continent: "americas" },
  { id: "SUR", code: "SR", nameAr: "سورينام",              nameEn: "Suriname",                 capitalAr: "باراماريبو",      lat: 3.9,   lng: -56.0,  capitalLat:  5.85,  capitalLng: -55.20, continent: "americas" },
  { id: "TTO", code: "TT", nameAr: "ترينيداد وتوباغو",     nameEn: "Trinidad and Tobago",      capitalAr: "بورت أوف سبيين",  lat: 10.7,  lng: -61.2,  capitalLat: 10.65,  capitalLng: -61.52, continent: "americas" },
  { id: "USA", code: "US", nameAr: "الولايات المتحدة",     nameEn: "United States",            capitalAr: "واشنطن",          lat: 37.1,  lng: -95.7,  capitalLat: 38.90,  capitalLng: -77.04, continent: "americas" },
  { id: "URY", code: "UY", nameAr: "أوروغواي",             nameEn: "Uruguay",                  capitalAr: "مونتيفيديو",      lat: -32.5, lng: -55.8,  capitalLat: -34.90, capitalLng: -56.19, continent: "americas" },
  { id: "VEN", code: "VE", nameAr: "فنزويلا",              nameEn: "Venezuela",                capitalAr: "كاراكاس",         lat: 6.4,   lng: -66.6,  capitalLat: 10.49,  capitalLng: -66.88, continent: "americas" },

  // ── Oceania ──────────────────────────────────────────────────────────
  { id: "AUS", code: "AU", nameAr: "أستراليا",             nameEn: "Australia",                capitalAr: "كانبيرا",         lat: -25.3, lng: 133.8,  capitalLat: -35.28, capitalLng: 149.13, continent: "oceania" },
  { id: "FJI", code: "FJ", nameAr: "فيجي",                 nameEn: "Fiji",                     capitalAr: "سوفا",            lat: -17.7, lng: 178.1,  capitalLat: -18.14, capitalLng: 178.44, continent: "oceania" },
  { id: "KIR", code: "KI", nameAr: "كيريباتي",             nameEn: "Kiribati",                 capitalAr: "جنوب تاراوا",     lat: 1.3,   lng: 173.0,  capitalLat:  1.33,  capitalLng: 172.98, continent: "oceania" },
  { id: "MHL", code: "MH", nameAr: "جزر مارشال",           nameEn: "Marshall Islands",         capitalAr: "ماجورو",          lat: 7.1,   lng: 171.2,  capitalLat:  7.09,  capitalLng: 171.38, continent: "oceania" },
  { id: "FSM", code: "FM", nameAr: "ميكرونيزيا",           nameEn: "Micronesia",               capitalAr: "باليكير",         lat: 6.9,   lng: 158.2,  capitalLat:  6.92,  capitalLng: 158.18, continent: "oceania" },
  { id: "NRU", code: "NR", nameAr: "ناورو",                nameEn: "Nauru",                    capitalAr: "ياريين",          lat: -0.5,  lng: 166.9,  capitalLat: -0.55,  capitalLng: 166.92, continent: "oceania" },
  { id: "NZL", code: "NZ", nameAr: "نيوزيلندا",            nameEn: "New Zealand",              capitalAr: "ويلينغتون",       lat: -40.9, lng: 174.9,  capitalLat: -41.29, capitalLng: 174.78, continent: "oceania" },
  { id: "PLW", code: "PW", nameAr: "بالاو",                nameEn: "Palau",                    capitalAr: "نغيرولمود",       lat: 7.5,   lng: 134.6,  capitalLat:  7.50,  capitalLng: 134.62, continent: "oceania" },
  { id: "PNG", code: "PG", nameAr: "بابوا غينيا الجديدة", nameEn: "Papua New Guinea",         capitalAr: "بورت مورسبي",     lat: -6.3,  lng: 143.9,  capitalLat: -9.44,  capitalLng: 147.18, continent: "oceania" },
  { id: "WSM", code: "WS", nameAr: "ساموا",                nameEn: "Samoa",                    capitalAr: "أبيا",            lat: -13.8, lng: -172.1, capitalLat: -13.83, capitalLng: -171.77,continent: "oceania" },
  { id: "SLB", code: "SB", nameAr: "جزر سليمان",           nameEn: "Solomon Islands",          capitalAr: "هونيارا",         lat: -9.4,  lng: 160.2,  capitalLat: -9.43,  capitalLng: 160.05, continent: "oceania" },
  { id: "TON", code: "TO", nameAr: "تونغا",                nameEn: "Tonga",                    capitalAr: "نوكوالوفا",       lat: -21.2, lng: -175.2, capitalLat: -21.14, capitalLng: -175.22,continent: "oceania" },
  { id: "TUV", code: "TV", nameAr: "توفالو",               nameEn: "Tuvalu",                   capitalAr: "فونافوتي",        lat: -7.1,  lng: 179.2,  capitalLat: -8.52,  capitalLng: 179.20, continent: "oceania" },
  { id: "VUT", code: "VU", nameAr: "فانواتو",              nameEn: "Vanuatu",                  capitalAr: "بورت فيلا",       lat: -15.4, lng: 166.9,  capitalLat: -17.73, capitalLng: 168.32, continent: "oceania" },
];

/** Quick lookup by ISO alpha-3 id */
export const COUNTRIES_BY_ID = new Map<string, Country>(
  COUNTRIES.map((c) => [c.id, c])
);

/** Quick lookup by ISO alpha-2 code */
export const COUNTRIES_BY_CODE = new Map<string, Country>(
  COUNTRIES.map((c) => [c.code, c])
);

/** Search countries by Arabic or English name */
export function searchCountries(query: string): Country[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return COUNTRIES.filter(
    (c) =>
      c.nameAr.includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.capitalAr.includes(q)
  ).slice(0, 8);
}
