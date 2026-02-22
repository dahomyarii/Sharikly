'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Mail } from 'lucide-react'

const DISMISS_STORAGE_KEY = 'emailVerifyBannerDismissedUntil'
const DISMISS_HOURS = 24

export default function EmailVerificationBanner() {
  const [visible, setVisible] = useState(false)
  const [user, setUser] = useState<{ is_email_verified?: boolean } | null>(null)

  useEffect(() => {
    const load = () => {
      if (typeof window === 'undefined') return
      try {
        const raw = localStorage.getItem('user')
        const token = localStorage.getItem('access_token')
        if (!raw || !token) {
          setVisible(false)
          setUser(null)
          return
        }
        const u = JSON.parse(raw)
        setUser(u)
        if (u?.is_email_verified) {
          setVisible(false)
          return
        }
        const dismissedUntil = parseInt(localStorage.getItem(DISMISS_STORAGE_KEY) ?? '0', 10)
        if (Date.now() < dismissedUntil) {
          setVisible(false)
          return
        }
        setVisible(true)
      } catch {
        setVisible(false)
      }
    }

    load()
    window.addEventListener('userLogin', load)
    window.addEventListener('userLogout', () => setVisible(false))
    return () => {
      window.removeEventListener('userLogin', load)
      window.removeEventListener('userLogout', () => setVisible(false))
    }
  }, [])

  const handleDismiss = () => {
    const until = Date.now() + DISMISS_HOURS * 60 * 60 * 1000
    localStorage.setItem(DISMISS_STORAGE_KEY, String(until))
    setVisible(false)
  }

  if (!visible || !user) return null

  return (
    <div
      role="banner"
      className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap text-sm"
    >
      <Mail className="h-4 w-4 flex-shrink-0" aria-hidden />
      <span>
        Please verify your email to get the most out of your account.
      </span>
      <Link
        href="/auth/resend-verification"
        className="font-medium underline hover:no-underline"
      >
        Resend verification email
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        className="ml-auto p-1 rounded hover:bg-amber-100 transition"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
