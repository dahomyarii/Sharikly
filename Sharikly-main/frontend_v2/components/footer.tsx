// frontend/components/Footer.tsx
'use client'
import React from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 md:pb-10 md:pt-8">
      <div className="marketplace-shell">
        <div className="surface-panel relative overflow-hidden rounded-[26px] border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-background/70 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.10)] ring-1 ring-white/10 sm:rounded-[30px] sm:p-6 lg:p-8">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.12),transparent_45%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(59,130,246,0.10),transparent_55%)]" />
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
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Marketplace
              </h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/listings" className="hover:text-foreground">Browse listings</Link></li>
                <li><Link href="/listings/new" className="hover:text-foreground">List your item</Link></li>
                <li><Link href="/favorites" className="hover:text-foreground">Saved items</Link></li>
                <li><Link href="/community-earnings" className="hover:text-foreground">Community earnings</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Company
              </h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/how-it-works" className="hover:text-foreground">How it works</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Support
              </h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">Privacy policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms of service</Link></li>
                <li><Link href="/sitemap.xml" className="hover:text-foreground">Sitemap</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Follow us
              </h3>
              <div className="flex flex-wrap gap-3">
                <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/85 shadow-sm transition hover:bg-accent/70">
                  <Facebook className="h-4 w-4" />
                </Link>
                <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/85 shadow-sm transition hover:bg-accent/70">
                  <Twitter className="h-4 w-4" />
                </Link>
                <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/85 shadow-sm transition hover:bg-accent/70">
                  <Instagram className="h-4 w-4" />
                </Link>
                <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/85 shadow-sm transition hover:bg-accent/70">
                  <Linkedin className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>&copy; 2026 EKRA. All rights reserved.</p>
            <p>Built for trusted local renting across Saudi Arabia.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
