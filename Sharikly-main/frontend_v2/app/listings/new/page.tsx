'use client'
import React, { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_BASE

export default function NewListing() {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [msg, setMsg] = useState('')
  const router = useRouter()

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

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('price_per_day', price)
      formData.append('city', city)
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
        <textarea
          className="w-full border rounded-xl px-4 py-3 h-40"
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} />
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
