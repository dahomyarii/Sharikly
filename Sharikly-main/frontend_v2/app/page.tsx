'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import useSWR, { mutate } from "swr"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Heart, TrendingUp, Sparkles, Briefcase, Music, Camera, Utensils, Mic, Plus, Star, MapPin, Clock } from 'lucide-react'
import Link from "next/link"
import SkeletonLoader from "@/components/SkeletonLoader"
import BannerBadge from "@/components/banner/BannerBadge"
import InfoCard from "@/components/banner/InfoCard"
import TrustIndicators from "@/components/banner/TrustIndicators"
import SearchSection from "@/components/banner/SearchSection"
import CategoriesGrid from "@/components/banner/CategoriesGrid"
import StatsSection from "@/components/banner/StatsSection"
import CTAButtons from "@/components/banner/CTAButtons"

const API = process.env.NEXT_PUBLIC_API_BASE

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const [token, setToken] = useState<string>('')
  const [tokenLoaded, setTokenLoaded] = useState(false)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  // Initialize token from localStorage
  useEffect(() => {
    const loadToken = () => {
      const storedToken = localStorage.getItem('access_token')
      if (storedToken) {
        setToken(storedToken)
      }
      setTokenLoaded(true)
    }
    
    loadToken()

    // Listen for login events to update token and refresh data
    const handleLogin = (event: CustomEvent) => {
      const newToken = event.detail?.token || localStorage.getItem('access_token')
      if (newToken) {
        setToken(newToken)
        // Revalidate SWR data with new token
        if (API) {
          mutate(`${API}/listings/`)
        }
      }
    }

    window.addEventListener('userLogin', handleLogin as EventListener)
    
    return () => {
      window.removeEventListener('userLogin', handleLogin as EventListener)
    }
  }, [])

  // Custom fetcher that includes the auth token
  const fetcher = useCallback((url: string) => {
    if (!url || !API) {
      return Promise.resolve([])
    }
    const headers: any = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return axios.get(url, { headers })
      .then(res => res.data)
      .catch(error => {
        // Silently handle 400/401/403 errors (expected when not authenticated or endpoint issues)
        // Only log unexpected errors
        if (error.response?.status && ![400, 401, 403, 404].includes(error.response.status)) {
          console.error('Error fetching listings:', error)
        }
        return []
      })
  }, [token])

  // Only fetch listings after token is loaded and API is defined
  const { data: listings, isLoading: isListingsLoading } = useSWR(
    tokenLoaded && API ? `${API}/listings/` : null, 
    fetcher,
    {
      onError: (error: any) => {
        // Silently handle expected errors (400, 401, 403, 404)
        // Only log unexpected errors
        if (error?.response?.status && ![400, 401, 403, 404].includes(error.response.status)) {
          console.error('SWR error:', error)
        }
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  )
  // Filter listings based on selected category
  const filteredListings = selectedCategory
    ? listings?.filter((listing: any) => listing.category?.id === selectedCategory)
    : listings

  const featuredService = filteredListings?.[0]
  const hotServices = filteredListings?.slice(1, 4) || []
  const recommendations = filteredListings?.slice(4, 10) || []

  // Set initial favorite state from listings data
  useEffect(() => {
    if (listings) {
      const favoriteIds = new Set<number>()
      listings.forEach((listing: any) => {
        if (listing.is_favorited) {
          favoriteIds.add(listing.id)
        }
      })
      setFavorites(favoriteIds)
    }
  }, [listings])

  const handleFavoriteClick = useCallback(async (e: React.MouseEvent, listingId: number) => {
    e.preventDefault()

    if (!token) {
      alert('Please login to add favorites')
      return
    }

    setFavorites(prevFavorites => {
      const isFavorited = prevFavorites.has(listingId)
      
      if (isFavorited) {
        // Optimistically remove from favorites
        const newSet = new Set(prevFavorites)
        newSet.delete(listingId)
        
        // Make the API call
        axios.delete(
          `${API}/listings/${listingId}/unfavorite/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ).catch(error => {
          console.error('Error removing from favorites:', error)
          // Revert on error
          setFavorites(prev => new Set(prev).add(listingId))
          alert('Error updating favorite')
        })
        
        return newSet
      } else {
        // Optimistically add to favorites
        const newSet = new Set(prevFavorites)
        newSet.add(listingId)
        
        // Make the API call
        axios.post(
          `${API}/listings/${listingId}/favorite/`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ).catch(error => {
          console.error('Error adding to favorites:', error)
          // Revert on error
          setFavorites(prev => {
            const reverted = new Set(prev)
            reverted.delete(listingId)
            return reverted
          })
          alert('Error updating favorite')
        })
        
        return newSet
      }
    })
  }, [token])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    let animationFrameId: number
    let lastTimestamp = 0
    const scrollSpeed = 0.5

    const smoothScroll = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp
      const deltaTime = timestamp - lastTimestamp
      lastTimestamp = timestamp

      if (isAutoScrolling && scrollContainer) {
        const newScrollLeft = scrollContainer.scrollLeft + scrollSpeed * deltaTime
        if (newScrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
          scrollContainer.scrollLeft = 0
        } else {
          scrollContainer.scrollLeft = newScrollLeft
        }
      }

      animationFrameId = requestAnimationFrame(smoothScroll)
    }

    animationFrameId = requestAnimationFrame(smoothScroll)

    return () => cancelAnimationFrame(animationFrameId)
  }, [isAutoScrolling])

  const handleMouseEnter = () => setIsAutoScrolling(false)
  const handleMouseLeave = () => setIsAutoScrolling(true)

  // Fetch categories from the backend
  useEffect(() => {
    if (!API) {
      return
    }
    axios
      .get(`${API}/categories/`)
      .then(res => setCategories(res.data))
      .catch(err => {
        // Silently handle expected errors (400, 401, 403, 404)
        // Only log unexpected errors
        if (err.response?.status && ![400, 401, 403, 404].includes(err.response.status)) {
          console.error('Failed to fetch categories:', err)
        }
        setCategories([])
      })
  }, [])

  // Get emoji icon for category based on its name
  const getCategoryEmoji = (categoryName: string): string => {
    const emojiMap: { [key: string]: string } = {
      'Electronics': '📱',
      'Furniture': '🛋️',
      'Sports': '⚽',
      'Music': '🎵',
      'Photography': '📷',
      'Weddings': '💐',
      'Party': '🎉',
      'Tools': '🔧',
      'Books': '📚',
      'Toys': '🧩',
      'Games': '🎮',
      'Fashion': '👗',
      'Jewelry': '💍',
      'Kitchen': '🍳',
      'Garden': '🌱',
      'Cars': '🚗',
      'Bikes': '🚴',
      'Home': '🏠',
      'Audio': '🎧',
      'Video': '🎬',
      'Camera': '📹',
      'Computers': '💻',
      'Office': '💼',
      'Business': '🏢',
      'Corporate': '💼',
      'Events': '🎪',
      'Catering': '🍽️',
      'Appliances': '⚙️',
      'Outdoor': '⛺',
      'Sports Equipment': '⚽',
      'Rental': '🔑',
    }
    
    // Try exact match first
    if (emojiMap[categoryName]) return emojiMap[categoryName]
    
    // Try partial match
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (categoryName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(categoryName.toLowerCase())) {
        return emoji
      }
    }
    
    // Default icon
    return '📦'
  }

  // Map category names to icons and colors for display
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: { icon: any; color: string } } = {
      'Weddings': { icon: Sparkles, color: 'from-pink-500 to-rose-500' },
      'Corporate': { icon: Briefcase, color: 'from-blue-500 to-cyan-500' },
      'Music': { icon: Music, color: 'from-purple-500 to-violet-500' },
      'Photography': { icon: Camera, color: 'from-orange-500 to-amber-500' },
      'Catering': { icon: Utensils, color: 'from-green-500 to-emerald-500' },
      'Audio': { icon: Mic, color: 'from-red-500 to-pink-500' },
    }
    
    // Try exact match first, then partial match
    if (iconMap[categoryName]) return iconMap[categoryName]
    
    for (const [key, value] of Object.entries(iconMap)) {
      if (categoryName.includes(key) || key.includes(categoryName)) {
        return value
      }
    }
    
    // Default icon
    return { icon: Sparkles, color: 'from-blue-500 to-cyan-500' }
  }

  // Component to display ratings
  const RatingDisplay = ({ serviceId }: { serviceId: number }) => {
    const [rating, setRating] = useState<number>(0)
    const [reviewCount, setReviewCount] = useState<number>(0)

    useEffect(() => {
      const fetchRating = async () => {
        try {
          const response = await axios.get(`${API}/reviews/?listing=${serviceId}`)
          if (Array.isArray(response.data)) {
            const reviews = response.data
            const count = reviews.length
            const avg = count > 0
              ? Math.round((reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / count) * 10) / 10
              : 0
            setRating(avg)
            setReviewCount(count)
          }
        } catch (error) {
          console.error('Error fetching rating:', error)
        }
      }
      fetchRating()
    }, [serviceId])

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.round(rating)
                  ? 'fill-orange-500 text-orange-500'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Hero / Banner Section */}
      <section 
        className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-white -mt-20"
      >
        {/* Professional Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-300 to-orange-300 rounded-full -mr-48 -mt-48 blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-300 to-cyan-300 rounded-full -ml-40 -mb-40 blur-3xl opacity-15"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full -ml-48 -mt-48 blur-3xl opacity-10"></div>
        </div>
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(0deg,#000_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-32 z-10">
          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="space-y-8">
              {/* Professional Badge */}
              <BannerBadge />

              {/* Primary Tagline */}
              <div>
                <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight drop-shadow-sm">
                  Share instead of buying
                </h1>
                <p className="text-xl text-gray-700 font-medium">
                  Nearby and at times that suit you
                </p>
              </div>

              {/* Description */}
              <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                Welcome to EKRA, where sharing is smarter than buying. Find everything you need in your neighborhood, rent from verified community members, and enjoy the freedom of flexible timing that works for your lifestyle.
              </p>

              {/* Location & Time Info */}
              <div className="space-y-4">
                <InfoCard 
                  icon={MapPin}
                  label="🎯 Find items nearby"
                  value="Usually closer than your nearest store"
                  colorClass="from-amber-50 to-orange-50"
                />
                <InfoCard 
                  icon={Clock}
                  label="⏰ Flexible timing"
                  value="Before & after work, weekends - your choice"
                  colorClass="from-blue-50 to-cyan-50"
                />
              </div>

              {/* Trust Indicators */}
              <div className="pt-4">
                <TrustIndicators />
              </div>
            </div>

            {/* Right Content - Search Section */}
            <div className="space-y-6">
              {/* Main Search Bar */}
              <SearchSection />

              {/* Popular Categories Grid */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">📂 Browse popular categories</p>
                <CategoriesGrid categories={categories} getCategoryEmoji={getCategoryEmoji} />
              </div>

              {/* CTA Buttons */}
              <CTAButtons />
            </div>
          </div>

          {/* Bottom Trust Section */}
          <div className="mt-20 pt-12 border-t border-gray-300">
            <StatsSection />
          </div>
        </div>
      </section>

      <div className="min-h-screen bg-white">
        {/* Categories */}
        {/* Categories Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="mb-12">
              <div className="inline-block mb-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 rounded-full text-amber-700 font-semibold text-sm">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  Explore Categories
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">Browse by Category</h2>
              <p className="text-lg text-gray-600 max-w-2xl">Discover items and services across all categories in your neighborhood</p>
            </div>

            {/* Horizontal Scrolling Categories */}
            <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {/* All Categories Button */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`group relative px-6 py-4 min-w-max rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 flex-row ${
                  selectedCategory === null
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-500 shadow-lg'
                    : 'bg-white border-gray-200 hover:border-amber-300 hover:shadow-lg'
                }`}
              >
                <Sparkles className={`h-6 w-6 ${selectedCategory === null ? 'text-white' : 'text-amber-600'}`} />
                <span className={`text-sm font-bold whitespace-nowrap ${selectedCategory === null ? 'text-white' : 'text-gray-900'}`}>
                  All Items
                </span>
              </button>
              
              {categories.map(cat => {
                const { icon: IconComponent, color } = getCategoryIcon(cat.name)
                const isSelected = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`group relative px-6 py-4 min-w-max rounded-2xl border-2 transition-all duration-300 flex items-center gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-500 shadow-lg'
                        : 'bg-white border-gray-200 hover:border-amber-300 hover:shadow-lg'
                    }`}
                  >
                    {isSelected ? (
                      <div className={`p-2 rounded-lg transition-all duration-300 bg-orange-600`}>
                        <IconComponent className={`h-5 w-5 text-white`} />
                      </div>
                    ) : null}
                    <span className={`text-sm font-bold whitespace-nowrap ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {cat.name}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Filter indicator */}
            {selectedCategory && (
              <div className="mt-8 flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Filtering by: <span className="text-amber-600">{categories.find(c => c.id === selectedCategory)?.name}</span></p>
                    <p className="text-xs text-gray-600">Showing results for this category</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="px-4 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-100 rounded-lg transition-colors duration-300"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Featured Service */}
        {featuredService && (
          <section className="py-12 md:py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Badge className="bg-orange-500 text-white border-0 mb-3 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Featured Service
              </Badge>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Most Popular This Week</h2>

              <Card className="overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-300">
                <div className="grid md:grid-cols-2 gap-0">
                  <Link href={`/listings/${featuredService.id}`} className="relative h-64 md:h-full md:min-h-[400px] block cursor-pointer group bg-black overflow-hidden">
                    {featuredService.images?.[0]?.image && (
                      <img
                        src={featuredService.images[0].image.startsWith('http') ? featuredService.images[0].image : `${API}${featuredService.images[0].image}`}
                        alt={featuredService.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </Link>
                  <div className="p-8 md:p-10 flex flex-col justify-between bg-gradient-to-br from-white to-blue-50">
                    <div>
                      <Badge variant="secondary" className="mb-4">{featuredService.category?.name || "Listing"}</Badge>
                      <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{featuredService.title}</h3>
                      <p className="text-gray-600 mb-6 text-lg">{featuredService.description}</p>
                      <div className="mb-6">
                        <RatingDisplay serviceId={featuredService.id} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                      <div>
                        <span className="text-4xl font-bold text-gray-800">${featuredService.price_per_day}</span>
                        <span className="text-gray-500 ml-1">/day</span>
                      </div>
                      <Link href={`/listings/${featuredService.id}`}>
                        <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8">Book Now</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Hot Services */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isListingsLoading ? (
              // Show skeleton loaders while loading
              [...Array(3)].map((_, i) => (
                <SkeletonLoader key={i} />
              ))
            ) : (
              // Show actual listings
              hotServices.map((service: any) => (
              <Card key={service.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white">
                <Link href={`/listings/${service.id}`} className="relative w-full block cursor-pointer bg-black overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
                  {service.images?.[0]?.image && (
                    <img
                      src={service.images[0].image.startsWith('http') ? service.images[0].image : `${API}${service.images[0].image}`}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => handleFavoriteClick(e, service.id)}
                    className={`absolute bottom-4 right-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                      favorites.has(service.id)
                        ? 'bg-red-500/90 hover:bg-red-600 text-white'
                        : 'bg-white/90 hover:bg-white text-gray-700'
                    }`}
                  >
                    <Heart className="h-5 w-5" fill={favorites.has(service.id) ? 'currentColor' : 'none'} />
                  </Button>
                </Link>
                <div className="p-5">
                  <Badge variant="secondary" className="mb-3 text-xs">{service.category?.name || "Listing"}</Badge>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{service.title}</h3>
                  <div className="mb-3">
                    <RatingDisplay serviceId={service.id} />
                  </div>
                  <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-800">${service.price_per_day}</span>
                      <Link href={`/listings/${service.id}`}>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white rounded-full">
                          Book Now
                        </Button>
                      </Link>
                  </div>
                </div>
              </Card>
            ))
            )}
          </div>
        </section>

        {/* Recommendations */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 overflow-x-auto scrollbar-hide" ref={scrollContainerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {isListingsLoading ? (
              // Show skeleton loaders while loading
              [...Array(6)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-80">
                  <SkeletonLoader />
                </div>
              ))
            ) : (
              // Show actual listings
              recommendations.map((service: any) => (
              <Card key={service.id} className="group flex-shrink-0 w-80 overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white">
                <Link href={`/listings/${service.id}`} className="relative w-full block cursor-pointer bg-black overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
                  {service.images?.[0]?.image && (
                    <img
                      src={service.images[0].image.startsWith('http') ? service.images[0].image : `${API}${service.images[0].image}`}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => handleFavoriteClick(e, service.id)}
                    className={`absolute top-3 right-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                      favorites.has(service.id)
                        ? 'bg-red-500/90 hover:bg-red-600 text-white'
                        : 'bg-white/90 hover:bg-white text-gray-700'
                    }`}
                  >
                    <Heart className="h-4 w-4" fill={favorites.has(service.id) ? 'currentColor' : 'none'} />
                  </Button>
                </Link>
                <div className="p-4">
                  <Badge variant="secondary" className="mb-2 text-xs">{service.category?.name || "Listing"}</Badge>
                  <h3 className="text-base font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{service.title}</h3>
                  <div className="mb-3">
                    <RatingDisplay serviceId={service.id} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-800">${service.price_per_day}</span>
                    <Button size="sm" variant="outline" className="rounded-full text-blue-600 border-blue-600 hover:bg-blue-50">View</Button>
                  </div>
                </div>
              </Card>
            ))
            )}
          </div>
        </section>
      </div>
    </div>
  )

}
