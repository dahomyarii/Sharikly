// frontend/components/LanguageSwitcher.tsx
'use client'
import React from 'react'
import { useLocale } from './LocaleProvider'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLocale()
  return (
    <div className="flex items-center gap-2">
      <button
        className={`px-2 py-1 rounded ${lang === 'en' ? 'bg-gray-900 text-white' : 'bg-transparent'}`}
        onClick={() => setLang('en')}
      >
        EN
      </button>
      <button
        className={`px-2 py-1 rounded ${lang === 'ar' ? 'bg-gray-900 text-white' : 'bg-transparent'}`}
        onClick={() => setLang('ar')}
      >
        AR
      </button>
    </div>
  )
}
