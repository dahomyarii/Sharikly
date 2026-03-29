'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Clock, MapPin, User, Check } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { countInclusiveRentalDays, formatLocalYMD, parseLocalYMD } from '@/lib/utils'

const API = process.env.NEXT_PUBLIC_API_BASE

function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('access') ||
    localStorage.getItem('token')
  )
}

function formatBookingApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Failed to send request. Please try again.'
  const d = data as Record<string, unknown>
  const detail = d.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0]
    if (typeof first === 'string') return first
  }
  const parts: string[] = []
  for (const [key, val] of Object.entries(d)) {
    if (key === 'detail') continue
    if (Array.isArray(val) && val.length) {
      const msg = val.map((x) => String(x)).join(', ')
      parts.push(`${key}: ${msg}`)
    } else if (typeof val === 'string') {
      parts.push(`${key}: ${val}`)
    }
  }
  if (parts.length) return parts.join(' | ')
  return 'Failed to send request. Please try again.'
}

export default function RequestBookingPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : String(params.id || '')
  
  const [user, setUser] = useState<any>(null)
  const [listing, setListing] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      } else {
        router.push('/auth/login')
      }
    }
  }, [router])

  useEffect(() => {
    if (!listingId) return
    const fetchListing = async () => {
      try {
        const res = await axiosInstance.get(`${API}/listings/${listingId}/`)
        setListing(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchListing()
  }, [listingId])

  // Get dates from URL search params (prefer local YYYY-MM-DD; fallback legacy ISO)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    const fromRaw = sp.get('from')
    const toRaw = sp.get('to')
    if (!fromRaw || !toRaw) return

    const fromParsed = parseLocalYMD(fromRaw)
    const toParsed = parseLocalYMD(toRaw)
    if (fromParsed && toParsed) {
      setDateRange({ from: fromParsed, to: toParsed })
      return
    }
    const fromLegacy = new Date(fromRaw)
    const toLegacy = new Date(toRaw)
    if (!Number.isNaN(fromLegacy.getTime()) && !Number.isNaN(toLegacy.getTime())) {
      setDateRange({ from: fromLegacy, to: toLegacy })
    }
  }, [])

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading listing...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Please log in to request a booking</div>
      </div>
    )
  }

  const calculateDays = () => {
    if (!dateRange?.from || !dateRange?.to) return 0
    return countInclusiveRentalDays(dateRange.from, dateRange.to)
  }

  const calculateTotal = () => {
    const days = calculateDays()
    if (!listing.price_per_day || days === 0) return 0
    return days * parseFloat(String(listing.price_per_day))
  }

  const wrapMessageForChat = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return ''

    const words = trimmed.split(/\s+/)
    const lines: string[] = []
    let currentLine: string[] = []
    let currentLength = 0

    for (const word of words) {
      const extraLength = word.length + (currentLine.length > 0 ? 1 : 0) // +1 for space
      const wouldExceedChars = currentLength + extraLength > 100
      const wouldExceedWords = currentLine.length >= 10

      if (wouldExceedChars || wouldExceedWords) {
        lines.push(currentLine.join(' '))
        currentLine = [word]
        currentLength = word.length
      } else {
        currentLine.push(word)
        currentLength += extraLength
      }
    }

    if (currentLine.length) {
      lines.push(currentLine.join(' '))
    }

    return lines.join('\n')
  }

  const handleSendRequest = async () => {
    setError('')
    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      setError('Please write a message to the owner.')
      return
    }
    if (trimmedMessage.length > 1000) {
      setError('Message must be 1000 characters or less.')
      return
    }

    if (!dateRange?.from || !dateRange?.to) {
      setError('Please select your booking dates.')
      return
    }

    const startDay = new Date(
      dateRange.from.getFullYear(),
      dateRange.from.getMonth(),
      dateRange.from.getDate()
    )
    const todayDay = new Date()
    todayDay.setHours(0, 0, 0, 0)
    const todayLocal = new Date(todayDay.getFullYear(), todayDay.getMonth(), todayDay.getDate())
    if (startDay < todayLocal) {
      setError('Start date cannot be in the past.')
      return
    }
    if (dateRange.from > dateRange.to) {
      setError('End date must be on or after the start date.')
      return
    }
    const days = calculateDays()
    if (days > 90) {
      setError('Booking period cannot exceed 90 days.')
      return
    }

    const token = getStoredAccessToken()
    if (!token) {
      setError('You are not logged in properly')
      return
    }

    setLoading(true)
    setError('')
    const headers = { Authorization: `Bearer ${token}` }

    try {
      // 1) Create booking (primary action)
      const startStr = formatLocalYMD(dateRange.from!)
      const endStr = formatLocalYMD(dateRange.to!)
      const total = calculateTotal()

      await axiosInstance.post(
        `${API}/bookings/`,
        {
          listing: listing.id,
          start_date: startStr,
          end_date: endStr,
          total_price: total.toFixed(2),
        },
        { headers }
      )

      // 2) Best-effort: create/find chat room + send message.
      // If this fails, the booking should still succeed.
      try {
        const chatRoomsRes = await axiosInstance.get(`${API}/chat/rooms/`, { headers })
        let existingRoom = Array.isArray(chatRoomsRes.data)
          ? chatRoomsRes.data.find((room: any) =>
              room.participants?.some((p: any) => p.id === listing.owner.id)
            )
          : null

        let roomId
        if (existingRoom) {
          roomId = existingRoom.id
        } else {
          const newRoomRes = await axiosInstance.post(
            `${API}/chat/rooms/`,
            { participants: [listing.owner.id] },
            { headers }
          )
          roomId = newRoomRes.data.id
        }

        const dateLabel = `${dateRange.from!.toLocaleDateString()} - ${dateRange.to!.toLocaleDateString()}`
        const durationLabel = `${calculateDays()} day${calculateDays() !== 1 ? 's' : ''}`
        const pricePerDayLabel = `$${listing.price_per_day || '0.00'}`
        const totalLabel = `$${total.toFixed(2)}`
        const wrappedMessage = wrapMessageForChat(message)

        const bookingMessage =
          `BOOKING_REQUEST\n` +
          `Hi! I'd like to book this item.\n\n` +
          `Dates: ${dateLabel}\n` +
          `Duration: ${durationLabel}\n` +
          `Price per day: ${pricePerDayLabel}\n` +
          `Total: ${totalLabel}\n\n` +
          `Message from guest:\n` +
          (wrappedMessage || '(no additional message)')

        await axiosInstance.post(
          `${API}/chat/messages/`,
          { room: roomId, text: bookingMessage },
          { headers }
        )
      } catch (chatErr) {
        // Log chat errors but don't block successful booking creation
        console.error('Error sending booking message:', (chatErr as any)?.response || chatErr)
      }

      // Go to My Bookings so user sees their request
      router.push('/bookings')
    } catch (err: any) {
      console.error(err.response || err)
      setError(formatBookingApiError(err.response?.data))
    } finally {
      setLoading(false)
    }
  }

  const getFullImageUrl = (imgPath: string) => {
    if (imgPath.startsWith('http')) return imgPath
    return `${API?.replace('/api', '')}${imgPath}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4" style={{ paddingTop: "max(1rem, var(--safe-area-inset-top))" }}>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold text-foreground">Request Booking</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-28 sm:py-8 sm:pb-10">
        {/* Box: You're requesting to book */}
        <Card className="p-4 mb-6 border-2 border-border bg-card shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground font-medium">You're requesting to book</p>
              <Link
                href={`/listings/${listing.id}`}
                className="text-lg font-bold text-foreground hover:text-foreground hover:underline truncate block"
              >
                {listing.title}
              </Link>
            </div>
            <Link
              href={`/listings/${listing.id}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground shrink-0"
            >
              View listing →
            </Link>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {/* Left Column - Listing Info */}
          <div className="order-2 space-y-5 md:order-1 md:col-span-2 md:space-y-6">
            {/* Listing Card */}
            <Card className="p-6 bg-card">
              <div className="flex gap-4 mb-4">
                {listing.images?.[0] && (
                  <Link
                    href={`/listings/${listing.id}`}
                    className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 block"
                  >
                    <img
                      src={getFullImageUrl(listing.images[0].image)}
                      alt={listing.title}
                      className="w-full h-full object-cover transition-transform duration-150 hover:scale-105"
                    />
                  </Link>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-1">{listing.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {listing.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{listing.city}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Owner Info */}
            <Card className="p-6 bg-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {listing.owner?.username || listing.owner?.email}
                  </h3>
                  <p className="text-sm text-muted-foreground">Owner</p>
                </div>
              </div>
            </Card>

            {/* Message */}
            <Card className="p-6 bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Message to Owner</h3>
              <textarea
                className="w-full border border-border rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500/80 resize-none bg-background text-foreground"
                placeholder="Tell the owner about your booking request, any special requirements, or questions..."
                rows={6}
                value={message}
                maxLength={1000}
                onChange={(e) => { setMessage(e.target.value); setError(''); }}
              />
              {error && (
                <div className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Booking Summary */}
          <div className="order-1 md:order-2 md:col-span-1">
            <Card className="rounded-2xl border border-purple-100 bg-card p-5 shadow-[0_18px_45px_rgba(147,51,234,0.25)] md:sticky md:top-24 md:p-6">
              <h3 className="text-lg font-semibold text-purple-700 mb-6">Booking Summary</h3>
              
              {dateRange?.from && dateRange?.to ? (
                <div className="mt-2 overflow-hidden rounded-2xl border border-purple-100/80 shadow-sm shadow-purple-200/80 bg-background">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="bg-muted/60">
                        <th className="px-3 py-2 text-left text-muted-foreground">Dates</th>
                        <td className="px-3 py-2 font-medium text-foreground">
                          {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                        </td>
                      </tr>
                      <tr>
                        <th className="px-3 py-2 text-left text-muted-foreground">Duration</th>
                        <td className="px-3 py-2 font-medium text-foreground">
                          {calculateDays()} day{calculateDays() !== 1 ? 's' : ''}
                        </td>
                      </tr>
                      <tr>
                        <th className="px-3 py-2 text-left text-muted-foreground">Price / day</th>
                        <td className="px-3 py-2 font-medium text-foreground">
                          ${listing.price_per_day || '0.00'}
                        </td>
                      </tr>
                      <tr className="bg-muted/60">
                        <th className="px-3 py-2 text-left text-muted-foreground">Total</th>
                        <td className="px-3 py-2">
                          <div className="inline-flex items-baseline justify-end w-full rounded-full bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-500 text-white px-3 py-1.5 shadow-[0_12px_30px_rgba(147,51,234,0.6)]">
                            <span className="text-lg font-semibold">
                              ${calculateTotal().toFixed(2)}
                            </span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <th className="px-3 py-2 text-left text-muted-foreground align-top">Message</th>
                        <td className="px-3 py-2 text-foreground whitespace-pre-wrap">
                          {message.trim() ? (
                            message
                          ) : (
                            <span className="text-muted-foreground/70">No message yet</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-2 text-sm text-muted-foreground text-center py-4">
                  Select dates on the listing page to see your full price breakdown.
                </div>
              )}

              <Button
                onClick={handleSendRequest}
                disabled={loading || !message.trim() || !dateRange?.from || !dateRange?.to}
                className="mt-6 w-full rounded-xl bg-primary py-6 text-lg font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Clock className="h-5 w-5 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Send Booking Request
                  </span>
                )}
              </Button>

              <p className="mt-4 text-center text-xs text-gray-500">
                You'll be redirected to chat to continue the conversation
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
