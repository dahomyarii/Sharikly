'use client'
import Link from 'next/link'
import { Mail, Phone, MapPin, Instagram, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 md:pb-10 md:pt-8">
      <div className="marketplace-shell">
        <div className="surface-panel overflow-hidden rounded-[22px] border border-white/65 bg-card/95 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.10)] sm:rounded-[26px] sm:p-5 lg:p-6">
          <div className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:mb-6 sm:gap-5 sm:pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 flex items-center gap-3">
                <img src="/logo.png" alt="EKRA" className="h-10 w-10" />
                <div>
                  <h2 className="text-xl font-black tracking-tight text-foreground">
                    Ekra
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Rent smarter. Earn from what you already own.
                  </p>
                </div>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Discover trusted rentals near you, book with confidence, and turn unused items
                into steady income for your community.
              </p>
            </div>
            <div className="glass-panel rounded-[24px] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Contact
              </p>
              <div className="mt-2.5 space-y-2.5 text-sm text-foreground">
                <a href="mailto:support@ekra.com" className="flex items-center gap-3 hover:text-primary">
                  <Mail className="h-4 w-4 text-primary" />
                  support@ekra.com
                </a>
                <a href="tel:+966542921670" className="flex items-center gap-3 hover:text-primary">
                  <Phone className="h-4 w-4 text-primary" />
                  +966 54 292 1670
                </a>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  Riyadh, Saudi Arabia
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground md:text-left">
                Marketplace
              </h3>
              <ul className="space-y-3 text-center text-sm md:text-left">
                <li><Link href="/listings" className="hover:text-primary">Browse listings</Link></li>
                <li><Link href="/listings/new" className="hover:text-primary">List your item</Link></li>
                <li><Link href="/favorites" className="hover:text-primary">Saved items</Link></li>
                <li><Link href="/community-earnings" className="hover:text-primary">Community earnings</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground md:text-left">
                Company
              </h3>
              <ul className="space-y-3 text-center text-sm md:text-left">
                <li><Link href="/about" className="hover:text-primary">About</Link></li>
                <li><Link href="/how-it-works" className="hover:text-primary">How it works</Link></li>
                <li><Link href="/careers" className="hover:text-primary">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-primary">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground md:text-left">
                Support
              </h3>
              <ul className="space-y-3 text-center text-sm md:text-left">
                <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-primary">Privacy policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary">Terms of service</Link></li>
                <li><Link href="/sitemap.xml" className="hover:text-primary">Sitemap</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground md:text-left">
                Follow us
              </h3>
              <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                <Link
                  href="https://instagram.com/ekra.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ekra on Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/85 shadow-sm transition hover:bg-accent/70"
                >
                  <Instagram className="h-4 w-4" />
                </Link>
                <Link
                  href="https://linkedin.com/company/ekra"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ekra on LinkedIn"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/85 shadow-sm transition hover:bg-accent/70"
                >
                  <Linkedin className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5 text-center text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:text-left">
            <p>&copy; 2026 EKRA. All rights reserved.</p>
            <p>Built for trusted local renting across Saudi Arabia.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
