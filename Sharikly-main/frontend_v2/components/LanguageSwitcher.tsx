// frontend/components/LanguageSwitcher.tsx
'use client'
import React from 'react'
import { useLocale } from './LocaleProvider'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLocale()

  const toggleLang = () => {
    setLang(lang === 'en' ? 'ar' : 'en')
  }

  return (
    <button
      type="button"
      onClick={toggleLang}
      className="inline-flex items-center justify-center px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors min-w-[44px] min-h-[32px]"
      aria-label={lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
    >
      {lang === 'en' ? 'EN' : 'AR'}
    </button>
  )
}
