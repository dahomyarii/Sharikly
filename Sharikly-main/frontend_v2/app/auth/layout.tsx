import type { Metadata } from "next";
import Header from "@/components/header";
import { LocaleProvider } from "@/components/LocaleProvider";
import FloatingChatButton from "@/components/FloatingChatButton";

export const metadata: Metadata = {
  title: "EKRA",
  description: "Rent what you need, when you need it",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <FloatingChatButton />
    </>
  );
}
