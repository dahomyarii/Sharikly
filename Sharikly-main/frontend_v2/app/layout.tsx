import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { LocaleProvider } from "@/components/LocaleProvider";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EKRA",
  description: "Rent what you need, when you need it",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload LCP image (hero) for faster First Contentful Paint / LCP on mobile */}
        <link rel="preload" href="/image.jpeg" as="image" />
        <link rel="preload" href="/logo.png" as="image" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LocaleProvider>
          <Providers>
            <Header />
            <main className="flex-1 min-h-[50vh] main-mobile-pb">{children}</main>
            <Footer />
          </Providers>
        </LocaleProvider>
        
      </body>
    </html>
  );
}
