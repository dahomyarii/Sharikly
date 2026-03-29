"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Copy,
  Edit3,
  Flame,
  ImagePlus,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Package,
  PauseCircle,
  PlayCircle,
  PlusCircle,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Trophy,
  Wallet,
  X,
} from "lucide-react"

import axiosInstance from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { formatSar, formatCompactSar, type LandlordEarningsDashboard, type EarningsPoint } from "@/lib/earnings"
import { useLocale } from "@/components/LocaleProvider"
import FloatingModal from "@/components/FloatingModal"
import LocationPicker from "@/components/LocationPicker"

const API = process.env.NEXT_PUBLIC_API_BASE

const getImageUrl = (image?: string | null) => {
  if (!image) return null
  if (image.startsWith("http")) return image
  return `${API?.replace("/api", "")}${image}`
}

interface LocalRequest {
  id: number
  title: string
  price_per_day: string
  city: string
  category: string | null
  image: string | null
  booking_count: number
}

interface TrendingSearch {
  id: number
  name: string
  icon: string
  booking_count: number
}

// Simple SVG chart from real monthly data
function EarningsSVGChart({ points }: { points: EarningsPoint[] }) {
  const data = points.slice(-6) // last 6 months
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        No earnings data yet
      </div>
    )
  }

  const values = data.map((p) => parseFloat(p.earnings) || 0)
  const maxVal = Math.max(...values, 1)
  const minVal = 0

  const width = 400
  const height = 140
  const pad = { top: 10, right: 20, bottom: 20, left: 50 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom

  const xStep = chartW / Math.max(data.length - 1, 1)
  const yScale = (v: number) => chartH - ((v - minVal) / (maxVal - minVal)) * chartH + pad.top

  const pathPoints = data.map((p, i) => ({
    x: pad.left + i * xStep,
    y: yScale(parseFloat(p.earnings) || 0),
    label: p.label,
    value: parseFloat(p.earnings) || 0,
  }))

  const linePath = pathPoints
    .map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x},${pt.y}`)
    .join(" ")

  const areaPath = `${linePath} L${pathPoints[pathPoints.length - 1].x},${height - pad.bottom} L${pad.left},${height - pad.bottom} Z`

  // Y-axis labels
  const yLabels = [maxVal, maxVal * 0.66, maxVal * 0.33, 0].map((v) => ({
    value: v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0),
    y: yScale(v),
  }))

  const lastGrowth = data.length >= 2
    ? Math.round(((values[values.length - 1] - values[values.length - 2]) / Math.max(values[values.length - 2], 1)) * 100)
    : null

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Earnings Chart</h3>
        {lastGrowth !== null && (
          <span className={`text-sm font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full ${lastGrowth >= 0 ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50"}`}>
            {lastGrowth >= 0 ? "▲" : "▼"} {Math.abs(lastGrowth)}%
          </span>
        )}
      </div>
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48" preserveAspectRatio="none">
          <defs>
            <linearGradient id="earningsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {yLabels.map((yl, i) => (
            <g key={i}>
              <line x1={pad.left} y1={yl.y} x2={width - pad.right} y2={yl.y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4,4" />
              <text x={pad.left - 6} y={yl.y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{yl.value}</text>
            </g>
          ))}
          {/* Bars */}
          {pathPoints.map((pt, i) => {
            const barW = Math.max(10, xStep * 0.4)
            const barH = height - pad.bottom - pt.y
            return (
              <rect
                key={i}
                x={pt.x - barW / 2}
                y={pt.y}
                width={barW}
                height={Math.max(0, barH)}
                fill="#ede9fe"
                rx="3"
              />
            )
          })}
          {/* Area fill */}
          <path d={areaPath} fill="url(#earningsGrad)" />
          {/* Line */}
          <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Dots */}
          {pathPoints.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r="4" fill={i === pathPoints.length - 1 ? "#8b5cf6" : "#10b981"} stroke="white" strokeWidth="2" />
          ))}
          {/* X-axis labels */}
          {pathPoints.map((pt, i) => (
            <text key={i} x={pt.x} y={height - 4} textAnchor="middle" fontSize="9" fill="#94a3b8">{pt.label}</text>
          ))}
        </svg>
      </div>
    </div>
  )
}

