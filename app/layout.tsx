import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#009736" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
};

export const metadata: Metadata = {
  title: "فلسطين Chat | Falastin Assistant - مساعدك الذكي للتعرف على فلسطين",
  description:
    "تحدث مع مساعد ذكي متخصص في فلسطين. اكتشف التاريخ العريق، الثقافة الغنية، المدن التاريخية، والتراث الفلسطيني. Chat with an AI assistant specialized in Palestinian history, culture, and heritage.",
  keywords: [
    "فلسطين",
    "Palestine",
    "تاريخ فلسطين",
    "Palestinian history",
    "القدس",
    "Jerusalem",
    "الثقافة الفلسطينية",
    "Palestinian culture",
    "المسجد الأقصى",
    "Al-Aqsa Mosque",
    "التراث الفلسطيني",
    "Palestinian heritage",
    "نكبة",
    "Nakba",
    "chatbot",
    "AI assistant",
  ],
  authors: [{ name: "Falastin Assistant" }],
  creator: "Falastin Assistant",
  publisher: "Falastin Assistant",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_PS",
    alternateLocale: "en_US",
    title: "فلسطين Chat | Falastin Assistant",
    description:
      "مساعدك الذكي للتعرف على فلسطين - تاريخها، ثقافتها، جغرافيتها، وشعبها",
    siteName: "Falastin Assistant",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Falastin Assistant - فلسطين Chat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "فلسطين Chat | Falastin Assistant",
    description:
      "مساعدك الذكي للتعرف على فلسطين - تاريخها، ثقافتها، جغرافيتها، وشعبها",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var isDark = theme === 'dark' ||
                    ((!theme || theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} antialiased font-[family-name:var(--font-arabic)]`}
      >
        {children}
      </body>
    </html>
  );
}
