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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flame,
  Inbox,
  LayoutDashboard,
  LucideIcon,
  Menu,
  MoreHorizontal,
  PlusCircle,
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  const [data, setData] = useState<LandlordEarningsDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isTabletNavExpanded, setIsTabletNavExpanded] = useState(false)
  const [isDesktopWide, setIsDesktopWide] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    items: true,
    bookings: true,
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

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    if (!token || !API) {
      setIsLoading(false)
      return
    }

    axiosInstance
      .get<LandlordEarningsDashboard>(`${API}/earnings/dashboard/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setData(response.data))
      .catch((error) => {
        console.error("Failed to load earnings dashboard", error)
        setData(null)
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
              <Button asChild className="w-full rounded-xl sm:w-auto">
                <Link href="/listings/new">
                  {text.listProduct}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-xl sm:w-auto">
                <Link href="/bookings">{text.manageOrders}</Link>
              </Button>
              <Button variant="ghost" size="icon" className="hidden rounded-xl sm:inline-flex" aria-label={text.moreActions}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
            <div className="space-y-4">
              <section id="overview" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {statCards.map((card) => {
                  const Icon = card.icon
                  return (
                    <Card key={card.label} className="rounded-[24px] border-border/60 shadow-none">
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
                          <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </section>

              <section id="performance" className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
                <EarningsChart
                  daily={data.chart.daily}
                  monthly={data.chart.monthly}
                  title={text.chartTitle}
                  description={text.chartDescription}
                  dailyLabel={text.daily}
                  monthlyLabel={text.monthly}
                  emptyLabel={text.chartEmpty}
                />

                <Card className="rounded-[28px] border-border/70 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{text.rankingTitle}</CardTitle>
                    <CardDescription>{text.rankFootnote}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
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

            <aside id="milestone" className="space-y-4">
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
                  <Button asChild className="w-full rounded-xl">
                    <Link href="/listings/new">{text.listProduct}</Link>
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
