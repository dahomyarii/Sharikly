'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { mutate } from 'swr'
import axiosInstance from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import type { DateRange } from 'react-day-picker'

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
  const [availabilityBlocks, setAvailabilityBlocks] = useState<Array<{ id: number; start_date: string; end_date: string; reason?: string }>>([])
  const [newBlockRange, setNewBlockRange] = useState<DateRange | undefined>(undefined)
  const [newBlockReason, setNewBlockReason] = useState('')
  const [savingBlock, setSavingBlock] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    Promise.all([
      axiosInstance.get(`${API}/listings/${id}/`, { headers: { Authorization: `Bearer ${token}` } }),
      axiosInstance.get(`${API}/categories/`),
      axiosInstance.get(`${API}/listings/${id}/availability-blocks/`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([listingRes, catRes, blocksRes]) => {
        const data = listingRes.data
        setListing(data)
        setTitle(data.title || '')
        setPrice(String(data.price_per_day ?? ''))
        setCity(data.city || '')
        setDescription(data.description || '')
        setCategoryId(data.category?.id ? String(data.category.id) : '')
        setIsActive(data.is_active !== false)
        setCategories(Array.isArray(catRes.data) ? catRes.data : [])
        setAvailabilityBlocks(Array.isArray(blocksRes.data) ? blocksRes.data : [])
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
    if (!categoryId || !String(categoryId).trim()) {
      showToast('Please select a category.', 'error')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, string | number> = {
        title: titleTrimmed,
        description: description.trim(),
        price_per_day: priceNum,
        city: city.trim().slice(0, 100),
        category_id: parseInt(categoryId, 10),
      }
      await axiosInstance.patch(`${API}/listings/${id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      showToast('Listing updated', 'success')
      if (API) {
        mutate(`${API}/listings/`)
        mutate((k) => typeof k === 'string' && k.includes('/listings/'), undefined, { revalidate: true })
      }
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

  const handleCreateBlock = async () => {
    if (!newBlockRange?.from || !newBlockRange?.to) return
    const token = localStorage.getItem('access_token')
    if (!token || !listing) return
    if (listing.owner?.id !== JSON.parse(localStorage.getItem('user') || '{}')?.id) {
      showToast('You can only edit your own listing', 'error')
      return
    }
    setSavingBlock(true)
    try {
      const payload = {
        start_date: newBlockRange.from.toISOString().slice(0, 10),
        end_date: newBlockRange.to.toISOString().slice(0, 10),
        reason: newBlockReason.trim() || undefined,
      }
      const res = await axiosInstance.post(`${API}/listings/${id}/availability-blocks/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAvailabilityBlocks((prev) => [...prev, res.data])
      setNewBlockRange(undefined)
      setNewBlockReason('')
      showToast('Availability block added', 'success')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Could not add availability block'
      showToast(msg, 'error')
    } finally {
      setSavingBlock(false)
    }
  }

  const handleDeleteBlock = async (blockId: number) => {
    const token = localStorage.getItem('access_token')
    if (!token || !listing) return
    if (!confirm('Remove this availability block?')) return
    try {
      await axiosInstance.delete(
        `${API}/listings/${id}/availability-blocks/`,
        {
          data: { id: blockId },
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setAvailabilityBlocks((prev) => prev.filter((b) => b.id !== blockId))
      showToast('Availability block removed', 'success')
    } catch {
      showToast('Could not remove availability block', 'error')
    }
  }

  if (loading || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-8">
      {/* Sticky mobile header */}
      <div className="sticky top-0 z-30 bg-background/95 border-b border-border backdrop-blur-sm px-4 py-3 md:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <span className="text-sm font-semibold">Edit listing</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 md:pt-10">
        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back to listing</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Edit listing</h1>
        </div>

        <div className="grid gap-6 lg:gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
          {/* Main form */}
          <Card className="p-4 sm:p-6 md:p-7 bg-card rounded-2xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4 sm:mb-5">Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  required
                  placeholder="What are you renting?"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Price per day ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    placeholder="25.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    maxLength={100}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    placeholder="Riyadh, Dubai…"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background text-foreground"
                  placeholder="Describe the condition, what’s included, and any pickup/return rules."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 gap-2 justify-center"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/listings/${id}`)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>

          {/* Side column: visibility + availability */}
          <div className="space-y-6 md:space-y-7">
            <Card className="p-4 sm:p-5 bg-card rounded-2xl shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-1.5">
                Visibility
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {isActive
                  ? 'This listing appears in search. You can hide it any time and it will stay visible only on your profile.'
                  : 'This listing is hidden from search. Only you can see it on your profile until you reactivate it.'}
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
                className="w-full sm:w-auto"
              >
                {togglingActive ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                {isActive ? 'Hide from search' : 'Show in search'}
              </Button>
            </Card>

            <Card className="p-4 sm:p-5 bg-card rounded-2xl shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-1.5">
                Availability calendar
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Block out dates when this item isn&apos;t available (you&apos;re using it yourself, travelling, or under maintenance).
              </p>
              <div className="grid gap-4 lg:gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div>
                  <DayPicker
                    mode="range"
                    selected={newBlockRange}
                    onSelect={setNewBlockRange}
                    numberOfMonths={1}
                    disabled={{ before: new Date() }}
                    className="border border-border rounded-xl p-2 bg-background shadow-[0_4px_12px_rgba(0,0,0,0.15)] w-full sm:w-[350px]"
                  />
                  <div className="mt-3 space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">
                      Reason (optional)
                    </label>
                    <input
                      type="text"
                      value={newBlockReason}
                      onChange={(e) => setNewBlockReason(e.target.value)}
                      maxLength={200}
                      placeholder="e.g. On holiday, personal use, in repair"
                      className="w-full sm:w-[280px] border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    />
                  </div>
                  <Button
                    type="button"
                    className="mt-3 w-full sm:w-auto"
                    disabled={savingBlock || !newBlockRange?.from || !newBlockRange?.to}
                    onClick={handleCreateBlock}
                  >
                    {savingBlock ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save blocked dates
                  </Button>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Existing blocked dates</h3>
                  {availabilityBlocks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No blocked dates yet. Use the calendar to add a block.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-64 overflow-auto pr-1">
                      {availabilityBlocks.map((b) => (
                        <li
                          key={b.id}
                          className="flex items-center justify-between gap-2 border border-border rounded-lg px-3 py-2 text-sm bg-background/80"
                        >
                          <div>
                            <div className="font-medium">
                              {b.start_date} &rarr; {b.end_date}
                            </div>
                            {b.reason ? (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {b.reason}
                              </div>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBlock(b.id)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
