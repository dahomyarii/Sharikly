'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const API = process.env.NEXT_PUBLIC_API_BASE

export default function RequestBookingPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = params.id
  const [user, setUser] = useState<any>(null)
  const [listing, setListing] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load user info
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      if (storedUser) setUser(JSON.parse(storedUser))
    }
  }, [])

  // Fetch listing
  useEffect(() => {
    if (!listingId) return
    axios
      .get(`${API}/listings/${listingId}/`)
      .then(res => setListing(res.data))
      .catch(err => console.error(err))
  }, [listingId])

  if (!listing)
    return <div className="text-center py-10 text-gray-500">Loading listing...</div>

  if (!user)
    return <div className="text-center py-10 text-gray-500">Please log in to request a booking</div>

  const handleSendRequest = async () => {
    if (!message.trim()) {
      setError('Please write a message before sending.')
      return
    }

    const token = localStorage.getItem('access_token')
    if (!token) {
      setError('You are not logged in properly')
      return
    }

    setLoading(true)
    setError('')
    const headers = { Authorization: `Bearer ${token}` }

    try {
      // Find or create chat room
      const chatRoomsRes = await axios.get(`${API}/chat/rooms/`, { headers })
      const existingRoom = chatRoomsRes.data.find((room: any) =>
        room.participants.some((p: any) => p.id === listing.owner.id)
      )

      let roomId
      if (existingRoom) {
        roomId = existingRoom.id
      } else {
        const newRoomRes = await axios.post(
          `${API}/chat/rooms/`,
          { participants: [listing.owner.id] },
          { headers }
        )
        roomId = newRoomRes.data.id
      }

      // Send message
      await axios.post(
        `${API}/chat/messages/`,
        { room: roomId, text: message },
        { headers }
      )

      alert('Booking request sent!')
      router.push('/')
    } catch (err: any) {
      console.error(err.response || err)
      setError('Failed to send request. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Fix image URLs like we did on the main page
  const getFullImageUrl = (imgPath: string) => {
    if (imgPath.startsWith('http')) return imgPath
    return `${API?.replace('/api', '')}${imgPath}`
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card className="p-6 mb-6 border rounded-2xl shadow-md">
        <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
        <p className="text-gray-600 mb-4">{listing.description}</p>

        {/* 🖼 Image Gallery */}
        {listing.images?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {listing.images.map((img: any) => (
              <div key={img.id} className="relative h-56 rounded-lg overflow-hidden">
                <Image
                  src={getFullImageUrl(img.image)}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 mb-6">No images available</div>
        )}

        <div className="text-lg font-semibold mb-2">
          <span className="text-blue-600">${listing.price_per_day}</span> / day
        </div>
        <div className="text-gray-700 mb-6">
          <strong>City:</strong> {listing.city}
        </div>

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-3">
            Request booking from {listing.owner?.username}
          </h2>
          <textarea
            className="w-full border rounded-xl px-4 py-3 mb-3"
            placeholder="Write your message..."
            rows={5}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          {error && <div className="text-red-600 mb-3">{error}</div>}

          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6"
            onClick={handleSendRequest}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Request'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
