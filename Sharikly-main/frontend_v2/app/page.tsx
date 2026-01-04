'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import useSWR, { mutate } from "swr"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Heart, TrendingUp, Sparkles, Briefcase, Music, Camera, Utensils, Mic, Plus } from 'lucide-react'
import Link from "next/link"

const API = process.env.NEXT_PUBLIC_API_BASE

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const [token, setToken] = useState<string>('')
  const [tokenLoaded, setTokenLoaded] = useState(false)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [categories, setCategories] = useState<any[]>([])

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
  const { data: listings } = useSWR(
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
  const featuredService = listings?.[0]
  const hotServices = listings?.slice(1, 4) || []
  const recommendations = listings?.slice(4, 10) || []

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
          <Badge className="bg-white/20 text-white border-0 mb-4 backdrop-blur-sm">
            <TrendingUp className="h-3 w-3 mr-1" />
            Browse Listings
          </Badge>
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
              {categories.map(cat => {
                const { icon: IconComponent, color } = getCategoryIcon(cat.name)
                return (
                  <Link key={cat.id} href="#" className="flex flex-col items-center p-4 rounded-lg shadow-sm bg-white hover:shadow-md transition">
                    <div className={`p-3 rounded-full bg-gradient-to-br ${color} mb-2`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                  </Link>
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
                  <div className="relative h-64 md:h-full min-h-[400px]">
                    {featuredService.images?.[0]?.image && (
                      <img
                        src={featuredService.images[0].image.startsWith('http') ? featuredService.images[0].image : `${API}${featuredService.images[0].image}`}
                        alt={featuredService.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-8 md:p-10 flex flex-col justify-between bg-gradient-to-br from-white to-blue-50">
                    <div>
                      <Badge variant="secondary" className="mb-4">{featuredService.category?.name || "Listing"}</Badge>
                      <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{featuredService.title}</h3>
                      <p className="text-gray-600 mb-6 text-lg">{featuredService.description}</p>
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
            {hotServices.map((service: any) => (
              <Card key={service.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white">
                <div className="relative overflow-hidden">
                  {service.images?.[0]?.image && (
                    <img
                      src={service.images[0].image.startsWith('http') ? service.images[0].image : `${API}${service.images[0].image}`}
                      alt={service.title}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
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
                </div>
                <div className="p-5">
                  <Badge variant="secondary" className="mb-3 text-xs">{service.category?.name || "Listing"}</Badge>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{service.title}</h3>
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
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 overflow-x-auto scrollbar-hide" ref={scrollContainerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {recommendations.map((service: any) => (
              <Card key={service.id} className="group flex-shrink-0 w-80 overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white">
                <div className="relative overflow-hidden">
                  {service.images?.[0]?.image && (
                    <img
                      src={service.images[0].image.startsWith('http') ? service.images[0].image : `${API}${service.images[0].image}`}
                      alt={service.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
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
                </div>
                <div className="p-4">
                  <Badge variant="secondary" className="mb-2 text-xs">{service.category?.name || "Listing"}</Badge>
                  <h3 className="text-base font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{service.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-800">${service.price_per_day}</span>
                    <Button size="sm" variant="outline" className="rounded-full text-blue-600 border-blue-600 hover:bg-blue-50">View</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Footer */}

        <footer className="bg-gray-800 text-gray-300 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">E</span>
                  </div>
                  <span className="text-xl font-bold text-white">EventHub</span>
                </div>
                <p className="text-sm text-gray-400">
                  Your trusted partner for premium event services and unforgettable experiences.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Services</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Wedding Events
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Corporate Events
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Birthday Parties
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Audio & Lighting
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Blog
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Cookie Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; 2025 EventHub. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div >
    </div >
  )

}
