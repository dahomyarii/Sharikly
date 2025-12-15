'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'

interface ListingCardProps {
  listing: any
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      if (storedUser) setUser(JSON.parse(storedUser))
    }
  }, [])

  return (
    <div className="border rounded-2xl overflow-hidden hover:shadow-md transition">
      <Link href={`/listings/${listing.id}`}>
        <div className="relative h-48">
          {listing.images && listing.images[0] ? (
            <img
              src={`http://127.0.0.1:8000${listing.images[0].image}`}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{listing.title}</h3>
            <span className="text-sm">${listing.price_per_day}/day</span>
          </div>
          <div className="text-sm text-gray-500">{listing.city || '—'}</div>
        </div>
      </Link>

      {user && (
        <div className="p-4 border-t">
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
