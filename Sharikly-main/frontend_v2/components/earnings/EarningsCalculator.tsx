"use client"

import { useMemo, useState } from "react"

import axiosInstance from "@/lib/axios"
import { formatSar, type EarningsCalculatorResponse } from "@/lib/earnings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface EarningsCalculatorProps {
  title: string
  description: string
  productsLabel: string
  priceLabel: string
  submitLabel: string
  resultTitle: string
  annualLabel: string
  monthlyLabel: string
}

export function EarningsCalculator({
  title,
  description,
  productsLabel,
  priceLabel,
  submitLabel,
  resultTitle,
  annualLabel,
  monthlyLabel,
}: EarningsCalculatorProps) {
  const [productsCount, setProductsCount] = useState("3")
  const [dailyRentalPrice, setDailyRentalPrice] = useState("200")
  const [result, setResult] = useState<EarningsCalculatorResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const disabled = useMemo(
    () => !productsCount.trim() || !dailyRentalPrice.trim() || isLoading,
    [dailyRentalPrice, isLoading, productsCount],
  )

  const handleCalculate = async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE
    if (!apiBase) return

    setIsLoading(true)
    try {
      const response = await axiosInstance.post<EarningsCalculatorResponse>(
        `${apiBase}/earnings/calculator/`,
        {
          products_count: Number(productsCount),
          daily_rental_price: Number(dailyRentalPrice),
        },
      )
      setResult(response.data)
    } catch (error) {
      console.error("Failed to calculate earnings", error)
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="rounded-3xl border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            {productsLabel}
            <Input
              type="number"
              min={1}
              step={1}
              value={productsCount}
              onChange={(event) => setProductsCount(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            {priceLabel}
            <Input
              type="number"
              min={0}
              step={1}
              value={dailyRentalPrice}
              onChange={(event) => setDailyRentalPrice(event.target.value)}
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="button" onClick={handleCalculate} disabled={disabled}>
              {isLoading ? "Calculating..." : submitLabel}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl bg-muted/60 p-5">
          <p className="text-sm font-medium text-muted-foreground">{resultTitle}</p>
          {result ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{annualLabel}</p>
                <p className="text-3xl font-semibold text-foreground">{formatSar(result.annual_earnings)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{monthlyLabel}</p>
                <p className="text-lg font-medium text-foreground">{formatSar(result.monthly_earnings)}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Enter your numbers to see how much your equipment could earn.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
