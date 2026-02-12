export type CityRegion = "west-bank" | "gaza" | "interior" | "galilee" | "negev" | "coast";

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
  region: CityRegion;
  facts: string[];
  imageUrl: string;
}

export const REGIONS: Record<CityRegion, { nameAr: string; nameEn: string }> = {
  "west-bank": { nameAr: "الضفة الغربية", nameEn: "West Bank" },
  "gaza": { nameAr: "قطاع غزة", nameEn: "Gaza Strip" },
  "interior": { nameAr: "الداخل المحتل", nameEn: "1948 Territories" },
  "galilee": { nameAr: "الجليل", nameEn: "Galilee" },
  "negev": { nameAr: "النقب", nameEn: "Negev" },
  "coast": { nameAr: "الساحل", nameEn: "Coast" },
};

export const CITIES: City[] = [
  {
    id: "jerusalem",
    name: "Jerusalem",
    nameAr: "القدس",
    emoji: "",
    x: 48,
    y: 52,
    lat: 31.7683,
    lng: 35.2137,
    color: "#FFD700",
    region: "west-bank",
    facts: [
      "عاصمة فلسطين الأبدية وواحدة من أقدم مدن العالم",
      "تضم المسجد الأقصى المبارك وقبة الصخرة المشرفة وكنيسة القيامة",
      "تعتبر مركزاً روحياً وتاريخياً للديانات السماوية الثلاث",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Western_Wall_and_Dome_of_the_Rock.jpg/800px-Western_Wall_and_Dome_of_the_Rock.jpg",
  },
  {
    id: "gaza",
    name: "Gaza",
    nameAr: "غزة",
    emoji: "",
    x: 22,
    y: 72,
    lat: 31.5017,
    lng: 34.4668,
    color: "#54A0FF",
    region: "gaza",
    facts: [
      "واحدة من أقدم المدن في العالم وأكبر مدن قطاع غزة",
      "مدينة هاشم، حيث دفن فيها جد الرسول صلى الله عليه وسلم",
      "تشتهر بمينائها القديم وأسواقها التاريخية العريقة",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Gaza_city_shatti_camp.jpg/800px-Gaza_city_shatti_camp.jpg",
  },
  {
    id: "nablus",
    name: "Nablus",
    nameAr: "نابلس",
    emoji: "",
    x: 52,
    y: 32,
    lat: 32.2211,
    lng: 35.2544,
    color: "#4ECDC4",
    region: "west-bank",
    facts: [
      "تلقب بدمشق الصغرى لجمال طبيعتها وكثرة مياهها",
      "مشهورة بصناعة الكنافة النابلسية والصابون التقليدي",
      "تقع في وادٍ ضيق بين جبلين هما جبل عيبال وجبل جرزيم",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Nablus_Panorama.jpg/800px-Nablus_Panorama.jpg",
  },
  {
    id: "hebron",
    name: "Hebron",
    nameAr: "الخليل",
    emoji: "",
    x: 52,
    y: 68,
    lat: 31.5326,
    lng: 35.0998,
    color: "#FF9F43",
    region: "west-bank",
    facts: [
      "بناها الكنعانيون قبل حوالي 5500 سنة",
      "تضم الحرم الإبراهيمي الشريف الذي يضم مقامات الأنبياء",
      "مشهورة بصناعة الزجاج والخزف والمنسوجات التقليدية",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Hebron01.jpg/800px-Hebron01.jpg",
  },
  {
    id: "jaffa",
    name: "Jaffa",
    nameAr: "يافا",
    emoji: "",
    x: 32,
    y: 38,
    lat: 32.0333,
    lng: 34.75,
    color: "#FF6B6B",
    region: "interior",
    facts: [
      "تلقب بعروس البحر وتعتبر من أقدم الموانئ في العالم",
      "اشتهرت عالمياً ببيارات البرتقال وصناعات النسيج والصابون",
      "تتميز بعمارتها العريقة ومنارتها الشهيرة المطلة على المتوسط",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Old_Jaffa_Harbour.jpg/800px-Old_Jaffa_Harbour.jpg",
  },
  {
    id: "haifa",
    name: "Haifa",
    nameAr: "حيفا",
    emoji: "",
    x: 35,
    y: 18,
    lat: 32.8191,
    lng: 34.9983,
    color: "#1DD1A1",
    region: "interior",
    facts: [
      "تلقب بعروس الكرمل لجمال جبالها الخضراء المطلة على البحر",
      "تضم واحداً من أهم الموانئ الفلسطينية التاريخية",
      "مشهورة بحدائقها المعلقة وعمارتها التي تمزج الجبل بالساحل",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Haifa_Harbor_2015.jpg/800px-Haifa_Harbor_2015.jpg",
  },
  {
    id: "acre",
    name: "Acre",
    nameAr: "عكا",
    emoji: "",
    x: 38,
    y: 12,
    lat: 32.9226,
    lng: 35.0694,
    color: "#10AC84",
    region: "galilee",
    facts: [
      "مدينة تاريخية شهيرة صمدت أسوارها أمام نابليون بونابرت",
      "تضم قلاعاً وأسواقاً ومساجد تعود للعصرين المملوكي والعثماني",
      "مدرجة ضمن قائمة التراث العالمي لليونسكو لعراقة تاريخها",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Acre_Old_City.jpg/800px-Acre_Old_City.jpg",
  },
  {
    id: "nazareth",
    name: "Nazareth",
    nameAr: "الناصرة",
    emoji: "",
    x: 50,
    y: 22,
    lat: 32.7019,
    lng: 35.3033,
    color: "#EE5253",
    region: "galilee",
    facts: [
      "مدينة كنعانية عريقة وتعتبر من أقدس المدن في العالم",
      "تضم كنيسة البشارة حيث ولد وترعرع فيها السيد المسيح",
      "مركز ثقافي واقتصادي هام في منطقة الجليل شمال فلسطين",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Nazareth_Basilica.jpg/800px-Nazareth_Basilica.jpg",
  },
  {
    id: "bethlehem",
    name: "Bethlehem",
    nameAr: "بيت لحم",
    emoji: "",
    x: 50,
    y: 58,
    lat: 31.7054,
    lng: 35.2024,
    color: "#FF9FF3",
    region: "west-bank",
    facts: [
      "مدينة السلام وتضم كنيسة المهد حيث ولد السيد المسيح",
      "تشتهر بصناعاتها التقليدية مثل خشب الزيتون والصدف",
      "تحيط بها حقول الزيتون والكروم والعديد من الأديرة التاريخية",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Bethlehem_Manger_Square.jpg/800px-Bethlehem_Manger_Square.jpg",
  },
  {
    id: "jericho",
    name: "Jericho",
    nameAr: "أريحا",
    emoji: "",
    x: 65,
    y: 52,
    lat: 31.8611,
    lng: 35.4597,
    color: "#Feca57",
    region: "west-bank",
    facts: [
      "أقدم مدينة مأهولة في العالم ويعود تاريخها لأكثر من 10 آلاف سنة",
      "أخفض بقعة في العالم حيث تقع تحت مستوى سطح البحر",
      "مشهورة بإنتاجها الوفير من الموز والتمور والحمضيات",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Jericho_Tell_es-Sultan.jpg/800px-Jericho_Tell_es-Sultan.jpg",
  },
  {
    id: "ramallah",
    name: "Ramallah",
    nameAr: "رام الله",
    emoji: "",
    x: 48,
    y: 42,
    lat: 31.9038,
    lng: 35.2034,
    color: "#A55EEA",
    region: "west-bank",
    facts: [
      "مدينة الثقافة والفنون والنشاط الفكري المعاصر",
      "تتميز بمناخها الجميل وموقعها الذي يربط بين مدن الوسط",
      "تضم العديد من المتاحف والمراكز الثقافية الفلسطينية",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Ramallah_skyline.jpg/800px-Ramallah_skyline.jpg",
  },
  {
    id: "jenin",
    name: "جنين",
    nameAr: "جنين",
    emoji: "",
    x: 52,
    y: 15,
    lat: 32.4646,
    lng: 35.2938,
    color: "#27ae60",
    region: "west-bank",
    facts: [
      "تعتبر سلة غذاء فلسطين لخصوبة مرج ابن عامر المحيط بها",
      "تضم أحد أقدم الكنائس في العالم (كنيسة برقين)",
      "تعرف بمدينة الحدائق وتاريخها النضالي العريق",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Jenin_city_view.jpg/800px-Jenin_city_view.jpg",
  },
  {
    id: "tulkarm",
    name: "Tulkarm",
    nameAr: "طولكرم",
    emoji: "",
    x: 35,
    y: 30,
    lat: 32.3152,
    lng: 35.0305,
    color: "#2980b9",
    region: "west-bank",
    facts: [
      "مدينة المعرفة والعلم وتشتهر بمكانتها التعليمية المرموقة",
      "تتمتع بموقع جغرافي مميز يربط السهل بالجبل",
      "مشهورة ببيارات الحمضيات والمحاصيل الزراعية المتنوعة",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Tulkarm_center.jpg/800px-Tulkarm_center.jpg",
  },
  {
    id: "qalqilya",
    name: "Qalqilya",
    nameAr: "قلقيلية",
    emoji: "",
    x: 34,
    y: 35,
    lat: 32.1897,
    lng: 34.9691,
    color: "#d35400",
    region: "west-bank",
    facts: [
      "تضم أكبر حديقة حيوان في فلسطين وهي مقصد سياحي هام",
      "تشتهر بزراعة الجوافة والحمضيات والخضروات الوفيرة",
      "تعتبر من أكثر المدن الفلسطينية خصوبة وقرباً من الساحل",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Qalqilya_zoo.jpg/800px-Qalqilya_zoo.jpg",
  },
  {
    id: "safad",
    name: "Safad",
    nameAr: "صفد",
    emoji: "",
    x: 60,
    y: 10,
    lat: 32.9658,
    lng: 35.4983,
    color: "#c0392b",
    region: "galilee",
    facts: [
      "عاصمة الجليل الأعلى وأعلى مدينة في فلسطين التاريخية",
      "مشهورة بهوائها النقي والكروم وبساتين الزيتون",
      "مركز تاريخي للعلوم والثقافة وتضم حارات فنية عريقة",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Safed_old_city.jpg/800px-Safed_old_city.jpg",
  },
  {
    id: "tiberias",
    name: "Tiberias",
    nameAr: "طبريا",
    emoji: "",
    x: 68,
    y: 18,
    lat: 32.7922,
    lng: 35.5312,
    color: "#2c3e50",
    region: "galilee",
    facts: [
      "مدينة تاريخية تقع على الساحل الغربي لبحيرة طبريا",
      "تعتبر من أهم مراكز السياحة العلاجية لوجود الينابيع الحارة",
      "تتمتع بمكانة دينية وتاريخية كبيرة عند جميع الحضارات",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Tiberias_Promenade.jpg/800px-Tiberias_Promenade.jpg",
  },
  {
    id: "beisan",
    name: "Beisan",
    nameAr: "بيسان",
    emoji: "",
    x: 70,
    y: 30,
    lat: 32.5,
    lng: 35.5,
    color: "#8e44ad",
    region: "interior",
    facts: [
      "من أقدم المدن في فلسطين وتعرف بآثارها الرومانية الضخمة",
      "تضم واحداً من أكبر المسارح الرومانية التاريخية في المنطقة",
      "تتميز بخصوبة أراضيها ووفرة مياهها والزراعة المروية",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Beit_She%27an_Roman_Theatre.jpg/800px-Beit_She%27an_Roman_Theatre.jpg",
  },
  {
    id: "beersheba",
    name: "Beersheba",
    nameAr: "بئر السبع",
    emoji: "",
    x: 40,
    y: 95,
    lat: 31.2444,
    lng: 34.7908,
    color: "#f39c12",
    region: "negev",
    facts: [
      "عاصمة النقب وأكبر مدن جنوب فلسطين التاريخية",
      "كانت محطة تجارية هامة بين فلسطين ومصر والجزيرة العربية",
      "مشهورة بسوقها التاريخي العريق وتراثها البدوي الأصيل",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Beersheba_Old_City.jpg/800px-Beersheba_Old_City.jpg",
  },
  {
    id: "ramla",
    name: "Ramla",
    nameAr: "الرملة",
    emoji: "",
    x: 42,
    y: 45,
    lat: 31.9292,
    lng: 34.8656,
    color: "#7f8c8d",
    region: "interior",
    facts: [
      "المدينة الوحيدة التي بناها الأمويون في فلسطين كعاصمة لهم",
      "تضم الجامع الأبيض ومئذنته الشهيرة وخزان الرملة (بركة العنزية)",
      "كانت مركزاً إدارياً وتجارياً هاماً على طريق القوافل القديم",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Ramla_White_Tower.jpg/800px-Ramla_White_Tower.jpg",
  },
  {
    id: "lod",
    name: "Lod",
    nameAr: "اللد",
    emoji: "",
    x: 43,
    y: 44,
    lat: 31.9514,
    lng: 34.8961,
    color: "#16a085",
    region: "interior",
    facts: [
      "مدينة كنعانية قديمة وتعتبر تاريخياً بوابة الساحل نحو القدس",
      "تضم كنيسة القديس جورج الأثرية ومطار اللد التاريخي",
      "عرفت عبر العصور كملتقى للطرق التجارية وسكك الحديد",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/St_George_Church_Lod.jpg/800px-St_George_Church_Lod.jpg",
  },
  {
    id: "ashkelon",
    name: "Ashkelon",
    nameAr: "عسقلان",
    emoji: "",
    x: 25,
    y: 65,
    lat: 31.6667,
    lng: 34.5667,
    color: "#2980b9",
    region: "coast",
    facts: [
      "مدينة ساحلية عريقة عرفت بجمالها وأسوارها المنيعة",
      "كانت من أهم موانئ جنوب فلسطين على مر العصور",
      "تشتهر بآثارها الكنعانية والبيزنطية والحدائق الوطنية",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Ashkelon_Park.jpg/800px-Ashkelon_Park.jpg",
  },
  {
    id: "ashdod",
    name: "Ashdod",
    nameAr: "إسدود",
    emoji: "",
    x: 28,
    y: 60,
    lat: 31.8167,
    lng: 34.65,
    color: "#27ae60",
    region: "coast",
    facts: [
      "مدينة كنعانية قديمة وميناء تجاري هام على البحر المتوسط",
      "اشتهرت بزراعة الحمضيات والنشاط التجاري البحري",
      "تعتبر من المدن التاريخية التي ورد ذكرها في أقدم المخطوطات",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Ashdod_Beach.jpg/800px-Ashdod_Beach.jpg",
  },
  {
    id: "khan-yunis",
    name: "Khan Yunis",
    nameAr: "خانيونس",
    emoji: "",
    x: 20,
    y: 78,
    lat: 31.3458,
    lng: 34.3008,
    color: "#8e44ad",
    region: "gaza",
    facts: [
      "ثاني أكبر مدينة في قطاع غزة وتشتهر بقلعتها التاريخية",
      "بنيت فيها قلعة الأمير يونس لحماية القوافل والمسافرين",
      "تتميز بزراعة اللوزيات والحمضيات والنشاط التجاري والزراعي",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Khan_Yunis_Castle.jpg/800px-Khan_Yunis_Castle.jpg",
  },
  {
    id: "rafah",
    name: "Rafah",
    nameAr: "رفح",
    emoji: "",
    x: 18,
    y: 85,
    lat: 31.2847,
    lng: 34.2533,
    color: "#c0392b",
    region: "gaza",
    facts: [
      "مدينة حدودية عريقة وتعتبر بوابة فلسطين نحو القارة الأفريقية",
      "شهدت أحداثاً تاريخية ومعارك فاصلة عبر العصور القديمة",
      "تعتبر مركزاً حيوياً للتبادل الثقافي والتجاري مع مصر",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Rafah_Crossing.jpg/800px-Rafah_Crossing.jpg",
  },
  {
    id: "deir-al-balah",
    name: "Deir al-Balah",
    nameAr: "دير البلح",
    emoji: "",
    x: 21,
    y: 75,
    lat: 31.4172,
    lng: 34.3486,
    color: "#f39c12",
    region: "gaza",
    facts: [
      "مشهورة بزراعة النخيل وتعتبر عاصمة التمور في فلسطين",
      "تضم دير القديس هيلاريون وهو من أقدم الأديرة في فلسطين",
      "تتميز بشاطئها الجميل وبساتينها الخضراء الوفيرة",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/41/Deir_al-Balah_Beach.jpg",
  },
  {
    id: "salfit",
    name: "Salfit",
    nameAr: "سلفيت",
    emoji: "",
    x: 48,
    y: 35,
    lat: 32.0847,
    lng: 35.1806,
    color: "#2c3e50",
    region: "west-bank",
    facts: [
      "تلقب بمملكة الزيتون لكثرة أشجار الزيتون في أراضيها",
      "مشهورة بجودة زيتها وصناعاتها الحجرية والزراعية",
      "تعتبر مركزاً إدارياً وثقافياً هاماً في منطقة جبال فلسطين",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Salfit_City.jpg/800px-Salfit_City.jpg",
  },
  {
    id: "tubas",
    name: "Tubas",
    nameAr: "طوباس",
    emoji: "",
    x: 62,
    y: 28,
    lat: 32.3211,
    lng: 35.3694,
    color: "#16a085",
    region: "west-bank",
    facts: [
      "مدينة عريقة تقع في الجزء الشمالي من فلسطين",
      "تتميز بسهولها الخصبة والمناظر الطبيعية الخلابة في أغوارها",
      "تعتبر مركزاً زراعياً هاماً وخاصة في إنتاج الخضروات والألبان",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Tubas_panorama.jpg/800px-Tubas_panorama.jpg",
  },
  {
    id: "al-bireh",
    name: "Al-Bireh",
    nameAr: "البيرة",
    emoji: "",
    x: 49,
    y: 43,
    lat: 31.91,
    lng: 35.21,
    color: "#3498db",
    region: "west-bank",
    facts: [
      "توأم مدينة رام الله وتعتبر مدينة كنعانية قديمة عريقة",
      "كانت محطة للقوافل والمسافرين بين الشمال والجنوب",
      "تضم معالم أثرية ومساجد تاريخية تعكس حضارات متعاقبة",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Al-Bireh_City.jpg/800px-Al-Bireh_City.jpg",
  },
  {
    id: "beit-jala",
    name: "Beit Jala",
    nameAr: "بيت جالا",
    emoji: "",
    x: 49,
    y: 57,
    lat: 31.7167,
    lng: 35.1833,
    color: "#f1c40f",
    region: "west-bank",
    facts: [
      "مشهورة بجودة زيت الزيتون والمنسوجات والمطاعم العريقة",
      "تتميز بموقعها الجبلي الجميل المطل على مدينة القدس",
      "تضم العديد من الكنائس والأديرة التاريخية والمؤسسات الخيرية",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Beit_Jala_Square.jpg/800px-Beit_Jala_Square.jpg",
  },
  {
    id: "beit-sahour",
    name: "Beit Sahour",
    nameAr: "بيت ساحور",
    emoji: "",
    x: 52,
    y: 59,
    lat: 31.7056,
    lng: 35.2283,
    color: "#e67e22",
    region: "west-bank",
    facts: [
      "تعرف بمدينة حقل الرعاة حيث بشرت الملائكة بميلاد المسيح",
      "تشتهر بصناعة الصدف وخشب الزيتون والتطريز الفلسطيني",
      "تعتبر نموذجاً للتعايش والمقاومة الشعبية السلمية",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Shepherds_Field_Beit_Sahour.jpg/800px-Shepherds_Field_Beit_Sahour.jpg",
  },
  {
    id: "umm-al-fahm",
    name: "Umm al-Fahm",
    nameAr: "أم الفحم",
    emoji: "",
    x: 45,
    y: 20,
    lat: 32.5161,
    lng: 35.1528,
    color: "#e74c3c",
    region: "interior",
    facts: [
      "تقع في منطقة المثلث وتتميز بموقعها الجبلي المرتفع",
      "سميت بهذا الاسم لكثرة الغابات فيها وصناعة الفحم قديماً",
      "مركز ثقافي واجتماعي هام يضم العديد من المبدعين والفنانين",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Umm_al-Fahm.jpg/800px-Umm_al-Fahm.jpg",
  },
  {
    id: "shefa-amr",
    name: "Shefa-Amr",
    nameAr: "شفا عمرو",
    emoji: "",
    x: 42,
    y: 15,
    lat: 32.8058,
    lng: 35.1706,
    color: "#34495e",
    region: "interior",
    facts: [
      "مدينة كنعانية تاريخية تضم قلعة ظاهر العمر الشهيرة",
      "تتميز بتنوعها الثقافي والاجتماعي وتاريخها العريق",
      "تقع في موقع استراتيجي بين حيفا والناصرة وعكا",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Shefa-Amr_Church.jpg/800px-Shefa-Amr_Church.jpg",
  },
  {
    id: "qalansawe",
    name: "Qalansawe",
    nameAr: "قلنسوة",
    emoji: "",
    x: 35,
    y: 35,
    lat: 32.2858,
    lng: 34.9817,
    color: "#95a5a6",
    region: "interior",
    facts: [
      "مدينة تاريخية تقع في منطقة المثلث بالسهل الساحلي",
      "تضم معثورات أثرية تعود للعصور المملوكية والعثمانية",
      "تشتهر بالزراعة والنشاط الاقتصادي المتنوع في المنطقة",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Qalansawe_Mosque.jpg/800px-Qalansawe_Mosque.jpg",
  },
  {
    id: "tayibe",
    name: "Tayibe",
    nameAr: "الطيبة",
    emoji: "",
    x: 36,
    y: 32,
    lat: 32.2661,
    lng: 35.0089,
    color: "#1abc9c",
    region: "interior",
    facts: [
      "من أكبر المدن العربية في منطقة المثلث بوسط فلسطين",
      "تتميز بموقعها المشرف على السهل الساحلي والنشاط الثقافي",
      "مشهورة بأسواقها ومؤسساتها التعليمية والإنتاج الزراعي",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Tayibe_City.jpg/800px-Tayibe_City.jpg",
  },
  {
    id: "baqa-al-gharbiyye",
    name: "Baqa al-Gharbiyye",
    nameAr: "باقة الغربية",
    emoji: "",
    x: 38,
    y: 28,
    lat: 32.4217,
    lng: 35.0361,
    color: "#2ecc71",
    region: "interior",
    facts: [
      "مركز تجاري وتعليمي هام في منطقة المثلث الشمالي",
      "تضم العديد من الكليات ومراكز البحث العلمي والثقافي",
      "تشتهر بحيوية أسواقها وتطورها العمراني المستمر",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Baqa_al-Gharbiyye.jpg/800px-Baqa_al-Gharbiyye.jpg",
  },
  {
    id: "sakhnin",
    name: "Sakhnin",
    nameAr: "سخنين",
    emoji: "",
    x: 52,
    y: 20,
    lat: 32.8631,
    lng: 35.3047,
    color: "#3498db",
    region: "galilee",
    facts: [
      "مدينة عريقة في الجليل وتعرف بمدينة يوم الأرض الخالد",
      "تتميز بطبيعتها الجبلية الجميلة والنشاط الرياضي المتميز",
      "تضم العديد من المعالم التراثية والأسواق الشعبية",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Sakhnin_City_view.jpg/800px-Sakhnin_City_view.jpg",
  },
  {
    id: "arraba",
    name: "Arraba",
    nameAr: "عرابة",
    emoji: "",
    x: 53,
    y: 21,
    lat: 32.855,
    lng: 35.3375,
    color: "#9b59b6",
    region: "galilee",
    facts: [
      "بلدة تاريخية عرفت بـ 'قصور عرابة' التي بناها آل عبد الهادي",
      "تشتهر بكثرة العلماء والمثقفين وتاريخها التعليمي العريق",
      "تتميز بزراعة الزيتون وموقعها الاستراتيجي في الجليل",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Arraba_Palace.jpg/800px-Arraba_Palace.jpg",
  },
  {
    id: "tamra",
    name: "Tamra",
    nameAr: "طمرة",
    emoji: "",
    x: 43,
    y: 18,
    lat: 32.8533,
    lng: 35.1972,
    color: "#e67e22",
    region: "galilee",
    facts: [
      "مدينة جبلية جميلة في الجليل تطل على سهل عكا",
      "تشتهر بنهضتها العمرانية والثقافية والتعليمية الواسعة",
      "مركز هام للخدمات والنشاط الاقتصادي في منطقتها",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Tamra_Panorama.jpg/800px-Tamra_Panorama.jpg",
  },
  {
    id: "maghar",
    name: "Maghar",
    nameAr: "المغار",
    emoji: "",
    x: 58,
    y: 18,
    lat: 32.8911,
    lng: 35.4086,
    color: "#e74c3c",
    region: "galilee",
    facts: [
      "تقع على سفوح جبل حزور وتتميز بموقعها الجغرافي الفريد",
      "سميت بالمغار لكثرة المغارات التاريخية الموجودة فيها",
      "تتميز بتنوعها الاجتماعي وجمال بساتين الزيتون المحيطة بها",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Maghar_Village.jpg/800px-Maghar_Village.jpg",
  },
  {
    id: "kafr-qasim",
    name: "Kafr Qasim",
    nameAr: "كفر قاسم",
    emoji: "",
    x: 37,
    y: 40,
    lat: 32.1133,
    lng: 34.9753,
    color: "#2c3e50",
    region: "interior",
    facts: [
      "مدينة فلسطينية عريقة تقع في مركز البلاد بالسهل الساحلي",
      "تشتهر بنهضتها الصناعية والتجارية والنشاط الاقتصادي القوي",
      "تعتبر رمزاً للصمود وتاريخها الوطني العريق في الوجدان الفلسطيني",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Kafr_Qasim_view.jpg/800px-Kafr_Qasim_view.jpg",
  },
  {
    id: "rahat",
    name: "رهط",
    nameAr: "رهط",
    emoji: "",
    x: 35,
    y: 105,
    lat: 31.3917,
    lng: 34.75,
    color: "#00b894",
    region: "negev",
    facts: [
      "أكبر مدينة بدوية في العالم وتقع في منطقة النقب",
      "مركز ثقافي واقتصادي هام يجمع بين الأصالة والحداثة",
      "تشتهر بكرم ضيافتها ومهرجاناتها التراثية البدوية السنوية",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Rahat_City_Center.jpg/800px-Rahat_City_Center.jpg",
  },
  {
    id: "sebastia",
    name: "Sebastia",
    nameAr: "سبسطية",
    emoji: "",
    x: 50,
    y: 28,
    lat: 32.2764,
    lng: 35.1972,
    color: "#6c5ce7",
    region: "west-bank",
    facts: [
      "عاصمة الرومان في فلسطين وتضم أكبر شارع أعمدة أثري",
      "تشتهر بآثارها الكنعانية واليونانية والرومانية العظيمة",
      "تتمتع بموقع جبلي ساحر وتحيط بها مزارع الزيتون والمشمش",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Sebastia_Roman_Forum.jpg/800px-Sebastia_Roman_Forum.jpg",
  },
  {
    id: "yibna",
    name: "Yibna",
    nameAr: "يبنة",
    emoji: "",
    x: 30,
    y: 50,
    lat: 31.8667,
    lng: 34.75,
    color: "#fab1a0",
    region: "interior",
    facts: [
      "مدينة تاريخية قديمة في السهل الساحلي الجنوبي",
      "اشتهرت بمنارتها ومساجدها وتاريخها العلمي العريق",
      "كانت مركزاً إدارياً وزراعياً حيوياً على مر العصور",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Yibna_Mosque_Minaret.jpg/800px-Yibna_Mosque_Minaret.jpg",
  },
  {
    id: "majdal-krum",
    name: "Majdal Krum",
    nameAr: "مجد الكروم",
    emoji: "",
    x: 48,
    y: 12,
    lat: 32.9211,
    lng: 35.2631,
    color: "#fdcb6e",
    region: "galilee",
    facts: [
      "قرية جبلية عريقة في الجليل تشتهر بجمال كرومها",
      "سميت بمجد الكروم لجودة إنتاجها من العنب والتين قديماً",
      "تضم معالم أثرية ومغارات تدل على تاريخ سكن قديم جداً",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Majdal_Krum_View.jpg/800px-Majdal_Krum_View.jpg",
  },
  {
    id: "umm-rashrash",
    name: "Umm Rashrash",
    nameAr: "أم الرشراش",
    emoji: "🏖️",
    x: 45,
    y: 95,
    lat: 29.5581,
    lng: 34.9482,
    color: "#FF6B9D",
    region: "negev",
    facts: [
      "المدينة الفلسطينية الوحيدة على ساحل خليج العقبة والبحر الأحمر",
      "احتُلت في 10 مارس 1949 وأُعيدت تسميتها إلى 'إيلات'",
      "كانت تضم حصناً عثمانياً ومركزاً حدودياً مهماً في أقصى جنوب فلسطين",
      "تقع على مفترق طرق تجارية بين آسيا وأفريقيا عبر البحر الأحمر",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Eilat_from_air.jpg/800px-Eilat_from_air.jpg",
  },
  {
    id: "ras-al-naqoura",
    name: "Ras al-Naqoura",
    nameAr: "رأس الناقورة",
    emoji: "🌊",
    x: 30,
    y: 2,
    lat: 33.086,
    lng: 35.104,
    color: "#0984e3",
    region: "galilee",
    facts: [
      "أقصى نقطة في شمال فلسطين على ساحل البحر الأبيض المتوسط",
      "تشتهر بمغاراتها البحرية الطبيعية الخلابة المنحوتة في الصخور",
      "كانت نقطة حدودية هامة بين فلسطين ولبنان منذ الانتداب البريطاني",
      "تتميز بمنحدراتها الصخرية البيضاء الشاهقة المطلة على البحر",
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Rosh_HaNikra_grottoes.jpg/800px-Rosh_HaNikra_grottoes.jpg",
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
