// frontend/components/LocaleProvider.tsx
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type Lang = "en" | "ar";
type TFn = (key: string) => string;

const translations: Record<Lang, Record<string, string>> = {
  en: {
    hero_title: "Rent almost anything near you",
    hero_sub: "Cameras, lenses, gear, and more—save money and reduce waste.",
    list_item: "List an item",
    browse: "Browse items",
    sign_in: "Sign in",
    sign_up: "Sign up",
    join_us: "Join Us",
    price_per_day: "/day",
    city: "City",
    description: "Description",
    save: "Save",
    login: "Log in",
    logout: "Log out",
    login_or_register: "Login or Register",
    list_new: "List an item",
    request_book: "Request booking",
    favorites: "Favorites",
    settings: "Settings",
    profile: "Profile",
    account: "Account",
    preferences: "Preferences",
    danger_zone: "Danger Zone",
    change_password: "Change Password",
    delete_account: "Delete Account",
    current_password: "Current Password",
    new_password: "New Password",
    confirm_password: "Confirm New Password",
    password_changed: "Password changed successfully",
    account_deleted: "Account deleted successfully",
    delete_account_warning: "This action is permanent and cannot be undone. All your data, listings, and messages will be deleted.",
    type_password_to_confirm: "Enter your password to confirm",
    cancel: "Cancel",
    confirm_delete: "Yes, Delete My Account",
    language: "Language",
    english: "English",
    arabic: "Arabic",
    email: "Email",
    username: "Username",
    bio: "Bio",
    saving: "Saving...",
    save_changes: "Save Changes",
    profile_updated: "Profile updated successfully",
  },
  ar: {
    hero_title: "استأجر أي شيء بالقرب منك",
    hero_sub: "كاميرات، عدسات، معدات والمزيد — وفّر المال وقلّل الهدر.",
    list_item: "أضف إعلانًا",
    browse: "تصفح العناصر",
    sign_in: "تسجيل الدخول",
    sign_up: "إنشاء حساب",
    join_us: "انضم إلينا",
    price_per_day: "/يومي",
    city: "المدينة",
    description: "الوصف",
    save: "حفظ",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    login_or_register: "تسجيل الدخول أو التسجيل",
    list_new: "أضف إعلانًا",
    request_book: "طلب الحجز",
    favorites: "المفضلة",
    settings: "الإعدادات",
    profile: "الملف الشخصي",
    account: "الحساب",
    preferences: "التفضيلات",
    danger_zone: "منطقة الخطر",
    change_password: "تغيير كلمة المرور",
    delete_account: "حذف الحساب",
    current_password: "كلمة المرور الحالية",
    new_password: "كلمة المرور الجديدة",
    confirm_password: "تأكيد كلمة المرور الجديدة",
    password_changed: "تم تغيير كلمة المرور بنجاح",
    account_deleted: "تم حذف الحساب بنجاح",
    delete_account_warning: "هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم حذف جميع بياناتك وإعلاناتك ورسائلك.",
    type_password_to_confirm: "أدخل كلمة المرور للتأكيد",
    cancel: "إلغاء",
    confirm_delete: "نعم، احذف حسابي",
    language: "اللغة",
    english: "الإنجليزية",
    arabic: "العربية",
    email: "البريد الإلكتروني",
    username: "اسم المستخدم",
    bio: "نبذة عنك",
    saving: "جارٍ الحفظ...",
    save_changes: "حفظ التغييرات",
    profile_updated: "تم تحديث الملف الشخصي بنجاح",
  },
};

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
