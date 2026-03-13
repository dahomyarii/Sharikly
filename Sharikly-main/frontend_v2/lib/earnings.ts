export interface EarningsListing {
  id: number
  title: string
  total_earnings: string
  rentals_count: number
}

export interface EarningsPoint {
  daily?: string
  month?: string
  label: string
  earnings: string
}

export interface TopLessorEntry {
  id: number
  username: string
  avatar: string | null
  monthly_earnings: string
  rentals_count: number
  rating: number
}

export interface TopRenterEntry {
  id: number
  username: string
  avatar: string | null
  rentals_count: number
  total_spent: string
  rating: number | null
}

export interface LandlordEarningsDashboard {
  summary: {
    total_earnings: string
    this_month_earnings: string
    rentals_count: number
    rating: number
    highest_earning_item: EarningsListing | null
  }
  chart: {
    daily: EarningsPoint[]
    monthly: EarningsPoint[]
  }
  leaderboards: {
    top_lessors_this_month: TopLessorEntry[]
    top_renters_this_month: TopRenterEntry[]
  }
  ranking: {
    position: number
    total_lessors: number
    suggested_additional_products: number
    hint: string
  }
  super_host: {
    qualified: boolean
    title: string
    requirements: Array<{
      label: string
      met: boolean
      detail: string
    }>
    benefits: string[]
  }
}

export interface PublicCommunityEarnings {
  total_lessor_earnings: string
  average_lessor_income_per_month: string
  highest_earning_lessors_per_month: TopLessorEntry[]
  homepage: {
    headline: string
    total_landlord_earnings: string
  }
  attraction: {
    average_landlord_income_per_month: string
    highest_earning_landlords_per_month: TopLessorEntry[]
  }
}

export interface EarningsCalculatorResponse {
  products_count: number
  daily_rental_price: string
  monthly_earnings: string
  annual_earnings: string
}

export function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export function formatSar(
  value: number | string | null | undefined,
  maximumFractionDigits = 0,
): string {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits > 0 ? 2 : 0,
  }).format(toNumber(value))
}

export function formatCompactSar(value: number | string | null | undefined): string {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(toNumber(value))
}

export function getBestChartPoint(points: EarningsPoint[]): EarningsPoint | null {
  if (!points.length) return null

  return points.reduce<EarningsPoint>((currentBest, point) => {
    return toNumber(point.earnings) > toNumber(currentBest.earnings)
      ? point
      : currentBest
  }, points[0])
}
