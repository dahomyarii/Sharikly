"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { 
  CalendarDays, Filter, Search, MapPin, MoreHorizontal, Check, 
  MessageCircle, Wallet, Plus, Camera, CheckCircle2, ChevronRight, Share,
  X, Clock, Phone, ChevronDown, CalendarPlus, ClipboardList
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axiosInstance from "@/lib/axios"
import { useToast } from "@/components/ui/toast"

const API = process.env.NEXT_PUBLIC_API_BASE

const getImageUrl = (image?: string | null) => {
  if (!image) return null
  if (image.startsWith("http")) return image
  return `${API?.replace("/api", "")}${image}`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(d)
}

function getDurationInDays(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const diffTime = Math.abs(e.getTime() - s.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays === 0 ? 1 : diffDays
}

export function HostBookingsClient() {
  const router = useRouter()
  const pathname = usePathname()
  const { showToast } = useToast()

  const [bookings, setBookings] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"incoming" | "ongoing" | "upcoming" | "past" | "cancelled">("incoming")
  const [search, setSearch] = useState("")
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null)

  const tabsNav = [
    { label: "Overview", href: "/host/overview" },
    { label: "Earnings", href: "/host/earnings" },
    { label: "Listings", href: "/host/listings" },
    { label: "Bookings", href: "/host/bookings" },
    { label: "Opportunities", href: "/host/opportunities" },
  ]

  const bookingTabs = [
    { id: "incoming", label: "Incoming" },
    { id: "ongoing", label: "Ongoing" },
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" },
    { id: "cancelled", label: "Cancelled" },
  ] as const

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token || !API) {
        setIsLoading(false)
        return
      }
      const headers = { Authorization: `Bearer ${token}` }
      const [uRes, bRes] = await Promise.all([
        axiosInstance.get(`${API}/auth/me/`, { headers }),
        axiosInstance.get(`${API}/bookings/`, { headers }),
      ])
      const currentUser = uRes.data
      setUser(currentUser)
      
      const allBookings = Array.isArray(bRes.data) ? bRes.data : (bRes.data?.results || [])
      // Filter strictly for host bookings (where user is the owner of the listing)
      const hostV = allBookings.filter((b: any) => {
        const ownerId = typeof b.listing?.owner === "object" ? b.listing.owner.id : b.listing?.owner_id || b.listing?.owner
        return ownerId === currentUser.id
      })
      setBookings(hostV)
    } catch (err) {
      console.error(err)
      showToast("Failed to load bookings", "error")
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAction = async (e: React.MouseEvent, id: number, action: "accept" | "decline" | "cancel") => {
    e.stopPropagation()
    try {
      const token = localStorage.getItem("access_token")
      await axiosInstance.post(`${API}/bookings/${id}/${action}/`, {}, { headers: { Authorization: `Bearer ${token}` } })
      showToast(`Booking ${action}ed successfully`, "success")
      if (selectedBookingId === id && action === "decline") {
         setSelectedBookingId(null)
      }
      fetchData()
    } catch (err) {
      showToast(`Failed to ${action} booking`, "error")
    }
  }

  const filteredBookings = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    
    let filtered = bookings.filter((b) => {
      if (search) {
        const titleMatch = b.listing?.title?.toLowerCase().includes(search.toLowerCase())
        const renterMatch = b.renter?.username?.toLowerCase().includes(search.toLowerCase()) || b.renter?.email?.toLowerCase().includes(search.toLowerCase())
        if (!titleMatch && !renterMatch) return false
      }
      return true
    })

    const byTab = {
      incoming: [] as any[],
      ongoing: [] as any[],
      upcoming: [] as any[],
      past: [] as any[],
      cancelled: [] as any[],
    }

    filtered.forEach((b) => {
      if (b.status === "PENDING") {
        byTab.incoming.push(b)
      } else if (b.status === "DECLINED" || b.status === "CANCELLED") {
        byTab.cancelled.push(b)
      } else if (b.status === "CONFIRMED") {
        if (today >= b.start_date && today <= b.end_date) {
          byTab.ongoing.push(b)
        } else if (today < b.start_date) {
          byTab.upcoming.push(b)
        } else {
          byTab.past.push(b)
        }
      } else {
        byTab.past.push(b) // fallback
      }
    })

    return byTab
  }, [bookings, search])

  const currentBookings = filteredBookings[activeTab]
  const incomingCount = filteredBookings.incoming.length
  
  // Calculate summary stats globally for all bookings, not just active tab
  const activeCount = filteredBookings.ongoing.length
  const upcomingCount = filteredBookings.upcoming.length

  const selectedBooking = useMemo(() => bookings.find(b => b.id === selectedBookingId), [bookings, selectedBookingId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f3edff] flex items-center justify-center">
        <div className="animate-pulse flex gap-2">
           <div className="h-4 w-4 bg-violet-400 rounded-full"></div>
           <div className="h-4 w-4 bg-violet-500 rounded-full"></div>
           <div className="h-4 w-4 bg-violet-600 rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f3edff] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.7),_transparent_60%)] py-5 sm:py-8 font-sans pb-20 overflow-x-hidden">
      <div className="mx-auto max-w-[1100px] px-3 sm:px-6 lg:px-8 transition-all duration-300">
        
        {/* Top Header & Nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 text-sm">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 shadow-sm flex items-center justify-center">
              <Share className="text-white h-4 w-4" />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">Ekra</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-6 text-[15px] font-medium overflow-x-auto pb-1 flex-1 sm:justify-center hide-scrollbar">
            {tabsNav.map((tab) => {
              const isActive = pathname === tab.href || (tab.href === "/host/bookings" && (pathname === "/host" || pathname.includes("bookings")))
              return (
                <button
                  key={tab.href}
                  type="button"
                  onClick={() => router.push(tab.href)}
                  className={`whitespace-nowrap pb-1.5 px-2 border-b-[3px] transition-colors ${isActive ? "text-violet-900 border-violet-400 font-semibold" : "text-slate-500 border-transparent hover:text-slate-800"}`}
                >
                  {tab.label}
                </button>
              )
            })}
            <button type="button" className="text-slate-400 pb-1.5 px-1 border-b-[3px] border-transparent hover:text-slate-600">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 shrink-0">
             <Button className="rounded-[14px] bg-violet-500 hover:bg-violet-600 shadow-md text-white h-[42px] px-5 flex items-center gap-2 font-medium" onClick={() => {}}>
               <Plus className="h-4 w-4" /> Add Item
             </Button>
             <div className="w-[42px] h-[42px] rounded-full border border-violet-100 overflow-hidden shrink-0 shadow-sm cursor-pointer hover:opacity-90 transition">
               {user?.avatar ? (
                  <img src={getImageUrl(user.avatar) || undefined} alt="Profile" className="h-full w-full object-cover" />
               ) : (
                  <div className="h-full w-full bg-white flex items-center justify-center">
                    <img src="/logo.png" alt="EKRA" className="h-2/3 w-2/3 object-contain" />
                  </div>
               )}
             </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-[28px] font-bold tracking-tight text-[#3b2a5c] mb-1.5">Bookings</h1>
          <p className="text-slate-500 text-[15px]">Manage requests and active reservations for your items.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white/70 backdrop-blur rounded-[20px] p-4 flex items-center gap-4 shadow-sm border border-white">
             <div className="p-3 bg-violet-50/80 text-violet-500 rounded-[14px] bg-[url('/noise.png')]">
               <ClipboardList className="h-6 w-6" />
             </div>
             <div>
               <p className="text-[16px] font-semibold text-[#3b2a5c] leading-tight">Incoming {incomingCount}</p>
               <p className="text-[14px] text-slate-500 font-medium">requests</p>
             </div>
          </div>
          <div className="bg-white/70 backdrop-blur rounded-[20px] p-4 flex items-center gap-4 shadow-sm border border-white">
             <div className="p-3 bg-violet-50/80 text-violet-500 rounded-[14px]">
               <CalendarDays className="h-6 w-6" />
             </div>
             <div>
               <p className="text-[16px] font-semibold text-[#3b2a5c] leading-tight">Active</p>
               <p className="text-[14px] text-slate-500 font-medium">{activeCount} bookings</p>
             </div>
          </div>
          <div className="bg-white/70 backdrop-blur rounded-[20px] p-4 flex items-center gap-4 shadow-sm border border-white">
             <div className="p-3 bg-[#e6fbf1] text-[#329875] rounded-[14px]">
               <MapPin className="h-6 w-6" fill="currentColor" stroke="white" />
             </div>
             <div>
               <p className="text-[16px] font-semibold text-[#3b2a5c] leading-tight">Upcoming</p>
               <p className="text-[14px] text-slate-500 font-medium">{upcomingCount} pickups</p>
             </div>
          </div>
        </div>

        {/* Main Layout containing List and Sidebar */}
        <div className={`flex flex-col lg:flex-row items-start gap-4 transition-all duration-500 ease-in-out`}>
            
          {/* Left Column (Main List) */}
          <div className={`transition-all duration-500 ${selectedBooking ? 'w-full lg:w-[calc(100%-380px)]' : 'w-full max-w-[900px]'}`}>
            
            {/* Search & Filter Component */}
            <div className="bg-white/70 backdrop-blur rounded-[16px] p-2 flex items-center gap-2 mb-6 shadow-sm border border-white">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
                <Input 
                  placeholder="Search bookings" 
                  className="pl-10 h-11 border-none bg-transparent shadow-none focus-visible:ring-0 text-[15px] placeholder:text-slate-400 font-medium" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 rounded-xl bg-[#f0eaff]/80 hover:bg-[#e6deff]">
                <Filter className="h-[18px] w-[18px]" />
              </Button>
            </div>

            {/* Booking Tabs */}
            <div className="flex items-center gap-1 sm:gap-2 mb-6 overflow-x-auto pb-1 hide-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
              {bookingTabs.map(tab => {
                const isActive = activeTab === tab.id
                const showCount = tab.id === "incoming" && incomingCount > 0
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setSelectedBookingId(null); }}
                    className={`whitespace-nowrap px-4 py-2.5 rounded-[12px] font-medium text-[15px] transition-all flex items-center gap-2.5
                      ${isActive 
                        ? "bg-[#e8dfff] text-[#553399] shadow-sm border border-[#d8caff]" 
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/40 border border-transparent"}`}
                  >
                    {tab.label}
                    {showCount && (
                      <span className="bg-slate-800 text-white text-[12px] font-bold px-2 py-[2px] rounded-lg min-w-[22px] flex items-center justify-center">
                        {incomingCount}
                      </span>
                    )}
                  </button>
                )
              })}
              <button className="px-3 py-2 text-slate-400 hover:text-slate-600 transition-colors ml-1">
                <MoreHorizontal className="h-[22px] w-[22px]" />
              </button>
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
              {currentBookings.length === 0 ? (
                <div className="bg-white/60 backdrop-blur rounded-[24px] py-16 flex flex-col items-center justify-center border border-white/80 shadow-sm mt-8">
                  <div className="bg-slate-100 text-slate-400 p-4 rounded-2xl mb-4">
                      <CalendarDays className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="text-slate-700 font-medium text-[16px]">No {activeTab} bookings.</p>
                  <p className="text-slate-400 text-[14px] mt-1">You're all set for now.</p>
                </div>
              ) : (
                currentBookings.map((booking) => {
                  const isIncoming = booking.status === "PENDING"
                  const isOngoing = activeTab === "ongoing"
                  const isConfirmed = booking.status === "CONFIRMED"
                  const imageUrl = getImageUrl(booking.listing?.images?.[0]?.image)
                  const renterName = booking.renter?.username || booking.renter?.email?.split('@')[0] || "User"
                  const renterAvatar = booking.renter?.avatar
                  const isSelected = selectedBookingId === booking.id
                  
                  return (
                    <Card 
                      key={booking.id} 
                      onClick={() => setSelectedBookingId(booking.id)}
                      className={`rounded-[20px] transition-all cursor-pointer overflow-hidden ${
                        isSelected 
                        ? 'border-2 border-violet-400 shadow-[0_8px_30px_rgb(139,92,246,0.15)] bg-white' 
                        : 'border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white/80 backdrop-blur hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]'
                      }`}
                    >
                      <CardContent className="p-0">
                        <div className="p-4 sm:p-5">
                          <div className={`flex flex-col sm:flex-row gap-4 sm:gap-5 relative`}>
                            {/* Image */}
                            <div className="w-full sm:w-[140px] h-[160px] sm:h-[110px] shrink-0 rounded-[14px] overflow-hidden bg-slate-100 flex items-center justify-center relative">
                              {imageUrl ? (
                                <img src={imageUrl} alt={booking.listing?.title} className="w-full h-full object-cover" />
                              ) : (
                                <Camera className="h-8 w-8 text-slate-300" />
                              )}
                              <div className="absolute top-2 right-2 sm:hidden bg-white/90 backdrop-blur px-2 py-1 rounded-[8px] border border-white/50 text-[13px] font-medium text-slate-600 shadow-sm">
                                <span className="text-emerald-600 font-semibold">SAR {Number(booking.listing?.price_per_day || 0).toFixed(0)}</span>
                                /day
                              </div>
                            </div>
                            
                            {/* Summary Details */}
                            <div className="flex-1 flex flex-col min-w-0">
                              
                              {/* Top Row: Title & Price */}
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-slate-800 text-[17px] truncate pr-4">{booking.listing?.title}</h3>
                                <div className="text-right hidden sm:block shrink-0">
                                    <p className="text-[14px] font-medium text-slate-500">
                                      <span className="text-[#329875] font-semibold text-[15px]">SAR {Number(booking.listing?.price_per_day || 0).toFixed(0)}</span>
                                      /day
                                    </p>
                                </div>
                              </div>
                              
                              {/* Second Row: Date */}
                              <div className="flex items-center gap-2 text-slate-600 text-[14px] font-medium mb-3">
                                <div className="text-violet-500">
                                  <CalendarDays className="h-[18px] w-[18px]" strokeWidth={2} />
                                </div>
                                <span>{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</span>
                              </div>
                              
                              {/* Third Row: Avatar/Renter + Buttons/Total */}
                              <div className="flex items-end justify-between mt-auto w-full pt-1">
                                
                                {/* Left side: Avatar + User OR Return time */}
                                <div className="flex flex-col gap-2">
                                  {isIncoming || isConfirmed ? (
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-7 w-7 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                          {renterAvatar ? (
                                            <img src={getImageUrl(renterAvatar) || undefined} alt={renterName} className="h-full w-full object-cover" />
                                          ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-white">
                                              <img src="/logo.png" alt="EKRA" className="h-2/3 w-2/3 object-contain" />
                                            </div>
                                          )}
                                        </div>
                                      <span className="text-[15px] font-medium text-slate-700">{renterName}</span>
                                      <CheckCircle2 className="h-[16px] w-[16px] text-[#329875]" fill="currentColor" stroke="white" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-[14px] font-medium text-slate-500">
                                      <CheckCircle2 className="h-[18px] w-[18px] text-[#329875]" /> Renter verified
                                    </div>
                                  )}
                                  
                                  {/* Extra row for incoming */}
                                  {isIncoming && (
                                    <div className="flex items-center gap-2 text-slate-500 text-[14px] font-medium mt-1">
                                        <div className="text-violet-400">
                                          <CalendarDays className="h-[18px] w-[18px]" strokeWidth={2} />
                                        </div>
                                        <span>{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Right side Actions */}
                                <div className="flex items-center gap-2 relative z-10">
                                  {isIncoming && (
                                    <>
                                      <Button onClick={(e) => handleAction(e, booking.id, "accept")} className="h-[38px] rounded-[10px] bg-[#3B8A61] hover:bg-[#2D6C4B] text-white font-medium px-5">
                                        Accept
                                      </Button>
                                      <Button onClick={(e) => handleAction(e, booking.id, "decline")} className="h-[38px] rounded-[10px] bg-[#CD5C5C] hover:bg-[#B22222] text-white font-medium px-5">
                                        Decline
                                      </Button>
                                    </>
                                  )}
                                  
                                  {!isIncoming && isConfirmed && (
                                    <Button onClick={(e) => { e.stopPropagation(); /* handle messaging */ }} className="h-[38px] rounded-[10px] bg-[#499d80] hover:bg-[#347A60] text-white font-medium px-4 flex items-center gap-2 pr-3 pl-4">
                                      Message Renter 
                                      <div className="bg-white/20 rounded-full p-[3px]">
                                        <ChevronRight className="h-[12px] w-[12px] text-white" strokeWidth={3} />
                                      </div>
                                    </Button>
                                  )}
                                  
                                  {!isIncoming && (booking.status === "DECLINED" || booking.status === "CANCELLED") && (
                                    <div className="text-[14px] font-medium text-slate-400">
                                      {booking.status}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Bottom Right Floating Badge for Incoming */}
                              {isIncoming && (
                                <div className="absolute right-4 sm:right-5 bottom-4 sm:bottom-[70px] flex items-center gap-2 bg-[#f0f9f3] px-3 py-1.5 rounded-xl text-[14px] font-medium text-slate-700 border border-[#e0ebd8]">
                                  <Wallet className="h-[18px] w-[18px] text-[#3B8A61]" />
                                  <span className="text-[#3B8A61]">SAR</span> <span className="text-slate-800 text-[15px]">{Number(booking.total_price).toFixed(0)}</span>
                                </div>
                              )}
                              
                            </div>
                          </div>
                        </div>
                        
                        {/* Location & Status Footer */}
                        <div className="bg-[#fcfbf9]/80 px-4 sm:px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-slate-500 text-[14px] font-medium">
                            <MapPin className="h-[18px] w-[18px] text-violet-500" />
                            <span>Pickup location <span className="text-slate-700 ml-1">{booking.listing?.city || "Aqiq, Riyadh"}</span></span>
                          </div>
                          
                          <div className={`px-3 py-1 text-[13px] font-medium rounded-lg ${
                            booking.status === "CONFIRMED" ? "bg-[#f8ede3] text-[#cf8e54]" :
                            booking.status === "PENDING" ? "bg-slate-100 text-slate-500" :
                            "bg-rose-100/50 text-rose-600"
                          }`}>
                            {booking.status === "CONFIRMED" ? "Confirmed" :
                              booking.status === "PENDING" ? "Incoming Request" :
                              booking.status === "CANCELLED" ? "Cancelled by User" : "Declined"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}

              {currentBookings.length > 0 && (
                <div className="mt-8 flex items-center justify-center pb-8">
                  <div className="bg-white/60 backdrop-blur rounded-[16px] px-6 py-5 flex items-center gap-4 text-slate-500 shadow-sm border border-white max-w-sm w-full">
                      <div className="p-2 rounded-xl bg-slate-100/80 shrink-0">
                        <CalendarDays className="h-[22px] w-[22px] text-slate-400" />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-medium text-slate-700">No more bookings.</h4>
                        <p className="text-[14px] text-slate-500">You're all set for now.</p>
                      </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar Details */}
          {selectedBooking && (
            <div className={`w-full lg:w-[350px] shrink-0 sticky top-[90px] animate-in slide-in-from-right-8 fade-in flex flex-col gap-4 duration-500 pb-10`}>
                
               <Card className="rounded-[24px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white/95 backdrop-blur w-full">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[17px] font-bold text-slate-800">Booking Details</h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-100/60 rounded-full" onClick={() => setSelectedBookingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Profile */}
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100/80">
                    <div className="h-[42px] w-[42px] rounded-full bg-white overflow-hidden shrink-0 shadow-sm border border-slate-100">
                      {selectedBooking.renter?.avatar ? (
                         <img src={getImageUrl(selectedBooking.renter.avatar) || undefined} className="h-full w-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center bg-white">
                           <img src="/logo.png" alt="EKRA" className="h-2/3 w-2/3 object-contain" />
                         </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[15px] text-slate-800">{selectedBooking.renter?.username || 'User'}</p>
                    </div>
                  </div>
                  
                  {/* Timeline section */}
                  <div className="relative pl-[18px] mb-8">
                    <div className="absolute left-[11px] top-4 bottom-8 w-px border-l-2 border-dashed border-slate-200"></div>
                    
                    {/* Start Date */}
                    <div className="mb-6 relative h-[24px] flex items-center">
                      <div className="absolute -left-[18px] top-0.5 bg-white p-[2px] rounded-full z-10 hidden sm:block"></div>
                      <div className="absolute -left-6 bg-[#f3edff] p-1.5 rounded-[10px] text-violet-500 z-10 border-2 border-white">
                         <CalendarDays className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex items-center justify-between w-full pl-3">
                        <p className="text-[14px] font-medium text-slate-600">{formatDate(selectedBooking.start_date)}</p>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <div className="w-[18px] h-px bg-slate-200 hidden sm:block" />
                          <div className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md flex items-center">
                            <CalendarDays className="h-3 w-3 mr-1"/>
                            <ChevronDown className="h-3 w-3"/>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* End Date */}
                    <div className="mb-6 relative h-[24px] flex items-center">
                      <div className="absolute -left-[23px] bg-[#e6fbf1] p-1.5 rounded-[10px] text-[#329875] z-10 border-2 border-white">
                         <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-[14px] font-medium text-slate-600 pl-3">{formatDate(selectedBooking.end_date)}</p>
                    </div>
                    
                    {/* Pickup Location */}
                    <div className="relative flex items-start mt-2">
                       <div className="absolute -left-[23px] top-0 bg-[#fef5f9] p-1.5 rounded-[10px] text-fuchsia-500 z-10 border-2 border-white">
                         <CalendarDays className="h-3.5 w-3.5" />
                       </div>
                       <div className="pl-3">
                         <p className="text-[14px] font-medium text-slate-600 mb-0.5">Pickup in 10:00AM – 11:00AM</p>
                         <p className="text-[13px] text-slate-400">{selectedBooking.listing?.city || 'Aqiq, Riyadh'}</p>
                       </div>
                    </div>
                  </div>
                  
                  {/* Booking Summary */}
                  <div className="mb-6">
                    <h3 className="text-[14px] font-semibold text-slate-800 mb-2.5 flex items-center gap-2">
                       <ClipboardList className="h-[15px] w-[15px] text-slate-400" /> Booking Summary
                    </h3>
                    <div className="bg-[#fcfaf9] p-4 rounded-[16px] border border-slate-100 shadow-sm">
                       <p className="text-[14px] font-medium text-slate-700 mb-1">
                          {formatDate(selectedBooking.start_date)} - {formatDate(selectedBooking.end_date)}{" "}
                          <span className="text-slate-400 text-[13px] font-normal">
                            ({new Date(selectedBooking.start_date).toLocaleDateString("en-US", {weekday: "short"})} - {new Date(selectedBooking.end_date).toLocaleDateString("en-US", {weekday: "short"})})
                          </span>
                       </p>
                       <p className="text-[13px] text-slate-400 flex items-center gap-1.5 mb-4">
                         <MapPin className="h-3.5 w-3.5"/> {selectedBooking.listing?.city || 'Aqiq, Riyadh'}
                       </p>
                       
                       <div className="flex items-end justify-between pt-3 border-t border-slate-100 border-dashed">
                          <div>
                            <p className="text-[13px] text-slate-500 mb-1 flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400"/> Time: {getDurationInDays(selectedBooking.start_date, selectedBooking.end_date)} Duration
                            </p>
                            <p className="text-[18px] font-bold text-slate-700">SAR {Number(selectedBooking.total_price).toFixed(0)}</p>
                          </div>
                          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-[#553399] flex items-center gap-1.5 shadow-sm">
                            Paid <ChevronDown className="h-3.5 w-3.5 opacity-50"/>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Renter Information */}
                  <div className="mb-6">
                    <h3 className="text-[14px] font-semibold text-slate-800 mb-2.5">Renter Information</h3>
                    <div className="bg-[#fcfaf9] p-3 rounded-[16px] border border-slate-100 flex items-center justify-between shadow-[0_2px_10px_rgb(0,0,0,0.01)] mb-2.5">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-white overflow-hidden shrink-0 shadow-sm border border-slate-100">
                           {selectedBooking.renter?.avatar ? (
                             <img src={getImageUrl(selectedBooking.renter.avatar) || undefined} className="h-full w-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center bg-white">
                               <img src="/logo.png" alt="EKRA" className="h-2/3 w-2/3 object-contain" />
                             </div>
                           )}
                         </div>
                         <div>
                           <p className="text-[14px] font-semibold text-slate-800 leading-tight">{selectedBooking.renter?.username || 'User'}</p>
                           <p className="text-[12px] text-slate-400 mt-0.5">{selectedBooking.renter?.email}</p>
                         </div>
                       </div>
                       <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                    
                    <div className="bg-[#fcfaf9] p-2.5 rounded-[16px] border border-slate-100 flex items-center justify-between shadow-[0_2px_10px_rgb(0,0,0,0.01)]">
                      <div className="flex items-center gap-2.5 text-[14px] font-medium text-slate-600 pl-1">
                        <div className="bg-violet-100 p-1.5 rounded-full text-violet-600"><Phone className="h-[14px] w-[14px] fill-current" /></div>
                        +966-555-123-456
                      </div>
                      <Button size="icon" className="h-8 w-8 rounded-[10px] bg-slate-200/60 hover:bg-slate-200 text-slate-500 shadow-none"><Phone className="h-[14px] w-[14px]" /></Button>
                    </div>
                  </div>
                  
                  {/* Rental Payment */}
                  <div className="mb-2">
                     <div className="flex items-center justify-between mb-2.5">
                       <h3 className="text-[14px] font-semibold text-slate-800">Rental Payment</h3>
                       <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Paid
                       </div>
                     </div>
                     <div className="bg-[#fcfaf9] p-3.5 rounded-[16px] border border-slate-100 flex items-center gap-3 mb-4 shadow-[0_2px_10px_rgb(0,0,0,0.01)]">
                       <div className="bg-violet-100 p-1.5 rounded-full">
                         <MapPin className="h-4 w-4 text-violet-500" fill="currentColor"/>
                       </div>
                       <span className="font-semibold text-slate-700 text-[15px]">infulty</span>
                     </div>
                     
                     <div className="w-full h-[120px] rounded-[16px] overflow-hidden bg-slate-100 border border-slate-100 relative shadow-inner">
                        <img src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/46.6753,24.7136,13,0/800x400?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.dummy_token_for_demo'}`} alt="Map" className="w-full h-full object-cover opacity-80 mix-blend-multiply" />
                        <div className="absolute inset-0 m-auto flex items-center justify-center">
                          <div className="relative">
                            <MapPin className="h-8 w-8 text-violet-600 fill-violet-600" />
                            <div className="h-2 w-2 rounded-full bg-white absolute top-2 left-3"></div>
                          </div>
                        </div>
                     </div>
                  </div>
                  
                </CardContent>
               </Card>

            </div>
          )}

        </div>

      </div>
    </div>
  )
}
