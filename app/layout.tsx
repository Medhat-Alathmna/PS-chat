import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic, Cairo, Tajawal, Changa } from "next/font/google";
import "./globals.css";
import ClientProviders from "./components/ClientProviders";
import JsonLd from "./components/JsonLd";

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

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

const changa = Changa({
  variable: "--font-changa",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ps-kids.school";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PS-Kids | تعلم مع مدحت - Learn with Medhat",
    template: "%s | PS-Kids",
  },
  description: "تطبيق تعليمي ممتع للأطفال عن فلسطين - An engaging educational app for kids about Palestine",
  keywords: ["فلسطين", "تعليم أطفال", "Palestine", "kids education", "مدحت", "ألعاب تعليمية", "educational games"],
  authors: [{ name: "PS-Kids" }],
  openGraph: {
    type: "website",
    locale: "ar_SA",
    alternateLocale: "en_US",
    siteName: "PS-Kids",
    title: "PS-Kids | تعلم مع مدحت",
    description: "تطبيق تعليمي ممتع للأطفال عن فلسطين",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PS-Kids - تعلم مع مدحت" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PS-Kids | تعلم مع مدحت",
    description: "تطبيق تعليمي ممتع للأطفال عن فلسطين",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#6C5CE7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} ${cairo.variable} ${tajawal.variable} ${changa.variable} antialiased font-[family-name:var(--font-arabic)]`}
        suppressHydrationWarning
      >
        <JsonLd />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
