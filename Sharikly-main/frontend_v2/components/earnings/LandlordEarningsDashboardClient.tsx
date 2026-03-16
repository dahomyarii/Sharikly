"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Activity,
  ArrowRight,
  Archive,
  Calendar,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crown,
  Edit3,
  Eye,
  Flame,
  ImagePlus,
  Inbox,
  LayoutDashboard,
  Loader2,
  LucideIcon,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PlusCircle,
  PlayCircle,
  PauseCircle,
  Package,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Trophy,
  Wallet,
  X,
  FileText,
  Clock3,
} from "lucide-react"

import axiosInstance from "@/lib/axios"
import { EarningsChart } from "@/components/earnings/EarningsChart"
import LocationPicker from "@/components/LocationPicker"
import FloatingModal from "@/components/FloatingModal"
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
    statusLabel: "Status",
    hostStatusTitle: "Host status",
    statusQualified: "Qualified",
    statusBuilding: "In progress",
    chartTotalLabel: "Total",
    chartAverageLabel: "Average",
    chartPeakLabel: "Peak",
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
    statusLabel: "الحالة",
    hostStatusTitle: "حالة المضيف",
    statusQualified: "مؤهل",
    statusBuilding: "قيد التقدم",
    chartTotalLabel: "الإجمالي",
    chartAverageLabel: "المتوسط",
    chartPeakLabel: "الذروة",
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

const workspaceCopy = {
  en: {
    bookingsWorkspace: "Bookings",
    bookingsHint: "Keep requests, active rentals, and booking details inside the same page.",
    itemsWorkspace: "My Items",
    itemsHint: "Manage visibility, pricing, duplication, and quick edits without leaving earnings.",
    addNewItem: "Add new item",
    viewDetails: "View details",
    messageRenter: "Message renter",
    accept: "Accept",
    decline: "Decline",
    noBookings: "Your booking activity will appear here.",
    noItems: "Your items will appear here once you start listing.",
    allFilter: "All",
    activeFilter: "Active",
    draftFilter: "Drafts",
    available: "Available",
    hidden: "Draft",
    editItem: "Edit",
    pauseListing: "Pause",
    resumeListing: "Resume",
    duplicate: "Duplicate",
    updateAvailability: "Update availability",
    createItem: "Create item",
    editListing: "Edit listing",
    titleLabel: "Title",
    descriptionLabel: "Description",
    categoryLabel: "Category",
    cityLabel: "City",
    pricePerDayLabel: "Price per day",
    pickupRadiusLabel: "Pickup radius (m)",
    publishNow: "Publish now",
    selectCategory: "Select category",
    cancel: "Cancel",
    save: "Save",
    sendMessage: "Send message",
    writeMessage: "Write a quick message",
    availabilityTitle: "Update availability",
    startDate: "Start date",
    endDate: "End date",
    reason: "Reason",
    selectItem: "Select item",
    bookingDetails: "Booking details",
    renterLabel: "Renter",
    statusLabelShort: "Status",
    paymentLabel: "Payment",
    listingSaved: "Listing saved.",
    listingCreated: "Listing created.",
    draftCreated: "Draft created.",
    listingDuplicated: "Draft copy created.",
    listingPaused: "Listing visibility updated.",
    availabilitySaved: "Availability updated.",
    messageSent: "Message sent.",
  },
  ar: {
    bookingsWorkspace: "الحجوزات",
    bookingsHint: "أدر الطلبات والتأجيرات النشطة وتفاصيل الحجز من نفس الصفحة.",
    itemsWorkspace: "عناصري",
    itemsHint: "تحكم في الظهور والتسعير والنسخ والتعديل السريع بدون مغادرة صفحة الأرباح.",
    addNewItem: "إضافة عنصر جديد",
    viewDetails: "عرض التفاصيل",
    messageRenter: "مراسلة المستأجر",
    accept: "قبول",
    decline: "رفض",
    noBookings: "ستظهر حجوزاتك هنا.",
    noItems: "ستظهر عناصرك هنا عندما تبدأ في الإضافة.",
    allFilter: "الكل",
    activeFilter: "النشطة",
    draftFilter: "المسودات",
    available: "منشور",
    hidden: "مسودة",
    editItem: "تعديل",
    pauseListing: "إيقاف",
    resumeListing: "استئناف",
    duplicate: "نسخ",
    updateAvailability: "تحديث التوفر",
    createItem: "إنشاء عنصر",
    editListing: "تعديل العرض",
    titleLabel: "العنوان",
    descriptionLabel: "الوصف",
    categoryLabel: "الفئة",
    cityLabel: "المدينة",
    pricePerDayLabel: "السعر اليومي",
    pickupRadiusLabel: "نطاق الاستلام (م)",
    publishNow: "نشر الآن",
    selectCategory: "اختر فئة",
    cancel: "إلغاء",
    save: "حفظ",
    sendMessage: "إرسال رسالة",
    writeMessage: "اكتب رسالة سريعة",
    availabilityTitle: "تحديث التوفر",
    startDate: "تاريخ البداية",
    endDate: "تاريخ النهاية",
    reason: "السبب",
    selectItem: "اختر عنصرًا",
    bookingDetails: "تفاصيل الحجز",
    renterLabel: "المستأجر",
    statusLabelShort: "الحالة",
    paymentLabel: "الدفع",
    listingSaved: "تم حفظ العرض.",
    listingCreated: "تم إنشاء العرض.",
    draftCreated: "تم إنشاء المسودة.",
    listingDuplicated: "تم إنشاء نسخة مسودة.",
    listingPaused: "تم تحديث ظهور العرض.",
    availabilitySaved: "تم تحديث التوفر.",
    messageSent: "تم إرسال الرسالة.",
  },
} as const

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

