"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Camera,
  Crown,
  Medal,
  Package,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react"

import axiosInstance from "@/lib/axios"
import { EarningsChart } from "@/components/earnings/EarningsChart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatSar, type LandlordEarningsDashboard } from "@/lib/earnings"
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

    return [
      {
        label: text.totalEarnings,
        value: formatSar(data.summary.total_earnings),
        icon: Wallet,
      },
      {
        label: text.monthEarnings,
        value: formatSar(data.summary.this_month_earnings),
        icon: TrendingUp,
      },
      {
        label: text.rentals,
        value: `${data.summary.rentals_count}`,
        icon: Package,
      },
      {
        label: text.rating,
        value: `${data.summary.rating.toFixed(1)}/5`,
        icon: Star,
      },
    ]
  }, [data, text])

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
    <div className="min-h-screen bg-background py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 mobile-content">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
          <div>
            <p className="section-label mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              {text.eyebrow}
            </p>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{text.title}</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">
              {text.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/listings/new">
                {text.listProduct}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/bookings">{text.manageOrders}</Link>
            </Button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.label} className="rounded-3xl border-border/70 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">{card.value}</p>
                    </div>
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <EarningsChart
            daily={data.chart.daily}
            monthly={data.chart.monthly}
            title={text.chartTitle}
            description={text.chartDescription}
            dailyLabel={text.daily}
            monthlyLabel={text.monthly}
            emptyLabel={text.chartEmpty}
          />

          <Card className="rounded-3xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">{text.topItem}</CardTitle>
              <CardDescription>{text.rankingDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.summary.highest_earning_item ? (
                <div className="rounded-2xl bg-muted/60 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {data.summary.highest_earning_item.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {data.summary.highest_earning_item.rentals_count} rentals
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-foreground">
                    {formatSar(data.summary.highest_earning_item.total_earnings)}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  {text.noItem}
                </div>
              )}

              <div className="rounded-2xl bg-amber-500/10 p-5">
                <div className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-amber-700" />
                  <h2 className="font-semibold text-foreground">{text.rankingTitle}</h2>
                </div>
                <p className="mt-3 text-3xl font-semibold text-foreground">
                  #{data.ranking.position}
                  <span className="text-base font-medium text-muted-foreground">
                    {" "}
                    / {data.ranking.total_lessors}
                  </span>
                </p>
                <p className="mt-3 text-sm text-muted-foreground">{data.ranking.hint}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-3">
          <Card className="rounded-3xl border-border/70 shadow-sm xl:col-span-1">
            <CardHeader>
              <CardTitle>{text.topHosts}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.leaderboards.top_lessors_this_month.map((host, index) => (
                <div key={host.id} className="rounded-2xl bg-muted/50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                      <div>
                        <p className="font-medium text-foreground">{host.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {host.rentals_count} rentals · {host.rating.toFixed(1)}/5
                        </p>
                      </div>
                    </div>
                    {index === 0 ? <Crown className="h-5 w-5 text-amber-600" /> : null}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{formatSar(host.monthly_earnings)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 shadow-sm xl:col-span-1">
            <CardHeader>
              <CardTitle>{text.topRenters}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.leaderboards.top_renters_this_month.map((renter, index) => (
                <div key={renter.id} className="rounded-2xl bg-muted/50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        #{index + 1} {renter.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {renter.rentals_count} rentals ·{" "}
                        {renter.rating ? `${renter.rating.toFixed(1)}/5` : text.unrated}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {text.rentersSpent}: {formatSar(renter.total_spent)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 shadow-sm xl:col-span-1">
            <CardHeader>
              <CardTitle>{text.superHostTitle}</CardTitle>
              <CardDescription>{text.superHostDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant={data.super_host.qualified ? "default" : "secondary"}>
                {data.super_host.qualified ? text.qualified : text.notQualified}
              </Badge>
              <div className="space-y-3">
                {data.super_host.requirements.map((requirement) => (
                  <div
                    key={requirement.label}
                    className="rounded-2xl border border-border/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">{requirement.label}</p>
                      <Badge variant={requirement.met ? "default" : "outline"}>
                        {requirement.met ? "Met" : "Open"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{requirement.detail}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-muted/60 p-4">
                <p className="font-medium text-foreground">{text.benefits}</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {data.super_host.benefits.map((benefit) => (
                    <li key={benefit}>• {benefit}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
