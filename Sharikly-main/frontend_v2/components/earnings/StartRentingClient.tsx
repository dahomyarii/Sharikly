"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import axiosInstance from "@/lib/axios"
import { EarningsCalculator } from "@/components/earnings/EarningsCalculator"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatSar, type PublicCommunityEarnings } from "@/lib/earnings"
import { useLocale } from "@/components/LocaleProvider"

const API = process.env.NEXT_PUBLIC_API_BASE

const copy = {
  en: {
    eyebrow: "Lessor attraction page",
    title: "Start earning from your equipment",
    description:
      "A simple business case for companies and individuals who want to turn idle equipment into reliable monthly income.",
    average: "Average landlord income",
    highest: "Highest earning landlords",
    cta: "Create your first product",
    calculatorTitle: "How much can you earn?",
    calculatorDescription:
      "Estimate the yearly income you could generate from the equipment you already own.",
    productsLabel: "How many cameras or products do you have?",
    priceLabel: "What is the daily rental price?",
    submitLabel: "Calculate earnings",
    resultTitle: "You can earn",
    annualLabel: "Annual earnings",
    monthlyLabel: "Monthly earnings",
    successTitle: "Success stories",
    loading: "Loading earning highlights...",
  },
  ar: {
    eyebrow: "صفحة جذب المؤجرين",
    title: "ابدأ الربح من معداتك",
    description:
      "عرض واضح للشركات والأفراد الذين يريدون تحويل المعدات غير المستخدمة إلى دخل شهري موثوق.",
    average: "متوسط دخل المؤجر",
    highest: "أعلى المؤجرين ربحًا",
    cta: "أنشئ أول منتج لك",
    calculatorTitle: "كم يمكنك أن تربح؟",
    calculatorDescription:
      "احسب الدخل السنوي المتوقع من المعدات التي تملكها بالفعل.",
    productsLabel: "كم عدد الكاميرات أو المنتجات التي لديك؟",
    priceLabel: "ما هو سعر التأجير اليومي؟",
    submitLabel: "احسب الأرباح",
    resultTitle: "يمكنك أن تربح",
    annualLabel: "الأرباح السنوية",
    monthlyLabel: "الأرباح الشهرية",
    successTitle: "قصص نجاح",
    loading: "جارٍ تحميل مؤشرات الأرباح...",
  },
} as const

export function StartRentingClient() {
  const { lang } = useLocale()
  const text = copy[lang]
  const [data, setData] = useState<PublicCommunityEarnings | null>(null)

  useEffect(() => {
    if (!API) return
    axiosInstance
      .get<PublicCommunityEarnings>(`${API}/earnings/public/`)
      .then((response) => setData(response.data))
      .catch((error) => {
        console.error("Failed to load start renting stats", error)
        setData(null)
      })
  }, [])

  return (
    <div className="min-h-screen bg-background py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 mobile-content">
        <section className="rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
          <p className="section-label mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            {text.eyebrow}
          </p>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{text.title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">{text.description}</p>
          <div className="mt-5">
            <Button asChild>
              <Link href="/listings/new">{text.cta}</Link>
            </Button>
          </div>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2">
          <Card className="rounded-3xl border-border/70 shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{text.average}</p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {data ? formatSar(data.attraction.average_landlord_income_per_month) : "—"}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-border/70 shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{text.highest}</p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {data?.attraction.highest_earning_landlords_per_month[0]
                  ? formatSar(data.attraction.highest_earning_landlords_per_month[0].monthly_earnings)
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-4">
          <EarningsCalculator
            title={text.calculatorTitle}
            description={text.calculatorDescription}
            productsLabel={text.productsLabel}
            priceLabel={text.priceLabel}
            submitLabel={text.submitLabel}
            resultTitle={text.resultTitle}
            annualLabel={text.annualLabel}
            monthlyLabel={text.monthlyLabel}
          />
        </section>

        <section className="mt-4">
          <Card className="rounded-3xl border-border/70 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-foreground">{text.successTitle}</h2>
              {data ? (
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {data.highest_earning_lessors_per_month.map((host) => (
                    <div key={host.id} className="rounded-2xl bg-muted/50 p-4">
                      <p className="font-semibold text-foreground">{host.username}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {host.rentals_count} rentals · {host.rating.toFixed(1)}/5
                      </p>
                      <p className="mt-3 text-lg font-semibold text-foreground">
                        {formatSar(host.monthly_earnings)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">{text.loading}</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
