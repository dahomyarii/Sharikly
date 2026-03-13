"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatSar, getBestChartPoint, type EarningsPoint, toNumber } from "@/lib/earnings"

type ChartMode = "daily" | "monthly"

interface EarningsChartProps {
  daily: EarningsPoint[]
  monthly: EarningsPoint[]
  title: string
  description: string
  dailyLabel: string
  monthlyLabel: string
  emptyLabel: string
}

export function EarningsChart({
  daily,
  monthly,
  title,
  description,
  dailyLabel,
  monthlyLabel,
  emptyLabel,
}: EarningsChartProps) {
  const [mode, setMode] = useState<ChartMode>("daily")

  const activeSeries = mode === "daily" ? daily : monthly
  const chartData = useMemo(
    () =>
      activeSeries.map((point) => ({
        label: point.label,
        earnings: toNumber(point.earnings),
      })),
    [activeSeries],
  )
  const bestPoint = getBestChartPoint(activeSeries)

  return (
    <Card className="rounded-3xl border-border/70 shadow-sm">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2" role="tablist" aria-label={title}>
            <Button
              type="button"
              size="sm"
              variant={mode === "daily" ? "default" : "outline"}
              onClick={() => setMode("daily")}
              aria-pressed={mode === "daily"}
            >
              {dailyLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "monthly" ? "default" : "outline"}
              onClick={() => setMode("monthly")}
              aria-pressed={mode === "monthly"}
            >
              {monthlyLabel}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {chartData.length > 0 ? (
          <>
            <div className="h-72 w-full" aria-label={title} role="img">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={16} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    tickFormatter={(value: number) => formatSar(value)}
                  />
                  <Tooltip
                    formatter={(value: number) => formatSar(value, 2)}
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="var(--color-chart-1)"
                    fill="url(#earningsGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
              {bestPoint ? (
                <p>
                  Highest {mode === "daily" ? dailyLabel.toLowerCase() : monthlyLabel.toLowerCase()}:
                  {" "}
                  <span className="font-semibold text-foreground">
                    {bestPoint.label} ({formatSar(bestPoint.earnings)})
                  </span>
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
