'use client'
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import LocationPicker from '@/components/LocationPicker'

const API = process.env.NEXT_PUBLIC_API_BASE

interface Category {
  id: number
  name: string
  description: string
  icon: string | null
}

export default function NewListing() {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [categoryId, setCategoryId] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [msg, setMsg] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [radius, setRadius] = useState(300)
  const router = useRouter()

  // Fetch categories on component mount
  useEffect(() => {
    axios
      .get(`${API}/categories/`)
      .then(res => setCategories(res.data))
      .catch(err => console.error('Failed to fetch categories:', err))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
const token =
  typeof window !== 'undefined'
    ? localStorage.getItem('access') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token')
    : null
    if (!token) {
      setMsg('You are not logged in properly')
      return
    }

    if (!image) {
      setMsg('Image is required')
      return
    }

    if (latitude === null || longitude === null) {
      setMsg('Location is required. Please select a location on the map.')
      return
    }

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('price_per_day', price)
      formData.append('city', city)
      formData.append('latitude', String(latitude))
      formData.append('longitude', String(longitude))
      formData.append('pickup_radius_m', String(radius))
      if (categoryId) {
        formData.append('category_id', categoryId)
      }
      formData.append('images', image)
      
      await axios.post(`${API}/listings/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      setMsg('Listing created! Redirecting...')
      setTimeout(() => router.push('/'), 1000)
    } catch (err: any) {
      console.error(err)
      // Show either detailed backend error or generic message
      if (err?.response?.data) {
        const errors = Object.entries(err.response.data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(' | ')
        setMsg(errors)
      } else {
        setMsg('Failed to create listing')
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">List an Item</h1>
      <form className="space-y-4" onSubmit={handleSave}>
        <input
          className="w-full border rounded-xl px-4 py-3"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Price per day"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />
          <input
            className="w-full border rounded-xl px-4 py-3"
            placeholder="City"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
        </div>
        <select
          className="w-full border rounded-xl px-4 py-3"
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
        >
          <option value="">Select a Category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <textarea
          className="w-full border rounded-xl px-4 py-3 h-40"
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} />
        
        <LocationPicker
          onLocationChange={(lat, lng, rad) => {
            setLatitude(lat)
            setLongitude(lng)
            setRadius(rad)
          }}
        />
        
        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="px-5 py-3 bg-black text-white rounded-full"
          >
            Save
          </button>
          <div className="text-sm text-red-600">{msg}</div>
        </div>
      </form>
    </div>
  )
}
