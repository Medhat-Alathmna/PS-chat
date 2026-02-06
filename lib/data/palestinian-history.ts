import { TimelineEvent } from "@/lib/types";

/**
 * Palestinian historical events database
 * Used by the timeline tool to display historical context
 */
export const PALESTINIAN_HISTORY: TimelineEvent[] = [
  // Ancient History
  {
    id: "h-1",
    year: -3000,
    title: "الكنعانيون في أرض فلسطين",
    description: "استوطن الكنعانيون أرض فلسطين وأسسوا مدناً مثل أريحا (أقدم مدينة في العالم) ويافا والقدس",
    category: "cultural",
    location: "فلسطين",
  },
  {
    id: "h-2",
    year: 638,
    title: "الفتح الإسلامي للقدس",
    description: "دخل الخليفة عمر بن الخطاب القدس سلماً وكتب العهدة العمرية التي ضمنت حقوق سكانها",
    category: "political",
    location: "القدس",
  },
  {
    id: "h-3",
    year: 691,
    title: "بناء قبة الصخرة",
    description: "بنى الخليفة الأموي عبد الملك بن مروان قبة الصخرة المشرفة في المسجد الأقصى",
    category: "cultural",
    location: "القدس",
  },
  {
    id: "h-4",
    year: 705,
    title: "بناء المسجد الأقصى",
    description: "أتم الخليفة الوليد بن عبد الملك بناء المسجد الأقصى المبارك بصورته الحالية",
    category: "cultural",
    location: "القدس",
  },
  {
    id: "h-5",
    year: 1099,
    title: "الغزو الصليبي",
    description: "احتل الصليبيون القدس وارتكبوا مجازر بحق سكانها المسلمين واليهود",
    category: "military",
    location: "القدس",
  },
  {
    id: "h-6",
    year: 1187,
    title: "تحرير القدس - معركة حطين",
    description: "حرر صلاح الدين الأيوبي القدس بعد انتصاره في معركة حطين على الصليبيين",
    category: "military",
    location: "حطين",
  },
  {
    id: "h-7",
    year: 1516,
    title: "العهد العثماني",
    description: "دخلت فلسطين تحت الحكم العثماني بعد معركة مرج دابق وبقيت 400 عام",
    category: "political",
    location: "فلسطين",
  },
  // Modern History
  {
    id: "h-8",
    year: 1882,
    title: "بداية الهجرة الصهيونية",
    description: "بدأت أولى موجات الهجرة اليهودية إلى فلسطين (الهجرة الأولى)",
    category: "political",
    location: "فلسطين",
  },
  {
    id: "h-9",
    year: 1897,
    title: "المؤتمر الصهيوني الأول",
    description: "عقد تيودور هرتزل المؤتمر الصهيوني الأول في بازل بسويسرا للمطالبة بدولة يهودية في فلسطين",
    category: "political",
    location: "بازل، سويسرا",
  },
  {
    id: "h-10",
    year: 1917,
    title: "وعد بلفور",
    description: "أصدرت بريطانيا وعد بلفور الذي تعهد بإنشاء 'وطن قومي لليهود' في فلسطين",
    category: "political",
    location: "لندن",
  },
  {
    id: "h-11",
    year: 1920,
    title: "ثورة موسم النبي موسى",
    description: "أول انتفاضة فلسطينية ضد الانتداب البريطاني والهجرة الصهيونية",
    category: "military",
    location: "القدس",
  },
  {
    id: "h-12",
    year: 1929,
    title: "ثورة البراق",
    description: "انتفاضة فلسطينية دفاعاً عن حائط البراق والمقدسات الإسلامية",
    category: "military",
    location: "القدس",
  },
  {
    id: "h-13",
    year: 1936,
    title: "الثورة الفلسطينية الكبرى",
    description: "إضراب عام وثورة مسلحة استمرت 3 سنوات ضد الانتداب البريطاني",
    category: "military",
    location: "فلسطين",
  },
  {
    id: "h-14",
    year: 1947,
    title: "قرار التقسيم",
    description: "صدور قرار الأمم المتحدة رقم 181 بتقسيم فلسطين",
    category: "political",
    location: "نيويورك",
  },
  {
    id: "h-15",
    year: 1948,
    title: "النكبة",
    description: "تهجير أكثر من 750,000 فلسطيني وتدمير أكثر من 500 قرية، وإعلان قيام إسرائيل",
    category: "political",
    location: "فلسطين",
  },
  {
    id: "h-16",
    year: 1948,
    title: "مجزرة دير ياسين",
    description: "ارتكاب مجزرة وحشية في قرية دير ياسين قرب القدس راح ضحيتها أكثر من 100 شهيد",
    category: "military",
    location: "دير ياسين",
  },
  {
    id: "h-17",
    year: 1964,
    title: "تأسيس منظمة التحرير الفلسطينية",
    description: "تأسيس منظمة التحرير الفلسطينية كممثل شرعي ووحيد للشعب الفلسطيني",
    category: "political",
    location: "القدس",
  },
  {
    id: "h-18",
    year: 1967,
    title: "النكسة - حرب يونيو",
    description: "احتلال إسرائيل للضفة الغربية وقطاع غزة والقدس الشرقية وسيناء والجولان",
    category: "military",
    location: "فلسطين",
  },
  {
    id: "h-19",
    year: 1969,
    title: "حريق المسجد الأقصى",
    description: "محاولة إحراق المسجد الأقصى المبارك على يد متطرف أسترالي",
    category: "other",
    location: "القدس",
  },
  {
    id: "h-20",
    year: 1987,
    title: "الانتفاضة الأولى",
    description: "انطلاق الانتفاضة الفلسطينية الأولى (انتفاضة الحجارة) ضد الاحتلال",
    category: "military",
    location: "غزة",
  },
  {
    id: "h-21",
    year: 1993,
    title: "اتفاقية أوسلو",
    description: "توقيع اتفاقية أوسلو بين منظمة التحرير وإسرائيل",
    category: "political",
    location: "واشنطن",
  },
  {
    id: "h-22",
    year: 1994,
    title: "مجزرة الحرم الإبراهيمي",
    description: "ارتكاب مجزرة في الحرم الإبراهيمي بالخليل راح ضحيتها 29 شهيداً أثناء صلاة الفجر",
    category: "military",
    location: "الخليل",
  },
  {
    id: "h-23",
    year: 2000,
    title: "الانتفاضة الثانية",
    description: "انطلاق انتفاضة الأقصى بعد اقتحام شارون للمسجد الأقصى",
    category: "military",
    location: "القدس",
  },
  {
    id: "h-24",
    year: 2002,
    title: "بناء جدار الفصل",
    description: "بدء بناء جدار الفصل العنصري الذي يلتهم أراضي فلسطينية",
    category: "political",
    location: "الضفة الغربية",
  },
  {
    id: "h-25",
    year: 2012,
    title: "فلسطين دولة مراقب",
    description: "حصول فلسطين على صفة دولة مراقب غير عضو في الأمم المتحدة",
    category: "political",
    location: "نيويورك",
  },
  {
    id: "h-26",
    year: 2017,
    title: "إعلان ترامب",
    description: "إعلان ترامب الاعتراف بالقدس عاصمة لإسرائيل ونقل السفارة الأمريكية إليها",
    category: "political",
    location: "واشنطن",
  },
  {
    id: "h-27",
    year: 2021,
    title: "هبة الشيخ جراح",
    description: "انتفاضة شعبية دفاعاً عن حي الشيخ جراح في القدس ضد التهجير القسري",
    category: "social",
    location: "القدس",
  },
  {
    id: "h-28",
    year: 2023,
    title: "طوفان الأقصى",
    description: "عملية طوفان الأقصى وما تلاها من عدوان إسرائيلي على قطاع غزة",
    category: "military",
    location: "غزة",
  },
];