export function LandlordEarningsDashboardClient() {
  const router = useRouter()
  const pathname = usePathname()
  const { lang } = useLocale()
  const { showToast } = useToast()

  const [data, setData] = useState<LandlordEarningsDashboard | null>(null)
  const [user, setUser] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [localRequests, setLocalRequests] = useState<LocalRequest[]>([])
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([])
  const [activeBookings, setActiveBookings] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [itemActionKey, setItemActionKey] = useState<string | null>(null)
  const [itemModal, setItemModal] = useState<{
    open: boolean
    mode: "create" | "edit"
    saving: boolean
    listingId: number | null
    form: {
      title: string
      description: string
      price_per_day: string
      city: string
      category_id: string
      is_active: boolean
      latitude: string
      longitude: string
      pickup_radius_m: string
    }
  }>({
    open: false,
    mode: "create",
    saving: false,
    listingId: null,
    form: {
      title: "",
      description: "",
      price_per_day: "",
      city: "",
      category_id: "",
      is_active: true,
      latitude: "24.7136",
      longitude: "46.6753",
      pickup_radius_m: "300",
    },
  })

  const [itemImages, setItemImages] = useState<Array<{ id: string; file: File; preview: string }>>([])

  useEffect(() => () => {
    itemImages.forEach((img) => URL.revokeObjectURL(img.preview))
  }, [])

  const clearItemImages = useCallback(() => {
    setItemImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.preview))
      return []
    })
  }, [])

  const closeItemModal = useCallback(() => {
    clearItemImages()
    setItemModal({
      open: false, mode: "create", saving: false, listingId: null,
      form: { title: "", description: "", price_per_day: "", city: "", category_id: "", is_active: true, latitude: "24.7136", longitude: "46.6753", pickup_radius_m: "300" },
    })
  }, [clearItemImages])

  const openCreateItemModal = useCallback(() => {
    clearItemImages()
    setItemModal({
      open: true, mode: "create", saving: false, listingId: null,
      form: { title: "", description: "", price_per_day: "", city: "", category_id: categories[0]?.id ? String(categories[0].id) : "", is_active: true, latitude: "24.7136", longitude: "46.6753", pickup_radius_m: "300" },
    })
  }, [categories, clearItemImages])

  const addItemImages = useCallback((files: FileList | File[]) => {
    const next = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, Math.max(0, 8 - itemImages.length))
      .map((f) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, file: f, preview: URL.createObjectURL(f) }))
    setItemImages((prev) => [...prev, ...next])
  }, [itemImages.length])

  const removeItemImage = useCallback((id: string) => {
    setItemImages((prev) => {
      const target = prev.find((img) => img.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((img) => img.id !== id)
    })
  }, [])

  const handleSaveItem = useCallback(async () => {
    const token = localStorage.getItem("access_token")
    if (!token || !API) return

    if (!itemModal.form.title || !itemModal.form.price_per_day || !itemModal.form.category_id) {
      showToast("Please complete the item form.", "warning")
      return
    }
    if (itemModal.mode === "create" && itemImages.length === 0) {
      showToast("Please add at least one image.", "warning")
      return
    }

    setItemModal((prev) => ({ ...prev, saving: true }))
    try {
      const headers = { Authorization: `Bearer ${token}` }
      if (itemModal.mode === "edit" && itemModal.listingId) {
        const payload = {
          title: itemModal.form.title,
          description: itemModal.form.description,
          price_per_day: itemModal.form.price_per_day,
          city: itemModal.form.city,
          category_id: Number(itemModal.form.category_id),
          is_active: itemModal.form.is_active,
          latitude: itemModal.form.latitude ? Number(itemModal.form.latitude) : null,
          longitude: itemModal.form.longitude ? Number(itemModal.form.longitude) : null,
          pickup_radius_m: itemModal.form.pickup_radius_m ? Number(itemModal.form.pickup_radius_m) : 300,
        }
        const res = await axiosInstance.patch(`${API}/listings/${itemModal.listingId}/`, payload, { headers })
        setItems((prev) => prev.map((item) => (item.id === itemModal.listingId ? res.data : item)))
        showToast("Listing saved.", "success")
      } else {
        const formData = new FormData()
        formData.append("title", itemModal.form.title)
        formData.append("description", itemModal.form.description)
        formData.append("price_per_day", itemModal.form.price_per_day)
        formData.append("city", itemModal.form.city)
        formData.append("category_id", itemModal.form.category_id)
        formData.append("is_active", itemModal.form.is_active ? "true" : "false")
        formData.append("latitude", itemModal.form.latitude || "24.7136")
        formData.append("longitude", itemModal.form.longitude || "46.6753")
        formData.append("pickup_radius_m", itemModal.form.pickup_radius_m || "300")
        itemImages.forEach((img) => formData.append("images", img.file))
        const res = await axiosInstance.post(`${API}/listings/`, formData, { headers })
        setItems((prev) => [res.data, ...prev])
        showToast(itemModal.form.is_active ? "Listing created." : "Draft created.", "success")
      }
      closeItemModal()
    } catch (err) {
      console.error("Failed to save listing", err)
      showToast("Failed to save listing.", "error")
      setItemModal((prev) => ({ ...prev, saving: false }))
    }
  }, [itemModal, itemImages, closeItemModal, showToast])

  const handleToggleListing = useCallback(async (listing: any) => {
    const token = localStorage.getItem("access_token")
    if (!token || !API) return
    setItemActionKey(`toggle-${listing.id}`)
    try {
      await axiosInstance.patch(`${API}/listings/${listing.id}/`, { is_active: !listing.is_active }, { headers: { Authorization: `Bearer ${token}` } })
      setItems((prev) => prev.map((item) => (item.id === listing.id ? { ...item, is_active: !item.is_active } : item)))
      showToast("Listing visibility updated.", "success")
    } catch {
      showToast("Failed to update listing.", "error")
    } finally {
      setItemActionKey(null)
    }
  }, [showToast])

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null

    if (storedUser) {
      try { setUser(JSON.parse(storedUser)) } catch { setUser(null) }
    }

    if (!token || !API) {
      setIsLoading(false)
      return
    }

    setIsLoggedIn(true)
    const headers = { Authorization: `Bearer ${token}` }

    Promise.allSettled([
      axiosInstance.get(`${API}/auth/me/`, { headers }),
      axiosInstance.get<LandlordEarningsDashboard>(`${API}/earnings/dashboard/`, { headers }),
      axiosInstance.get(`${API}/listings/?mine=1`, { headers }),
      axiosInstance.get(`${API}/categories/`, { headers }),
      axiosInstance.get(`${API}/earnings/local-requests/`, { headers }),
      axiosInstance.get(`${API}/earnings/trending-searches/`),
      axiosInstance.get(`${API}/earnings/active-bookings/`, { headers }),
    ]).then(([userRes, dashRes, itemsRes, catsRes, localRes, trendRes, activeRes]) => {
      if (userRes.status === "fulfilled") setUser(userRes.value.data)
      if (dashRes.status === "fulfilled") setData(dashRes.value.data)
      if (itemsRes.status === "fulfilled") {
        const d = itemsRes.value.data
        setItems(Array.isArray(d) ? d : d?.results ?? [])
      }
      if (catsRes.status === "fulfilled") {
        const d = catsRes.value.data
        setCategories(Array.isArray(d) ? d : d?.results ?? [])
      }
      if (localRes.status === "fulfilled") setLocalRequests(localRes.value.data ?? [])
      if (trendRes.status === "fulfilled") setTrendingSearches(trendRes.value.data ?? [])
      if (activeRes.status === "fulfilled") setActiveBookings(activeRes.value.data?.active_bookings ?? 0)
    }).finally(() => setIsLoading(false))
  }, [])

  const statCards = useMemo(() => {
    if (!data) return []
    const monthlySeries = data.chart.monthly
    const latestMonth = monthlySeries[monthlySeries.length - 1]
    const prevMonth = monthlySeries[monthlySeries.length - 2]
    const latestV = latestMonth ? parseFloat(latestMonth.earnings) : 0
    const prevV = prevMonth ? parseFloat(prevMonth.earnings) : 0
    const growth = prevV > 0 ? Math.round(((latestV - prevV) / prevV) * 100) : null

    return [
      {
        label: "Rentals",
        value: `${data.summary.rentals_count.toLocaleString()}`,
        icon: Camera,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-500",
        accent: null,
      },
      {
        label: "Monthly",
        value: formatCompactSar(data.summary.this_month_earnings),
        icon: Wallet,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-500",
        accent: growth !== null ? `${growth >= 0 ? "▲" : "▼"} ${Math.abs(growth)}%` : null,
        accentColor: growth !== null && growth >= 0 ? "text-emerald-500" : "text-red-500",
      },
      {
        label: "Active bookings",
        value: `${activeBookings}`,
        icon: CalendarDays,
        iconBg: "bg-violet-500/10",
        iconColor: "text-violet-500",
        accent: null,
      },
      {
        label: "Rating",
        value: `${data.summary.rating.toFixed(1)}`,
        icon: Star,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-500",
        accent: null,
        star: true,
      },
    ]
  }, [data, activeBookings])

  const milestone = useMemo(() => {
    if (!data) return null
    const milestoneTarget = 20
    const remaining = Math.max(0, milestoneTarget - data.summary.rentals_count)
    const progress = Math.min(100, Math.round((data.summary.rentals_count / milestoneTarget) * 100))
    return { remaining, progress }
  }, [data])

  const topItems = useMemo(() => {
    if (!items.length) return []
    return items
      .filter((item) => item.is_active !== false)
      .slice(0, 2)
  }, [items])

  const tabs = [
    { label: "Overview", href: "/host/overview" },
    { label: "Listings", href: "/host/listings" },
    { label: "Bookings", href: "/host/bookings" },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f3edff] py-8">
        <div className="mx-auto max-w-[1000px] px-3 sm:px-6 lg:px-8">
          {/* Skeleton */}
          <div className="grid grid-cols-4 gap-4 mb-6 mt-16">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-3xl bg-white/60 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-[1.8fr_1fr] gap-4 mb-6">
            <div className="h-64 rounded-3xl bg-white/60 animate-pulse" />
            <div className="h-64 rounded-3xl bg-white/60 animate-pulse" />
          </div>
          <div className="grid grid-cols-[1.8fr_1fr] gap-4">
            <div className="space-y-4">
              <div className="h-32 rounded-3xl bg-white/60 animate-pulse" />
              <div className="h-32 rounded-3xl bg-white/60 animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-40 rounded-3xl bg-white/60 animate-pulse" />
              <div className="h-40 rounded-3xl bg-white/60 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isLoggedIn || !data) {
    return (
      <div className="min-h-screen bg-[#f3edff] flex items-center justify-center">
        <Card className="rounded-3xl border-none shadow-lg bg-white/90 max-w-sm w-full mx-4">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="h-12 w-12 text-violet-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Sign in to view your dashboard</h2>
            <p className="text-sm text-muted-foreground mb-6">Track your earnings, bookings, and ranking in one place.</p>
            <Button className="w-full rounded-xl bg-violet-500 hover:bg-violet-600" onClick={() => router.push("/auth/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f3edff] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.7),_transparent_60%)] py-5 sm:py-8 font-sans pb-20">
      <div className="mx-auto max-w-[1000px] px-3 sm:px-6 lg:px-8">

        {/* Tabs */}
        <div className="flex items-center justify-center gap-1 sm:gap-5 mb-10 text-sm font-medium overflow-x-auto pb-1 flex-wrap">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href === "/host/overview" && (pathname === "/earnings" || pathname === "/host"))
            return (
              <button
                key={tab.href}
                type="button"
                onClick={() => router.push(tab.href)}
                className={`whitespace-nowrap pb-2 px-2 border-b-[3px] transition-colors ${isActive ? "text-violet-900 border-violet-400 font-semibold" : "text-muted-foreground border-transparent hover:text-foreground"}`}
              >
                {tab.label}
              </button>
            )
          })}
          <button type="button" className="text-muted-foreground pb-2 px-1 border-b-[3px] border-transparent">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Hero Section */}
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] mb-6 items-center">
          <div className="flex flex-col justify-center pr-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-2">
              Ekra <span className="text-violet-500 font-medium">Dashboard</span>
            </h1>
            <h2 className="text-2xl text-foreground font-medium mb-3">
              Start earning by <span className="font-bold">Your Items</span> on Ekra
            </h2>
            <p className="text-muted-foreground max-w-sm mb-5 leading-relaxed text-sm">
              Turn your items and equipment into passive income by renting them out.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-xl bg-violet-500 hover:bg-violet-600 text-white px-6 py-5 shadow-lg shadow-violet-500/25 text-base"
                onClick={openCreateItemModal}
              >
                Start Earning Today <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Ranking Card */}
          <Card className="rounded-[24px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.05)] bg-white/80 backdrop-blur">
            <CardContent className="p-6 relative">
              <div className="absolute top-4 right-4 text-emerald-400">
                <TrendingUp className="h-8 w-8" strokeWidth={3} />
              </div>
              <p className="text-sm text-foreground font-medium">Your ranking this month</p>
              <div className="flex items-baseline gap-2 mt-1 mb-4">
                <p className="text-3xl font-bold text-foreground">#{data.ranking.position}</p>
                <p className="text-sm text-muted-foreground">of {data.ranking.total_lessors} hosts</p>
              </div>
              <div className="h-2.5 bg-[#e2e8f0] rounded-full w-3/4 mb-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-300 to-emerald-500 transition-all"
                  style={{
                    width: `${data.ranking.total_lessors > 0
                      ? Math.max(5, Math.round(((data.ranking.total_lessors - data.ranking.position + 1) / data.ranking.total_lessors) * 100))
                      : 10}%`
                  }}
                />
              </div>
              {/* Mini chart from monthly data */}
              {data.chart.monthly.length > 1 ? (
                <div className="mt-3">
                  <svg viewBox="0 0 200 50" className="w-full h-[60px] text-violet-500" preserveAspectRatio="none">
                    {(() => {
                      const pts = data.chart.monthly.slice(-5)
                      const vals = pts.map((p) => parseFloat(p.earnings) || 0)
                      const maxV = Math.max(...vals, 1)
                      const xStep = 190 / Math.max(pts.length - 1, 1)
                      const coordPts = pts.map((p, i) => ({
                        x: 5 + i * xStep,
                        y: 5 + (1 - (parseFloat(p.earnings) || 0) / maxV) * 35,
                      }))
                      const path = coordPts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x},${pt.y}`).join(" ")
                      const area = `${path} L${coordPts[coordPts.length - 1].x},45 L5,45 Z`
                      return (
                        <>
                          <defs>
                            <linearGradient id="rg" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d={area} fill="url(#rg)" />
                          <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          {coordPts.map((pt, i) => (
                            <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="currentColor" stroke="white" strokeWidth="1.5" />
                          ))}
                        </>
                      )
                    })()}
                  </svg>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    {data.chart.monthly.slice(-5).map((p, i) => (
                      <span key={i}>{p.label.split(" ")[0]}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-3">{data.ranking.hint}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {statCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <Card key={idx} className="rounded-[20px] border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white/80 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`p-2 rounded-xl ${card.iconBg} ${card.iconColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-foreground">{card.value}</span>
                      {card.star && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                      {card.accent && (
                        <span className={`text-[11px] font-semibold ${(card as any).accentColor}`}>{card.accent}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Chart and Milestone */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-4 mb-5">
          <Card className="rounded-[24px] border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <EarningsSVGChart points={data.chart.monthly} />
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white/80 backdrop-blur">
            <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
              <div className="w-full">
                <h3 className="text-base font-semibold text-foreground mb-1">Next Milestone</h3>
                <p className="text-sm text-foreground">
                  {milestone?.remaining
                    ? `Reach ${milestone.remaining} more ${milestone.remaining === 1 ? "rental" : "rentals"}`
                    : "You qualify for Super Host!"}
                </p>
                <div className="mt-3 bg-[#e2e8f0] h-2.5 rounded-full overflow-hidden w-full">
                  <div
                    className="bg-gradient-to-r from-emerald-300 to-emerald-500 h-full transition-all duration-700"
                    style={{ width: `${milestone?.progress ?? 0}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 text-right">
                  {data.summary.rentals_count} of 20 rentals
                </div>
              </div>

              <div className="rounded-[16px] bg-[#fbf9ff] border border-violet-100 p-4 flex items-start gap-3 shadow-sm">
                <div className="h-10 w-10 shrink-0 bg-gradient-to-br from-amber-300 to-yellow-400 rounded-full flex items-center justify-center shadow-sm">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[13px] text-foreground mb-0.5">Unlock SUPER HOST badge</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {data.super_host.qualified
                      ? "🎉 You've qualified! Keep it up."
                      : "Keep going! You're building momentum."}
                  </p>
                </div>
              </div>

              <Button
                className="w-full rounded-[14px] bg-violet-500 hover:bg-violet-600 text-white shadow-md py-5 font-semibold"
                onClick={openCreateItemModal}
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-4">
          {/* Top Items */}
          <div className="flex flex-col gap-4">
            {(topItems.length > 0 ? topItems : [null, null]).map((item, idx) => {
              const imageUrl = item ? getImageUrl(item.images?.[0]?.image) : null
              return (
                <Card key={idx} className="rounded-[24px] border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white/80 backdrop-blur overflow-hidden h-[120px]">
                  <CardContent className="p-5 h-full flex flex-col justify-center">
                    <h3 className="text-xs font-medium text-slate-500 mb-3">Your Highest Earning Item</h3>
                    {item ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-[56px] h-[44px] bg-slate-800 rounded-xl overflow-hidden relative shrink-0">
                            {imageUrl ? (
                              <img src={imageUrl} alt={item.title} className="h-full w-full object-cover" />
                            ) : (
                              <Camera className="text-white h-5 w-5 absolute inset-0 m-auto opacity-40" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-[14px] line-clamp-1">{item.title}</p>
                            <p className="text-[12px] text-slate-500">
                              {formatSar(item.price_per_day)}/day
                            </p>
                          </div>
                        </div>
                        {idx === 0 && data.summary.highest_earning_item && (
                          <Button
                            size="sm"
                            className="rounded-[10px] bg-violet-500 text-white hover:bg-violet-600 text-xs px-3 h-8 shrink-0"
                            onClick={() => router.push(`/listings/${data.summary.highest_earning_item!.id}`)}
                          >
                            Promote Item
                          </Button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={openCreateItemModal}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-violet-500 transition-colors"
                      >
                        <PlusCircle className="h-4 w-4" /> Add your first item to start earning
                      </button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4">
            {/* Local Rental Requests */}
            <Card className="rounded-[24px] border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white/80 backdrop-blur">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100">
                  Local Rental Requests <Flame className="h-4 w-4 text-orange-400 fill-orange-400" />
                </h3>
                {localRequests.length > 0 ? (
                  <div className="space-y-3.5">
                    {localRequests.map((req, idx) => (
                      <div key={req.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-violet-100 text-violet-600">
                            <Camera className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-slate-700 line-clamp-1">{req.title}</p>
                            {idx === 0 && (
                              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                <CalendarDays className="h-3 w-3" /> SAR {parseFloat(req.price_per_day).toFixed(0)}/day
                              </p>
                            )}
                          </div>
                        </div>
                        {idx > 0 && <TrendingUp className="h-5 w-5 text-emerald-400 shrink-0" strokeWidth={2.5} />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No local requests yet. The marketplace is growing!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Trending Searches */}
            <Card className="rounded-[24px] border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white/80 backdrop-blur">
              <CardContent className="p-5 pt-4">
                <h3 className="text-[13px] font-semibold text-foreground flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  Trending Searches on Ekra
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </h3>
                {trendingSearches.length > 0 ? (
                  <div className="space-y-3">
                    {trendingSearches.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => router.push(`/listings?category=${item.id}`)}
                        className="flex items-center justify-between text-slate-600 cursor-pointer hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors w-full text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 bg-slate-100 rounded-md flex items-center justify-center text-base">
                            {item.icon || "🔍"}
                          </div>
                          <p className="text-[13px] font-medium">{item.name}</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-3">Loading trending data…</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create / Edit Item Modal */}
      {itemModal.open && (
        <FloatingModal onClose={closeItemModal}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {itemModal.mode === "edit" ? "Edit Listing" : "Create New Item"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Fill in the details to list your item for renting.</p>
            </div>
            <button type="button" onClick={closeItemModal} className="rounded-2xl p-2 text-muted-foreground hover:bg-accent/70">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {itemModal.mode === "create" && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-foreground">Photos</label>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center">
                  <ImagePlus className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium text-foreground">Upload listing images</span>
                  <span className="text-xs text-muted-foreground">Add up to 8 photos</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) addItemImages(e.target.files) }} />
                </label>
                {itemImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {itemImages.map((img) => (
                      <div key={img.id} className="relative overflow-hidden rounded-[16px] border border-border/60">
                        <img src={img.preview} alt="Preview" className="h-20 w-full object-cover" />
                        <button type="button" onClick={() => removeItemImage(img.id)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
              <Input value={itemModal.form.title} onChange={(e) => setItemModal((p) => ({ ...p, form: { ...p.form, title: e.target.value } }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Category</label>
              <select
                value={itemModal.form.category_id}
                onChange={(e) => setItemModal((p) => ({ ...p, form: { ...p.form, category_id: e.target.value } }))}
                className="h-11 w-full rounded-2xl border border-input bg-background/90 px-4 text-sm shadow-sm"
              >
                <option value="">Select category</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Price per day (SAR)</label>
              <Input type="number" min="0" value={itemModal.form.price_per_day} onChange={(e) => setItemModal((p) => ({ ...p, form: { ...p.form, price_per_day: e.target.value } }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">City</label>
              <Input value={itemModal.form.city} onChange={(e) => setItemModal((p) => ({ ...p, form: { ...p.form, city: e.target.value } }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Pickup radius (m)</label>
              <Input type="number" min="100" value={itemModal.form.pickup_radius_m} onChange={(e) => setItemModal((p) => ({ ...p, form: { ...p.form, pickup_radius_m: e.target.value } }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
              <textarea
                value={itemModal.form.description}
                onChange={(e) => setItemModal((p) => ({ ...p, form: { ...p.form, description: e.target.value } }))}
                className="min-h-[100px] w-full rounded-2xl border border-input bg-background/90 px-4 py-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div className="sm:col-span-2 overflow-hidden rounded-[24px] border border-border/60">
              <LocationPicker
                initialLat={Number(itemModal.form.latitude || 24.7136)}
                initialLng={Number(itemModal.form.longitude || 46.6753)}
                initialRadius={Number(itemModal.form.pickup_radius_m || 300)}
                onLocationChange={(lat, lng, radius) =>
                  setItemModal((p) => ({ ...p, form: { ...p.form, latitude: String(lat), longitude: String(lng), pickup_radius_m: String(radius) } }))
                }
              />
            </div>
            <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={itemModal.form.is_active}
                onChange={(e) => setItemModal((p) => ({ ...p, form: { ...p.form, is_active: e.target.checked } }))}
              />
              Publish now
            </label>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={closeItemModal}>Cancel</Button>
            <Button onClick={handleSaveItem} disabled={itemModal.saving}>
              {itemModal.saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save
            </Button>
          </div>
        </FloatingModal>
      )}
    </div>
  )
}
