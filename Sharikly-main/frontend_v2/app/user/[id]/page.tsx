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

  const { data: allListings } = useSWR(
    id ? `${API}/listings/` : null,
    fetcher
  )

  const userListings = allListings
    ? (Array.isArray(allListings) ? allListings : allListings.results || []).filter(
        (l: any) => l.owner?.id === Number(id)
      )
    : []

  const getImageUrl = (imgPath: string | null) => {
    if (!imgPath) return DEFAULT_AVATAR
    if (imgPath.startsWith('http')) return imgPath
    return `${API?.replace('/api', '')}${imgPath}`
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">User not found</p>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <SkeletonLoader />
        </div>
      </div>
    )
  }

  const joinedDate = profile.date_joined
    ? new Date(profile.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 ring-4 ring-gray-100">
              {profile.avatar ? (
                <img
                  src={getImageUrl(profile.avatar)}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-2xl font-bold text-gray-900">{profile.username}</h2>
                {profile.is_email_verified && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-gray-500 mb-3">
                {joinedDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {joinedDate}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                  {profile.average_rating > 0 ? `${profile.average_rating} avg rating` : 'No ratings yet'}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  {profile.listings_count} listing{profile.listings_count !== 1 ? 's' : ''}
                </span>
              </div>

              {profile.bio && (
                <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
              )}

              {user && user.id !== profile.id && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReportModal(true)}
                    className="text-gray-600 border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
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
                      className="text-gray-600 border-gray-300"
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
                      className="text-gray-600 border-gray-300 hover:bg-gray-100"
                    >
                      {blockLoading ? '...' : t('block_user')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {showReportModal && (
          <ReportModal
            target="user"
            targetId={Number(id)}
            onClose={() => setShowReportModal(false)}
          />
        )}

        {/* Listings */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
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
            <Card className="p-8 text-center text-gray-500">
              <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No listings yet</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
