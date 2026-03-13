"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import axiosInstance from "@/lib/axios"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatSar, type PublicCommunityEarnings } from "@/lib/earnings"
import { useLocale } from "@/components/LocaleProvider"

const API = process.env.NEXT_PUBLIC_API_BASE

const copy = {
  en: {
    eyebrow: "Top hosts",
    title: "Meet the top hosts this month",
    description:
      "See the lessors leading the platform with strong earnings, repeat rentals, and standout ratings.",
    cta: "View community earnings",
    loading: "Loading top hosts...",
  },
  ar: {
    eyebrow: "أفضل المضيفين",
    title: "تعرّف على أفضل المضيفين هذا الشهر",
    description:
      "تعرّف على المؤجرين الذين يقودون المنصة بأرباح قوية وتأجيرات متكررة وتقييمات مميزة.",
    cta: "عرض أرباح المجتمع",
    loading: "جارٍ تحميل أفضل المضيفين...",
  },
} as const

export function TopHostsClient() {
  const { lang } = useLocale()
  const text = copy[lang]
  const [data, setData] = useState<PublicCommunityEarnings | null>(null)

  useEffect(() => {
    if (!API) return
    axiosInstance
      .get<PublicCommunityEarnings>(`${API}/earnings/public/`)
      .then((response) => setData(response.data))
      .catch((error) => {
        console.error("Failed to load top hosts", error)
        setData(null)
      })
  }, [])

  return (
    <div className="min-h-screen bg-background py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 mobile-content">
        <div className="mb-8 max-w-3xl">
          <p className="section-label mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            {text.eyebrow}
          </p>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{text.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{text.description}</p>
        </div>

        {data ? (
          <div className="space-y-4">
            {data.highest_earning_lessors_per_month.map((host, index) => (
              <Card key={host.id} className="rounded-3xl border-border/70 shadow-sm">
                <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-2xl">{host.username}</CardTitle>
                    <CardDescription>
                      {host.rentals_count} rentals · {host.rating.toFixed(1)}/5
                    </CardDescription>
                  </div>
                  <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-3xl font-semibold text-foreground">
                    {formatSar(host.monthly_earnings)}
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/community-earnings">{text.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
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
