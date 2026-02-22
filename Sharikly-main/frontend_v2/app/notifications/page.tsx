'use client'

import React, { useEffect, useState, Component } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axios'
import { useLocale } from '@/components/LocaleProvider'
import { Bell, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API = process.env.NEXT_PUBLIC_API_BASE

function ensureNotificationArray(value: unknown): any[] {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object' && 'results' in value && Array.isArray((value as any).results)) {
    return (value as any).results
  }
  return []
}

class NotificationsErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; retryKey: number }
> {
  state = { hasError: false, error: null as Error | null, retryKey: 0 }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Notifications page error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 py-6 pb-32 md:pb-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <Link href="/" className="p-2 rounded-full hover:bg-gray-200 transition" aria-label="Back">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-7 h-7" />
                Notifications
              </h1>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
              <p className="text-lg font-medium text-gray-700 mb-2">Couldn&apos;t load notifications</p>
              <p className="text-sm text-gray-500 mb-6">Something went wrong. Please try again.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => this.setState((s) => ({ hasError: false, error: null, retryKey: s.retryKey + 1 }))}
                >
                  Try again
                </Button>
                <Link href="/">
                  <Button variant="outline">Go home</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return React.cloneElement(React.Children.only(this.props.children) as React.ReactElement, {
      key: this.state.retryKey,
    })
  }
}

function NotificationsPageContent() {
  const locale = useLocale()
  const t = locale?.t ?? ((k: string) => k)
  const router = useRouter()
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [nextPage, setNextPage] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [markAllReadLoading, setMarkAllReadLoading] = useState(false)

  const fetchNotifications = (page?: number) => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('access_token')
    if (!token || !API) {
      setLoading(false)
      return
    }
    if (page == null || page === 1) setLoading(true)
    else setLoadingMore(true)
    const url = page != null && page > 1 ? `${API}/notifications/?page=${page}` : `${API}/notifications/`
    axiosInstance
      .get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const data = res.data
        const items = ensureNotificationArray(data)
        if (page != null && page > 1) {
          setList((prev) => [...(Array.isArray(prev) ? prev : []), ...items])
        } else {
          setList(items)
        }
        setNextPage(data?.next ?? null)
      })
      .catch(() => {
        if (page == null || page === 1) setList([])
      })
      .finally(() => {
        setLoading(false)
        setLoadingMore(false)
      })
  }

  const loadMore = () => {
    if (!nextPage || loadingMore) return
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('access_token')
    if (!token || !API) return
    const url = nextPage.startsWith('http') ? nextPage : `${API.replace(/\/api\/?$/, '')}${nextPage.startsWith('/') ? nextPage : `/${nextPage}`}`
    setLoadingMore(true)
    axiosInstance
      .get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const data = res.data
        const items = ensureNotificationArray(data)
        setList((prev) => [...(Array.isArray(prev) ? prev : []), ...items])
        setNextPage(data?.next ?? null)
      })
      .finally(() => setLoadingMore(false))
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      router.push('/auth/login')
      return
    }
    fetchNotifications(1)
  }, [router])

  const markRead = (id: number) => {
    const token = localStorage.getItem('access_token')
    if (!token || !API) return
    axiosInstance
      .patch(
        `${API}/notifications/mark-read/`,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setList((prev) =>
          (Array.isArray(prev) ? prev : []).map((n) => (n && n.id === id ? { ...n, read: true } : n))
        )
      })
  }

  const markAllRead = () => {
    const token = localStorage.getItem('access_token')
    if (!token || !API || markAllReadLoading) return
    setMarkAllReadLoading(true)
    axiosInstance
      .patch(
        `${API}/notifications/mark-read/`,
        { all: true },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setList((prev) => (Array.isArray(prev) ? prev : []).map((n) => (n ? { ...n, read: true } : n)))
      })
      .finally(() => setMarkAllReadLoading(false))
  }

  const safeList = Array.isArray(list) ? list.filter((n) => n && typeof n === 'object' && n.id != null) : []
  const unreadCount = safeList.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 pb-32 md:pb-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-full hover:bg-gray-200 transition touch-target"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-7 h-7" />
              {t('notifications')}
              {unreadCount > 0 && (
                <span className="ml-1 min-w-[22px] h-6 px-1.5 flex items-center justify-center rounded-full bg-black text-white text-xs font-semibold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </h1>
          </div>
          {safeList.length > 0 && unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              disabled={markAllReadLoading}
              className="shrink-0"
            >
              {markAllReadLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-black inline-block mr-1.5" />
              ) : (
                <Check className="w-4 h-4 mr-1.5" />
              )}
              {markAllReadLoading ? '…' : (t('mark_all_read') || 'Mark all read')}
            </Button>
          )}
        </div>

        {safeList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-700 mb-1">{t('no_notifications') || 'No notifications yet'}</p>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              When someone accepts or declines your booking, or sends you a message, you&apos;ll see it here.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/listings">
                <Button className="w-full sm:w-auto">Browse listings</Button>
              </Link>
              <Link href="/bookings">
                <Button variant="outline" className="w-full sm:w-auto">My bookings</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {safeList.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link || '/notifications'}
                    className={`block bg-white rounded-xl border p-4 hover:bg-gray-50/80 transition shadow-sm ${
                      !n.read ? 'border-l-4 border-l-black border-gray-200' : 'border-gray-100'
                    }`}
                    onClick={() => !n.read && markRead(n.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{n.title}</p>
                        {n.body && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{n.body}</p>}
                        <p className="text-xs text-gray-400 mt-2">
                          {n.created_at
                            ? new Date(n.created_at).toLocaleDateString(undefined, {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : ''}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-black mt-2" aria-hidden />
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {nextPage && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="min-h-[44px] px-6"
                >
                  {loadingMore ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
                      Loading…
                    </span>
                  ) : (
                    'Load more'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <NotificationsErrorBoundary>
      <NotificationsPageContent />
    </NotificationsErrorBoundary>
  )
}
