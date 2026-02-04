'use client'
import useSWR from 'swr'
import axiosInstance from '@/lib/axios'
import ListingCard from '@/components/ListingCard'
import SkeletonLoader from '@/components/SkeletonLoader'
import { useState } from 'react'
import { Search } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_BASE
const fetcher = (url: string) => axiosInstance.get(url).then(res => res.data)

export default function ListingsPage() {
  const { data: listings, error, isLoading } = useSWR(`${API}/listings/`, fetcher)
  const [query, setQuery] = useState('')

  if (error) return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="text-red-600 text-center py-12">Failed to load listings</div>
    </div>
  )

  const filtered = listings?.filter((l: any) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      (l.title || '').toLowerCase().includes(q) ||
      (l.description || '').toLowerCase().includes(q) ||
      (l.city || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Listings</h1>
        <p className="text-sm text-gray-600">Browse and find services, rentals, and more.</p>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          <input
            aria-label="Search listings"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, description, or location"
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        {isLoading ? (
          [...Array(8)].map((_, i) => (
            <SkeletonLoader key={i} />
          ))
        ) : filtered?.length > 0 ? (
          filtered.map((listing: any) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">No listings found</div>
        )}
      </div>
    </div>
  )
}
