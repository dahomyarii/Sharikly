"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import axiosInstance from "@/lib/axios"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCompactSar, formatSar, type PublicCommunityEarnings } from "@/lib/earnings"
import { useLocale } from "@/components/LocaleProvider"

const API = process.env.NEXT_PUBLIC_API_BASE

const copy = {
  en: {
    eyebrow: "Community earnings",
    title: "How much does the platform community earn?",
    description:
      "Show real momentum to future lessors with live platform earnings, strong monthly averages, and the hosts leading the month.",
    total: "Total landlord earnings",
    average: "Average landlord income",
    topHosts: "Top hosts this month",
    publicPage: "Community earnings page",
    startPage: "Start renting page",
    loading: "Loading community earnings...",
  },
  ar: {
    eyebrow: "أرباح المجتمع",
    title: "كم يربح مجتمع المنصة؟",
    description:
      "اعرض مؤشرات حقيقية للمؤجرين الجدد من خلال أرباح المنصة الفعلية ومتوسطات الدخل الشهرية وأفضل المضيفين هذا الشهر.",
    total: "إجمالي أرباح المؤجرين",
    average: "متوسط دخل المؤجر",
    topHosts: "أفضل المضيفين هذا الشهر",
    publicPage: "صفحة أرباح المجتمع",
    startPage: "صفحة ابدأ التأجير",
    loading: "جارٍ تحميل أرباح المجتمع...",
  },
} as const

export function CommunityEarningsSection() {
  const { lang } = useLocale()
  const text = copy[lang]
  const [data, setData] = useState<PublicCommunityEarnings | null>(null)

  useEffect(() => {
    if (!API) return

    axiosInstance
      .get<PublicCommunityEarnings>(`${API}/earnings/public/`)
      .then((response) => setData(response.data))
      .catch((error) => {
        console.error("Failed to load public earnings", error)
        setData(null)
      })
  }, [])

  return (
    <section className="border-t border-border bg-muted/40 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 mobile-content">
        <div className="mb-5 max-w-2xl">
          <p className="section-label mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            {text.eyebrow}
          </p>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{text.title}</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{text.description}</p>
        </div>

        {data ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="rounded-3xl border-border/70 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{text.total}</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {formatCompactSar(data.total_lessor_earnings)}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-border/70 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{text.average}</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {formatSar(data.average_lessor_income_per_month)}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-border/70 shadow-sm sm:col-span-2">
                <CardContent className="p-5">
                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link href="/community-earnings">{text.publicPage}</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/start-renting">{text.startPage}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl border-border/70 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">{text.topHosts}</h3>
                  <Badge variant="secondary">{data.highest_earning_lessors_per_month.length}</Badge>
                </div>
                <div className="space-y-3">
                  {data.highest_earning_lessors_per_month.map((host) => (
                    <div
                      key={host.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 p-3.5"
                    >
                      <div>
                        <p className="font-medium text-foreground">{host.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {host.rentals_count} rentals · {host.rating.toFixed(1)}/5
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatSar(host.monthly_earnings)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="rounded-3xl border-dashed border-border shadow-none">
            <CardContent className="p-6 text-sm text-muted-foreground">{text.loading}</CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
