import type { Metadata } from "next";

export { useBackgroundMusicContext } from "@/app/components/ClientProviders";

export const metadata: Metadata = {
  title: "عالم مدحت - Medhat's World",
  description: "تعلم عن فلسطين مع مدحت - الألعاب والقصص والمحادثات - Learn about Palestine with Medhat",
  alternates: { canonical: "/kids" },
};

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