/**
 * Get timeline events filtered by period or topic
 */
export function getTimelineEvents(
  options: {
    startYear?: number;
    endYear?: number;
    category?: TimelineEvent["category"];
    location?: string;
    limit?: number;
  } = {}
): TimelineEvent[] {
  let events = [...PALESTINIAN_HISTORY];

  // Filter by year range
  if (options.startYear !== undefined) {
    events = events.filter((e) => e.year >= options.startYear!);
  }
  if (options.endYear !== undefined) {
    events = events.filter((e) => e.year <= options.endYear!);
  }

  // Filter by category
  if (options.category) {
    events = events.filter((e) => e.category === options.category);
  }

  // Filter by location
  if (options.location) {
    const lowerLocation = options.location.toLowerCase();
    events = events.filter(
      (e) => e.location?.toLowerCase().includes(lowerLocation)
    );
  }

  // Sort by year
  events.sort((a, b) => a.year - b.year);

  // Limit results
  if (options.limit) {
    events = events.slice(0, options.limit);
  }

  return events;
}

/**
 * Search timeline by keyword
 */
export function searchTimelineByKeyword(keyword: string): TimelineEvent[] {
  const lowerKeyword = keyword.toLowerCase();

  return PALESTINIAN_HISTORY.filter(
    (event) =>
      event.title.toLowerCase().includes(lowerKeyword) ||
      event.description.toLowerCase().includes(lowerKeyword) ||
      event.location?.toLowerCase().includes(lowerKeyword) ||
      event.year.toString().includes(keyword)
  ).sort((a, b) => a.year - b.year);
}
