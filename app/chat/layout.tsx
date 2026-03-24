import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "محادثة مع مدحت - Chat with Medhat",
  description: "تحدث مع مدحت واسأله عن فلسطين - Chat with Medhat and learn about Palestine",
  alternates: { canonical: "/chat" },
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
