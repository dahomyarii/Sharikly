'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Clock, MapPin, User, Check } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

const API = process.env.NEXT_PUBLIC_API_BASE

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

  // Get dates from URL search params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const fromDate = params.get('from')
      const toDate = params.get('to')
      
      if (fromDate && toDate) {
        setDateRange({
          from: new Date(fromDate),
          to: new Date(toDate)
        })
      }
    }
  }, [])

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading listing...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Please log in to request a booking</div>
      </div>
    )
  }

  const calculateDays = () => {
    if (!dateRange?.from || !dateRange?.to) return 0
    const diff = dateRange.to.getTime() - dateRange.from.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  }

  const calculateTotal = () => {
    const days = calculateDays()
    if (!listing.price_per_day || days === 0) return 0
    return days * parseFloat(listing.price_per_day)
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

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (dateRange.from < today) {
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

    const token = localStorage.getItem('access_token')
    if (!token) {
      setError('You are not logged in properly')
      return
    }

    setLoading(true)
    setError('')
    const headers = { Authorization: `Bearer ${token}` }

    try {
      // Create booking (so it appears in My Bookings and owner can accept/decline)
      const startStr = dateRange.from!.toISOString().slice(0, 10)
      const endStr = dateRange.to!.toISOString().slice(0, 10)
      await axiosInstance.post(
        `${API}/bookings/`,
        {
          listing: listing.id,
          start_date: startStr,
          end_date: endStr,
          total_price: calculateTotal().toFixed(2),
        },
        { headers }
      )

      // Find or create chat room and send message
      const chatRoomsRes = await axiosInstance.get(`${API}/chat/rooms/`, { headers })
      let existingRoom = chatRoomsRes.data.find((room: any) =>
        room.participants.some((p: any) => p.id === listing.owner.id)
      )

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

      const bookingMessage = `Hi! I'd like to book this item.\n\n` +
        `📅 Dates: ${dateRange.from!.toLocaleDateString()} - ${dateRange.to!.toLocaleDateString()}\n` +
        `📆 Duration: ${calculateDays()} day${calculateDays() !== 1 ? 's' : ''}\n` +
        `💰 Total: $${calculateTotal().toFixed(2)}\n\n` +
        message

      await axiosInstance.post(
        `${API}/chat/messages/`,
        { room: roomId, text: bookingMessage },
        { headers }
      )

      // Go to My Bookings so user sees their request
      router.push('/bookings')
    } catch (err: any) {
      console.error(err.response || err)
      setError(err.response?.data?.detail || 'Failed to send request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getFullImageUrl = (imgPath: string) => {
    if (imgPath.startsWith('http')) return imgPath
    return `${API?.replace('/api', '')}${imgPath}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Request Booking</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Box: You're requesting to book */}
        <Card className="p-4 mb-6 border-2 border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 font-medium">You're requesting to book</p>
              <Link
                href={`/listings/${listing.id}`}
                className="text-lg font-bold text-gray-900 hover:text-black hover:underline truncate block"
              >
                {listing.title}
              </Link>
            </div>
            <Link
              href={`/listings/${listing.id}`}
              className="text-sm font-medium text-gray-600 hover:text-black shrink-0"
            >
              View listing →
            </Link>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Listing Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Listing Card */}
            <Card className="p-6">
              <div className="flex gap-4 mb-4">
                {listing.images?.[0] && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={getFullImageUrl(listing.images[0].image)}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{listing.title}</h2>
                  <p className="text-sm text-gray-600 line-clamp-2">{listing.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
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
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {listing.owner?.username || listing.owner?.email}
                  </h3>
                  <p className="text-sm text-gray-500">Owner</p>
                </div>
              </div>
            </Card>

            {/* Message */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Message to Owner</h3>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-black resize-none"
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
          <div className="md:col-span-1">
            <Card className="p-6 sticky top-24 border-2 border-gray-200 shadow-md bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Booking Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price per day</span>
                  <span className="font-semibold">${listing.price_per_day || '0.00'}</span>
                </div>
                
                {dateRange?.from && dateRange?.to && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-semibold">
                        {calculateDays()} day{calculateDays() !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-gray-900">
                          ${calculateTotal().toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {calculateDays()} × ${listing.price_per_day || '0.00'}
                      </p>
                    </div>
                  </>
                )}

                {(!dateRange?.from || !dateRange?.to) && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    Select dates on the listing page to see total
                  </div>
                )}
                
                {dateRange?.from && dateRange?.to && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Selected dates:</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSendRequest}
                disabled={loading || !message.trim() || !dateRange?.from || !dateRange?.to}
                className="w-full mt-6 bg-black hover:bg-gray-800 text-white rounded-lg py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
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

              <p className="text-xs text-gray-500 text-center mt-4">
                You'll be redirected to chat to continue the conversation
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
