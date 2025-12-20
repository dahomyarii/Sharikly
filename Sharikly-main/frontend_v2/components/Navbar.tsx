// frontend/components/Navbar.tsx
'use client'
import Link from 'next/link'
import React from 'react'
import LanguageSwitcher from './LanguageSwitcher'
import { useLocale } from './LocaleProvider'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { t } = useLocale()
  const router = useRouter()
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      router.push('/')
    }
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">EKRA</Link>

        <div className="flex items-center gap-4">
          <Link href="/listings/new" className="px-3 py-1 rounded-full border">{t('list_item')}</Link>
          {token ? (
            <>
              <button onClick={handleLogout} className="px-3 py-1 rounded-full border">{t('logout')}</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="px-3 py-1 rounded-full border">{t('sign_in')}</Link>
              <Link href="/auth/signup" className="px-3 py-1 rounded-full border">{t('sign_up')}</Link>
            </>
          )}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
