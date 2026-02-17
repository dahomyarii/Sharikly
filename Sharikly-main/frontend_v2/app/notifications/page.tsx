'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axios'
import { useLocale } from '@/components/LocaleProvider'
import { Bell, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API = process.env.NEXT_PUBLIC_API_BASE

export default function NotificationsPage() {
  const { t } = useLocale()
  const router = useRouter()
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = () => {
    const token = localStorage.getItem('access_token')
    if (!token || !API) {
      setLoading(false)
      return
    }
    setLoading(true)
    axiosInstance
      .get(`${API}/notifications/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const data = res.data
        setList(Array.isArray(data) ? data : data?.results || [])
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    fetchNotifications()
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
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
      })
  }

  const markAllRead = () => {
    const token = localStorage.getItem('access_token')
    if (!token || !API) return
    axiosInstance
      .patch(
        `${API}/notifications/mark-read/`,
        { all: true },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setList((prev) => prev.map((n) => ({ ...n, read: true })))
      })
  }

  const unreadCount = list.filter((n) => !n.read).length

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-full hover:bg-gray-200 transition"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-7 h-7" />
              {t('notifications')}
            </h1>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <Check className="w-4 h-4 mr-1" />
              {t('mark_all_read')}
            </Button>
          )}
        </div>

        {list.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('no_notifications')}</p>
            <Link href="/listings" className="inline-block mt-4 text-black font-medium hover:underline">
              Browse listings
            </Link>
          </div>
        ) : (
          <ul className="space-y-1">
            {list.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link || '#'}
                  className={`block bg-white rounded-xl border border-gray-100 p-4 hover:bg-gray-50/50 transition ${
                    !n.read ? 'border-l-4 border-l-black' : ''
                  }`}
                  onClick={() => !n.read && markRead(n.id)}
                >
                  <p className="font-medium text-gray-900">{n.title}</p>
                  {n.body && <p className="text-sm text-gray-500 mt-1">{n.body}</p>}
                  <p className="text-xs text-gray-400 mt-2">
                    {n.created_at
                      ? new Date(n.created_at).toLocaleDateString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
