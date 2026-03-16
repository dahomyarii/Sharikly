"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Activity,
  ArrowRight,
  Archive,
  Bell,
  Calendar,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  CheckCheck,
  CircleDashed,
  Copy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Edit3,
  Eye,
  Hourglass,
  Flame,
  Inbox,
  LayoutDashboard,
  Loader2,
  LucideIcon,
  MessageCircle,
  Menu,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  PlusCircle,
  Package,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Trophy,
  Wallet,
  X,
  Zap,
  FileText,
  Clock3,
} from "lucide-react"

import axiosInstance from "@/lib/axios"
import { EarningsChart } from "@/components/earnings/EarningsChart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { formatCompactSar, formatSar, type LandlordEarningsDashboard } from "@/lib/earnings"
import { useLocale } from "@/components/LocaleProvider"

const API = process.env.NEXT_PUBLIC_API_BASE

const copy = {
  en: {
    eyebrow: "Landlord dashboard",
    title: "Earnings Dashboard",
    description:
      "Turn your landlord account into a small business inside the platform with live earnings, rankings, and growth hints.",
    loginPrompt: "Log in to see your earnings dashboard.",
    loginAction: "Go to login",
    totalEarnings: "Total earnings",
    monthEarnings: "This month's earnings",
    rentals: "Number of rentals",
    rating: "Rating",
    topItem: "Your highest earning item",
    chartTitle: "Earnings chart",
    chartDescription: "Track daily and monthly gross earnings from paid rentals.",
    daily: "Daily earnings",
    monthly: "Monthly earnings",
    chartEmpty: "Paid rentals will appear here once your earnings start coming in.",
    topHosts: "Top hosts this month",
    topRenters: "Top renters this month",
    rankingTitle: "Your ranking this month",
    rankingDescription: "See where you stand among active lessors on the platform.",
    superHostTitle: "Super Host title requirements",
    superHostDescription: "Unlock a gold badge, stronger trust, and better visibility in search.",
    qualified: "You qualify for Super Host",
    notQualified: "Keep going. You are building momentum.",
    benefits: "When you earn the title, you receive",
    listProduct: "Add another product",
    manageOrders: "Manage orders",
    noItem: "No earning item yet",
    rentersSpent: "Spent",
    unrated: "No public rating yet",
    nextMilestone: "Next milestone",
    unlockSuperHost: "Unlock SUPER HOST badge",
    topPercentage: "You are in the top",
    highestItemSubtitle: "earned",
    promoteItem: "Promote this item",
    topHostsCompact: "Top hosts",
    rentalDemand: "Rental demand signals",
    popularSearches: "Trending searches on Ekra",
    popularSearchesBody:
      "People are searching for these items on the platform. Add similar listings to improve your chances of getting rentals.",
    hostBadge: "hosts",
    moreActions: "More actions",
    rankFootnote: "Based on monthly earnings, rating, and rental activity.",
    localDemandHint: "Use these signals to decide what to list next.",
    noDemand: "Demand signals will appear here as the marketplace grows.",
    navigation: "Navigation",
    menu: "Menu",
    closeMenu: "Close menu",
    collapseSidebar: "Collapse sidebar",
    expandSidebar: "Expand sidebar",
    dashboardNav: "Dashboard",
    myItemsNav: "My Items",
    bookingsNav: "Bookings",
    allItemsNav: "All Items",
    addNewItemNav: "Add New Item",
    draftsNav: "Drafts",
    availabilityNav: "Availability / Calendar",
    pricingNav: "Pricing",
    analyticsNav: "Performance / Analytics",
    incomingNav: "Incoming",
    ongoingNav: "Ongoing",
    pastNav: "Past",
    allBookingsNav: "All Bookings",
    soon: "Soon",
  },
  ar: {
    eyebrow: "لوحة المؤجر",
    title: "لوحة الأرباح",
    description:
      "حوّل حساب المؤجر إلى مشروع صغير داخل المنصة من خلال الأرباح المباشرة والترتيب الشهري وفرص النمو.",
    loginPrompt: "سجّل الدخول لعرض لوحة الأرباح.",
    loginAction: "الذهاب لتسجيل الدخول",
    totalEarnings: "إجمالي الأرباح",
    monthEarnings: "أرباح هذا الشهر",
    rentals: "عدد التأجيرات",
    rating: "التقييم",
    topItem: "العنصر الأعلى ربحًا",
    chartTitle: "مخطط الأرباح",
    chartDescription: "تابع الأرباح اليومية والشهرية من التأجيرات المدفوعة.",
    daily: "الأرباح اليومية",
    monthly: "الأرباح الشهرية",
    chartEmpty: "ستظهر التأجيرات المدفوعة هنا عندما تبدأ أرباحك بالوصول.",
    topHosts: "أفضل المضيفين هذا الشهر",
    topRenters: "أفضل المستأجرين هذا الشهر",
    rankingTitle: "ترتيبك هذا الشهر",
    rankingDescription: "اعرف موقعك بين المؤجرين النشطين على المنصة.",
    superHostTitle: "متطلبات لقب المضيف المميز",
    superHostDescription: "احصل على شارة ذهبية وثقة أكبر وظهور أفضل في نتائج البحث.",
    qualified: "أنت مؤهل للقب المضيف المميز",
    notQualified: "استمر. أنت تبني زخمًا قويًا.",
    benefits: "عند حصولك على اللقب ستتلقى",
    listProduct: "أضف منتجًا جديدًا",
    manageOrders: "إدارة الطلبات",
    noItem: "لا يوجد عنصر رابح بعد",
    rentersSpent: "الإنفاق",
    unrated: "لا يوجد تقييم عام بعد",
    nextMilestone: "الهدف القادم",
    unlockSuperHost: "افتح شارة المضيف المميز",
    topPercentage: "أنت ضمن أفضل",
    highestItemSubtitle: "تم ربحه",
    promoteItem: "روّج لهذا العنصر",
    topHostsCompact: "أفضل المضيفين",
    rentalDemand: "إشارات الطلب",
    popularSearches: "البحثات الرائجة على إكرا",
    popularSearchesBody:
      "الناس يبحثون عن هذه العناصر على المنصة. أضف عروضًا مشابهة لزيادة فرص حصولك على تأجيرات.",
    hostBadge: "مضيف",
    moreActions: "مزيد من الخيارات",
    rankFootnote: "يعتمد على أرباح الشهر والتقييم ونشاط التأجير.",
    localDemandHint: "استخدم هذه الإشارات لتحديد ما الذي يستحق إضافته لاحقًا.",
    noDemand: "ستظهر إشارات الطلب هنا مع نمو السوق.",
    navigation: "التنقل",
    menu: "القائمة",
    closeMenu: "إغلاق القائمة",
    collapseSidebar: "تصغير الشريط الجانبي",
    expandSidebar: "توسيع الشريط الجانبي",
    dashboardNav: "لوحة التحكم",
    myItemsNav: "عناصري",
    bookingsNav: "الحجوزات",
    allItemsNav: "كل العناصر",
    addNewItemNav: "إضافة عنصر جديد",
    draftsNav: "المسودات",
    availabilityNav: "التوفر / التقويم",
    pricingNav: "التسعير",
    analyticsNav: "الأداء / التحليلات",
    incomingNav: "الواردة",
    ongoingNav: "الجارية",
    pastNav: "السابقة",
    allBookingsNav: "كل الحجوزات",
    soon: "قريبًا",
  },
} as const

