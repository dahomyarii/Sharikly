// frontend/components/LocaleProvider.tsx
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

import { translations, type Lang } from "./translations";

type TFn = (key: string) => string;

const LocaleContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFn;
}>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  // read saved language on first client render
  useEffect(() => {
    try {
      const saved = (localStorage.getItem("locale") as Lang) || null;
      if (saved && ["en", "ar"].includes(saved)) setLang(saved);
    } catch (e) {}
    setReady(true);
  }, []);

  // whenever lang changes, set html dir & lang attr and persist
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      try {
        localStorage.setItem("locale", lang);
      } catch (e) {}
    }
  }, [lang]);

  const t: TFn = (key) => {
    return translations[lang][key] ?? translations["en"][key] ?? key;
  };

  if (!ready) return null; // prevents flash

  return (
    <LocaleContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
