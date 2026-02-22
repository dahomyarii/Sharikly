'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axiosInstance from '@/lib/axios'
import { useLocale } from '@/components/LocaleProvider'
import { ArrowLeft, Calendar, Check, Receipt } from 'lucide-react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_BASE

function getImageUrl(listing: { images?: { image: string }[] } | null): string | null {
  const img = listing?.images?.[0]?.image
  if (!img) return null
  if (img.startsWith('http')) return img
  return `${API?.replace('/api', '')}${img}`
}

export default function BookingReceiptPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useLocale()
  const id = params?.id as string
  const [user, setUser] = useState<any>(null)
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    if (!user || !id) return
    const token = localStorage.getItem('access_token')
    if (!token) return
    const fetchBooking = async () => {
      try {
        const res = await axiosInstance.get(`${API}/bookings/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setBooking(res.data)
      } catch {
        setError('Booking not found or you don’t have access.')
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [user, id])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{t('please_login')}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading receipt…</div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-gray-600 mb-4">{error ?? 'Booking not found.'}</p>
          <Link
            href="/bookings"
            className="inline-flex items-center gap-2 text-black font-medium hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to My Bookings
          </Link>
        </div>
      </div>
    )
  }

  const listing = booking.listing
  const isOwner = listing?.owner?.id === user?.id
  const statusLabel =
    booking.status === 'PENDING'
      ? 'Pending'
      : booking.status === 'CONFIRMED'
        ? 'Confirmed'
        : booking.status === 'DECLINED'
          ? 'Declined'
          : booking.status === 'CANCELLED'
            ? 'Cancelled'
            : booking.status

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-200 transition"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="h-6 w-6" /> Booking receipt
          </h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Receipt header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Booking #{booking.id}</p>
            <p className="text-sm text-gray-600 mt-0.5">
              {(() => {
              const d = new Date(booking.created_at)
              try {
                return d.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              } catch {
                return d.toISOString().slice(0, 16).replace('T', ' ')
              }
            })()}
            </p>
          </div>

          {/* Listing summary */}
          <div className="p-4 flex gap-4">
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
                className="font-semibold text-gray-900 hover:underline line-clamp-2"
              >
                {listing?.title}
              </Link>
              <p className="text-sm text-gray-500 mt-0.5">
                {isOwner
                  ? `Renter: ${booking.renter?.username || booking.renter?.email}`
                  : `Owner: ${listing?.owner?.username || 'Owner'}`}
              </p>
            </div>
          </div>

          {/* Dates & total */}
          <div className="px-4 pb-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Dates</span>
              <span className="text-gray-900 font-medium">
                {new Date(booking.start_date).toLocaleDateString()} – {new Date(booking.end_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total</span>
              <span className="text-gray-900 font-semibold">${Number(booking.total_price).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-500">Status</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  booking.status === 'CONFIRMED'
                    ? 'bg-green-100 text-green-800'
                    : booking.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : booking.status === 'CANCELLED' || booking.status === 'DECLINED'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-gray-100 text-gray-700'
                }`}
              >
                {booking.status === 'CONFIRMED' && <Check className="h-3.5 w-3.5" />}
                {statusLabel}
              </span>
            </div>
            {booking.payment_status && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Payment</span>
                <span
                  className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                    booking.payment_status === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : booking.payment_status === 'REFUNDED'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {booking.payment_status === 'PAID'
                    ? 'Paid'
                    : booking.payment_status === 'REFUNDED'
                      ? 'Refunded'
                      : 'Pending'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/bookings"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
          >
            <ArrowLeft className="h-4 w-4" /> My Bookings
          </Link>
          <Link
            href={`/listings/${listing?.id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            View listing
          </Link>
        </div>
      </div>
    </div>
  )
}
