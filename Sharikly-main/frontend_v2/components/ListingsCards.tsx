'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { User } from 'lucide-react'

interface ListingCardProps {
  listing: any
}

const API = process.env.NEXT_PUBLIC_API_BASE

export default function ListingCard({ listing }: ListingCardProps) {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      if (storedUser) setUser(JSON.parse(storedUser))
    }
  }, [])

  const imageHeight = "h-40 sm:h-40 md:h-48"

  return (
    <div className="rounded-[28px_14px_28px_14px] overflow-hidden mobile-card border-none shadow-none">
      <Link href={`/listings/${listing.id}`}>
        <div className={`relative ${imageHeight} bg-muted rounded-[22px_10px_22px_10px] overflow-hidden`}>
          {listing.images && listing.images[0] ? (
            <img
              src={listing.images[0].image.startsWith('http') ? listing.images[0].image : `${API || ''}${listing.images[0].image}`}
              alt={listing.title}
              className="w-full h-full object-cover listing-img-mobile listing-card-img-mobile"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>
        <div className="p-4 bg-card">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{listing.title}</h3>
            <span className="text-sm">${listing.price_per_day}/day</span>
          </div>
          <div className="text-sm text-gray-500 mb-3">{listing.city || '—'}</div>
          
          {/* Lender/Owner Info */}
          {listing.owner && (
            <div className="flex items-center gap-2 mb-3 pb-3">
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
        </div>
      </Link>

      {user && (
        <div className="p-4 bg-card">
          <Link
            href={`/listings/${listing.id}/request_booking`}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-full text-sm"
          >
            Chat to Request Booking
          </Link>
        </div>
      )}
    </div>
  )
}
