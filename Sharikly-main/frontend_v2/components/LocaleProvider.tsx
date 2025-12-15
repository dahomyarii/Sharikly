// frontend/components/LocaleProvider.tsx
'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'

type Lang = 'en' | 'ar' | 'es'
type TFn = (key: string) => string

const translations: Record<Lang, Record<string, string>> = {
  en: {
    hero_title: 'Rent almost anything near you',
    hero_sub: 'Cameras, lenses, gear, and more—save money and reduce waste.',
    list_item: 'List an item',
    browse: 'Browse items',
    sign_in: 'Sign in',
    sign_up: 'Sign up',
    price_per_day: '/day',
    city: 'City',
    description: 'Description',
    save: 'Save',
    login: 'Log in',
    logout: 'Log out',
    list_new: 'List an item',
    request_book: 'Request booking',
  },
  ar: {
    hero_title: 'استأجر أي شيء بالقرب منك',
    hero_sub: 'كاميرات، عدسات، معدات والمزيد — وفّر المال وقلّل الهدر.',
    list_item: 'أضف إعلانًا',
    browse: 'تصفح العناصر',
    sign_in: 'تسجيل الدخول',
    sign_up: 'إنشاء حساب',
    price_per_day: '/يومي',
    city: 'المدينة',
    description: 'الوصف',
    save: 'حفظ',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    list_new: 'أضف إعلانًا',
    request_book: 'طلب الحجز',
  },
  es: {
    hero_title: 'Alquila casi cualquier cosa cerca de ti',
    hero_sub: 'Cámaras, lentes, equipo y más—ahorra dinero y reduce el desperdicio.',
    list_item: 'Publicar un artículo',
    browse: 'Explorar artículos',
    sign_in: 'Iniciar sesión',
    sign_up: 'Registrarse',
    price_per_day: '/día',
    city: 'Ciudad',
    description: 'Descripción',
    save: 'Guardar',
    login: 'Iniciar sesión',
    logout: 'Cerrar sesión',
    list_new: 'Publicar artículo',
    request_book: 'Solicitar reserva',
  },
}

const LocaleContext = createContext<{
  lang: Lang
  setLang: (l: Lang) => void
  t: TFn
}>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
})

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const [ready, setReady] = useState(false)

  // read saved language on first client render
  useEffect(() => {
    try {
      const saved = (localStorage.getItem('locale') as Lang) || null
      if (saved && ['en', 'ar', 'es'].includes(saved)) setLang(saved)
    } catch (e) {}
    setReady(true)
  }, [])

  // whenever lang changes, set html dir & lang attr and persist
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
      try {
        localStorage.setItem('locale', lang)
      } catch (e) {}
    }
  }, [lang])

  const t: TFn = (key) => {
    return translations[lang][key] ?? translations['en'][key] ?? key
  }

  if (!ready) return null // prevents flash

  return (
    <LocaleContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export const useLocale = () => useContext(LocaleContext)
