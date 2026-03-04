// frontend/components/Footer.tsx
'use client'
import React from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border text-muted-foreground py-8 sm:py-12 md:py-16 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mobile-content">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-8 sm:mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="mb-6 flex items-center gap-2">
              <img src="/logo.png" alt="EKRA" className="h-8 w-8" />
              <h2 className="text-foreground font-bold text-2xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                EKRA
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              A modern marketplace platform connecting buyers and sellers in your community.
            </p>
            <div className="flex gap-3">
              <Link href="#" className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
                <Facebook className="w-4 h-4" />
              </Link>
              <Link href="#" className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
                <Twitter className="w-4 h-4" />
              </Link>
              <Link href="#" className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
                <Instagram className="w-4 h-4" />
              </Link>
              <Link href="#" className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
                <Linkedin className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="text-foreground font-semibold mb-6 text-sm uppercase tracking-wider">Services</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/listings" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link href="/listings?filter=new" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
                  New Items
                </Link>
              </li>
              <li>
                <Link href="/listings?filter=featured" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
                  Featured Items
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
                  My Favorites
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-foreground font-semibold mb-6 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
                  Blog & News
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-foreground font-semibold mb-6 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy#cookies" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-foreground font-semibold mb-6 text-sm uppercase tracking-wider">Get in Touch</h3>
            <ul className="space-y-3">
              <li className="flex gap-3 items-start">
                <Mail className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <a href="mailto:support@ekra.com" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
                  support@ekra.com
                </a>
              </li>
              <li className="flex gap-3 items-start">
                <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <a href="tel:+966112345678" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm">
                    +966 54 292 1670
                </a>
              </li>
              <li className="flex gap-3 items-start">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground text-sm">
                  Riyadh, Saudi Arabia
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 EKRA. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/sitemap.xml" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
              Sitemap
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
