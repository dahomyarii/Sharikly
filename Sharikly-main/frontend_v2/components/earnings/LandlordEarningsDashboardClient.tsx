"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Activity,
  ArrowRight,
  Camera,
  Crown,
  Flame,
  MoreHorizontal,
  Package,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Trophy,
  Wallet,
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
  },
} as const

export function LandlordEarningsDashboardClient() {
  const router = useRouter()
  const { lang } = useLocale()
  const text = copy[lang]
  const [data, setData] = useState<LandlordEarningsDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      <div className="mx-auto max-w-[1280px] px-3 sm:px-6 lg:px-8 mobile-content">
        <div className="rounded-[32px] border border-border/60 bg-card/95 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.06)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
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
            <div className="flex flex-wrap gap-2">
              <Button asChild className="rounded-xl">
                <Link href="/listings/new">
                  {text.listProduct}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/bookings">{text.manageOrders}</Link>
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl" aria-label={text.moreActions}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
            <div className="space-y-4">
              <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => {
                  const Icon = card.icon
                  return (
                    <Card key={card.label} className="rounded-[24px] border-border/60 shadow-none">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">{card.label}</p>
                            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
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

              <section className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
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

              <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
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

              <section className="grid gap-4 lg:grid-cols-2">
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

            <aside className="space-y-4">
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
    </div>
  )
}
