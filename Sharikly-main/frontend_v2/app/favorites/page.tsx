'use client'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import axios from 'axios'
import ListingCard from '@/components/ListingCard'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_BASE
const fetcher = (url: string, token: string) =>
  axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.data)

export default function FavoritesPage() {
  const router = useRouter()
  const [token, setToken] = useState<string>('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token')
    if (!storedToken) {
      router.push('/auth/login')
    } else {
      setToken(storedToken)
      setIsAuthenticated(true)
    }
  }, [router])

  const { data: favorites, error, isLoading } = useSWR(
    isAuthenticated && token ? [`${API}/favorites/`, token] : null,
    ([url, tok]) => fetcher(url, tok)
  )

  if (!isAuthenticated) {
    return <div className="p-4">Redirecting to login...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">Failed to load favorites</div>
  }

  if (isLoading) {
    return <div className="p-4">Loading your favorites...</div>
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="mx-auto max-w-5xl p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">My Favorites</h1>
        <p className="text-gray-500">You haven't added any listings to your favorites yet.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="text-3xl font-bold mb-8">My Favorites</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((favorite: any) => (
          <ListingCard key={favorite.id} listing={favorite.listing} />
        ))}
      </div>
    </div>
  )
}
