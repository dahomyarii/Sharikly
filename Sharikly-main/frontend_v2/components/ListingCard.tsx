// frontend/components/ListingCard.tsx
'use client'
import Link from 'next/link'
import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_BASE

export default function ListingCard({ listing }: { listing: any }) {
  const [isFavorited, setIsFavorited] = useState(listing?.is_favorited || false)
  const [token, setToken] = useState<string>('')

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
    return `http://localhost:8000${imageUrl}`
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
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{listing.title}</h3>
          <span className="text-sm">${listing.price_per_day}</span>
        </div>
        <div className="text-sm text-gray-500">{listing.city || '—'}</div>
      </div>
    </Link>
  )
}
