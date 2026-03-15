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
  const hideFooter = pathname.startsWith("/chat/");
  const mainClassName = hideFooter
    ? "flex-1 min-h-[50vh]"
    : "flex-1 min-h-[50vh] main-mobile-pb";

  return (
    <LocaleProvider>
      <Providers>
        <Header />
        <EmailVerificationBanner />
        <main id="main-content" className={mainClassName} tabIndex={-1}>
          {children}
        </main>
        {!hideFooter && <Footer />}
      </Providers>
    </LocaleProvider>
  );
}
