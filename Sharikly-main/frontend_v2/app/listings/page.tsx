'use client'
import useSWR from 'swr'
import axios from 'axios'
import ListingCard from '@/components/ListingCard'

const API = process.env.NEXT_PUBLIC_API_BASE
const fetcher = (url: string) => axios.get(url).then(res => res.data)

export default function ListingsPage() {
  const { data: listings, error } = useSWR(`${API}/listings/`, fetcher)

  if (error) return <div>Failed to load listings</div>
  if (!listings) return <div>Loading...</div>

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Listings</h1>
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        {listings.map((listing: any) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  )
}
