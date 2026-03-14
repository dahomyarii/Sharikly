"use client"

import { useMemo, useState } from "react"
import {
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
            <div className="h-72 w-full" aria-label={title} role="img">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <defs>
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
                      background: "var(--color-card)",
                    }}
                  />
                  <Bar
                    dataKey="earnings"
                    radius={[10, 10, 0, 0]}
                    barSize={28}
                    fill="url(#earningsBarGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "var(--color-chart-1)" }}
                    activeDot={{ r: 5 }}
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
