'use client'

import React, { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axiosInstance from '@/lib/axios'
import { useLocale } from '@/components/LocaleProvider'
import { ArrowLeft, Calendar, Check, ChevronLeft, ChevronRight, CreditCard, Loader2, Receipt, X } from 'lucide-react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_BASE

function getImageUrl(listing: any): string | null {
  const img = listing?.images?.[0]?.image
  if (!img) return null
  if (img.startsWith('http')) return img
  return `${API?.replace('/api', '')}${img}`
}

function BookingsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLocale()
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [urlReady, setUrlReady] = useState(false)
  const hasSyncedFromUrl = useRef(false)
  const [paginationMeta, setPaginationMeta] = useState<{ count: number; next: string | null; previous: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [payError, setPayError] = useState<string | null>(null)

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

  // Read page from URL once on mount (shareable links)
  useEffect(() => {
    if (hasSyncedFromUrl.current) return
    hasSyncedFromUrl.current = true
    const p = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    setPage(p)
    setUrlReady(true)
  }, [searchParams])

  // Persist page to URL when it changes
  useEffect(() => {
    if (!urlReady || typeof window === 'undefined') return
    const url = page > 1 ? `/bookings?page=${page}` : '/bookings'
    window.history.replaceState(null, '', url)
  }, [urlReady, page])

  useEffect(() => {
    if (!user || !urlReady) return
    const token = localStorage.getItem('access_token')
    if (!token) return
    setLoading(true)
    const fetchBookings = async () => {
      try {
        const res = await axiosInstance.get(`${API}/bookings/`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page },
        })
        const data = res.data
        const list = Array.isArray(data) ? data : data?.results ?? []
        setBookings(list)
        if (data && !Array.isArray(data) && ('count' in data || 'next' in data)) {
          setPaginationMeta({
            count: typeof data.count === 'number' ? data.count : list.length,
            next: data.next ?? null,
            previous: data.previous ?? null,
          })
        } else {
          setPaginationMeta(null)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [user, urlReady, page])

  // Refetch when returning from payment (paid=1 or cancelled=1); redirect to receipt when paid
  useEffect(() => {
    const paid = searchParams.get('paid')
    const cancelled = searchParams.get('cancelled')
    const bookingId = searchParams.get('booking_id')
    if ((paid === '1' || cancelled === '1') && user) {
      setPage(1)
      const token = localStorage.getItem('access_token')
      if (token) {
        axiosInstance.get(`${API}/bookings/`, { headers: { Authorization: `Bearer ${token}` }, params: { page: 1 } })
          .then((res) => {
            const data = res.data
            const list = Array.isArray(data) ? data : data?.results ?? []
            setBookings(list)
            if (data && !Array.isArray(data)) setPaginationMeta({ count: data.count ?? list.length, next: data.next ?? null, previous: data.previous ?? null })
          })
          .catch(() => {})
      }
      if (paid === '1' && bookingId) {
        router.replace(`/bookings/${bookingId}/receipt`, { scroll: false })
      } else {
        router.replace('/bookings', { scroll: false })
      }
    }
  }, [searchParams, user, router])

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

  const handlePayNow = async (bookingId: number) => {
    setPayError(null)
    setActionId(bookingId)
    const token = localStorage.getItem('access_token')
    try {
      const res = await axiosInstance.post<{ url: string }>(
        `${API}/bookings/${bookingId}/checkout/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data?.url) {
        window.location.href = res.data.url
        return
      }
      setPayError('Could not start payment.')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Payment failed.'
      setPayError(typeof msg === 'string' ? msg : 'Payment failed.')
    } finally {
      setActionId(null)
    }
  }

  const handleCancel = async (bookingId: number) => {
    if (!confirm('Cancel this booking? This cannot be undone.')) return
    setActionId(bookingId)
    const token = localStorage.getItem('access_token')
    try {
      const res = await axiosInstance.post(
        `${API}/bookings/${bookingId}/cancel/`,
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

  const handleRefund = async (bookingId: number) => {
    if (!confirm('Mark this booking as refunded? (Use after processing refund in your payment dashboard.)')) return
    setActionId(bookingId)
    const token = localStorage.getItem('access_token')
    try {
      const res = await axiosInstance.post(
        `${API}/bookings/${bookingId}/refund/`,
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

        {payError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {payError}
          </div>
        )}

        {loading ? (
          <ul className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <li key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex gap-4 p-4">
                  <div className="w-20 h-20 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                    <div className="flex gap-2 mt-3">
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-14" />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
                      : booking.status === 'CANCELLED'
                        ? 'Cancelled'
                        : booking.status
              const canCancel =
                booking.status !== 'CANCELLED' &&
                booking.status !== 'DECLINED' &&
                (ownerView
                  ? (booking.status === 'PENDING' || booking.status === 'CONFIRMED')
                  : booking.status === 'PENDING' || (booking.status === 'CONFIRMED' && booking.payment_status !== 'PAID'))

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
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Link
                          href={`/bookings/${booking.id}/receipt`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-black"
                        >
                          <Receipt className="h-3.5 w-3.5" /> View receipt
                        </Link>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            pending
                              ? 'bg-amber-100 text-amber-800'
                              : booking.status === 'CONFIRMED'
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'CANCELLED'
                                  ? 'bg-gray-100 text-gray-600'
                                  : booking.status === 'DECLINED'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {statusLabel}
                        </span>
                        {booking.payment_status && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
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
                                : 'Payment pending'}
                          </span>
                        )}
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
                      {ownerView && booking.status === 'CONFIRMED' && booking.payment_status === 'PAID' && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleRefund(booking.id)}
                            disabled={actionId !== null}
                            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
                          >
                            {actionId === booking.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : null}
                            Mark as refunded
                          </button>
                        </div>
                      )}
                      {!ownerView &&
                        booking.status === 'CONFIRMED' &&
                        booking.payment_status !== 'PAID' && (
                          <div className="mt-3">
                            <button
                              onClick={() => handlePayNow(booking.id)}
                              disabled={actionId !== null}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50"
                            >
                              {actionId === booking.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CreditCard className="h-4 w-4" />
                              )}
                              Pay now
                            </button>
                          </div>
                        )}
                      {canCancel && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleCancel(booking.id)}
                            disabled={actionId !== null}
                            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
                          >
                            {actionId === booking.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                            Cancel booking
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
        {!loading && paginationMeta && paginationMeta.count > 10 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!paginationMeta.previous}
              className="inline-flex items-center gap-1 min-h-[44px] px-4 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-5 w-5" /> Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {Math.ceil(paginationMeta.count / 10) || 1} ({paginationMeta.count} bookings)
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!paginationMeta.next}
              className="inline-flex items-center gap-1 min-h-[44px] px-4 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
            >
              Next <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function BookingsFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-gray-500">Loading bookings…</div>
    </div>
  )
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<BookingsFallback />}>
      <BookingsPageContent />
    </Suspense>
  )
}
