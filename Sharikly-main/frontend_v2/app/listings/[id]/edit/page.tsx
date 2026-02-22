'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Loader2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_BASE

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : String(params.id || '')
  const [listing, setListing] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [togglingActive, setTogglingActive] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    Promise.all([
      axiosInstance.get(`${API}/listings/${id}/`, { headers: { Authorization: `Bearer ${token}` } }),
      axiosInstance.get(`${API}/categories/`),
    ])
      .then(([listingRes, catRes]) => {
        const data = listingRes.data
        setListing(data)
        setTitle(data.title || '')
        setPrice(String(data.price_per_day ?? ''))
        setCity(data.city || '')
        setDescription(data.description || '')
        setCategoryId(data.category?.id ? String(data.category.id) : '')
        setIsActive(data.is_active !== false)
        setCategories(Array.isArray(catRes.data) ? catRes.data : [])
      })
      .catch(() => {
        showToast('Could not load listing', 'error')
        router.push('/listings')
      })
      .finally(() => setLoading(false))
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('access_token')
    if (!token || !listing) return
    if (listing.owner?.id !== JSON.parse(localStorage.getItem('user') || '{}')?.id) {
      showToast('You can only edit your own listing', 'error')
      return
    }
    const titleTrimmed = title.trim()
    if (!titleTrimmed) {
      showToast('Title is required.', 'error')
      return
    }
    if (titleTrimmed.length > 200) {
      showToast('Title must be 200 characters or less.', 'error')
      return
    }
    if (!description.trim()) {
      showToast('Description is required.', 'error')
      return
    }
    const priceNum = price.trim() ? parseFloat(price) : 0
    if (price.trim() && (isNaN(priceNum) || priceNum < 0)) {
      showToast('Please enter a valid price (0 or greater).', 'error')
      return
    }
    if (priceNum > 99999.99) {
      showToast('Price must be 99,999.99 or less.', 'error')
      return
    }
    if (city.trim().length > 100) {
      showToast('City must be 100 characters or less.', 'error')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, string | number> = {
        title: titleTrimmed,
        description: description.trim(),
        price_per_day: priceNum,
        city: city.trim().slice(0, 100),
      }
      if (categoryId) payload.category_id = parseInt(categoryId, 10)
      await axiosInstance.patch(`${API}/listings/${id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      showToast('Listing updated', 'success')
      router.push(`/listings/${id}`)
    } catch (err: any) {
      const data = err?.response?.data
      let msg = typeof data?.detail === 'string' ? data.detail : null
      if (!msg && data && typeof data === 'object') {
        const first = Object.values(data).flat().find((v: unknown) => typeof v === 'string')
        msg = (first as string) || 'Failed to update'
      }
      showToast(msg || 'Failed to update', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-xl mx-auto px-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit listing</h1>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per day ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={100}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving} className="flex-1 gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push(`/listings/${id}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Visibility</h2>
          <p className="text-sm text-gray-600 mb-4">
            {isActive
              ? 'This listing is visible in search. You can hide it from search (it will stay visible to you on your profile).'
              : 'This listing is hidden from search. Only you can see it on your profile. Activate to show it again.'}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={togglingActive}
            onClick={async () => {
              const token = localStorage.getItem('access_token')
              if (!token || !listing) return
              setTogglingActive(true)
              try {
                await axiosInstance.patch(
                  `${API}/listings/${id}/`,
                  { is_active: !isActive },
                  { headers: { Authorization: `Bearer ${token}` } }
                )
                setIsActive(!isActive)
                setListing((prev: any) => (prev ? { ...prev, is_active: !isActive } : prev))
                showToast(isActive ? 'Listing hidden from search' : 'Listing is now visible', 'success')
              } catch {
                showToast('Failed to update visibility', 'error')
              } finally {
                setTogglingActive(false)
              }
            }}
          >
            {togglingActive ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isActive ? 'Hide from search' : 'Show in search'}
          </Button>
        </Card>
      </div>
    </div>
  )
}
