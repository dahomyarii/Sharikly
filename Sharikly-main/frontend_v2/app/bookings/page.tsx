'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axios'
import { useLocale } from '@/components/LocaleProvider'
import { ArrowLeft, Calendar, Check, X, Loader2 } from 'lucide-react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_BASE

function getImageUrl(listing: any): string | null {
  const img = listing?.images?.[0]?.image
  if (!img) return null
  if (img.startsWith('http')) return img
  return `${API?.replace('/api', '')}${img}`
}

export default function BookingsPage() {
  const router = useRouter()
  const { t } = useLocale()
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user')
      const token = localStorage.getItem('access_token')
      if (stored && token) {
        setUser(JSON.parse(stored))
      } else {
        router.push('/auth/login')
        return
      }
    }
  }, [router])

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('access_token')
    if (!token) return
    const fetchBookings = async () => {
      try {
        const res = await axiosInstance.get(`${API}/bookings/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setBookings(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [user])

  const isOwner = (booking: any) =>
    booking.listing?.owner?.id === user?.id

  const handleAccept = async (bookingId: number) => {
    setActionId(bookingId)
    const token = localStorage.getItem('access_token')
    try {
      const res = await axiosInstance.post(
        `${API}/bookings/${bookingId}/accept/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.data : b))
      )
    } catch (err) {
      console.error(err)
    } finally {
      setActionId(null)
    }
  }

  const handleDecline = async (bookingId: number) => {
    setActionId(bookingId)
    const token = localStorage.getItem('access_token')
    try {
      const res = await axiosInstance.post(
        `${API}/bookings/${bookingId}/decline/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.data : b))
      )
    } catch (err) {
      console.error(err)
    } finally {
      setActionId(null)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{t('please_login')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-200 transition"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('my_bookings')}
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No bookings yet</p>
            <p className="text-sm text-gray-500 mb-6">
              When you request to book an item, it will show up here.
            </p>
            <Link
              href="/listings"
              className="inline-block px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {bookings.map((booking) => {
              const listing = booking.listing
              const ownerView = isOwner(booking)
              const pending = booking.status === 'PENDING'
              const statusLabel =
                booking.status === 'PENDING'
                  ? 'Pending'
                  : booking.status === 'CONFIRMED'
                    ? 'Accepted'
                    : booking.status === 'DECLINED'
                      ? 'Declined'
                      : booking.status

              return (
                <li
                  key={booking.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <div className="flex gap-4 p-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      {getImageUrl(listing) ? (
                        <img
                          src={getImageUrl(listing)!}
                          alt={listing?.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Calendar className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/listings/${listing?.id}`}
                        className="font-semibold text-gray-900 hover:underline line-clamp-1"
                      >
                        {listing?.title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {ownerView
                          ? `Request from ${booking.renter?.username || booking.renter?.email}`
                          : `${listing?.owner?.username || 'Owner'}`}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(booking.start_date).toLocaleDateString()} –{' '}
                        {new Date(booking.end_date).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            pending
                              ? 'bg-amber-100 text-amber-800'
                              : booking.status === 'CONFIRMED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {statusLabel}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          ${Number(booking.total_price).toFixed(2)}
                        </span>
                      </div>
                      {ownerView && pending && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleAccept(booking.id)}
                            disabled={actionId !== null}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionId === booking.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={() => handleDecline(booking.id)}
                            disabled={actionId !== null}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            {actionId === booking.id ? null : <X className="h-4 w-4" />}
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
