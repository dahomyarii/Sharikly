// frontend/components/LocaleProvider.tsx
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type Lang = "en" | "ar";
type TFn = (key: string) => string;

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Navigation & Header
    home: "Home",
    hero_title: "Rent almost anything near you",
    hero_sub: "Cameras, lenses, gear, and more—save money and reduce waste.",
    list_item: "List an item",
    browse: "Browse items",
    sign_in: "Sign in",
    sign_up: "Sign up",
    join_us: "Join Us",
    about_us: "About Us",
    contact_us: "Contact Us",
    blog: "Blog",
    careers: "Careers",

    // Authentication
    login: "Log in",
    logout: "Log out",
    login_or_register: "Login or Register",
    create_account: "Create Account",
    welcome_back: "Welcome Back",
    dont_have_account: "Don't have an account?",
    already_have_account: "Already have an account?",
    signup_here: "Sign up here",
    login_here: "Log in here",
    signup_success:
      "Account created! Please check your email to verify your account.",
    login_failed: "Login failed",
    signup_failed: "Signup failed",
    password: "Password",
    confirm_password: "Confirm Password",
    phone_number: "Phone Number",
    phone: "Phone",
    verify_email: "Verify Email",
    email_verification: "Email Verification",
    verification_code: "Verification Code",
    resend_code: "Resend Code",
    resend_verification_email: "Resend verification email",
    resend_verification_sent: "If your email is not verified, we've sent a new link. Check your inbox.",
    forgot_password: "Forgot password?",
    reset_password: "Reset password",
    reset_password_sent: "If an account exists with this email, you will receive a password reset link.",
    password_reset_success: "Password has been reset. You can now log in.",

    // Form Fields
    email: "Email",
    username: "Username",
    password_label: "Password",
    new_password: "New Password",
    current_password: "Current Password",
    city: "City",
    description: "Description",
    title: "Title",
    price: "Price",
    category: "Category",
    location: "Location",
    address: "Address",

    // Listings
    listings: "Listings",
    my_listings: "My Listings",
    // view: "View", // Removed duplicate
    edit_listing: "Edit Listing",
    delete_listing: "Delete Listing",
    list_new: "List an item",
    search_listings: "Search by title, description, or location",
    browse_and_find: "Browse and find services, rentals, and more.",
    no_listings_found: "No listings found",
    failed_load_listings: "Failed to load listings",
    request_book: "Request booking",
    price_per_day: "/day",
    featured: "Featured",
    hot_services: "Hot Services",
    recommendations: "Recommendations",
    all_categories: "All Categories",
    sort_newest: "Newest",
    sort_price_low: "Price: low to high",
    sort_price_high: "Price: high to low",
    min_price: "Min price",
    max_price: "Max price",

    // Favorites
    favorites: "Favorites",
    my_favorites: "My Favorites",
    add_favorite: "Add to Favorites",
    remove_favorite: "Remove from Favorites",
    no_favorites: "You haven't added any listings to your favorites yet.",
    please_login_favorites: "Please login to add favorites",

    // Profile & Account
    profile: "Profile",
    // view: "عرض", // Removed duplicate
    edit_profile: "Edit Profile",
    account: "Account",
    account_settings: "Account Settings",
    preferences: "Preferences",
    settings: "Settings",
    bio: "Bio",
    avatar: "Avatar",
    change_avatar: "Change Avatar",

    // Password & Security
    change_password: "Change Password",
    password_changed: "Password changed successfully",
    change_password_success: "Your password has been changed successfully",
    password_mismatch: "Passwords do not match",
    invalid_password: "Invalid password",

    // Account Deletion
    danger_zone: "Danger Zone",
    delete_account: "Delete Account",
    delete_account_warning:
      "This action is permanent and cannot be undone. All your data, listings, and messages will be deleted.",
    type_password_to_confirm: "Enter your password to confirm",
    confirm_delete: "Yes, Delete My Account",
    account_deleted: "Account deleted successfully",

    // Common Actions
    save: "Save",
    save_changes: "Save Changes",
    cancel: "Cancel",
    report: "Report",
    report_listing: "Report listing",
    report_user: "Report user",
    report_reason: "Reason",
    report_details: "Additional details (optional)",
    report_submit: "Submit report",
    report_success: "Report submitted. We'll review it shortly.",
    report_reason_spam: "Spam",
    report_reason_inappropriate: "Inappropriate content",
    report_reason_scam: "Scam or fraud",
    report_reason_harassment: "Harassment",
    report_reason_other: "Other",
    block_user: "Block user",
    unblock_user: "Unblock",
    block_user_confirm: "Block this user? They won't see you in chat or be able to message you.",
    blocked_users: "Blocked users",
    loading: "Loading...",
    saving: "Saving...",
    delete: "Delete",
    edit: "Edit",
    // view: "View", // Removed duplicate
    close: "Close",
    back: "Back",
    next: "Next",
    previous: "Previous",
    submit: "Submit",
    send: "Send",
    clear: "Clear",

    // Messages & Notifications
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Info",
    profile_updated: "Profile updated successfully",
    changes_saved: "Changes saved successfully",
    failed_to_save: "Failed to save changes",
    please_login: "Please login to continue",
    redirecting_login: "Redirecting to login...",

    // Language
    language: "Language",
    english: "English",
    arabic: "Arabic",
    select_language: "Select Language",

    // Pages
    about: "About",
    about_ekra: "About EKRA",
    our_mission: "Our Mission",
    why_ekra: "Why EKRA?",
    mission_text:
      "We believe in empowering communities through sharing. Our platform makes it easy for people to rent, share, and earn from their unused items and services.",
    safe_transactions: "Safe and secure transactions",
    easy_to_use: "Easy to use platform",
    community_driven: "Community-driven approach",
    verified_sellers: "Verified sellers and renters",
    ekra_description:
      "EKRA is a peer-to-peer marketplace connecting people who want to share services and items.",

    // Search
    search: "Search",
    search_placeholder: "Search...",
    filter: "Filter",
    filter_results: "Filter Results",

    // Chat & Messages
    messages: "Messages",
    chat: "Chat",
    send_message: "Send Message",
    message: "Message",
    reply: "Reply",
    no_messages: "No messages yet",

    // Booking
    booking: "Booking",
    request_booking: "Request booking",
    my_bookings: "My Bookings",
    confirm_booking: "Confirm Booking",
    cancel_booking: "Cancel Booking",
    booking_confirmed: "Booking confirmed successfully",

    // Ratings & Reviews
    rating: "Rating",
    review: "Review",
    reviews: "Reviews",
    leave_review: "Leave a Review",
    no_reviews: "No reviews yet",
    lender: "Lender",
    book_now: "Book Now",
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
    loading_favorites: "Loading your favorites...",
    something_went_wrong: "Something went wrong",
  },
  ar: {
    // Navigation & Header
    home: "الرئيسية",
    hero_title: "استأجر أي شيء بالقرب منك",
    hero_sub: "كاميرات، عدسات، معدات والمزيد — وفّر المال وقلّل الهدر.",
    list_item: "أضف إعلانًا",
    browse: "تصفح العناصر",
    sign_in: "تسجيل الدخول",
    sign_up: "إنشاء حساب",
    join_us: "انضم إلينا",
    about_us: "عن الموقع",
    contact_us: "اتصل بنا",
    blog: "المدونة",
    careers: "الوظائف",

    // Authentication
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    login_or_register: "تسجيل الدخول أو التسجيل",
    create_account: "إنشاء حساب",
    welcome_back: "أهلا بعودتك",
    dont_have_account: "ليس لديك حساب؟",
    already_have_account: "هل لديك حساب بالفعل؟",
    signup_here: "إنشاء حساب جديد",
    login_here: "تسجيل الدخول",
    signup_success:
      "تم إنشاء الحساب! يرجى التحقق من بريدك الإلكتروني للتحقق من الحساب.",
    login_failed: "فشل تسجيل الدخول",
    signup_failed: "فشل إنشاء الحساب",
    password: "كلمة المرور",
    confirm_password: "تأكيد كلمة المرور",
    phone_number: "رقم الهاتف",
    phone: "الهاتف",
    verify_email: "تحقق من البريد الإلكتروني",
    email_verification: "التحقق من البريد الإلكتروني",
    verification_code: "رمز التحقق",
    resend_code: "إعادة إرسال الرمز",
    resend_verification_email: "إعادة إرسال بريد التحقق",
    resend_verification_sent: "إذا لم يكن بريدك موثقاً، أرسلنا رابطاً جديداً. تحقق من صندوق الوارد.",
    forgot_password: "نسيت كلمة المرور؟",
    reset_password: "إعادة تعيين كلمة المرور",
    reset_password_sent: "إذا وجد حساب بهذا البريد، ستتلقى رابط إعادة تعيين كلمة المرور.",
    password_reset_success: "تم إعادة تعيين كلمة المرور. يمكنك تسجيل الدخول الآن.",

    // Form Fields
    email: "البريد الإلكتروني",
    username: "اسم المستخدم",
    password_label: "كلمة المرور",
    new_password: "كلمة المرور الجديدة",
    current_password: "كلمة المرور الحالية",
    city: "المدينة",
    description: "الوصف",
    title: "العنوان",
    price: "السعر",
    category: "الفئة",
    location: "الموقع",
    address: "العنوان",

    // Listings
    listings: "الإعلانات",
    my_listings: "إعلاناتي",
    create_listing: "إنشاء إعلان",
    edit_listing: "تعديل الإعلان",
    delete_listing: "حذف الإعلان",
    list_new: "أضف إعلانًا",
    search_listings: "ابحث حسب العنوان أو الوصف أو الموقع",
    browse_and_find: "تصفح والعثور على الخدمات والمقاول والمزيد.",
    no_listings_found: "لم يتم العثور على إعلانات",
    failed_load_listings: "فشل تحميل الإعلانات",
    request_book: "طلب الحجز",
    price_per_day: "/يومي",
    featured: "المميزة",
    hot_services: "الخدمات الشهيرة",
    recommendations: "التوصيات",
    all_categories: "جميع الفئات",
    sort_newest: "الأحدث",
    sort_price_low: "السعر: من الأقل إلى الأعلى",
    sort_price_high: "السعر: من الأعلى إلى الأقل",
    min_price: "الحد الأدنى للسعر",
    max_price: "الحد الأقصى للسعر",

    // Favorites
    favorites: "المفضلة",
    my_favorites: "مفضلاتي",
    add_favorite: "أضف إلى المفضلة",
    remove_favorite: "إزالة من المفضلة",
    no_favorites: "لم تضف أي إعلانات إلى مفضلاتك بعد.",
    please_login_favorites: "يرجى تسجيل الدخول لإضافة المفضلة",

    // Profile & Account
    profile: "الملف الشخصي",
    my_profile: "ملفي الشخصي",
    edit_profile: "تعديل الملف الشخصي",
    account: "الحساب",
    account_settings: "إعدادات الحساب",
    preferences: "التفضيلات",
    settings: "الإعدادات",
    bio: "نبذة عنك",
    avatar: "الصورة الشخصية",
    change_avatar: "تغيير الصورة الشخصية",

    // Password & Security
    change_password: "تغيير كلمة المرور",
    password_changed: "تم تغيير كلمة المرور بنجاح",
    change_password_success: "تم تغيير كلمة المرور بنجاح",
    password_mismatch: "كلمات المرور غير متطابقة",
    invalid_password: "كلمة المرور غير صحيحة",

    // Account Deletion
    danger_zone: "منطقة الخطر",
    delete_account: "حذف الحساب",
    delete_account_warning:
      "هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم حذف جميع بياناتك وإعلاناتك ورسائلك.",
    type_password_to_confirm: "أدخل كلمة المرور للتأكيد",
    confirm_delete: "نعم، احذف حسابي",
    account_deleted: "تم حذف الحساب بنجاح",

    // Common Actions
    save: "حفظ",
    save_changes: "حفظ التغييرات",
    cancel: "إلغاء",
    report: "إبلاغ",
    report_listing: "الإبلاغ عن الإعلان",
    report_user: "الإبلاغ عن المستخدم",
    report_reason: "السبب",
    report_details: "تفاصيل إضافية (اختياري)",
    report_submit: "إرسال البلاغ",
    report_success: "تم إرسال البلاغ. سنراجعه قريباً.",
    report_reason_spam: "رسائل مزعجة",
    report_reason_inappropriate: "محتوى غير لائق",
    report_reason_scam: "احتيال أو غش",
    report_reason_harassment: "مضايقة",
    report_reason_other: "أخرى",
    block_user: "حظر المستخدم",
    unblock_user: "إلغاء الحظر",
    block_user_confirm: "حظر هذا المستخدم؟ لن يتمكن من رؤيتك في المحادثات أو مراسلتك.",
    blocked_users: "المستخدمون المحظورون",
    loading: "جارٍ التحميل...",
    saving: "جارٍ الحفظ...",
    delete: "حذف",
    edit: "تعديل",
    // view: "عرض", // Removed duplicate
    close: "إغلاق",
    back: "رجوع",
    next: "التالي",
    previous: "السابق",
    submit: "إرسال",
    send: "إرسال",
    clear: "مسح",

    // Messages & Notifications
    success: "نجح",
    error: "خطأ",
    warning: "تحذير",
    info: "معلومة",
    profile_updated: "تم تحديث الملف الشخصي بنجاح",
    changes_saved: "تم حفظ التغييرات بنجاح",
    failed_to_save: "فشل حفظ التغييرات",
    please_login: "يرجى تسجيل الدخول للمتابعة",
    redirecting_login: "جارٍ إعادة التوجيه إلى صفحة الدخول...",

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
