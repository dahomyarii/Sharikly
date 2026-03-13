"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import axiosInstance from "@/lib/axios"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompactSar, formatSar, type PublicCommunityEarnings } from "@/lib/earnings"
import { useLocale } from "@/components/LocaleProvider"

const API = process.env.NEXT_PUBLIC_API_BASE

const copy = {
  en: {
    eyebrow: "Public earnings page",
    title: "How much do lessors earn on the platform?",
    description:
      "Strong social proof helps future lessors picture themselves building a business through EKRA.",
    total: "Total lessor earnings",
    average: "Average lessor income",
    topHosts: "Highest earning landlords",
    cta: "Start earning from your equipment",
    loading: "Loading public earnings...",
    monthly: "per month",
  },
  ar: {
    eyebrow: "صفحة أرباح عامة",
    title: "كم يربح المؤجرون على المنصة؟",
    description:
      "الدليل الاجتماعي القوي يساعد المؤجرين الجدد على تخيّل بناء مشروعهم عبر منصة إكرا.",
    total: "إجمالي أرباح المؤجرين",
    average: "متوسط دخل المؤجر",
    topHosts: "أعلى المؤجرين ربحًا",
    cta: "ابدأ الربح من معداتك",
    loading: "جارٍ تحميل الأرباح العامة...",
    monthly: "شهريًا",
  },
} as const

export function PublicCommunityEarningsClient() {
  const { lang } = useLocale()
  const text = copy[lang]
  const [data, setData] = useState<PublicCommunityEarnings | null>(null)

  useEffect(() => {
    if (!API) return
    axiosInstance
      .get<PublicCommunityEarnings>(`${API}/earnings/public/`)
      .then((response) => setData(response.data))
      .catch((error) => {
        console.error("Failed to load community earnings page", error)
        setData(null)
      })
  }, [])

  return (
    <div className="min-h-screen bg-background py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 mobile-content">
        <div className="mb-8 max-w-3xl">
          <p className="section-label mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            {text.eyebrow}
          </p>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{text.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{text.description}</p>
        </div>

        {data ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Card className="rounded-3xl border-border/70 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">{text.total}</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {formatCompactSar(data.total_lessor_earnings)}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-border/70 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">{text.average}</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {formatSar(data.average_lessor_income_per_month)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{text.monthly}</p>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-border/70 shadow-sm">
                <CardContent className="p-6">
                  <Button asChild>
                    <Link href="/start-renting">{text.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>{text.topHosts}</CardTitle>
                <CardDescription>
                  {data.highest_earning_lessors_per_month.length} featured hosts this month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.highest_earning_lessors_per_month.map((host, index) => (
                  <div
                    key={host.id}
                    className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                        <p className="font-semibold text-foreground">{host.username}</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {host.rentals_count} rentals · {host.rating.toFixed(1)}/5
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      {formatSar(host.monthly_earnings)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="rounded-3xl border-dashed border-border shadow-none">
            <CardContent className="p-6 text-sm text-muted-foreground">{text.loading}</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
