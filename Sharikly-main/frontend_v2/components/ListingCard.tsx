// frontend/components/ListingCard.tsx
'use client'
import Link from 'next/link'
import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Star, User } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_BASE

export default function ListingCard({ listing }: { listing: any }) {
  const [isFavorited, setIsFavorited] = useState(listing?.is_favorited || false)
  const [token, setToken] = useState<string>('')
  const [averageRating, setAverageRating] = useState<number>(0)
  const [reviewCount, setReviewCount] = useState<number>(0)

  // Fetch reviews and calculate average rating
  useEffect(() => {
    const fetchReviews = async () => {
      if (!listing?.id) return
      try {
        const response = await axios.get(`${API}/reviews/?listing=${listing.id}`)
        if (Array.isArray(response.data)) {
          const reviews = response.data
          const count = reviews.length
          const avgRating = count > 0
            ? Math.round((reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / count) * 10) / 10
            : 0
          setReviewCount(count)
          setAverageRating(avgRating)
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
      }
    }

    fetchReviews()
  }, [listing?.id])

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token')
    if (storedToken) {
      setToken(storedToken)
    }
    // Update favorited status when listing prop changes
    setIsFavorited(listing?.is_favorited || false)
  }, [listing?.id, listing?.is_favorited])

  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()

    if (!token) {
      alert('Please login to add favorites')
      return
    }

    setIsFavorited((prevState: boolean) => {
      const newState = !prevState

      if (prevState) {
        // Optimistically remove from favorites
        // Make the API call
        axios.delete(
          `${API}/listings/${listing.id}/unfavorite/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ).catch(error => {
          console.error('Error removing from favorites:', error)
          // Revert on error
          setIsFavorited(true)
          alert('Error updating favorite')
        })
      } else {
        // Optimistically add to favorites
        // Make the API call
        axios.post(
          `${API}/listings/${listing.id}/favorite/`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ).catch(error => {
          console.error('Error adding to favorites:', error)
          // Revert on error
          setIsFavorited(false)
          alert('Error updating favorite')
        })
      }

      return newState
    })
  }, [token, listing.id])

  // Handle both full URLs and relative paths
  const getImageUrl = () => {
    if (!listing?.images?.[0]?.image) return '/hero.jpg'
    const imageUrl = listing.images[0].image
    // Check if it's already a full URL
    if (imageUrl.startsWith('http')) {
      return imageUrl
    }
    // If it's a relative path, prepend the API base
    return `${API?.replace('/api', '')}${imageUrl}`
  }

  const imageUrl = getImageUrl()

  return (
    <Link href={`/listings/${listing.id}`} className="block border rounded-2xl overflow-hidden hover:shadow-md transition">
      <div className="relative h-48 bg-gray-100">
        <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" />
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 p-2 rounded-full ${
            isFavorited
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          } transition`}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg
            className="w-5 h-5"
            fill={isFavorited ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{listing.title}</h3>
          <span className="text-sm">${listing.price_per_day}</span>
        </div>
        {listing.category && (
          <div className="mb-2 inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
            {listing.category.name}
          </div>
        )}
        <div className="text-sm text-gray-500 mb-3">{listing.city || '—'}</div>
        
        {/* Lender/Owner Info */}
        {listing.owner && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {listing.owner.avatar ? (
                <img
                  src={listing.owner.avatar.startsWith('http') ? listing.owner.avatar : `${API?.replace('/api', '')}${listing.owner.avatar}`}
                  alt={listing.owner.username || listing.owner.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500">Lender</div>
              <span className="text-sm font-medium text-gray-700 truncate block">
                {listing.owner.username || listing.owner.email}
              </span>
            </div>
          </div>
        )}
        
        {/* Rating and Reviews */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(averageRating)
                    ? 'fill-orange-500 text-orange-500'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {averageRating > 0 ? `${averageRating}` : 'No ratings'}
          </span>
          <span className="text-xs text-gray-500">
            ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      </div>
    </Link>
  )
}
