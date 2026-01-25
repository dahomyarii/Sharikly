'use client'
import useSWR from 'swr'
import axios from 'axios'
import ListingCard from '@/components/ListingCard'
import SkeletonLoader from '@/components/SkeletonLoader'

const API = process.env.NEXT_PUBLIC_API_BASE
const fetcher = (url: string) => axios.get(url).then(res => res.data)

export default function ListingsPage() {
  const { data: listings, error, isLoading } = useSWR(`${API}/listings/`, fetcher)

  if (error) return <div className="mx-auto max-w-6xl p-4 md:p-8"><div className="text-red-600 text-center py-12">Failed to load listings</div></div>

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Listings</h1>
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        {isLoading ? (
          // Show skeleton loaders while loading
          [...Array(8)].map((_, i) => (
            <SkeletonLoader key={i} />
          ))
        ) : listings?.length > 0 ? (
          // Show actual listings
          listings.map((listing: any) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        ) : (
          // Show message when no listings
          <div className="col-span-full text-center py-12 text-gray-500">No listings found</div>
        )}
      </div>
    </div>
  )
}
