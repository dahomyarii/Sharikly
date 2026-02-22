'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import LocationPicker from '@/components/LocationPicker'
import { useToast } from '@/components/ui/toast'
import { ImagePlus, X, GripVertical, Loader2, ChevronLeft } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_BASE

interface Category {
  id: number
  name: string
  description: string
  icon: string | null
}

interface ImageFile {
  id: string
  file: File
  preview: string
}

export default function NewListing() {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<ImageFile[]>([])
  const [categoryId, setCategoryId] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [radius, setRadius] = useState(300)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { showToast } = useToast()

  const MAX_IMAGES = 8
  const COOLDOWN_DURATION = 30

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.preview))
    }
  }, [])

  // Check cooldown on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkCooldown = () => {
      const lastListingTime = localStorage.getItem('lastListingTime')
      if (!lastListingTime) {
        setCooldownSeconds(0)
        return
      }
      const timeSinceLastListing = Date.now() - parseInt(lastListingTime)
      const remainingSeconds = Math.ceil((COOLDOWN_DURATION * 1000 - timeSinceLastListing) / 1000)
      if (remainingSeconds > 0) {
        setCooldownSeconds(remainingSeconds)
      } else {
        setCooldownSeconds(0)
        localStorage.removeItem('lastListingTime')
      }
    }

    checkCooldown()
    const interval = setInterval(checkCooldown, 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch categories
  useEffect(() => {
    axios
      .get(`${API}/categories/`)
      .then(res => setCategories(res.data))
      .catch(err => console.error('Failed to fetch categories:', err))
  }, [])

  const addImages = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'))

    if (imageFiles.length === 0) return

    setImages(prev => {
      const remaining = MAX_IMAGES - prev.length
      if (remaining <= 0) {
        showToast(`Maximum ${MAX_IMAGES} images allowed`, 'warning')
        return prev
      }
      const toAdd = imageFiles.slice(0, remaining)
      if (imageFiles.length > remaining) {
        showToast(`Only ${remaining} more image${remaining !== 1 ? 's' : ''} can be added`, 'warning')
      }
      const newImages: ImageFile[] = toAdd.map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
      }))
      return [...prev, ...newImages]
    })
  }, [showToast])

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id)
      if (img) URL.revokeObjectURL(img.preview)
      return prev.filter(i => i.id !== id)
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      addImages(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (cooldownSeconds > 0) {
      showToast(`Please wait ${cooldownSeconds} seconds before creating another listing`, 'warning')
      return
    }
    if (isSubmitting) return

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access') ||
          localStorage.getItem('access_token') ||
          localStorage.getItem('token')
        : null
    if (!token) {
      showToast('You are not logged in', 'error')
      return
    }
    const titleTrimmed = title.trim()
    if (!titleTrimmed) {
      showToast('Title is required', 'warning')
      return
    }
    if (titleTrimmed.length > 200) {
      showToast('Title must be 200 characters or less', 'warning')
      return
    }
    if (!description.trim()) {
      showToast('Description is required', 'warning')
      return
    }
    if (!price.trim()) {
      showToast('Price is required', 'warning')
      return
    }
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) {
      showToast('Please enter a valid price (0 or greater)', 'warning')
      return
    }
    if (priceNum > 99999.99) {
      showToast('Price must be 99,999.99 or less', 'warning')
      return
    }
    if (city.trim().length > 100) {
      showToast('City must be 100 characters or less', 'warning')
      return
    }
    if (images.length === 0) {
      showToast('At least one image is required', 'warning')
      return
    }
    if (!categoryId || !String(categoryId).trim()) {
      showToast('Please select a category', 'warning')
      return
    }
    if (latitude === null || longitude === null) {
      showToast('Please select a location on the map', 'warning')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('title', titleTrimmed)
      formData.append('description', description.trim())
      formData.append('price_per_day', String(priceNum))
      formData.append('city', city.trim().slice(0, 100))
      formData.append('latitude', String(latitude))
      formData.append('longitude', String(longitude))
      formData.append('pickup_radius_m', String(radius))
      formData.append('category_id', String(categoryId).trim())
      images.forEach(img => {
        formData.append('images', img.file)
      })

      await axios.post(`${API}/listings/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      if (typeof window !== 'undefined') {
        localStorage.setItem('lastListingTime', Date.now().toString())
        setCooldownSeconds(COOLDOWN_DURATION)
      }

      showToast('Listing created successfully!', 'success')
      if (API) {
        mutate(`${API}/listings/`)
        mutate((k) => typeof k === 'string' && k.includes('/listings/'), undefined, { revalidate: true })
      }
      setTimeout(() => router.push('/'), 1000)
    } catch (err: any) {
      console.error(err)
      let errorMsg = 'Failed to create listing'
      if (err?.response?.data) {
        const errors = Object.entries(err.response.data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(' | ')
        errorMsg = errors
      }
      showToast(errorMsg, 'error')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-neutral-100">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-neutral-500 hover:text-black transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-sm font-semibold tracking-tight">New Listing</h1>
          <div className="w-14" />
        </div>
      </div>

      <form onSubmit={handleSave} className="mx-auto max-w-2xl px-4 py-8 space-y-8">

        {/* ── Images ── */}
        <section>
          <label className="block text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3">
            Photos <span className="text-neutral-300">({images.length}/{MAX_IMAGES})</span>
          </label>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              grid gap-3
              ${images.length === 0 ? '' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'}
            `}
          >
            {/* Existing image previews */}
            {images.map((img, index) => (
              <div
                key={img.id}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-neutral-50 border border-neutral-100"
              >
                <img
                  src={img.preview}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Cover badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium uppercase tracking-wider rounded-full">
                    Cover
                  </div>
                )}
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add button / drop zone */}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`
                  ${images.length === 0
                    ? 'w-full aspect-[16/7] rounded-2xl'
                    : 'aspect-square rounded-2xl'
                  }
                  border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer
                  ${dragOver
                    ? 'border-black bg-neutral-50 scale-[0.98]'
                    : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                  }
                `}
              >
                <div className={`
                  rounded-full bg-neutral-100 flex items-center justify-center
                  ${images.length === 0 ? 'w-14 h-14' : 'w-10 h-10'}
                `}>
                  <ImagePlus className={`text-neutral-400 ${images.length === 0 ? 'w-6 h-6' : 'w-5 h-5'}`} />
                </div>
                {images.length === 0 ? (
                  <>
                    <span className="text-sm font-medium text-neutral-600">Add photos</span>
                    <span className="text-xs text-neutral-400">Drag & drop or click to browse</span>
                  </>
                ) : (
                  <span className="text-[11px] text-neutral-400">Add more</span>
                )}
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => {
              if (e.target.files) addImages(e.target.files)
              e.target.value = ''
            }}
          />
        </section>

        {/* ── Title ── */}
        <section>
          <label className="block text-xs font-medium uppercase tracking-widest text-neutral-400 mb-2">
            Title
          </label>
          <input
            className="w-full bg-transparent border-b-2 border-neutral-200 focus:border-black outline-none text-lg font-medium py-2 transition-colors placeholder:text-neutral-300"
            placeholder="What are you listing?"
            value={title}
            maxLength={200}
            onChange={e => setTitle(e.target.value)}
          />
        </section>

        {/* ── Price & City ── */}
        <section className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-neutral-400 mb-2">
              Price / day
            </label>
            <div className="relative">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-lg text-neutral-300 font-medium">$</span>
              <input
                className="w-full bg-transparent border-b-2 border-neutral-200 focus:border-black outline-none text-lg font-medium py-2 pl-5 transition-colors placeholder:text-neutral-300"
                placeholder="0.00"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-neutral-400 mb-2">
              City
            </label>
            <input
              className="w-full bg-transparent border-b-2 border-neutral-200 focus:border-black outline-none text-lg font-medium py-2 transition-colors placeholder:text-neutral-300"
              placeholder="e.g. Riyadh"
              value={city}
              maxLength={100}
              onChange={e => setCity(e.target.value)}
            />
          </div>
        </section>

        {/* ── Category ── */}
        <section>
          <label className="block text-xs font-medium uppercase tracking-widest text-neutral-400 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            required
            className="w-full bg-transparent border-b-2 border-neutral-200 focus:border-black outline-none text-lg py-2 transition-colors text-neutral-800 appearance-none cursor-pointer"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
          >
            <option value="">Select a category (required)</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </section>

        {/* ── Description ── */}
        <section>
          <label className="block text-xs font-medium uppercase tracking-widest text-neutral-400 mb-2">
            Description
          </label>
          <textarea
            className="w-full bg-transparent border-2 border-neutral-200 focus:border-black outline-none text-base py-3 px-4 rounded-xl transition-colors placeholder:text-neutral-300 resize-none"
            placeholder="Tell people about your item — condition, features, rules..."
            rows={5}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </section>

        {/* ── Location ── */}
        <section>
          <label className="block text-xs font-medium uppercase tracking-widest text-neutral-400 mb-3">
            Pickup Location
          </label>
          <div className="rounded-2xl overflow-hidden border border-neutral-200">
            <LocationPicker
              onLocationChange={(lat, lng, rad) => {
                setLatitude(lat)
                setLongitude(lng)
                setRadius(rad)
              }}
            />
          </div>
        </section>

        {/* ── Submit ── */}
        <section className="pt-2 pb-8">
          <button
            type="submit"
            disabled={isSubmitting || cooldownSeconds > 0}
            className="w-full h-12 bg-black text-white text-sm font-semibold uppercase tracking-wider rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : cooldownSeconds > 0 ? (
              `Wait ${cooldownSeconds}s`
            ) : (
              'Publish Listing'
            )}
          </button>
          {cooldownSeconds > 0 && (
            <p className="text-center text-xs text-neutral-400 mt-3">
              Please wait {cooldownSeconds} second{cooldownSeconds !== 1 ? 's' : ''} before creating another listing
            </p>
          )}
        </section>
      </form>
    </div>
  )
}
