'use client'

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import axiosInstance from '@/lib/axios'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ListingCard from '@/components/ListingCard'
import SkeletonLoader from '@/components/SkeletonLoader'
import ReportModal from '@/components/ReportModal'
import { ArrowLeft, Star, Check, Package, User, Calendar, MessageCircle, Flag } from 'lucide-react'
import { useLocale } from '@/components/LocaleProvider'

const API = process.env.NEXT_PUBLIC_API_BASE
const DEFAULT_AVATAR = '/logo.png'

const fetcher = (url: string) => {
  const headers: any = {}
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  return axiosInstance.get(url, { headers }).then((res) => res.data)
}

export default function PublicProfilePage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : String(params.id || '')
  const router = useRouter()
  const { t } = useLocale()
  const [user, setUser] = useState<any>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [blockedIds, setBlockedIds] = useState<number[]>([])
  const [blockLoading, setBlockLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user')
      if (stored) setUser(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token || !user) return
    axiosInstance
      .get(`${API}/users/blocked/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setBlockedIds((res.data || []).map((u: any) => u.id)))
      .catch(() => {})
  }, [user])

  const { data: profile, error: profileError } = useSWR(
    id ? `${API}/users/${id}/` : null,
    fetcher
  )

  const { data: listingsResp } = useSWR(
    id ? `${API}/listings/?owner=${encodeURIComponent(id)}&page_size=48` : null,
    fetcher
  )

  const userListings = listingsResp
    ? (Array.isArray(listingsResp) ? listingsResp : listingsResp.results || [])
    : []

  const getImageUrl = (imgPath: string | null) => {
    if (!imgPath) return DEFAULT_AVATAR
    if (imgPath.startsWith('http')) return imgPath
    return `${API?.replace('/api', '')}${imgPath}`
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">User not found</p>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <SkeletonLoader />
        </div>
      </div>
    )
  }

  const joinedDate = profile.date_joined
    ? new Date(profile.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  const startChatWithUser = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access') ||
          localStorage.getItem('access_token') ||
          localStorage.getItem('token')
        : null
    if (!token) {
      router.push('/chat')
      return
    }
    try {
      const res = await axiosInstance.post(
        `${API}/chat/rooms/get-or-create/`,
        { participant_id: Number(id) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const roomId = res.data?.id
      if (roomId) {
        router.push(`/chat/${roomId}`)
        return
      }
    } catch (_) {}
    router.push('/chat')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-accent rounded-full transition-colors touch-target"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">{profile.username}</h1>
            <p className="text-xs text-muted-foreground truncate">Public profile</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Profile header */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-violet-600/15 via-fuchsia-500/10 to-cyan-400/10">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="absolute -bottom-28 -left-28 w-80 h-80 rounded-full bg-cyan-400/10 blur-3xl" />
          </div>

          <div className="relative p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-end">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-4 ring-background shadow-sm">
                {profile.avatar ? (
                  <img
                    src={getImageUrl(profile.avatar)}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 w-full text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
                    {profile.username}
                  </h2>
                  {profile.is_email_verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      <Check className="w-3.5 h-3.5" />
                      Identified
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                  {joinedDate && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 border border-border">
                      <Calendar className="w-3.5 h-3.5" />
                      Joined {joinedDate}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 border border-border">
                    <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                    {profile.average_rating > 0 ? `${profile.average_rating} avg rating` : 'No ratings yet'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 border border-border">
                    <Package className="w-3.5 h-3.5" />
                    {profile.listings_count} listing{profile.listings_count !== 1 ? 's' : ''}
                  </span>
                </div>

                {profile.bio && (
                  <p className="mt-3 text-sm sm:text-base text-foreground/80 leading-relaxed max-w-2xl mx-auto sm:mx-0">
                    {profile.bio}
                  </p>
                )}

                {user && user.id !== profile.id && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <Button
                      size="sm"
                      onClick={startChatWithUser}
                      className="rounded-full px-4"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReportModal(true)}
                      className="rounded-full"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      {t('report_user')}
                    </Button>
                    {blockedIds.includes(profile.id) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={blockLoading}
                        onClick={async () => {
                          setBlockLoading(true)
                          try {
                            const token = localStorage.getItem('access_token')
                            await axiosInstance.delete(`${API}/users/${id}/unblock/`, {
                              headers: { Authorization: `Bearer ${token}` },
                            })
                            setBlockedIds((prev) => prev.filter((x) => x !== Number(id)))
                          } finally {
                            setBlockLoading(false)
                          }
                        }}
                        className="rounded-full"
                      >
                        {blockLoading ? '...' : t('unblock_user')}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={blockLoading}
                        onClick={async () => {
                          if (!confirm(t('block_user_confirm'))) return
                          setBlockLoading(true)
                          try {
                            const token = localStorage.getItem('access_token')
                            await axiosInstance.post(
                              `${API}/users/${id}/block/`,
                              {},
                              { headers: { Authorization: `Bearer ${token}` } }
                            )
                            setBlockedIds((prev) => [...prev, Number(id)])
                          } finally {
                            setBlockLoading(false)
                          }
                        }}
                        className="rounded-full"
                      >
                        {blockLoading ? '...' : t('block_user')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showReportModal && (
          <ReportModal
            target="user"
            targetId={Number(id)}
            onClose={() => setShowReportModal(false)}
          />
        )}

        {/* Listings */}
        <div className="mt-8">
          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Listings by {profile.username}
          </h3>
          {userListings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {userListings.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-muted-foreground bg-card">
              <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/60" />
              <p>No listings yet</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
