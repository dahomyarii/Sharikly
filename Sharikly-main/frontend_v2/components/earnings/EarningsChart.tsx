"use client"

import { useMemo, useState } from "react"
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompactSar, formatSar, getBestChartPoint, type EarningsPoint, toNumber } from "@/lib/earnings"

type ChartMode = "daily" | "monthly"

interface EarningsChartProps {
  daily: EarningsPoint[]
  monthly: EarningsPoint[]
  title: string
  description: string
  dailyLabel: string
  monthlyLabel: string
  emptyLabel: string
  totalLabel: string
  averageLabel: string
  peakLabel: string
}

export function EarningsChart({
  daily,
  monthly,
  title,
  description,
  dailyLabel,
  monthlyLabel,
  emptyLabel,
  totalLabel,
  averageLabel,
  peakLabel,
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
  const totalValue = useMemo(
    () => chartData.reduce((sum, point) => sum + point.earnings, 0),
    [chartData],
  )
  const averageValue = chartData.length ? totalValue / chartData.length : 0

  return (
    <Card className="rounded-[28px] border-border/70 shadow-sm">
      <CardHeader className="gap-4 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div
            className="inline-flex rounded-full bg-muted p-1"
            role="tablist"
            aria-label={title}
          >
            <Button
              type="button"
              size="sm"
              variant={mode === "daily" ? "default" : "ghost"}
              onClick={() => setMode("daily")}
              aria-pressed={mode === "daily"}
              className="rounded-full border-0 shadow-none"
            >
              {dailyLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "monthly" ? "default" : "ghost"}
              onClick={() => setMode("monthly")}
              aria-pressed={mode === "monthly"}
              className="rounded-full border-0 shadow-none"
            >
              {monthlyLabel}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {chartData.length > 0 ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-border/60 bg-muted/35 p-3">
                <p className="text-xs text-muted-foreground">{totalLabel}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{formatCompactSar(totalValue)}</p>
              </div>
              <div className="rounded-[22px] border border-border/60 bg-muted/35 p-3">
                <p className="text-xs text-muted-foreground">{averageLabel}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{formatCompactSar(averageValue)}</p>
              </div>
              <div className="rounded-[22px] border border-border/60 bg-muted/35 p-3">
                <p className="text-xs text-muted-foreground">{peakLabel}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {bestPoint ? formatCompactSar(bestPoint.earnings) : formatCompactSar(0)}
                </p>
              </div>
            </div>
            <div className="h-[340px] w-full sm:h-[380px] xl:h-[430px]" aria-label={title} role="img">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="earningsBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.12} />
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
                      background: "color-mix(in oklab, var(--color-card) 92%, white 8%)",
                      boxShadow: "0 18px 36px rgba(15,23,42,0.10)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    fill="url(#earningsAreaGradient)"
                    stroke="none"
                  />
                  <Bar
                    dataKey="earnings"
                    radius={[10, 10, 0, 0]}
                    barSize={24}
                    fill="url(#earningsBarGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="var(--color-chart-1)"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "var(--color-chart-1)", strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: "var(--color-card)", strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
              {bestPoint ? (
                <p className="flex flex-wrap items-center gap-2">
                  <span>Highest {mode === "daily" ? dailyLabel.toLowerCase() : monthlyLabel.toLowerCase()}:</span>
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
