'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Edit2, Save, X, Camera, Mail, User, FileText, Package, Star } from 'lucide-react'
import ListingCard from '@/components/ListingCard'
import SkeletonLoader from '@/components/SkeletonLoader'
import { useToast } from '@/components/ui/toast'

const API = process.env.NEXT_PUBLIC_API_BASE

export default function ProfilePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [listings, setListings] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoadingListings, setIsLoadingListings] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatar: null as File | null,
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchUserProfile()
    fetchUserListings()
    fetchUserReviews()
  }, [router])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await axiosInstance.get(`${API}/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const userData = response.data
      setUser(userData)
      setFormData({
        username: userData.username || '',
        bio: userData.bio || '',
        avatar: null,
      })
      if (userData.avatar) {
        setAvatarPreview(userData.avatar)
      }
      setIsLoading(false)
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      if (error.response?.status === 401) {
        router.push('/auth/login')
      }
      setIsLoading(false)
    }
  }

  const fetchUserListings = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await axiosInstance.get(`${API}/listings/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      // Filter listings by current user
      const allListings = response.data
      const token2 = localStorage.getItem('access_token')
      const userResponse = await axiosInstance.get(`${API}/auth/me/`, {
        headers: { Authorization: `Bearer ${token2}` },
      })
      const currentUserId = userResponse.data.id
      const userListings = allListings.filter((listing: any) => listing.owner?.id === currentUserId)
      setListings(userListings)
      setIsLoadingListings(false)
    } catch (error) {
      console.error('Error fetching listings:', error)
      setIsLoadingListings(false)
    }
  }

  const fetchUserReviews = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setReviews([])
        return
      }
      
      // Get current user
      const userResponse = await axiosInstance.get(`${API}/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const currentUserId = userResponse.data.id
      
      // Fetch all listings (without reviews to avoid large payload)
      let allListings: any[] = []
      try {
        const listingsResponse = await axiosInstance.get(`${API}/listings/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        // Handle paginated response (results field) or direct array
        allListings = listingsResponse.data?.results || listingsResponse.data || []
      } catch (listingsError: any) {
        console.error('Error fetching listings:', listingsError)
        setReviews([])
        return
      }
      
      // Filter to only get listings owned by the current user
      const userListings = allListings.filter((listing: any) => listing.owner?.id === currentUserId)
      
      if (userListings.length === 0) {
        setReviews([])
        return
      }
      
      // Collect all reviews from user's listings
      const allReviews: any[] = []
      
      // Fetch reviews for each listing individually to avoid loading all reviews at once
      for (const listing of userListings) {
        try {
          // Fetch reviews for this specific listing
          const reviewsResponse = await axiosInstance.get(`${API}/reviews/?listing=${listing.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          
          const reviews = reviewsResponse.data?.results || reviewsResponse.data || []
          
          // Add listing info to each review
          if (Array.isArray(reviews)) {
            reviews.forEach((review: any) => {
              allReviews.push({
                ...review,
                listing: {
                  id: listing.id,
                  title: listing.title || 'Untitled Listing',
                  owner: listing.owner
                }
              })
            })
          }
        } catch (reviewError: any) {
          // Skip listings that cause errors (e.g., if reviews endpoint fails)
          console.error(`Error fetching reviews for listing ${listing.id}:`, reviewError?.response?.status, reviewError?.message)
          continue
        }
      }
      
      setReviews(allReviews)
    } catch (error: any) {
      console.error('Error in fetchUserReviews:', error?.response?.status, error?.message)
      // Set empty array on error to prevent UI issues
      setReviews([])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, avatar: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('access_token')
      const formDataToSend = new FormData()
      formDataToSend.append('username', formData.username)
      if (formData.bio) {
        formDataToSend.append('bio', formData.bio)
      }
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar)
      }

      const response = await axiosInstance.patch(`${API}/auth/me/`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      setUser(response.data)
      localStorage.setItem('user', JSON.stringify(response.data))
      window.dispatchEvent(new CustomEvent('userLogin', { detail: { user: response.data, token } }))
      
      setIsEditing(false)
      setFormData((prev) => ({ ...prev, avatar: null }))
      showToast('Profile updated successfully!', 'success')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      showToast(error?.response?.data?.detail || 'Failed to update profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      username: user?.username || '',
      bio: user?.bio || '',
      avatar: null,
    })
    setAvatarPreview(user?.avatar || null)
  }

  const getFullImageUrl = (imgPath: string) => {
    if (!imgPath) return '/logo.png'
    if (imgPath.startsWith('http')) return imgPath
    return `${API?.replace('/api', '')}${imgPath}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <SkeletonLoader />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view your profile</p>
          <Button onClick={() => router.push('/auth/login')}>Log In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar Section */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={getFullImageUrl(avatarPreview)}
                      alt={user.username || user.email}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full cursor-pointer hover:bg-gray-800 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <Input
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {user.username || user.email}
                    </h1>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  {user.bio && (
                    <div className="mt-4">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-400 mt-1" />
                        <p className="text-gray-700 whitespace-pre-wrap">{user.bio}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{listings.length}</div>
            <div className="text-sm text-gray-600">Listings</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{reviews.length}</div>
            <div className="text-sm text-gray-600">Reviews</div>
          </Card>
          <Card className="p-4 text-center col-span-2 md:col-span-1">
            <div className="text-2xl font-bold text-gray-900">
              {reviews.length > 0
                ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
                : '0'}
            </div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </Card>
        </div>

        {/* My Listings */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-6 h-6" />
            My Listings
          </h2>
          {isLoadingListings ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <SkeletonLoader key={i} />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {listings.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>You haven't created any listings yet.</p>
              <Button
                onClick={() => router.push('/listings/new')}
                className="mt-4"
              >
                Create Your First Listing
              </Button>
            </Card>
          )}
        </div>

        {/* My Reviews */}
        {reviews.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-6 h-6" />
              My Reviews
            </h2>
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <Card key={review.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < (review.rating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          on{' '}
                          <a
                            href={`/listings/${review.listing?.id}`}
                            className="text-black hover:underline font-medium"
                          >
                            {review.listing?.title}
                          </a>
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