const dashboardUi = {
  en: {
    bookingsWidget: "Bookings",
    itemsWidget: "My items",
    earningsWidget: "Earnings",
    activityWidget: "Activity",
    quickActionsWidget: "Quick actions",
    viewAll: "View all",
    incoming: "Incoming",
    ongoing: "Ongoing",
    past: "Past",
    soon: "Soon",
    noItems: "No items yet",
    noBookings: "No bookings in this view yet.",
    noActivity: "No recent activity yet.",
    totalItems: "Total items",
    activeItems: "Active",
    draftItems: "Drafts",
    addNewItem: "Add New Item",
    updateAvailability: "Update availability",
    messageRenters: "Message renters",
    upcomingPayouts: "Upcoming payouts",
    recentItems: "Recent items",
    recentActivity: "Recent activity",
    pricePerDay: "per day",
    accept: "Accept",
    decline: "Decline",
    messageRenter: "Message renter",
    markCompleted: "Mark completed",
    viewDetails: "View details",
    leaveReview: "Leave review",
    editItem: "Edit item",
    pauseListing: "Pause listing",
    resumeListing: "Resume listing",
    duplicate: "Duplicate",
    available: "Available",
    paused: "Paused",
    hidden: "Draft",
    sendMessage: "Send message",
    writeMessage: "Write a quick message",
    cancel: "Cancel",
    save: "Save",
    createItem: "Create item",
    editListing: "Edit listing",
    createDraftCopy: "Create draft copy",
    listingSaved: "Listing saved.",
    listingCreated: "Listing created.",
    listingDuplicated: "Draft copy created.",
    listingPaused: "Listing visibility updated.",
    availabilitySaved: "Availability updated.",
    messageSent: "Message sent.",
    completedLocally: "Marked as completed in your dashboard.",
    reviewSaved: "Review submitted.",
    title: "Title",
    descriptionLabel: "Description",
    category: "Category",
    city: "City",
    publishNow: "Publish now",
    startDate: "Start date",
    endDate: "End date",
    reason: "Reason",
    selectItem: "Select item",
    bookingDetails: "Booking details",
    renter: "Renter",
    owner: "Owner",
    status: "Status",
    payment: "Payment",
    leaveReviewTitle: "Leave review",
    ratingLabel: "Rating",
    commentLabel: "Comment",
    quickActionHint: "Fast actions without leaving the dashboard.",
    bookingsHint: "Manage requests and active rentals from one place.",
    itemsHint: "Keep pricing, status, and duplication close at hand.",
    activityHint: "The latest platform signals and updates.",
    miniTrend: "Monthly trend",
    selectCategory: "Select category",
    draftCreated: "Created as draft",
  },
  ar: {
    bookingsWidget: "الحجوزات",
    itemsWidget: "عناصري",
    earningsWidget: "الأرباح",
    activityWidget: "النشاط",
    quickActionsWidget: "إجراءات سريعة",
    viewAll: "عرض الكل",
    incoming: "الواردة",
    ongoing: "الجارية",
    past: "السابقة",
    soon: "قريبًا",
    noItems: "لا توجد عناصر بعد",
    noBookings: "لا توجد حجوزات في هذا القسم بعد.",
    noActivity: "لا يوجد نشاط حديث بعد.",
    totalItems: "إجمالي العناصر",
    activeItems: "النشطة",
    draftItems: "المسودات",
    addNewItem: "إضافة عنصر جديد",
    updateAvailability: "تحديث التوفر",
    messageRenters: "مراسلة المستأجرين",
    upcomingPayouts: "الدفعات القادمة",
    recentItems: "أحدث العناصر",
    recentActivity: "أحدث النشاطات",
    pricePerDay: "لكل يوم",
    accept: "قبول",
    decline: "رفض",
    messageRenter: "مراسلة المستأجر",
    markCompleted: "وضع كمكتمل",
    viewDetails: "عرض التفاصيل",
    leaveReview: "إضافة تقييم",
    editItem: "تعديل العنصر",
    pauseListing: "إيقاف العرض",
    resumeListing: "إعادة تفعيل العرض",
    duplicate: "نسخ",
    available: "متاح",
    paused: "موقوف",
    hidden: "مسودة",
    sendMessage: "إرسال رسالة",
    writeMessage: "اكتب رسالة سريعة",
    cancel: "إلغاء",
    save: "حفظ",
    createItem: "إنشاء عنصر",
    editListing: "تعديل العرض",
    createDraftCopy: "إنشاء نسخة مسودة",
    listingSaved: "تم حفظ العرض.",
    listingCreated: "تم إنشاء العرض.",
    listingDuplicated: "تم إنشاء نسخة مسودة.",
    listingPaused: "تم تحديث حالة الظهور.",
    availabilitySaved: "تم تحديث التوفر.",
    messageSent: "تم إرسال الرسالة.",
    completedLocally: "تم وضعه كمكتمل داخل لوحة التحكم.",
    reviewSaved: "تم إرسال التقييم.",
    title: "العنوان",
    descriptionLabel: "الوصف",
    category: "الفئة",
    city: "المدينة",
    publishNow: "نشر الآن",
    startDate: "تاريخ البداية",
    endDate: "تاريخ النهاية",
    reason: "السبب",
    selectItem: "اختر عنصرًا",
    bookingDetails: "تفاصيل الحجز",
    renter: "المستأجر",
    owner: "المالك",
    status: "الحالة",
    payment: "الدفع",
    leaveReviewTitle: "إضافة تقييم",
    ratingLabel: "التقييم",
    commentLabel: "التعليق",
    quickActionHint: "إجراءات سريعة بدون مغادرة لوحة التحكم.",
    bookingsHint: "إدارة الطلبات والتأجيرات النشطة من مكان واحد.",
    itemsHint: "اجعل التسعير والحالة والنسخ قريبة منك.",
    activityHint: "أحدث الإشارات والتحديثات على المنصة.",
    miniTrend: "اتجاه الأشهر",
    selectCategory: "اختر فئة",
    draftCreated: "تم الإنشاء كمسودة",
  },
} as const

type DashboardBookingTab = "incoming" | "ongoing" | "past" | "soon"

