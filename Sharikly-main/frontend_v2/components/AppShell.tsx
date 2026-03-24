'use client'

import Header from "@/components/header";
import Footer from "@/components/footer";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { LocaleProvider } from "@/components/LocaleProvider";
import { Providers } from "@/components/Providers";
import { usePathname } from "next/navigation";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const isChatFullscreen = pathname === "/chat" || pathname.startsWith("/chat/");
  if (isChatFullscreen) {
    return (
      <LocaleProvider>
        <Providers>
          <main id="main-content" className="flex-1 h-[100svh] overflow-hidden bg-background" tabIndex={-1}>
            {children}
          </main>
        </Providers>
      </LocaleProvider>
    );
  }

  return (
    <LocaleProvider>
      <Providers>
        <Header />
        <EmailVerificationBanner />
        <main id="main-content" className="flex-1 min-h-[50vh] main-mobile-pb" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </Providers>
    </LocaleProvider>
  );
}
