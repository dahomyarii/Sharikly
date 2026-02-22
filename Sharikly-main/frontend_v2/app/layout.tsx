import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { LocaleProvider } from "@/components/LocaleProvider";
import { Providers } from "@/components/Providers";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";

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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ekra.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "EKRA — Rent What You Need, When You Need It",
    template: "%s | EKRA",
  },
  description:
    "Rent cameras, lenses, gear, and more near you. Save money and reduce waste. Browse listings, book items by the day, and list your own. The modern rental marketplace.",
  keywords: [
    "rent",
    "rental",
    "marketplace",
    "rent equipment",
    "rent camera",
    "rent gear",
    "rent near me",
    "daily rental",
    "EKRA",
  ],
  authors: [{ name: "EKRA", url: APP_URL }],
  creator: "EKRA",
  publisher: "EKRA",
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "EKRA",
    title: "EKRA — Rent What You Need, When You Need It",
    description:
      "Rent cameras, lenses, gear, and more near you. Save money and reduce waste. Browse listings and book by the day.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "EKRA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EKRA — Rent What You Need, When You Need It",
    description:
      "Rent cameras, lenses, gear, and more near you. Save money and reduce waste.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
  alternates: { canonical: APP_URL },
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
        {/* Structured data for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${APP_URL}/#organization`,
                  name: "EKRA",
                  url: APP_URL,
                  logo: { "@type": "ImageObject", url: `${APP_URL}/logo.png` },
                  description:
                    "Rent what you need, when you need it. A modern rental marketplace.",
                },
                {
                  "@type": "WebSite",
                  "@id": `${APP_URL}/#website`,
                  url: APP_URL,
                  name: "EKRA",
                  description:
                    "Rent cameras, lenses, gear, and more near you. Save money and reduce waste.",
                  publisher: { "@id": `${APP_URL}/#organization` },
                  inLanguage: "en-US",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: { "@type": "EntryPoint", urlTemplate: `${APP_URL}/listings?search={search_term_string}` },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <a
          href="#main-content"
          className="sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gray-900 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 focus:w-auto focus:h-auto focus:m-0 focus:overflow-visible focus:[clip:auto] focus:whitespace-normal"
        >
          Skip to main content
        </a>
        <LocaleProvider>
          <Providers>
            <Header />
            <EmailVerificationBanner />
            <main id="main-content" className="flex-1 min-h-[50vh] main-mobile-pb" tabIndex={-1}>{children}</main>
            <Footer />
          </Providers>
        </LocaleProvider>
        
      </body>
    </html>
  );
}
