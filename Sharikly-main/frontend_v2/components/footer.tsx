// frontend/components/Footer.tsx
'use client'
import React from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="pb-[calc(7rem+env(safe-area-inset-bottom))] pt-8 md:pb-14 md:pt-10">
      <div className="marketplace-shell">
        <div className="surface-panel overflow-hidden rounded-[32px] border border-white/65 bg-card/95 p-5 sm:rounded-[36px] sm:p-8 lg:p-10">
          <div className="mb-6 flex flex-col gap-5 border-b border-border pb-6 sm:mb-8 sm:gap-6 sm:pb-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="mb-4 flex items-center gap-3">
                <img src="/logo.png" alt="EKRA" className="h-11 w-11" />
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    Ekra
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Rent smarter. Earn from what you already own.
                  </p>
                </div>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                Discover trusted rentals near you, book with confidence, and turn unused items
                into steady income for your community.
              </p>
            </div>
            <div className="glass-panel rounded-[28px] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Contact
              </p>
              <div className="mt-3 space-y-3 text-sm text-foreground">
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
                <Link href="#" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/85 shadow-sm transition hover:bg-accent/70">
                  <Facebook className="h-4 w-4" />
                </Link>
                <Link href="#" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/85 shadow-sm transition hover:bg-accent/70">
                  <Twitter className="h-4 w-4" />
                </Link>
                <Link href="#" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/85 shadow-sm transition hover:bg-accent/70">
                  <Instagram className="h-4 w-4" />
                </Link>
                <Link href="#" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/85 shadow-sm transition hover:bg-accent/70">
                  <Linkedin className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>&copy; 2026 EKRA. All rights reserved.</p>
            <p>Built for trusted local renting across Saudi Arabia.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
