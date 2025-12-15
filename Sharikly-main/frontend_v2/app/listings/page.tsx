'use client'
import useSWR from 'swr'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_BASE
const fetcher = (url: string) => axios.get(url).then(res => res.data)

export default function ListingsPage() {
  const { data: listings, error } = useSWR(`${API}/listings/`, fetcher)

  if (error) return <div>Failed to load listings</div>
  if (!listings) return <div>Loading...</div>

  return (
    <div className="listings-container mx-auto max-w-5xl p-4 grid md:grid-cols-2 gap-6">
      {listings.map((listing: any) => (
        <div key={listing.id} className="listing-card border rounded-xl p-4 shadow">
          <h2 className="text-xl font-bold">{listing.title}</h2>
          <p className="text-gray-700">{listing.description}</p>
          <p className="font-semibold">${listing.price_per_day} / day</p>
          {listing.images.length > 0 
            ? <img src={`http://127.0.0.1:8000${listing.images[0].image}`} alt={listing.title} className="mt-2 rounded-lg" /> 
            : <img src="/hero.jpg" alt="Placeholder" className="mt-2 rounded-lg" />
          }
        </div>
      ))}
    </div>
  )
}
