import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ekra.com";

export const metadata: Metadata = {
  title: "Browse Listings",
  description:
    "Browse and search rental listings. Rent cameras, lenses, gear, and more by the day. Find items near you on EKRA.",
  alternates: { canonical: `${APP_URL}/listings` },
  openGraph: {
    title: "Browse Listings | EKRA",
    description:
      "Browse and search rental listings. Rent cameras, lenses, gear, and more by the day.",
    url: `${APP_URL}/listings`,
    siteName: "EKRA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Listings | EKRA",
    description: "Browse and search rental listings. Rent what you need by the day.",
  },
};

export default function ListingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
