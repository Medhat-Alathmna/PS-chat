const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ps-kids.school";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PS-Kids | تعلم مع مدحت - Learn with Medhat",
  description: "تطبيق تعليمي ممتع للأطفال عن فلسطين - An engaging educational app for kids about Palestine",
  url: SITE_URL,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
    audienceType: "children",
  },
  typicalAgeRange: "7-12",
  inLanguage: ["ar", "en"],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