const toPlainNumber = (value: string | number | null | undefined) => {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const toIsoDate = (value: string) => new Date(`${value}T00:00:00`)

const formatDateRange = (start: string, end: string) =>
  `${toIsoDate(start).toLocaleDateString()} - ${toIsoDate(end).toLocaleDateString()}`

const formatRelativeTime = (value: string) => {
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

const getImageUrl = (image?: string | null) => {
  if (!image) return null
  if (image.startsWith("http")) return image
  return `${API?.replace("/api", "")}${image}`
}

type DashboardNavLeaf = {
  id: string
  label: string
  icon: LucideIcon
  href?: string
  soon?: boolean
}

type DashboardNavGroup = {
  id: string
  label: string
  icon: LucideIcon
  items: DashboardNavLeaf[]
}

const isPathActive = (pathname: string, href?: string) => {
  if (!href) return false
  if (href === "/") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function LandlordEarningsDashboardClient() {
  const router = useRouter()
  const pathname = usePathname()
  const { lang } = useLocale()
  const text = copy[lang]
  const ui = dashboardUi[lang]
  const { showToast } = useToast()
  const [data, setData] = useState<LandlordEarningsDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [bookingTab, setBookingTab] = useState<DashboardBookingTab>("incoming")
  const [bookingActionId, setBookingActionId] = useState<number | null>(null)
  const [itemActionKey, setItemActionKey] = useState<string | null>(null)
  const [completedBookingIds, setCompletedBookingIds] = useState<number[]>([])
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isTabletNavExpanded, setIsTabletNavExpanded] = useState(false)
  const [isDesktopWide, setIsDesktopWide] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    items: true,
    bookings: true,
  })
  const [messageModal, setMessageModal] = useState<{
    open: boolean
    booking: any | null
    text: string
    sending: boolean
  }>({ open: false, booking: null, text: "", sending: false })
  const [detailsBooking, setDetailsBooking] = useState<any | null>(null)
  const [reviewModal, setReviewModal] = useState<{
    open: boolean
    booking: any | null
    rating: number
    comment: string
    saving: boolean
  }>({ open: false, booking: null, rating: 5, comment: "", saving: false })
  const [itemModal, setItemModal] = useState<{
    open: boolean
    mode: "create" | "edit"
    saving: boolean
    listingId: number | null
    form: {
      title: string
      description: string
      price_per_day: string
      city: string
      category_id: string
      is_active: boolean
      latitude: string
      longitude: string
      pickup_radius_m: string
    }
  }>({
    open: false,
    mode: "create",
    saving: false,
    listingId: null,
    form: {
      title: "",
      description: "",
      price_per_day: "",
      city: "",
      category_id: "",
      is_active: true,
      latitude: "",
      longitude: "",
      pickup_radius_m: "300",
    },
  })
  const [availabilityModal, setAvailabilityModal] = useState<{
    open: boolean
    saving: boolean
    form: {
      listingId: string
      start_date: string
      end_date: string
      reason: string
    }
  }>({
    open: false,
    saving: false,
    form: {
      listingId: "",
      start_date: "",
      end_date: "",
      reason: "",
    },
  })

  const sidebarExpanded = isDesktopWide || isTabletNavExpanded

  const dashboardItem = useMemo<DashboardNavLeaf>(
    () => ({
      id: "dashboard",
      label: text.dashboardNav,
      icon: LayoutDashboard,
      href: "/earnings",
    }),
    [text],
  )

  const navGroups = useMemo<DashboardNavGroup[]>(
    () => [
      {
        id: "items",
        label: text.myItemsNav,
        icon: Package,
        items: [
          { id: "all-items", label: text.allItemsNav, icon: Package, href: "/profile" },
          { id: "add-item", label: text.addNewItemNav, icon: PlusCircle, href: "/listings/new" },
          { id: "drafts", label: text.draftsNav, icon: FileText, soon: true },
          { id: "availability", label: text.availabilityNav, icon: CalendarDays, soon: true },
          { id: "pricing", label: text.pricingNav, icon: Wallet, soon: true },
          { id: "analytics", label: text.analyticsNav, icon: TrendingUp, href: "/earnings#performance" },
        ],
      },
      {
        id: "bookings",
        label: text.bookingsNav,
        icon: Calendar,
        items: [
          { id: "incoming", label: text.incomingNav, icon: Inbox, soon: true },
          { id: "ongoing", label: text.ongoingNav, icon: Clock3, soon: true },
          { id: "past", label: text.pastNav, icon: Archive, soon: true },
          { id: "all-bookings", label: text.allBookingsNav, icon: CalendarDays, href: "/bookings" },
        ],
      },
    ],
    [text],
  )

  useEffect(() => {
    if (typeof window === "undefined") return

    const updateViewport = () => {
      setIsDesktopWide(window.innerWidth >= 1280)
      if (window.innerWidth >= 768) {
        setIsMobileNavOpen(false)
      }
    }

    updateViewport()
    window.addEventListener("resize", updateViewport)
    return () => window.removeEventListener("resize", updateViewport)
  }, [])

  useEffect(() => {
    if (typeof document === "undefined") return

    const previousOverflow = document.body.style.overflow
    if (isMobileNavOpen) {
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileNavOpen])

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        setUser(null)
      }
    }

    if (!token || !API) {
      setIsLoading(false)
      return
    }

    const headers = { Authorization: `Bearer ${token}` }

    Promise.allSettled([
      axiosInstance.get(`${API}/auth/me/`, { headers }),
      axiosInstance.get<LandlordEarningsDashboard>(`${API}/earnings/dashboard/`, { headers }),
      axiosInstance.get(`${API}/bookings/`, { headers }),
      axiosInstance.get(`${API}/listings/?mine=1`, { headers }),
      axiosInstance.get(`${API}/notifications/`, { headers }),
      axiosInstance.get(`${API}/categories/`, { headers }),
    ])
      .then(([userRes, dashboardRes, bookingsRes, itemsRes, notificationsRes, categoriesRes]) => {
        if (userRes.status === "fulfilled") {
          setUser(userRes.value.data)
        }

        if (dashboardRes.status === "fulfilled") {
          setData(dashboardRes.value.data)
        } else {
          console.error("Failed to load earnings dashboard", dashboardRes.reason)
          setData(null)
        }

        if (bookingsRes.status === "fulfilled") {
          const bookingData = bookingsRes.value.data
          const bookingList = Array.isArray(bookingData) ? bookingData : bookingData?.results ?? []
          setBookings(Array.isArray(bookingList) ? bookingList : [])
        }

        if (itemsRes.status === "fulfilled") {
          const listingData = itemsRes.value.data
          const listingList = Array.isArray(listingData) ? listingData : listingData?.results ?? []
          setItems(Array.isArray(listingList) ? listingList : [])
        }

        if (notificationsRes.status === "fulfilled") {
          const notificationData = notificationsRes.value.data
          const list = Array.isArray(notificationData) ? notificationData : notificationData?.results ?? []
          setNotifications(Array.isArray(list) ? list : [])
        }

        if (categoriesRes.status === "fulfilled") {
          const categoryData = categoriesRes.value.data
          const list = Array.isArray(categoryData) ? categoryData : categoryData?.results ?? []
          setCategories(Array.isArray(list) ? list : [])
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const scrollToWidget = (widgetId: string) => {
    if (typeof document === "undefined") return
    document.getElementById(widgetId)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const resetItemModal = () =>
    setItemModal({
      open: false,
      mode: "create",
      saving: false,
      listingId: null,
      form: {
        title: "",
        description: "",
        price_per_day: "",
        city: "",
        category_id: "",
        is_active: true,
        latitude: "",
        longitude: "",
        pickup_radius_m: "300",
      },
    })

  const openCreateItemModal = () =>
    setItemModal((prev) => ({
      ...prev,
      open: true,
      mode: "create",
      listingId: null,
      form: {
        title: "",
        description: "",
        price_per_day: "",
        city: "",
        category_id: categories[0]?.id ? String(categories[0].id) : "",
        is_active: true,
        latitude: "",
        longitude: "",
        pickup_radius_m: "300",
      },
    }))

  const openEditItemModal = (listing: any) =>
    setItemModal({
      open: true,
      mode: "edit",
      saving: false,
      listingId: listing.id,
      form: {
        title: listing.title ?? "",
        description: listing.description ?? "",
        price_per_day: String(listing.price_per_day ?? ""),
        city: listing.city ?? "",
        category_id: listing.category?.id ? String(listing.category.id) : "",
        is_active: listing.is_active !== false,
        latitude: listing.latitude != null ? String(listing.latitude) : "",
        longitude: listing.longitude != null ? String(listing.longitude) : "",
        pickup_radius_m: String(listing.pickup_radius_m ?? 300),
      },
    })

  const openMessageModal = (booking: any) =>
    setMessageModal({
      open: true,
      booking,
      text: "",
      sending: false,
    })

  const closeMessageModal = () =>
    setMessageModal({
      open: false,
      booking: null,
      text: "",
      sending: false,
    })

  const updateBookingInState = (updated: any) =>
    setBookings((prev) => prev.map((booking) => (booking.id === updated.id ? updated : booking)))

  const handleBookingDecision = async (bookingId: number, action: "accept" | "decline") => {
    const token = localStorage.getItem("access_token")
    if (!token || !API) return

    setBookingActionId(bookingId)
    try {
      const response = await axiosInstance.post(
        `${API}/bookings/${bookingId}/${action}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      updateBookingInState(response.data)
    } catch (error) {
      console.error(`Failed to ${action} booking`, error)
      showToast("Action failed.", "error")
    } finally {
      setBookingActionId(null)
    }
  }

  const handleSendMessage = async () => {
    const token = localStorage.getItem("access_token")
    const booking = messageModal.booking
    if (!token || !API || !booking || !messageModal.text.trim()) return

    const ownerView = booking.listing?.owner?.id === user?.id
    const participantId = ownerView ? booking.renter?.id : booking.listing?.owner?.id
    if (!participantId) return

    setMessageModal((prev) => ({ ...prev, sending: true }))
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const roomRes = await axiosInstance.post(
        `${API}/chat/rooms/get-or-create/`,
        { participant_id: participantId, listing_id: booking.listing?.id },
        { headers },
      )
      await axiosInstance.post(
        `${API}/chat/messages/`,
        { room: roomRes.data.id, text: messageModal.text.trim() },
        { headers },
      )
      showToast(ui.messageSent, "success")
      closeMessageModal()
    } catch (error) {
      console.error("Failed to send message", error)
      showToast("Failed to send message.", "error")
      setMessageModal((prev) => ({ ...prev, sending: false }))
    }
  }

  const handleToggleListing = async (listing: any) => {
    const token = localStorage.getItem("access_token")
    if (!token || !API) return

    setItemActionKey(`toggle-${listing.id}`)
    try {
      await axiosInstance.patch(
        `${API}/listings/${listing.id}/`,
        { is_active: !listing.is_active },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setItems((prev) =>
        prev.map((item) => (item.id === listing.id ? { ...item, is_active: !item.is_active } : item)),
      )
      showToast(ui.listingPaused, "success")
    } catch (error) {
      console.error("Failed to toggle listing", error)
      showToast("Failed to update listing.", "error")
    } finally {
      setItemActionKey(null)
    }
  }

  const handleDuplicateListing = async (listing: any) => {
    const token = localStorage.getItem("access_token")
    if (!token || !API) return

    setItemActionKey(`duplicate-${listing.id}`)
    try {
      const response = await axiosInstance.post(
        `${API}/listings/`,
        {
          title: `${listing.title} Copy`,
          description: listing.description,
          price_per_day: listing.price_per_day,
          city: listing.city,
          category_id: listing.category?.id,
          is_active: false,
          latitude: listing.latitude,
          longitude: listing.longitude,
          pickup_radius_m: listing.pickup_radius_m ?? 300,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setItems((prev) => [response.data, ...prev])
      showToast(ui.listingDuplicated, "success")
    } catch (error) {
      console.error("Failed to duplicate listing", error)
      showToast("Failed to duplicate listing.", "error")
    } finally {
      setItemActionKey(null)
    }
  }

  const handleSaveItem = async () => {
    const token = localStorage.getItem("access_token")
    if (!token || !API) return

    setItemModal((prev) => ({ ...prev, saving: true }))
    try {
      const payload = {
        title: itemModal.form.title,
        description: itemModal.form.description,
        price_per_day: itemModal.form.price_per_day,
        city: itemModal.form.city,
        category_id: itemModal.form.category_id ? Number(itemModal.form.category_id) : undefined,
        is_active: itemModal.form.is_active,
        latitude: itemModal.form.latitude ? Number(itemModal.form.latitude) : null,
        longitude: itemModal.form.longitude ? Number(itemModal.form.longitude) : null,
        pickup_radius_m: itemModal.form.pickup_radius_m ? Number(itemModal.form.pickup_radius_m) : 300,
      }
      const headers = { Authorization: `Bearer ${token}` }

      if (itemModal.mode === "edit" && itemModal.listingId) {
        const response = await axiosInstance.patch(`${API}/listings/${itemModal.listingId}/`, payload, { headers })
        setItems((prev) => prev.map((item) => (item.id === itemModal.listingId ? response.data : item)))
        showToast(ui.listingSaved, "success")
      } else {
        const response = await axiosInstance.post(`${API}/listings/`, payload, { headers })
        setItems((prev) => [response.data, ...prev])
        showToast(itemModal.form.is_active ? ui.listingCreated : ui.draftCreated, "success")
      }
      resetItemModal()
    } catch (error) {
      console.error("Failed to save listing", error)
      showToast("Failed to save listing.", "error")
      setItemModal((prev) => ({ ...prev, saving: false }))
    }
  }

  const handleAvailabilitySave = async () => {
    const token = localStorage.getItem("access_token")
    if (!token || !API || !availabilityModal.form.listingId) return

    setAvailabilityModal((prev) => ({ ...prev, saving: true }))
    try {
      await axiosInstance.post(
        `${API}/listings/${availabilityModal.form.listingId}/availability-blocks/`,
        {
          start_date: availabilityModal.form.start_date,
          end_date: availabilityModal.form.end_date,
          reason: availabilityModal.form.reason,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      showToast(ui.availabilitySaved, "success")
      setAvailabilityModal({
        open: false,
        saving: false,
        form: { listingId: "", start_date: "", end_date: "", reason: "" },
      })
    } catch (error) {
      console.error("Failed to add availability block", error)
      showToast("Failed to update availability.", "error")
      setAvailabilityModal((prev) => ({ ...prev, saving: false }))
    }
  }

  const handleReviewSubmit = async () => {
    const token = localStorage.getItem("access_token")
    if (!token || !API || !reviewModal.booking) return

    setReviewModal((prev) => ({ ...prev, saving: true }))
    try {
      const response = await axiosInstance.post(
        `${API}/reviews/`,
        {
          listing: reviewModal.booking.listing?.id,
          rating: reviewModal.rating,
          comment: reviewModal.comment,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === reviewModal.booking.id
            ? {
                ...booking,
                listing: {
                  ...booking.listing,
                  reviews: [...(Array.isArray(booking.listing?.reviews) ? booking.listing.reviews : []), response.data],
                },
              }
            : booking,
        ),
      )
      showToast(ui.reviewSaved, "success")
      setReviewModal({ open: false, booking: null, rating: 5, comment: "", saving: false })
    } catch (error) {
      console.error("Failed to submit review", error)
      showToast("Failed to submit review.", "error")
      setReviewModal((prev) => ({ ...prev, saving: false }))
    }
  }

  const handleMarkNotificationRead = async (notificationId: number) => {
    const token = localStorage.getItem("access_token")
    if (!token || !API) return

    try {
      await axiosInstance.patch(
        `${API}/notifications/mark-read/`,
        { id: notificationId },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification,
        ),
      )
    } catch (error) {
      console.error("Failed to mark notification read", error)
    }
  }

  const toggleGroup = (groupId: string) => {
    if (!sidebarExpanded && !isDesktopWide) {
      setIsTabletNavExpanded(true)
      return
    }

    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  const renderSidebar = (mobile = false) => {
    const showLabels = mobile || sidebarExpanded
    const DashboardIcon = dashboardItem.icon

    return (
      <div
        className={`flex h-full flex-col ${
          mobile
            ? "mobile-sheet-panel mx-auto max-w-md p-4"
            : "surface-panel rounded-[30px] border border-border/60 bg-card/90 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className={`flex items-center gap-3 ${showLabels ? "" : "justify-center"}`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-emerald-400 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {showLabels ? (
              <div>
                <p className="section-label text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  {text.navigation}
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">Ekra Dashboard</p>
              </div>
            ) : null}
          </div>

          {mobile ? (
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/80 text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
              aria-label={text.closeMenu}
            >
              <X className="h-4 w-4" />
            </button>
          ) : !isDesktopWide ? (
            <button
              type="button"
              onClick={() => setIsTabletNavExpanded((prev) => !prev)}
              className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/80 text-muted-foreground transition hover:bg-accent/70 hover:text-foreground md:flex xl:hidden"
              aria-label={sidebarExpanded ? text.collapseSidebar : text.expandSidebar}
            >
              {sidebarExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : null}
        </div>

        {showLabels ? (
          <div className="mt-4 rounded-[24px] border border-border/60 bg-muted/40 p-3">
            <p className="text-sm font-medium text-foreground">{text.description}</p>
            <div className="mt-3 flex flex-col gap-2">
              <Button asChild className="w-full rounded-xl">
                <Link href="/listings/new" onClick={() => setIsMobileNavOpen(false)}>
                  {text.listProduct}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href="/bookings" onClick={() => setIsMobileNavOpen(false)}>
                  {text.manageOrders}
                </Link>
              </Button>
            </div>
          </div>
        ) : null}

        <nav className="mt-4 flex-1 space-y-2">
          <Link
            href={dashboardItem.href ?? "/earnings"}
            title={dashboardItem.label}
            onClick={() => setIsMobileNavOpen(false)}
            className={`flex items-center rounded-2xl px-3 py-3 text-sm font-medium transition-all ${
              isPathActive(pathname, dashboardItem.href)
                ? "ekra-gradient text-white shadow-[0_14px_34px_rgba(124,58,237,0.22)]"
                : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
            } ${showLabels ? "gap-3" : "justify-center"}`}
          >
            <DashboardIcon className="h-4 w-4 shrink-0" />
            {showLabels ? <span>{dashboardItem.label}</span> : null}
          </Link>

          {navGroups.map((group) => {
            const isGroupActive = group.items.some((item) => isPathActive(pathname, item.href))
            const isGroupExpanded = expandedGroups[group.id]

            return (
              <div key={group.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  title={group.label}
                  className={`flex w-full items-center rounded-2xl px-3 py-3 text-sm font-medium transition-all ${
                    isGroupActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                  } ${showLabels ? "gap-3" : "justify-center"}`}
                  aria-expanded={showLabels ? isGroupExpanded : false}
                >
                  <group.icon className="h-4 w-4 shrink-0" />
                  {showLabels ? (
                    <>
                      <span className="flex-1 text-left">{group.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform ${isGroupExpanded ? "rotate-180" : ""}`}
                      />
                    </>
                  ) : null}
                </button>

                {showLabels && isGroupExpanded ? (
                  <div className="ml-4 space-y-1 border-l border-border/60 pl-3">
                    {group.items.map((item) => {
                      const isActive = isPathActive(pathname, item.href)
                      const Icon = item.icon

                      const itemClasses = `flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(124,58,237,0.18)]"
                          : item.soon
                            ? "cursor-default text-muted-foreground/80 hover:bg-accent/50"
                            : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                      }`

                      if (item.href) {
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setIsMobileNavOpen(false)}
                            className={itemClasses}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {item.soon ? (
                              <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
                                {text.soon}
                              </Badge>
                            ) : null}
                          </Link>
                        )
                      }

                      return (
                        <button key={item.id} type="button" className={itemClasses} aria-disabled="true">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                          <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
                            {text.soon}
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>
      </div>
    )
  }

  const bookingBuckets = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    return bookings.reduce<Record<DashboardBookingTab, any[]>>(
      (acc, booking) => {
        const start = toIsoDate(booking.start_date)
        const end = toIsoDate(booking.end_date)
        const ownerView = booking.listing?.owner?.id === user?.id
        const isCompletedLocally = completedBookingIds.includes(booking.id)
        const isPast = isCompletedLocally || end < now || booking.status === "DECLINED" || booking.status === "CANCELLED"
        const isSoon = booking.status === "CONFIRMED" && start > now
        const isOngoing =
          booking.status === "CONFIRMED" && !isCompletedLocally && start <= now && end >= now
        const isIncoming = ownerView && booking.status === "PENDING"

        if (isIncoming) acc.incoming.push(booking)
        else if (isOngoing) acc.ongoing.push(booking)
        else if (isPast) acc.past.push(booking)
        else if (isSoon) acc.soon.push(booking)
        else if (booking.status === "PENDING") acc.soon.push(booking)
        else acc.past.push(booking)

        return acc
      },
      { incoming: [], ongoing: [], past: [], soon: [] },
    )
  }, [bookings, completedBookingIds, user?.id])

  const itemsSummary = useMemo(
    () => ({
      total: items.length,
      active: items.filter((item) => item.is_active !== false).length,
      drafts: items.filter((item) => item.is_active === false).length,
    }),
    [items],
  )

  const recentItems = useMemo(
    () =>
      [...items]
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
        .slice(0, 4),
    [items],
  )

  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications])

  const monthlyTrend = useMemo(() => data?.chart.monthly.slice(-4) ?? [], [data])

  const upcomingPayouts = useMemo(
    () =>
      bookings.reduce((sum, booking) => {
        const start = toIsoDate(booking.start_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (
          booking.status === "CONFIRMED" &&
          booking.payment_status === "PAID" &&
          start >= today &&
          booking.listing?.owner?.id === user?.id
        ) {
          return sum + toPlainNumber(booking.total_price)
        }
        return sum
      }, 0),
    [bookings, user?.id],
  )

  const activityEntries = useMemo(() => {
    if (recentNotifications.length) return recentNotifications

    return bookings.slice(0, 4).map((booking) => ({
      id: booking.id,
      title: booking.status === "PENDING" ? "New booking request" : "Booking updated",
      body: booking.listing?.title,
      created_at: booking.created_at,
      read: true,
      notification_type: booking.status === "PENDING" ? "BOOKING_ACCEPTED" : "BOOKING_CANCELLED",
    }))
  }, [bookings, recentNotifications])

  const messageableBookings = useMemo(
    () => [...bookingBuckets.ongoing, ...bookingBuckets.soon, ...bookingBuckets.incoming].slice(0, 6),
    [bookingBuckets],
  )

  const statCards = useMemo(() => {
    if (!data) return []

    const monthlySeries = data.chart.monthly
    const latestMonth = monthlySeries[monthlySeries.length - 1]
    const previousMonth = monthlySeries[monthlySeries.length - 2]
    const previousValue = previousMonth ? Number(previousMonth.earnings) : 0
    const latestValue = latestMonth ? Number(latestMonth.earnings) : 0
    const growth =
      previousValue > 0 ? Math.round(((latestValue - previousValue) / previousValue) * 100) : null

    return [
      {
        label: text.totalEarnings,
        value: formatSar(data.summary.total_earnings),
        icon: Wallet,
        accent: null,
      },
      {
        label: text.monthEarnings,
        value: formatSar(data.summary.this_month_earnings),
        icon: TrendingUp,
        accent: growth && growth > 0 ? `▲ ${growth}%` : null,
      },
      {
        label: text.rentals,
        value: `${data.summary.rentals_count}`,
        icon: Package,
        accent: null,
      },
      {
        label: text.rating,
        value: `${data.summary.rating.toFixed(1)}/5`,
        icon: Star,
        accent: null,
      },
    ]
  }, [data, text])

  const milestone = useMemo(() => {
    if (!data) return null
    const milestoneTarget = 20
    const remainingRentals = Math.max(0, milestoneTarget - data.summary.rentals_count)
    const progress = Math.min(100, Math.round((data.summary.rentals_count / milestoneTarget) * 100))
    const leaderboardPercent = data.ranking.total_lessors
      ? Math.max(
          1,
          Math.round(
            ((data.ranking.total_lessors - data.ranking.position + 1) / data.ranking.total_lessors) * 100,
          ),
        )
      : 0

    return {
      remainingRentals,
      progress,
      leaderboardPercent,
    }
  }, [data])

  const trendingSearches = useMemo(() => {
    if (!data) return []

    const highestItem = data.summary.highest_earning_item?.title ?? "Camera"
    return [
      { label: highestItem, value: `${Math.max(15, data.summary.rentals_count * 3)} days` },
      { label: "Camping Tent", value: "135 days" },
      { label: "Lighting Kit", value: "98 days" },
    ]
  }, [data])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 mobile-content">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="h-32 rounded-3xl animate-pulse bg-muted/60" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background py-10">
        <div className="mx-auto max-w-3xl px-3 sm:px-6 lg:px-8 mobile-content">
          <Card className="rounded-3xl border-border/70 text-center shadow-sm">
            <CardContent className="p-8">
              <p className="text-muted-foreground">{text.loginPrompt}</p>
              <Button className="mt-4" onClick={() => router.push("/auth/login")}>
                {text.loginAction}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.08),_transparent_35%),linear-gradient(to_bottom,_rgba(248,250,252,0.9),_transparent)] py-5 sm:py-8">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8 mobile-content">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5 xl:gap-6">
          <aside
            className={`hidden md:sticky md:top-24 md:block md:shrink-0 ${
              sidebarExpanded ? "md:w-[280px]" : "md:w-[88px]"
            } xl:w-[280px]`}
          >
            {renderSidebar()}
          </aside>

          <div className="min-w-0 flex-1 rounded-[28px] border border-border/60 bg-card/95 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.06)] backdrop-blur sm:rounded-[32px] sm:p-6">
          <div className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/80 text-muted-foreground transition hover:bg-accent/70 hover:text-foreground md:hidden"
                aria-label={text.menu}
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-emerald-400 text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {text.eyebrow}
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Ekra Dashboard
                </h1>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button className="w-full rounded-xl sm:w-auto" onClick={openCreateItemModal}>
                {ui.addNewItem}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl sm:w-auto"
                onClick={() => {
                  setBookingTab("incoming")
                  scrollToWidget("bookings-widget")
                }}
              >
                {text.manageOrders}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden rounded-xl sm:inline-flex"
                aria-label={text.moreActions}
                onClick={() => scrollToWidget("quick-actions-widget")}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.38fr)_minmax(320px,0.92fr)]">
            <div className="space-y-4">
              <Card id="bookings-widget" className="rounded-[28px] border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Calendar className="h-5 w-5 text-primary" />
                        {ui.bookingsWidget}
                      </CardTitle>
                      <CardDescription>{ui.bookingsHint}</CardDescription>
                    </div>
                    <Link href="/bookings" className="text-sm font-medium text-primary hover:underline">
                      {ui.viewAll}
                    </Link>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {([
                      ["incoming", ui.incoming],
                      ["ongoing", ui.ongoing],
                      ["past", ui.past],
                      ["soon", ui.soon],
                    ] as [DashboardBookingTab, string][]).map(([tabId, label]) => (
                      <button
                        key={tabId}
                        type="button"
                        onClick={() => setBookingTab(tabId)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                          bookingTab === tabId
                            ? "ekra-gradient text-white shadow-[0_12px_24px_rgba(124,58,237,0.24)]"
                            : "border border-border/70 bg-background/80 text-muted-foreground hover:bg-accent/70"
                        }`}
                      >
                        {label}
                        <span className="ml-1.5 text-xs opacity-80">{bookingBuckets[tabId].length}</span>
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {bookingBuckets[bookingTab].length ? (
                    <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
                      {bookingBuckets[bookingTab].map((booking) => {
                        const listingImage = getImageUrl(booking.listing?.images?.[0]?.image)
                        const ownerView = booking.listing?.owner?.id === user?.id
                        const hasReviewed = Array.isArray(booking.listing?.reviews)
                          ? booking.listing.reviews.some((review: any) => review.user?.id === user?.id)
                          : false

                        return (
                          <div
                            key={booking.id}
                            className="rounded-[24px] border border-border/60 bg-muted/30 p-3.5 sm:p-4"
                          >
                            <div className="flex gap-3">
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-background sm:h-20 sm:w-20">
                                {listingImage ? (
                                  <img src={listingImage} alt={booking.listing?.title} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                    <Camera className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="line-clamp-1 font-semibold text-foreground">{booking.listing?.title}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {formatSar(booking.listing?.price_per_day)} {ui.pricePerDay}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant={booking.status === "PENDING" ? "secondary" : booking.status === "CONFIRMED" ? "success" : "outline"}>
                                      {booking.status}
                                    </Badge>
                                    <Badge variant={booking.payment_status === "PAID" ? "success" : "outline"}>
                                      {booking.payment_status}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  {formatDateRange(booking.start_date, booking.end_date)}
                                </p>
                                <div className="mt-2 flex items-center gap-2 text-sm">
                                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                                    {booking.renter?.avatar ? (
                                      <img
                                        src={getImageUrl(booking.renter.avatar) ?? ""}
                                        alt={booking.renter?.username}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-xs font-semibold">
                                        {String(booking.renter?.username ?? "U").slice(0, 1).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-foreground">{booking.renter?.username ?? "Guest"}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {bookingTab === "incoming" ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleBookingDecision(booking.id, "accept")}
                                    disabled={bookingActionId === booking.id}
                                  >
                                    {bookingActionId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    {ui.accept}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleBookingDecision(booking.id, "decline")}
                                    disabled={bookingActionId === booking.id}
                                  >
                                    {ui.decline}
                                  </Button>
                                </>
                              ) : null}

                              {bookingTab === "ongoing" ? (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => openMessageModal(booking)}>
                                    <MessageCircle className="h-4 w-4" />
                                    {ui.messageRenter}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      setCompletedBookingIds((prev) => [...prev, booking.id])
                                      showToast(ui.completedLocally, "success")
                                    }}
                                  >
                                    <CheckCheck className="h-4 w-4" />
                                    {ui.markCompleted}
                                  </Button>
                                </>
                              ) : null}

                              {bookingTab === "soon" ? (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => setDetailsBooking(booking)}>
                                    <Eye className="h-4 w-4" />
                                    {ui.viewDetails}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => openMessageModal(booking)}>
                                    <MessageCircle className="h-4 w-4" />
                                    {ui.messageRenter}
                                  </Button>
                                </>
                              ) : null}

                              {bookingTab === "past" ? (
                                !ownerView && !hasReviewed && booking.status === "CONFIRMED" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setReviewModal({
                                        open: true,
                                        booking,
                                        rating: 5,
                                        comment: "",
                                        saving: false,
                                      })
                                    }
                                  >
                                    <Star className="h-4 w-4" />
                                    {ui.leaveReview}
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => setDetailsBooking(booking)}>
                                    <Eye className="h-4 w-4" />
                                    {ui.viewDetails}
                                  </Button>
                                )
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
                      {ui.noBookings}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card id="items-widget" className="rounded-[28px] border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Package className="h-5 w-5 text-primary" />
                        {ui.itemsWidget}
                      </CardTitle>
                      <CardDescription>{ui.itemsHint}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={openCreateItemModal}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        + {ui.addNewItem}
                      </button>
                      <Link href="/profile" className="text-sm font-medium text-primary hover:underline">
                        {ui.viewAll}
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-[22px] bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">{ui.totalItems}</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">{itemsSummary.total}</p>
                    </div>
                    <div className="rounded-[22px] bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">{ui.activeItems}</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">{itemsSummary.active}</p>
                    </div>
                    <div className="rounded-[22px] bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">{ui.draftItems}</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">{itemsSummary.drafts}</p>
                    </div>
                  </div>

                  {recentItems.length ? (
                    <div className="max-h-[440px] space-y-3 overflow-y-auto pr-1">
                      {recentItems.map((listing) => {
                        const imageUrl = getImageUrl(listing.images?.[0]?.image)
                        const actionBusy = itemActionKey?.includes(String(listing.id))

                        return (
                          <div key={listing.id} className="rounded-[24px] border border-border/60 bg-muted/30 p-3.5">
                            <div className="flex gap-3">
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-background">
                                {imageUrl ? (
                                  <img src={imageUrl} alt={listing.title} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                    <Camera className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="line-clamp-1 font-semibold text-foreground">{listing.title}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {formatSar(listing.price_per_day)} {ui.pricePerDay}
                                    </p>
                                  </div>
                                  <Badge variant={listing.is_active !== false ? "success" : "secondary"}>
                                    {listing.is_active !== false ? ui.available : ui.hidden}
                                  </Badge>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Button size="sm" variant="outline" onClick={() => openEditItemModal(listing)}>
                                    <Edit3 className="h-4 w-4" />
                                    {ui.editItem}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleListing(listing)}
                                    disabled={actionBusy}
                                  >
                                    {listing.is_active !== false ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                                    {listing.is_active !== false ? ui.pauseListing : ui.resumeListing}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDuplicateListing(listing)}
                                    disabled={actionBusy}
                                  >
                                    {actionBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                                    {ui.duplicate}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
                      {ui.noItems}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-4">
              <Card id="performance" className="rounded-[28px] border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        {ui.earningsWidget}
                      </CardTitle>
                      <CardDescription>{ui.miniTrend}</CardDescription>
                    </div>
                    <Link href="/earnings" className="text-sm font-medium text-primary hover:underline">
                      {ui.viewAll}
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <div className="rounded-[22px] bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">{text.totalEarnings}</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {formatSar(data.summary.total_earnings)}
                      </p>
                    </div>
                    <div className="rounded-[22px] bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">{text.monthEarnings}</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {formatSar(data.summary.this_month_earnings)}
                      </p>
                    </div>
                    <div className="rounded-[22px] bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">{ui.upcomingPayouts}</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {formatSar(upcomingPayouts)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-border/60 bg-muted/20 p-4">
                    <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                      <span>{text.rankingTitle}</span>
                      <span>#{data.ranking.position}</span>
                    </div>
                    <div className="space-y-3">
                      {monthlyTrend.map((point) => {
                        const maxEarnings = Math.max(...monthlyTrend.map((entry) => toPlainNumber(entry.earnings)), 1)
                        const width = `${Math.max(12, Math.round((toPlainNumber(point.earnings) / maxEarnings) * 100))}%`

                        return (
                          <div key={point.label}>
                            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{point.label}</span>
                              <span>{formatCompactSar(point.earnings)}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400" style={{ width }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card id="activity-widget" className="rounded-[28px] border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Bell className="h-5 w-5 text-primary" />
                        {ui.activityWidget}
                      </CardTitle>
                      <CardDescription>{ui.activityHint}</CardDescription>
                    </div>
                    <Link href="/notifications" className="text-sm font-medium text-primary hover:underline">
                      {ui.viewAll}
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {activityEntries.length ? (
                    <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                      {activityEntries.map((entry) => {
                        const EntryIcon =
                          entry.notification_type === "NEW_MESSAGE"
                            ? MessageCircle
                            : entry.notification_type === "BOOKING_ACCEPTED"
                              ? CheckCircle2
                              : entry.notification_type === "BOOKING_DECLINED"
                                ? X
                                : entry.notification_type === "BOOKING_CANCELLED"
                                  ? CircleDashed
                                  : Bell

                        return (
                          <div key={entry.id} className="flex items-start gap-3 rounded-[22px] border border-border/60 bg-muted/20 p-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                              <EntryIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-foreground">{entry.title ?? entry.notification_type}</p>
                                  <p className="mt-1 text-sm text-muted-foreground">{entry.body ?? entry.link ?? ""}</p>
                                </div>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                  {formatRelativeTime(entry.created_at)}
                                </span>
                              </div>
                              {!entry.read ? (
                                <button
                                  type="button"
                                  onClick={() => handleMarkNotificationRead(entry.id)}
                                  className="mt-2 text-xs font-medium text-primary hover:underline"
                                >
                                  Mark read
                                </button>
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
                      {ui.noActivity}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card id="quick-actions-widget" className="rounded-[28px] border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Zap className="h-5 w-5 text-primary" />
                    {ui.quickActionsWidget}
                  </CardTitle>
                  <CardDescription>{ui.quickActionHint}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Button className="justify-start rounded-2xl" onClick={openCreateItemModal}>
                    <PlusCircle className="h-4 w-4" />
                    {ui.addNewItem}
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start rounded-2xl"
                    onClick={() => {
                      setBookingTab("incoming")
                      scrollToWidget("bookings-widget")
                    }}
                  >
                    <Inbox className="h-4 w-4" />
                    {text.manageOrders}
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start rounded-2xl"
                    onClick={() =>
                      setAvailabilityModal((prev) => ({
                        ...prev,
                        open: true,
                        form: {
                          ...prev.form,
                          listingId: prev.form.listingId || (items[0]?.id ? String(items[0].id) : ""),
                        },
                      }))
                    }
                  >
                    <CalendarDays className="h-4 w-4" />
                    {ui.updateAvailability}
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start rounded-2xl"
                    onClick={() => {
                      if (messageableBookings[0]) openMessageModal(messageableBookings[0])
                    }}
                    disabled={!messageableBookings.length}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {ui.messageRenters}
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
      </div>

      {itemModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-border/70 bg-card p-5 shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {itemModal.mode === "edit" ? ui.editListing : ui.createItem}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{ui.itemsHint}</p>
              </div>
              <button type="button" onClick={resetItemModal} className="rounded-2xl p-2 text-muted-foreground hover:bg-accent/70">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.title}</label>
                <Input
                  value={itemModal.form.title}
                  onChange={(e) => setItemModal((prev) => ({ ...prev, form: { ...prev.form, title: e.target.value } }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.category}</label>
                <select
                  value={itemModal.form.category_id}
                  onChange={(e) => setItemModal((prev) => ({ ...prev, form: { ...prev.form, category_id: e.target.value } }))}
                  className="h-11 w-full rounded-2xl border border-input bg-background/90 px-4 text-sm shadow-sm"
                >
                  <option value="">{ui.selectCategory}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{text.monthEarnings.replace("This month's earnings", "Price per day")}</label>
                <Input
                  type="number"
                  min="0"
                  value={itemModal.form.price_per_day}
                  onChange={(e) => setItemModal((prev) => ({ ...prev, form: { ...prev.form, price_per_day: e.target.value } }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.city}</label>
                <Input
                  value={itemModal.form.city}
                  onChange={(e) => setItemModal((prev) => ({ ...prev, form: { ...prev.form, city: e.target.value } }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Pickup radius</label>
                <Input
                  type="number"
                  min="100"
                  value={itemModal.form.pickup_radius_m}
                  onChange={(e) => setItemModal((prev) => ({ ...prev, form: { ...prev.form, pickup_radius_m: e.target.value } }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.descriptionLabel}</label>
                <textarea
                  value={itemModal.form.description}
                  onChange={(e) => setItemModal((prev) => ({ ...prev, form: { ...prev.form, description: e.target.value } }))}
                  className="min-h-[110px] w-full rounded-2xl border border-input bg-background/90 px-4 py-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={itemModal.form.is_active}
                  onChange={(e) => setItemModal((prev) => ({ ...prev, form: { ...prev.form, is_active: e.target.checked } }))}
                />
                {ui.publishNow}
              </label>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={resetItemModal}>
                {ui.cancel}
              </Button>
              <Button onClick={handleSaveItem} disabled={itemModal.saving || !itemModal.form.title || !itemModal.form.price_per_day}>
                {itemModal.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {ui.save}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {availabilityModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-border/70 bg-card p-5 shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{ui.updateAvailability}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{ui.quickActionHint}</p>
              </div>
              <button
                type="button"
                onClick={() => setAvailabilityModal({ open: false, saving: false, form: { listingId: "", start_date: "", end_date: "", reason: "" } })}
                className="rounded-2xl p-2 text-muted-foreground hover:bg-accent/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.selectItem}</label>
                <select
                  value={availabilityModal.form.listingId}
                  onChange={(e) => setAvailabilityModal((prev) => ({ ...prev, form: { ...prev.form, listingId: e.target.value } }))}
                  className="h-11 w-full rounded-2xl border border-input bg-background/90 px-4 text-sm shadow-sm"
                >
                  <option value="">{ui.selectItem}</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.startDate}</label>
                  <Input
                    type="date"
                    value={availabilityModal.form.start_date}
                    onChange={(e) => setAvailabilityModal((prev) => ({ ...prev, form: { ...prev.form, start_date: e.target.value } }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.endDate}</label>
                  <Input
                    type="date"
                    value={availabilityModal.form.end_date}
                    onChange={(e) => setAvailabilityModal((prev) => ({ ...prev, form: { ...prev.form, end_date: e.target.value } }))}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.reason}</label>
                <textarea
                  value={availabilityModal.form.reason}
                  onChange={(e) => setAvailabilityModal((prev) => ({ ...prev, form: { ...prev.form, reason: e.target.value } }))}
                  className="min-h-[100px] w-full rounded-2xl border border-input bg-background/90 px-4 py-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setAvailabilityModal({ open: false, saving: false, form: { listingId: "", start_date: "", end_date: "", reason: "" } })}
              >
                {ui.cancel}
              </Button>
              <Button
                onClick={handleAvailabilitySave}
                disabled={availabilityModal.saving || !availabilityModal.form.listingId || !availabilityModal.form.start_date || !availabilityModal.form.end_date}
              >
                {availabilityModal.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {ui.save}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {messageModal.open && messageModal.booking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-border/70 bg-card p-5 shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{ui.sendMessage}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{messageModal.booking.listing?.title}</p>
              </div>
              <button type="button" onClick={closeMessageModal} className="rounded-2xl p-2 text-muted-foreground hover:bg-accent/70">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.writeMessage}</label>
              <textarea
                value={messageModal.text}
                onChange={(e) => setMessageModal((prev) => ({ ...prev, text: e.target.value }))}
                className="min-h-[140px] w-full rounded-2xl border border-input bg-background/90 px-4 py-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={closeMessageModal}>
                {ui.cancel}
              </Button>
              <Button onClick={handleSendMessage} disabled={messageModal.sending || !messageModal.text.trim()}>
                {messageModal.sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {ui.sendMessage}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {detailsBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-border/70 bg-card p-5 shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{ui.bookingDetails}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{detailsBooking.listing?.title}</p>
              </div>
              <button type="button" onClick={() => setDetailsBooking(null)} className="rounded-2xl p-2 text-muted-foreground hover:bg-accent/70">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">{ui.renter}</p>
                <p className="mt-1 font-medium text-foreground">{detailsBooking.renter?.username}</p>
              </div>
              <div className="rounded-[22px] bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">{ui.owner}</p>
                <p className="mt-1 font-medium text-foreground">{detailsBooking.listing?.owner?.username}</p>
              </div>
              <div className="rounded-[22px] bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">{ui.status}</p>
                <p className="mt-1 font-medium text-foreground">{detailsBooking.status}</p>
              </div>
              <div className="rounded-[22px] bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">{ui.payment}</p>
                <p className="mt-1 font-medium text-foreground">{detailsBooking.payment_status}</p>
              </div>
              <div className="rounded-[22px] bg-muted/30 p-4 sm:col-span-2">
                <p className="text-xs text-muted-foreground">{ui.startDate} / {ui.endDate}</p>
                <p className="mt-1 font-medium text-foreground">{formatDateRange(detailsBooking.start_date, detailsBooking.end_date)}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button variant="outline" onClick={() => setDetailsBooking(null)}>
                {ui.cancel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {reviewModal.open && reviewModal.booking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-border/70 bg-card p-5 shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{ui.leaveReviewTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{reviewModal.booking.listing?.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModal({ open: false, booking: null, rating: 5, comment: "", saving: false })}
                className="rounded-2xl p-2 text-muted-foreground hover:bg-accent/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.ratingLabel}</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewModal((prev) => ({ ...prev, rating }))}
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                        reviewModal.rating >= rating ? "border-amber-300 bg-amber-50 text-amber-500" : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      <Star className={`h-4 w-4 ${reviewModal.rating >= rating ? "fill-current" : ""}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.commentLabel}</label>
                <textarea
                  value={reviewModal.comment}
                  onChange={(e) => setReviewModal((prev) => ({ ...prev, comment: e.target.value }))}
                  className="min-h-[130px] w-full rounded-2xl border border-input bg-background/90 px-4 py-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReviewModal({ open: false, booking: null, rating: 5, comment: "", saving: false })}>
                {ui.cancel}
              </Button>
              <Button onClick={handleReviewSubmit} disabled={reviewModal.saving}>
                {reviewModal.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {ui.save}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isMobileNavOpen ? (
        <div className="mobile-sheet-backdrop fixed inset-0 z-50 flex items-end md:hidden">
          <button
            type="button"
            className="absolute inset-0"
            aria-label={text.closeMenu}
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="relative z-10 w-full">{renderSidebar(true)}</div>
        </div>
      ) : null}
    </div>
  )
}