type DashboardBookingTab = "incoming" | "ongoing" | "past" | "soon"
type DashboardItemsTab = "all" | "active" | "drafts"

const isPathActive = (pathname: string, href?: string) => {
  if (!href) return false
  if (href === "/") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

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

const getImageUrl = (image?: string | null) => {
  if (!image) return null
  if (image.startsWith("http")) return image
  return `${API?.replace("/api", "")}${image}`
}

export function LandlordEarningsDashboardClient() {
  const router = useRouter()
  const pathname = usePathname()
  const { lang } = useLocale()
  const text = copy[lang]
  const ui = workspaceCopy[lang]
  const { showToast } = useToast()
  const [data, setData] = useState<LandlordEarningsDashboard | null>(null)
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [bookingTab, setBookingTab] = useState<DashboardBookingTab>("incoming")
  const [itemsTab, setItemsTab] = useState<DashboardItemsTab>("all")
  const [bookingActionId, setBookingActionId] = useState<number | null>(null)
  const [itemActionKey, setItemActionKey] = useState<string | null>(null)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isTabletNavExpanded, setIsTabletNavExpanded] = useState(false)
  const [isDesktopWide, setIsDesktopWide] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    items: true,
    bookings: true,
  })
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
  const [messageModal, setMessageModal] = useState<{
    open: boolean
    booking: any | null
    text: string
    sending: boolean
  }>({ open: false, booking: null, text: "", sending: false })
  const [detailsBooking, setDetailsBooking] = useState<any | null>(null)
  const [itemImages, setItemImages] = useState<Array<{ id: string; file: File; preview: string }>>([])

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
          { id: "all-items", label: text.allItemsNav, icon: Package },
          { id: "add-item", label: text.addNewItemNav, icon: PlusCircle },
          { id: "drafts", label: text.draftsNav, icon: FileText },
          { id: "availability", label: text.availabilityNav, icon: CalendarDays },
          { id: "pricing", label: text.pricingNav, icon: Wallet },
          { id: "analytics", label: text.analyticsNav, icon: TrendingUp },
        ],
      },
      {
        id: "bookings",
        label: text.bookingsNav,
        icon: Calendar,
        items: [
          { id: "incoming", label: text.incomingNav, icon: Inbox },
          { id: "ongoing", label: text.ongoingNav, icon: Clock3 },
          { id: "past", label: text.pastNav, icon: Archive },
          { id: "all-bookings", label: text.allBookingsNav, icon: CalendarDays },
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

  useEffect(() => () => clearItemImages(), [])

  const scrollToSection = (sectionId: string) => {
    if (typeof document === "undefined") return
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const clearItemImages = () => {
    setItemImages((prev) => {
      prev.forEach((image) => URL.revokeObjectURL(image.preview))
      return []
    })
  }

  const closeItemModal = () =>
    (clearItemImages(),
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
    }))

  const openCreateItemModal = () =>
    (clearItemImages(),
    setItemModal({
      open: true,
      mode: "create",
      saving: false,
      listingId: null,
      form: {
        title: "",
        description: "",
        price_per_day: "",
        city: "",
        category_id: categories[0]?.id ? String(categories[0].id) : "",
        is_active: true,
        latitude: "24.7136",
        longitude: "46.6753",
        pickup_radius_m: "300",
      },
    }))

  const openEditItemModal = (listing: any) =>
    (clearItemImages(),
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
    }))

  const addItemImages = (files: FileList | File[]) => {
    const nextFiles = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, Math.max(0, 8 - itemImages.length))
      .map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
      }))

    setItemImages((prev) => [...prev, ...nextFiles])
  }

  const removeItemImage = (imageId: string) =>
    setItemImages((prev) => {
      const target = prev.find((image) => image.id === imageId)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((image) => image.id !== imageId)
    })

  const openAvailabilityModal = (listingId?: string) =>
    setAvailabilityModal((prev) => ({
      ...prev,
      open: true,
      form: {
        listingId: listingId ?? prev.form.listingId ?? (items[0]?.id ? String(items[0].id) : ""),
        start_date: "",
        end_date: "",
        reason: "",
      },
    }))

  const handleSidebarAction = (itemId: string) => {
    if (itemId === "add-item") {
      openCreateItemModal()
    } else if (itemId === "all-items") {
      setItemsTab("all")
      scrollToSection("items-panel")
    } else if (itemId === "drafts") {
      setItemsTab("drafts")
      scrollToSection("items-panel")
    } else if (itemId === "pricing") {
      setItemsTab("active")
      scrollToSection("items-panel")
    } else if (itemId === "availability") {
      openAvailabilityModal()
    } else if (itemId === "analytics") {
      scrollToSection("performance")
    } else if (itemId === "incoming" || itemId === "ongoing" || itemId === "past") {
      setBookingTab(itemId as DashboardBookingTab)
      scrollToSection("bookings-panel")
    } else if (itemId === "all-bookings") {
      setBookingTab("incoming")
      scrollToSection("bookings-panel")
    }

    setIsMobileNavOpen(false)
  }

  const isSidebarItemActive = (itemId: string) => {
    if (itemId === "analytics") return true
    if (itemId === "all-items") return itemsTab === "all"
    if (itemId === "drafts") return itemsTab === "drafts"
    if (itemId === "pricing") return itemsTab === "active"
    if (itemId === "incoming" || itemId === "ongoing" || itemId === "past") return bookingTab === itemId
    if (itemId === "all-bookings") return bookingTab === "incoming"
    return false
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
              <Button className="w-full rounded-xl" onClick={openCreateItemModal}>
                {ui.addNewItem}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => handleSidebarAction("all-bookings")}
              >
                {text.manageOrders}
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
            const isGroupActive =
              pathname === "/earnings" && group.items.some((item) => isSidebarItemActive(item.id))
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
                      const isActive = isSidebarItemActive(item.id)
                      const Icon = item.icon

                      const itemClasses = `flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(124,58,237,0.18)]"
                          : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                      }`

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={itemClasses}
                          onClick={() => handleSidebarAction(item.id)}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
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
      axiosInstance.get(`${API}/categories/`, { headers }),
    ])
      .then(([userRes, dashboardRes, bookingsRes, itemsRes, categoriesRes]) => {
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

        if (categoriesRes.status === "fulfilled") {
          const categoryData = categoriesRes.value.data
          const categoryList = Array.isArray(categoryData) ? categoryData : categoryData?.results ?? []
          setCategories(Array.isArray(categoryList) ? categoryList : [])
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

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

  const bookingBuckets = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return bookings.reduce<Record<DashboardBookingTab, any[]>>(
      (acc, booking) => {
        const start = toIsoDate(booking.start_date)
        const end = toIsoDate(booking.end_date)

        if (booking.status === "PENDING") {
          acc.incoming.push(booking)
          return acc
        }

        if (booking.status === "CONFIRMED" && start > today) {
          acc.soon.push(booking)
          return acc
        }

        if (booking.status === "CONFIRMED" && end >= today) {
          acc.ongoing.push(booking)
          return acc
        }

        acc.past.push(booking)
        return acc
      },
      { incoming: [], ongoing: [], past: [], soon: [] },
    )
  }, [bookings])

  const itemsSummary = useMemo(
    () => ({
      total: items.length,
      active: items.filter((item) => item.is_active !== false).length,
      drafts: items.filter((item) => item.is_active === false).length,
    }),
    [items],
  )

  const visibleItems = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
    )

    if (itemsTab === "active") {
      return sorted.filter((item) => item.is_active !== false)
    }

    if (itemsTab === "drafts") {
      return sorted.filter((item) => item.is_active === false)
    }

    return sorted
  }, [items, itemsTab])

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
      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? response.data : booking)))
    } catch (error) {
      console.error(`Failed to ${action} booking`, error)
      showToast(`Failed to ${action} booking.`, "error")
    } finally {
      setBookingActionId(null)
    }
  }

  const handleSendMessage = async () => {
    const token = localStorage.getItem("access_token")
    const booking = messageModal.booking

    if (!token || !API || !booking || !messageModal.text.trim()) return

    setMessageModal((prev) => ({ ...prev, sending: true }))
    try {
      const ownerView = booking.listing?.owner?.id === user?.id
      const participantId = ownerView ? booking.renter?.id : booking.listing?.owner?.id
      if (!participantId) return

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
      setMessageModal({ open: false, booking: null, text: "", sending: false })
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
      console.error("Failed to update listing", error)
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

    if (!itemModal.form.title || !itemModal.form.price_per_day || !itemModal.form.category_id) {
      showToast("Please complete the item form.", "warning")
      return
    }

    if (itemModal.mode === "create" && itemImages.length === 0) {
      showToast("Please add at least one image.", "warning")
      return
    }

    setItemModal((prev) => ({ ...prev, saving: true }))
    try {
      if (itemModal.mode === "edit" && itemModal.listingId) {
        const payload = {
          title: itemModal.form.title,
          description: itemModal.form.description,
          price_per_day: itemModal.form.price_per_day,
          city: itemModal.form.city,
          category_id: Number(itemModal.form.category_id),
          is_active: itemModal.form.is_active,
          latitude: itemModal.form.latitude ? Number(itemModal.form.latitude) : null,
          longitude: itemModal.form.longitude ? Number(itemModal.form.longitude) : null,
          pickup_radius_m: itemModal.form.pickup_radius_m ? Number(itemModal.form.pickup_radius_m) : 300,
        }
        const response = await axiosInstance.patch(`${API}/listings/${itemModal.listingId}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setItems((prev) =>
          prev.map((item) => (item.id === itemModal.listingId ? response.data : item)),
        )
        showToast(ui.listingSaved, "success")
      } else {
        const formData = new FormData()
        formData.append("title", itemModal.form.title)
        formData.append("description", itemModal.form.description)
        formData.append("price_per_day", itemModal.form.price_per_day)
        formData.append("city", itemModal.form.city)
        formData.append("category_id", itemModal.form.category_id)
        formData.append("is_active", itemModal.form.is_active ? "true" : "false")
        formData.append("latitude", itemModal.form.latitude || "24.7136")
        formData.append("longitude", itemModal.form.longitude || "46.6753")
        formData.append("pickup_radius_m", itemModal.form.pickup_radius_m || "300")
        itemImages.forEach((image) => formData.append("images", image.file))

        const response = await axiosInstance.post(`${API}/listings/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setItems((prev) => [response.data, ...prev])
        showToast(itemModal.form.is_active ? ui.listingCreated : ui.draftCreated, "success")
      }

      closeItemModal()
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
      console.error("Failed to save availability", error)
      showToast("Failed to update availability.", "error")
      setAvailabilityModal((prev) => ({ ...prev, saving: false }))
    }
  }

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
                onClick={() => handleSidebarAction("all-bookings")}
              >
                {text.manageOrders}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden rounded-xl sm:inline-flex"
                aria-label={text.moreActions}
                onClick={() => scrollToSection("items-panel")}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_340px]">
            <div className="space-y-4">
              <section id="overview" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {statCards.map((card, index) => {
                  const Icon = card.icon
                  return (
                    <Card
                      key={card.label}
                      className={`rounded-[24px] border-border/60 shadow-none ${
                        index === 0
                          ? "border-primary/15 bg-gradient-to-br from-violet-50 via-white to-emerald-50 dark:from-violet-500/10 dark:via-card dark:to-emerald-500/10"
                          : "bg-card/90"
                      }`}
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">{card.label}</p>
                            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                              {card.value}
                            </p>
                            {card.accent ? (
                              <p className="mt-2 text-sm font-medium text-emerald-600">{card.accent}</p>
                            ) : null}
                          </div>
                          <div className="rounded-2xl bg-primary/10 p-2.5 text-primary shadow-sm">
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted/70">
                          <div
                            className={`h-full rounded-full ${
                              index === 0
                                ? "bg-gradient-to-r from-violet-500 to-emerald-400"
                                : "bg-primary/60"
                            }`}
                            style={{ width: `${index === 0 ? 88 : index === 1 ? 72 : index === 2 ? 64 : 58}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </section>

              <section id="performance" className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
                <EarningsChart
                  daily={data.chart.daily}
                  monthly={data.chart.monthly}
                  title={text.chartTitle}
                  description={text.chartDescription}
                  dailyLabel={text.daily}
                  monthlyLabel={text.monthly}
                  emptyLabel={text.chartEmpty}
                  totalLabel={text.chartTotalLabel}
                  averageLabel={text.chartAverageLabel}
                  peakLabel={text.chartPeakLabel}
                />

                <Card className="rounded-[28px] border-border/70 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{text.rankingTitle}</CardTitle>
                    <CardDescription>{text.rankFootnote}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="rounded-[24px] border border-border/60 bg-violet-50/70 p-4 dark:bg-violet-500/10">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {text.statusLabel}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-foreground">{text.hostStatusTitle}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {data.super_host.qualified ? text.qualified : text.notQualified}
                          </p>
                        </div>
                        <Badge variant={data.super_host.qualified ? "success" : "secondary"} className="rounded-full">
                          {data.super_host.qualified ? text.statusQualified : text.statusBuilding}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-4xl font-bold tracking-tight text-foreground">
                        #{data.ranking.position}
                        <span className="ml-2 text-xl font-medium text-muted-foreground">
                          of {data.ranking.total_lessors} {text.hostBadge}
                        </span>
                      </p>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {text.topPercentage} {milestone?.leaderboardPercent}%
                      </p>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                        style={{ width: `${milestone?.leaderboardPercent ?? 0}%` }}
                      />
                    </div>
                    <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                      {data.ranking.hint}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span>{data.summary.rating.toFixed(1)} rating</span>
                      <span className="text-border">•</span>
                      <span>{data.summary.rentals_count} rentals</span>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="items-insights" className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                <Card className="rounded-[28px] border-border/70 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl">{text.topItem}</CardTitle>
                        <CardDescription>{text.description}</CardDescription>
                      </div>
                      {data.summary.highest_earning_item ? (
                        <Button asChild size="sm" className="rounded-xl">
                          <Link href={`/listings/${data.summary.highest_earning_item.id}`}>
                            {text.promoteItem}
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {data.summary.highest_earning_item ? (
                      <div className="flex flex-col gap-4 rounded-[24px] border border-border/60 bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card text-primary shadow-sm">
                            <Camera className="h-8 w-8" />
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-foreground">
                              {data.summary.highest_earning_item.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatSar(data.summary.highest_earning_item.total_earnings)} {text.highestItemSubtitle}
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-3xl font-semibold tracking-tight text-foreground">
                            {formatCompactSar(data.summary.highest_earning_item.total_earnings)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {data.summary.highest_earning_item.rentals_count} rentals
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                        {text.noItem}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-[28px] border-border/70 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-amber-500" />
                      <CardTitle>{text.topHostsCompact}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.leaderboards.top_lessors_this_month.map((host, index) => (
                      <div
                        key={host.id}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={index === 0 ? "default" : "secondary"} className="rounded-full">
                            #{index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium text-foreground">{host.username}</p>
                            <p className="text-xs text-muted-foreground">{host.rating.toFixed(1)}/5</p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatSar(host.monthly_earnings)}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>

              <section id="demand-signals" className="grid gap-4 lg:grid-cols-2">
                <Card className="rounded-[28px] border-border/70 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <CardTitle>{text.rentalDemand}</CardTitle>
                    </div>
                    <CardDescription>{text.localDemandHint}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.leaderboards.top_renters_this_month.length ? (
                      data.leaderboards.top_renters_this_month.map((renter) => (
                        <div
                          key={renter.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 p-4"
                        >
                          <div>
                            <p className="font-medium text-foreground">{renter.username}</p>
                            <p className="text-sm text-muted-foreground">
                              {renter.rentals_count} rentals ·{" "}
                              {renter.rating ? `${renter.rating.toFixed(1)}/5` : text.unrated}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">
                              {formatSar(renter.total_spent)}
                            </p>
                            <p className="text-xs text-muted-foreground">{text.rentersSpent}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                        {text.noDemand}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-[28px] border-border/70 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      <CardTitle>{text.superHostTitle}</CardTitle>
                    </div>
                    <CardDescription>{text.superHostDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.super_host.requirements.map((requirement) => (
                      <div
                        key={requirement.label}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 p-4"
                      >
                        <div>
                          <p className="font-medium text-foreground">{requirement.label}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{requirement.detail}</p>
                        </div>
                        <Badge variant={requirement.met ? "default" : "outline"} className="shrink-0 rounded-full">
                          {requirement.met ? "Met" : "Open"}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>
            </div>

            <aside id="operations-rail" className="space-y-4">
              <Card id="bookings-panel" className="rounded-[28px] border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Calendar className="h-5 w-5 text-primary" />
                        {ui.bookingsWorkspace}
                      </CardTitle>
                      <CardDescription>{ui.bookingsHint}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      {bookings.length}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {([
                      ["incoming", text.incomingNav],
                      ["ongoing", text.ongoingNav],
                      ["soon", text.soon],
                      ["past", text.pastNav],
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
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {bookingBuckets[bookingTab].length ? (
                    <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
                      {bookingBuckets[bookingTab].map((booking) => {
                        const listingImage = getImageUrl(booking.listing?.images?.[0]?.image)
                        return (
                          <div key={booking.id} className="rounded-[24px] border border-border/60 bg-muted/30 p-3.5">
                            <div className="flex gap-3">
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-background">
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
                                      {formatDateRange(booking.start_date, booking.end_date)}
                                    </p>
                                  </div>
                                  <Badge
                                    variant={
                                      booking.status === "PENDING"
                                        ? "secondary"
                                        : booking.status === "CONFIRMED"
                                          ? "success"
                                          : "outline"
                                    }
                                    className="rounded-full"
                                  >
                                    {booking.status}
                                  </Badge>
                                </div>
                                <p className="mt-2 text-sm font-medium text-foreground">
                                  {formatSar(booking.total_price)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {ui.renterLabel}: {booking.renter?.username ?? "Guest"}
                                </p>
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
                              {bookingTab !== "incoming" ? (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => setDetailsBooking(booking)}>
                                    <Eye className="h-4 w-4" />
                                    {ui.viewDetails}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setMessageModal({ open: true, booking, text: "", sending: false })}
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                    {ui.messageRenter}
                                  </Button>
                                </>
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                      {ui.noBookings}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card id="items-panel" className="rounded-[28px] border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Package className="h-5 w-5 text-primary" />
                        {ui.itemsWorkspace}
                      </CardTitle>
                      <CardDescription>{ui.itemsHint}</CardDescription>
                    </div>
                    <Button size="sm" className="rounded-xl" onClick={openCreateItemModal}>
                      <PlusCircle className="h-4 w-4" />
                      {ui.addNewItem}
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setItemsTab("all")}
                      className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                        itemsTab === "all" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {ui.allFilter}
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemsTab("active")}
                      className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                        itemsTab === "active" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {ui.activeFilter}
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemsTab("drafts")}
                      className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                        itemsTab === "drafts" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {ui.draftFilter}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-[20px] bg-muted/40 p-3">
                      <p className="text-[11px] text-muted-foreground">{ui.allFilter}</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{itemsSummary.total}</p>
                    </div>
                    <div className="rounded-[20px] bg-muted/40 p-3">
                      <p className="text-[11px] text-muted-foreground">{ui.activeFilter}</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{itemsSummary.active}</p>
                    </div>
                    <div className="rounded-[20px] bg-muted/40 p-3">
                      <p className="text-[11px] text-muted-foreground">{ui.draftFilter}</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{itemsSummary.drafts}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {visibleItems.length ? (
                    <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
                      {visibleItems.slice(0, 6).map((listing) => {
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
                                  <div className="min-w-0">
                                    <p className="line-clamp-1 font-semibold text-foreground">{listing.title}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {formatSar(listing.price_per_day)} / day
                                    </p>
                                  </div>
                                  <Badge variant={listing.is_active !== false ? "success" : "secondary"} className="rounded-full">
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
                                    {actionBusy ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : listing.is_active !== false ? (
                                      <PauseCircle className="h-4 w-4" />
                                    ) : (
                                      <PlayCircle className="h-4 w-4" />
                                    )}
                                    {listing.is_active !== false ? ui.pauseListing : ui.resumeListing}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => openAvailabilityModal(String(listing.id))}>
                                    <CalendarDays className="h-4 w-4" />
                                    {ui.updateAvailability}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDuplicateListing(listing)}
                                    disabled={actionBusy}
                                  >
                                    <Copy className="h-4 w-4" />
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
                    <div className="rounded-[24px] border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                      {ui.noItems}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{text.nextMilestone}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-foreground">
                      {milestone?.remainingRentals
                        ? `Reach ${milestone.remainingRentals} more rentals`
                        : text.qualified}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{text.unlockSuperHost}</p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                      <span>{text.rentals}</span>
                      <span>{milestone?.progress}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500"
                        style={{ width: `${milestone?.progress ?? 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-[24px] bg-violet-50 p-4 dark:bg-violet-500/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-violet-500 text-white shadow-sm">
                        <Trophy className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground">{text.unlockSuperHost}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.super_host.qualified ? text.qualified : text.notQualified}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full rounded-xl" onClick={openCreateItemModal}>
                    {ui.addNewItem}
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border-border/70 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    <CardTitle>{text.popularSearches}</CardTitle>
                  </div>
                  <CardDescription>{text.popularSearchesBody}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trendingSearches.map((searchItem) => (
                    <div
                      key={searchItem.label}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card text-emerald-600 shadow-sm">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{searchItem.label}</p>
                          <p className="text-xs text-muted-foreground">{searchItem.value}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
      </div>

      {itemModal.open ? (
        <FloatingModal onClose={closeItemModal}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {itemModal.mode === "edit" ? ui.editListing : ui.createItem}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{ui.itemsHint}</p>
            </div>
            <button type="button" onClick={closeItemModal} className="rounded-2xl p-2 text-muted-foreground hover:bg-accent/70">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {itemModal.mode === "create" ? (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-foreground">Photos</label>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
                  <ImagePlus className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium text-foreground">Upload listing images</span>
                  <span className="text-xs text-muted-foreground">Add up to 8 photos for the new item.</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) addItemImages(e.target.files)
                    }}
                  />
                </label>
                {itemImages.length ? (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {itemImages.map((image) => (
                      <div key={image.id} className="relative overflow-hidden rounded-[20px] border border-border/60 bg-muted/30">
                        <img src={image.preview} alt="Listing preview" className="h-24 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeItemImage(image.id)}
                          className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.titleLabel}</label>
              <Input
                value={itemModal.form.title}
                onChange={(e) => setItemModal((prev) => ({ ...prev, form: { ...prev.form, title: e.target.value } }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.categoryLabel}</label>
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
              <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.pricePerDayLabel}</label>
              <Input
                type="number"
                min="0"
                value={itemModal.form.price_per_day}
                onChange={(e) =>
                  setItemModal((prev) => ({ ...prev, form: { ...prev.form, price_per_day: e.target.value } }))
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.cityLabel}</label>
              <Input
                value={itemModal.form.city}
                onChange={(e) => setItemModal((prev) => ({ ...prev, form: { ...prev.form, city: e.target.value } }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.pickupRadiusLabel}</label>
              <Input
                type="number"
                min="100"
                value={itemModal.form.pickup_radius_m}
                onChange={(e) =>
                  setItemModal((prev) => ({ ...prev, form: { ...prev.form, pickup_radius_m: e.target.value } }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.descriptionLabel}</label>
              <textarea
                value={itemModal.form.description}
                onChange={(e) =>
                  setItemModal((prev) => ({ ...prev, form: { ...prev.form, description: e.target.value } }))
                }
                className="min-h-[110px] w-full rounded-2xl border border-input bg-background/90 px-4 py-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div className="sm:col-span-2 overflow-hidden rounded-[24px] border border-border/60">
              <LocationPicker
                initialLat={Number(itemModal.form.latitude || 24.7136)}
                initialLng={Number(itemModal.form.longitude || 46.6753)}
                initialRadius={Number(itemModal.form.pickup_radius_m || 300)}
                onLocationChange={(lat, lng, radius) =>
                  setItemModal((prev) => ({
                    ...prev,
                    form: {
                      ...prev.form,
                      latitude: String(lat),
                      longitude: String(lng),
                      pickup_radius_m: String(radius),
                    },
                  }))
                }
              />
            </div>
            <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={itemModal.form.is_active}
                onChange={(e) =>
                  setItemModal((prev) => ({ ...prev, form: { ...prev.form, is_active: e.target.checked } }))
                }
              />
              {ui.publishNow}
            </label>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={closeItemModal}>
              {ui.cancel}
            </Button>
            <Button onClick={handleSaveItem} disabled={itemModal.saving}>
              {itemModal.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {ui.save}
            </Button>
          </div>
        </FloatingModal>
      ) : null}

      {availabilityModal.open ? (
        <FloatingModal
          onClose={() =>
            setAvailabilityModal({
              open: false,
              saving: false,
              form: { listingId: "", start_date: "", end_date: "", reason: "" },
            })
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{ui.availabilityTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{ui.itemsHint}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setAvailabilityModal({
                  open: false,
                  saving: false,
                  form: { listingId: "", start_date: "", end_date: "", reason: "" },
                })
              }
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
                onChange={(e) =>
                  setAvailabilityModal((prev) => ({ ...prev, form: { ...prev.form, listingId: e.target.value } }))
                }
                className="h-11 w-full rounded-2xl border border-input bg-background/90 px-4 text-sm shadow-sm"
              >
                <option value="">{ui.selectItem}</option>
                {items.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.title}
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
                  onChange={(e) =>
                    setAvailabilityModal((prev) => ({ ...prev, form: { ...prev.form, start_date: e.target.value } }))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.endDate}</label>
                <Input
                  type="date"
                  value={availabilityModal.form.end_date}
                  onChange={(e) =>
                    setAvailabilityModal((prev) => ({ ...prev, form: { ...prev.form, end_date: e.target.value } }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{ui.reason}</label>
              <textarea
                value={availabilityModal.form.reason}
                onChange={(e) =>
                  setAvailabilityModal((prev) => ({ ...prev, form: { ...prev.form, reason: e.target.value } }))
                }
                className="min-h-[100px] w-full rounded-2xl border border-input bg-background/90 px-4 py-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setAvailabilityModal({
                  open: false,
                  saving: false,
                  form: { listingId: "", start_date: "", end_date: "", reason: "" },
                })
              }
            >
              {ui.cancel}
            </Button>
            <Button
              onClick={handleAvailabilitySave}
              disabled={
                availabilityModal.saving ||
                !availabilityModal.form.listingId ||
                !availabilityModal.form.start_date ||
                !availabilityModal.form.end_date
              }
            >
              {availabilityModal.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {ui.save}
            </Button>
          </div>
        </FloatingModal>
      ) : null}

      {messageModal.open && messageModal.booking ? (
        <FloatingModal onClose={() => setMessageModal({ open: false, booking: null, text: "", sending: false })}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{ui.sendMessage}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{messageModal.booking.listing?.title}</p>
            </div>
            <button
              type="button"
              onClick={() => setMessageModal({ open: false, booking: null, text: "", sending: false })}
              className="rounded-2xl p-2 text-muted-foreground hover:bg-accent/70"
            >
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
            <Button variant="outline" onClick={() => setMessageModal({ open: false, booking: null, text: "", sending: false })}>
              {ui.cancel}
            </Button>
            <Button onClick={handleSendMessage} disabled={messageModal.sending || !messageModal.text.trim()}>
              {messageModal.sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {ui.sendMessage}
            </Button>
          </div>
        </FloatingModal>
      ) : null}

      {detailsBooking ? (
        <FloatingModal onClose={() => setDetailsBooking(null)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{ui.bookingDetails}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{detailsBooking.listing?.title}</p>
            </div>
            <button type="button" onClick={() => setDetailsBooking(null)} className="rounded-2xl p-2 text-muted-foreground hover:bg-accent/70">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 space-y-3 rounded-[24px] border border-border/60 bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{ui.renterLabel}</span>
              <span className="font-medium text-foreground">{detailsBooking.renter?.username ?? "Guest"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{ui.statusLabelShort}</span>
              <span className="font-medium text-foreground">{detailsBooking.status}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{ui.paymentLabel}</span>
              <span className="font-medium text-foreground">{detailsBooking.payment_status ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{text.rentals}</span>
              <span className="font-medium text-foreground">
                {formatDateRange(detailsBooking.start_date, detailsBooking.end_date)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{text.totalEarnings}</span>
              <span className="font-medium text-foreground">{formatSar(detailsBooking.total_price)}</span>
            </div>
          </div>
        </FloatingModal>
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
