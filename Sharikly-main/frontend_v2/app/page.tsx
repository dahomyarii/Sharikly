'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import useSWR, { mutate } from "swr"
import axiosInstance from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Heart, TrendingUp, Sparkles, Briefcase, Music, Camera, Utensils, Mic, Plus, Star, User } from 'lucide-react'
import Link from "next/link"
import SkeletonLoader from "@/components/SkeletonLoader"

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

    // Listen for logout events to clear token
    const handleLogout = () => {
      setToken('')
      if (API) {
        mutate(`${API}/listings/`)
      }
    }

    window.addEventListener('userLogin', handleLogin as EventListener)
    window.addEventListener('userLogout', handleLogout as EventListener)
    
    return () => {
      window.removeEventListener('userLogin', handleLogin as EventListener)
      window.removeEventListener('userLogout', handleLogout as EventListener)
    }
  }, [])

  // Custom fetcher for public endpoints (like listings)
  // Don't send token for public endpoints - if token is expired, it causes 401 errors
  const fetcher = useCallback((url: string) => {
    if (!url || !API) {
      return Promise.resolve([])
    }
    
    // For public endpoints like /listings/, don't send token
    // The endpoint has AllowAny permission, so token is optional
    // If token is expired, sending it causes 401 errors
    return axiosInstance.get(url)
      .then(res => res.data)
      .catch(error => {
        // If 401 occurs, the interceptor will clear the token
        // Retry once without token for public endpoints
        if (error.response?.status === 401 && url.includes('/listings/')) {
          // Token was cleared by interceptor, retry without token
          return axiosInstance.get(url)
            .then(res => res.data)
            .catch(() => [])
        }
        
        // Silently handle expected errors (400, 401, 403, 404)
        // Only log unexpected errors
        if (error.response?.status && ![400, 401, 403, 404].includes(error.response.status)) {
          console.error('Error fetching listings:', error)
        }
        return []
      })
  }, [])

  // Fetch listings immediately - it's a public endpoint, no token needed
  const { data: listings, isLoading: isListingsLoading } = useSWR(
    API ? `${API}/listings/` : null, 
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
        axiosInstance.delete(
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
        axiosInstance.post(
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
    axiosInstance
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
          const response = await axiosInstance.get(`${API}/reviews/?listing=${serviceId}`)
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
      {/* Header / Hero Section */}
      <section 
        className="relative text-white py-16 md:py-20 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/image.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link href="/listings">
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition">
                <TrendingUp className="h-3 w-3 mr-1" />
                Browse Listings
              </Badge>
            </Link>
            <Link href="/blog">
              <Badge className="bg-white/10 text-white/90 border-0 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition">
                <Sparkles className="h-3 w-3 mr-1" />
                Blog
              </Badge>
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Explore Our Latest Listings</h1>
          <p className="text-lg md:text-xl text-blue-50 max-w-2xl mx-auto">
            Discover premium rentals and services tailored to your needs.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/listings/new">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6">
                <Plus className="h-4 w-4 mr-2" />
                Add Listing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="min-h-screen bg-white">
        {/* Categories */}
        <section className="py-6 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* All Categories Button */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex flex-col items-center p-4 rounded-lg shadow-sm transition ${
                  selectedCategory === null
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white hover:shadow-md'
                }`}
              >
                <div className={`p-3 rounded-full mb-2 ${selectedCategory === null ? 'bg-orange-600' : 'bg-gray-200'}`}>
                  <Sparkles className={`h-6 w-6 ${selectedCategory === null ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <span className={`text-sm font-medium ${selectedCategory === null ? 'text-white' : 'text-gray-700'}`}>All</span>
              </button>
              
              {categories.map(cat => {
                const { icon: IconComponent, color } = getCategoryIcon(cat.name)
                const isSelected = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col items-center p-4 rounded-lg shadow-sm transition ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-white hover:shadow-md'
                    }`}
                  >
                    <div className={`p-3 rounded-full mb-2 ${isSelected ? 'bg-orange-600' : `bg-gradient-to-br ${color}`}`}>
                      <IconComponent className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-white'}`} />
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>{cat.name}</span>
                  </button>
                )
              })}
            </div>
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
                  
                  {/* Lender/Owner Info */}
                  {service.owner && (
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {service.owner.avatar ? (
                          <img
                            src={service.owner.avatar.startsWith('http') ? service.owner.avatar : `${API?.replace('/api', '')}${service.owner.avatar}`}
                            alt={service.owner.username || service.owner.email}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">Lender</div>
                        <span className="text-sm font-medium text-gray-700 truncate block">
                          {service.owner.username || service.owner.email}
                        </span>
                      </div>
                    </div>
                  )}
                  
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
