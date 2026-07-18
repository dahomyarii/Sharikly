// frontend/components/LocaleProvider.tsx
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";


type Lang = "en" | "ar";
type TFn = (key: string) => string;
const translations = {
  en: {
    // General
    welcome_back: "Welcome back",
    get_started: "Get started",
    home: "Home",
    explore: "Explore",
    notifications: "Notifications",
    no_notifications: "No notifications yet",

    // Language
    language: "Language",
    english: "English",
    arabic: "Arabic",
    select_language: "Select language",

    // Pages
    about: "About",
    about_ekra: "About EKRA",
    our_mission: "Our mission",
    why_ekra: "Why EKRA?",
    mission_text:
      "We believe in empowering communities through sharing. Our platform makes it easy for people to rent and share items and services.",
    safe_transactions: "Safe and trusted transactions",
    easy_to_use: "Easy-to-use platform",
    community_driven: "Community-driven approach",
    verified_sellers: "Verified sellers and customers",
    ekra_description:
      "EKRA is a peer-to-peer marketplace connecting people who want to share services and items.",

    // Search
    search: "Search",
    search_placeholder: "Search...",
    filter: "Filter",
    filter_results: "Filter results",

    // Chat & Messages
    messages: "Messages",
    chat: "Chat",
    send_message: "Send message",
    message: "Message",
    reply: "Reply",
    no_messages: "No messages yet",

    // Booking
    booking: "Booking",
    request_booking: "Request booking",
    my_bookings: "My bookings",
    confirm_booking: "Confirm booking",
    cancel_booking: "Cancel booking",
    booking_confirmed: "Booking confirmed successfully",

    // Ratings & Reviews
    rating: "Rating",
    review: "Review",
    reviews: "Reviews",
    leave_review: "Leave a review",
    no_reviews: "No reviews yet",
    lender: "Lender",
    book_now: "Book now",
    // view: "View", // Removed duplicate
    listing: "Listing",

    // Categories
    cameras: "Cameras",
    lenses: "Lenses",
    gear: "Gear",
    tools: "Tools",
    furniture: "Furniture",
    clothing: "Clothing",
    electronics: "Electronics",

    // Misc
    loading_favorites: "Loading favorites...",
    something_went_wrong: "Something went wrong",
  },
  ar: {
    // General
    welcome_back: "أهلاً بعودتك",
    get_started: "ابدأ الآن",
    home: "الرئيسية",
    explore: "استكشف",
    notifications: "الإشعارات",
    no_notifications: "لا توجد إشعارات بعد",

    // Language
    language: "اللغة",
    english: "الإنجليزية",
    arabic: "العربية",
    select_language: "اختر اللغة",

    // Pages
    about: "عن",
    about_ekra: "عن EKRA",
    our_mission: "مهمتنا",
    why_ekra: "لماذا EKRA؟",
    mission_text:
      "نؤمن بتمكين المجتمعات من خلال المشاركة. تجعل منصتنا من السهل على الناس استئجار ومشاركة وكسب المال من عناصرهم والخدمات غير المستخدمة.",
    safe_transactions: "معاملات آمنة وموثوقة",
    easy_to_use: "منصة سهلة الاستخدام",
    community_driven: "نهج موجه للمجتمع",
    verified_sellers: "بائعون وعملاء معتمدون",
    ekra_description:
      "EKRA هي سوق نظير إلى نظير تربط الأشخاص الذين يرغبون في مشاركة الخدمات والعناصر.",

    // Search
    search: "بحث",
    search_placeholder: "ابحث...",
    filter: "تصفية",
    filter_results: "تصفية النتائج",

    // Chat & Messages
    messages: "الرسائل",
    chat: "الدردشة",
    send_message: "إرسال رسالة",
    message: "رسالة",
    reply: "رد",
    no_messages: "لا توجد رسائل بعد",

    // Booking
    booking: "الحجز",
    request_booking: "طلب الحجز",
    my_bookings: "حجوزاتي",
    confirm_booking: "تأكيد الحجز",
    cancel_booking: "إلغاء الحجز",
    booking_confirmed: "تم تأكيد الحجز بنجاح",

    // Ratings & Reviews
    rating: "التقييم",
    review: "التقييم",
    reviews: "التقييمات",
    leave_review: "اترك تقييمًا",
    no_reviews: "لا توجد تقييمات بعد",
    lender: "المُؤجّر",
    book_now: "احجز الآن",
    // view: "عرض", // Removed duplicate
    listing: "الإعلان",

    // Categories
    cameras: "الكاميرات",
    lenses: "العدسات",
    gear: "المعدات",
    tools: "الأدوات",
    furniture: "الأثاث",
    clothing: "الملابس",
    electronics: "الإلكترونيات",

    // Misc
    loading_favorites: "جارٍ تحميل المفضلة...",
    something_went_wrong: "حدث خطأ ما",
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
    const k = key as keyof typeof translations["en"];
    return translations[lang][k] ?? translations["en"][k] ?? key;
  };

  if (!ready) return null; // prevents flash

  return (
    <LocaleContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
