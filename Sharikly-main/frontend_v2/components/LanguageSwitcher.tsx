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
      className="inline-flex items-center justify-center px-3.5 py-2 rounded-full border border-white/60 bg-background/90 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/70 transition-colors min-w-[44px] min-h-[40px] shadow-sm"
      aria-label={lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
    >
      {lang === 'en' ? 'EN' : 'AR'}
    </button>
  )
}
