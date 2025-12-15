'use client'

import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import axios from "axios"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  ArrowLeft,
  Search,
  Star,
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_BASE
const fetcher = (url: string) => axios.get(url).then((res) => res.data)

const DEFAULT_AVATAR = "/placeholder.svg"

export default function ListingDetail() {
  const { id } = useParams()
  const router = useRouter()
  const { data } = useSWR(id ? `${API}/listings/${id}/` : null, fetcher)

  const [user, setUser] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [mainImage, setMainImage] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenIndex, setFullscreenIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)

  const [reviews, setReviews] = useState<any[]>([])

  const [newRating, setNewRating] = useState<number>(0)
  const [newComment, setNewComment] = useState<string>("")
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user")
      if (storedUser) setUser(JSON.parse(storedUser))
    }
  }, [])

  useEffect(() => {
    if (!data) return

    if (data.images?.length) {
      const firstImage = data.images[0].image.startsWith("http")
        ? data.images[0].image
        : `${API}${data.images[0].image}`
      setMainImage(firstImage)
    } else {
      setMainImage("/hero.jpg")
    }

    if (typeof data.is_favorited !== "undefined") {
      setIsFavorite(Boolean(data.is_favorited))
    }

    if (Array.isArray(data.reviews)) {
      const normalized = data.reviews.map((r: any) => ({
        id: r.id,
        user: {
          name: r.user?.username || r.user?.email || "Anonymous",
          avatar: r.user?.avatar ? (r.user.avatar.startsWith("http") ? r.user.avatar : `${API}${r.user.avatar}`) : DEFAULT_AVATAR,
        },
        rating: r.rating ?? 0,
        comment: r.comment ?? "",
        helpful: r.upvotes ?? 0,
        notHelpful: r.downvotes ?? 0,
        date: r.created_at ? new Date(r.created_at).toLocaleDateString() : "",
        raw: r,
      }))
      normalized.sort((a: any, b: any) => (b.helpful - b.notHelpful) - (a.helpful - a.notHelpful))
      setReviews(normalized)
    } else {
      setReviews([])
    }
  }, [data])

  if (!data) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    )
  }

  const images =
    data?.images?.length > 0
      ? data.images.map((img: any) => (img.image.startsWith("http") ? img.image : `${API}${img.image}`))
      : ["/hero.jpg"]

  const isOwner = user?.id === data.owner?.id

  const averageRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length) * 10) / 10
      : (data.average_rating ?? 0)

  const handleRequestBooking = () => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    router.push(`/listings/${id}/request_booking`)
  }

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index)
    setIsFullscreen(true)
  }

  const closeFullscreen = () => {
    setIsFullscreen(false)
  }

  const nextImage = () => {
    setFullscreenIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setFullscreenIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleVote = (reviewId: number, type: "up" | "down") => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              helpful: type === "up" ? review.helpful + 1 : review.helpful,
              notHelpful: type === "down" ? review.notHelpful + 1 : review.notHelpful,
            }
          : review
      ).sort((a, b) => (b.helpful - b.notHelpful) - (a.helpful - a.notHelpful))
    )
  }

  const toggleFavorite = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    try {
      const token = localStorage.getItem("access_token")
      if (!token) {
        router.push("/auth/login")
        return
      }

      // Optimistically update the UI
      setIsFavorite((prevState) => !prevState)

      if (isFavorite) {
        // Remove from favorites
        await axios.delete(
          `${API}/listings/${id}/unfavorite/`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } else {
        // Add to favorites
        await axios.post(
          `${API}/listings/${id}/favorite/`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
    } catch (err: any) {
      console.error("Error toggling favorite:", err)
      // Revert on error
      setIsFavorite((prevState) => !prevState)
      alert("Error updating favorite")
    }
  }

  const setNewRatingFromStar = (n: number) => {
    setNewRating(n)
  }

  const submitReview = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (newRating <= 0 && newComment.trim() === "") return

    setSubmittingReview(true)

    const tmpId = Date.now()
    const optimistic = {
      id: tmpId,
      user: {
        name: (user?.username) || user?.email || "You",
        avatar: user?.avatar
          ? user.avatar.startsWith("http")
            ? user.avatar
            : `${API}${user.avatar}`
          : DEFAULT_AVATAR,
      },
      rating: newRating,
      comment: newComment,
      helpful: 0,
      notHelpful: 0,
      date: new Date().toLocaleDateString(),
      raw: {},
    }

    setReviews((prev) => [optimistic, ...prev])
    setNewComment("")
    setNewRating(0)

    try {
      async function getAccessToken() {
        let token = localStorage.getItem("access")
        if (!token) token = localStorage.getItem("access_token")
        if (!token) token = localStorage.getItem("token")
        return token
      }

      async function refreshAccessToken() {
        try {
          const refresh = localStorage.getItem("refresh")
          if (!refresh) return null

          const res = await axios.post(`${API}/auth/refresh/`, { refresh })
          if (res.data.access) {
            localStorage.setItem("access", res.data.access)
            return res.data.access
          }
        } catch (err) {
          return null
        }
      }

      const token = await getAccessToken()
      if (!token) {
        const newToken = await refreshAccessToken()
        if (!newToken) throw new Error("Auth failed")
      }

      const res = await axios.post(
        `${API}/listings/${id}/reviews/`,
        { rating: newRating, comment: newComment},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (res.data && res.data.id) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === tmpId
              ? {
                  id: res.data.id,
                  user: {
                    name: res.data.user?.username || res.data.user?.email || optimistic.user.name,
                    avatar: res.data.user?.avatar
                      ? res.data.user.avatar.startsWith("http")
                        ? res.data.user.avatar
                        : `${API}${res.data.user.avatar}`
                      : DEFAULT_AVATAR,
                  },
                  rating: res.data.rating,
                  comment: res.data.comment,
                  helpful: res.data.upvotes ?? 0,
                  notHelpful: res.data.downvotes ?? 0,
                  date: res.data.created_at
                    ? new Date(res.data.created_at).toLocaleDateString()
                    : optimistic.date,
                  raw: res.data,
                }
              : r
          )
        )
      }
    } catch (err: any) {
      setReviews((prev) => prev.filter((r) => r.id !== tmpId))
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 text-white p-4 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search..."
              className="w-full pl-10 bg-white border-0 text-gray-800 placeholder:text-gray-400"
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <div className="flex gap-4 p-4">
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px]">
                  {images.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setMainImage(url)
                      }}
                      className={`border-2 rounded-lg overflow-hidden flex-shrink-0 transition-all ${mainImage === url
                        ? "border-orange-500 ring-2 ring-orange-200"
                        : "border-gray-200 hover:border-gray-400"
                        }`}
                    >
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`thumbnail ${idx}`}
                        className="w-16 h-16 object-cover"
                      />
                    </button>
                  ))}
                </div>

                <div className="flex-1 relative group">
                  <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={mainImage || images[0]}
                      alt={data.title}
                      className="w-full h-full object-cover cursor-zoom-in"
                      onClick={() => openFullscreen(images.indexOf(mainImage || images[0]))}
                    />
                  </div>
                  <Button
                    onClick={() => openFullscreen(images.indexOf(mainImage || images[0]))}
                    className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                    size="sm"
                  >
                    <ZoomIn className="h-4 w-4 mr-2" />
                    Zoom
                  </Button>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{data.title}</h1>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < Math.floor(averageRating) ? "fill-orange-500 text-orange-500" : "text-gray-300"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-gray-700">{averageRating}</span>
                    <span className="text-gray-500">({reviews.length} reviews)</span>
                  </div>
                </div>
                <Button
                  onClick={toggleFavorite}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-100"
                >
                  <Heart
                    className={`h-6 w-6 transition-all ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                  />
                </Button>
              </div>

              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Description</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{data.description}</p>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Leave a review</h2>

              <div className="mb-3">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setNewRatingFromStar(n)}
                      type="button"
                      aria-label={`Rate ${n} stars`}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 cursor-pointer ${n <= newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write your review..."
                className="w-full border rounded-md p-3 h-28 resize-none"
              />

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={submitReview}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={submittingReview}
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setNewRating(0); setNewComment("") }}
                >
                  Clear
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h2>
              <div className="space-y-6">
                {reviews.length === 0 && (
                  <p className="text-gray-500">No reviews yet. Be the first to review this listing.</p>
                )}

                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-start gap-4">
                      <img
                        src={review.user.avatar || DEFAULT_AVATAR}
                        alt={review.user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-800">{review.user.name}</h4>
                            <p className="text-sm text-gray-500">{review.date}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? "fill-orange-500 text-orange-500" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleVote(review.id, "up")}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span>Helpful ({review.helpful})</span>
                          </button>
                          <button
                            onClick={() => handleVote(review.id, "down")}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                          >
                            <ThumbsDown className="h-4 w-4" />
                            <span>Not Helpful ({review.notHelpful})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24 space-y-6">
              <div className="text-center pb-6 border-b border-gray-200">
                <div className="text-4xl font-bold text-blue-600 mb-1">${data.price_per_day}</div>
                <div className="text-gray-500">per day</div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Dates</h3>
                <div className="grid grid-cols-7 gap-1">
                  <div className="text-center text-xs font-medium text-gray-500 py-2">Sun</div>
                  <div className="text-center text-xs font-medium text-gray-500 py-2">Mon</div>
                  <div className="text-center text-xs font-medium text-gray-500 py-2">Tue</div>
                  <div className="text-center text-xs font-medium text-gray-500 py-2">Wed</div>
                  <div className="text-center text-xs font-medium text-gray-500 py-2">Thu</div>
                  <div className="text-center text-xs font-medium text-gray-500 py-2">Fri</div>
                  <div className="text-center text-xs font-medium text-gray-500 py-2">Sat</div>
                  {[...Array(30)].map((_, i) => {
                    const day = i + 1
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(day)}
                        className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${selectedDate === day
                          ? "bg-orange-500 text-white shadow-md"
                          : "text-gray-700 hover:bg-gray-100"
                          }`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
                {selectedDate && (
                  <p className="mt-4 text-sm text-gray-600 text-center">
                    Selected: <span className="font-semibold">Day {selectedDate}</span>
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                {user && !isOwner && (
                  <Button
                    onClick={handleRequestBooking}
                    className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Send Request
                  </Button>
                )}
                {!user && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">Please log in to request booking</p>
                    <Button
                      onClick={() => router.push("/auth/login")}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                    >
                      Log In
                    </Button>
                  </div>
                )}
                {isOwner && <p className="text-sm text-gray-500 text-center">This is your listing</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <Button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white"
            size="icon"
          >
            <X className="h-6 w-6" />
          </Button>
          <Button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white"
            size="icon"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white"
            size="icon"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
          <img
            src={images[fullscreenIndex] || "/placeholder.svg"}
            alt="Fullscreen view"
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
            {fullscreenIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  )
}
