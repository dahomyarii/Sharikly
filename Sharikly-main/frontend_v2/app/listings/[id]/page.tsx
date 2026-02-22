"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import axiosInstance from "@/lib/axios";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import LocationPicker from "@/components/LocationPicker";
import Link from "next/link";
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
  Check,
  AlertCircle,
  Flag,
  Pencil,
  Trash2,
} from "lucide-react";
import ReportModal from "@/components/ReportModal";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useToast } from "@/components/ui/toast";

const API = process.env.NEXT_PUBLIC_API_BASE;

const DEFAULT_AVATAR = "/logo.png";

export default function ListingDetail() {
  // In Next.js 15 client components, useParams() works directly
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : String(params.id || '');
  const router = useRouter();

  // Custom fetcher that includes the auth token
  const fetcher = useCallback((url: string) => {
    if (!url || !API) {
      return Promise.resolve(null);
    }
    const headers: any = {};
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access") ||
        localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return axiosInstance
      .get(url, { headers })
      .then((res) => res.data)
      .catch((error) => {
        // Silently handle 400/401/403 errors (expected when not authenticated)
        if (
          error.response?.status &&
          ![400, 401, 403, 404].includes(error.response.status)
        ) {
          console.error("Error fetching listing:", error);
        }
        throw error;
      });
  }, []);

  const { data } = useSWR(id ? `${API}/listings/${id}/` : null, fetcher);
  const { data: availability } = useSWR<{ booked_ranges: { start: string; end: string }[] }>(
    id ? `${API}/listings/${id}/availability/` : null,
    (url: string) => axiosInstance.get(url).then((r) => r.data)
  );

  const [user, setUser] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const [reviews, setReviews] = useState<any[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);

  const [newRating, setNewRating] = useState<number>(0);
  const [newComment, setNewComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch reviews from backend
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        const response = await axiosInstance.get(`${API}/reviews/?listing=${id}`);
        if (Array.isArray(response.data)) {
          const normalized = response.data.map((r: any) => ({
            id: r.id,
            user: {
              name: r.user?.username || r.user?.email || "Anonymous",
              avatar: r.user?.avatar
                ? r.user.avatar.startsWith("http")
                  ? r.user.avatar
                  : `${API}${r.user.avatar}`
                : DEFAULT_AVATAR,
            },
            rating: r.rating ?? 0,
            comment: r.comment ?? "",
            helpful: r.helpful ?? 0,
            notHelpful: r.not_helpful ?? 0,
            userVote: r.user_vote ?? null,
            date: r.created_at ? new Date(r.created_at).toLocaleDateString() : "",
            raw: r,
          }));
          // Preserve stable ordering by review date (newest first).
          const getTime = (r: any) =>
            r.raw?.created_at
              ? new Date(r.raw.created_at).getTime()
              : r.date
              ? new Date(r.date).getTime()
              : 0;
          normalized.sort((a: any, b: any) => getTime(b) - getTime(a));
          setReviews(normalized);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    fetchReviews();
  }, [id]);

  useEffect(() => {
    if (!data) return;

    if (data.images?.length) {
      const firstImage = data.images[0].image.startsWith("http")
        ? data.images[0].image
        : `${API}${data.images[0].image}`;
      setMainImage(firstImage);
    } else {
      setMainImage("/hero.jpg");
    }

    if (typeof data.is_favorited !== "undefined") {
      setIsFavorite(Boolean(data.is_favorited));
    }
  }, [data]);

  if (!data) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  const images =
    data?.images?.length > 0
      ? data.images.map((img: any) =>
          img.image.startsWith("http") ? img.image : `${API}${img.image}`
        )
      : ["/hero.jpg"];

  const isOwner = user?.id === data.owner?.id;

  // Check if current user has already reviewed this listing
  const userHasReviewed = user && reviews.some((r: any) => r.raw?.user?.id === user?.id);

  const averageRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length) *
            10
        ) / 10
      : data.average_rating ?? 0;

  const handleRequestBooking = () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    // Pass selected dates via URL params
    let url = `/listings/${id}/request_booking`
    if (dateRange?.from && dateRange?.to) {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      })
      url += `?${params.toString()}`
    }
    router.push(url);
  };

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const nextImage = () => {
    setFullscreenIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setFullscreenIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleVote = async (reviewId: number, type: "up" | "down") => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const voteType = type === "up" ? "HELPFUL" : "NOT_HELPFUL";
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;

    // Optimistic UI update
    const previousState = {
      helpful: review.helpful,
      notHelpful: review.notHelpful,
      userVote: review.userVote,
    };

    // Calculate optimistic state
    let newHelpful = review.helpful;
    let newNotHelpful = review.notHelpful;
    let newUserVote: "HELPFUL" | "NOT_HELPFUL" | null = review.userVote;

    if (review.userVote === voteType) {
      // Toggle off: remove vote
      if (voteType === "HELPFUL") {
        newHelpful = Math.max(0, review.helpful - 1);
      } else {
        newNotHelpful = Math.max(0, review.notHelpful - 1);
      }
      newUserVote = null;
    } else if (review.userVote) {
      // Switch vote: remove old, add new
      if (review.userVote === "HELPFUL") {
        newHelpful = Math.max(0, review.helpful - 1);
      } else {
        newNotHelpful = Math.max(0, review.notHelpful - 1);
      }
      if (voteType === "HELPFUL") {
        newHelpful =
          review.helpful + (review.userVote === "NOT_HELPFUL" ? 1 : 0);
      } else {
        newNotHelpful =
          review.notHelpful + (review.userVote === "HELPFUL" ? 1 : 0);
      }
      newUserVote = voteType;
    } else {
      // Add new vote
      if (voteType === "HELPFUL") {
        newHelpful = review.helpful + 1;
      } else {
        newNotHelpful = review.notHelpful + 1;
      }
      newUserVote = voteType;
    }

    // Update UI optimistically — keep existing order (by date)
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              helpful: newHelpful,
              notHelpful: newNotHelpful,
              userVote: newUserVote,
            }
          : r
      )
    );

    try {
      async function getAccessToken() {
        let token = localStorage.getItem("access");
        if (!token) token = localStorage.getItem("access_token");
        if (!token) token = localStorage.getItem("token");
        return token;
      }

      async function refreshAccessToken() {
        try {
          const refresh = localStorage.getItem("refresh");
          if (!refresh) return null;

          const res = await axiosInstance.post(`${API}/auth/token/refresh/`, {
            refresh,
          });
          if (res.data.access) {
            localStorage.setItem("access", res.data.access);
            return res.data.access;
          }
        } catch (err) {
          return null;
        }
      }

      const token = await getAccessToken();
      if (!token) {
        const newToken = await refreshAccessToken();
        if (!newToken) throw new Error("Auth failed");
      }

      const res = await axiosInstance.post(
        `${API}/reviews/${reviewId}/vote/`,
        { vote_type: voteType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update with server response — keep existing order (by date)
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                helpful: res.data.helpful ?? newHelpful,
                notHelpful: res.data.not_helpful ?? newNotHelpful,
                userVote: res.data.user_vote ?? newUserVote,
              }
            : r
        )
      );
    } catch (err: any) {
      console.error("Error voting on review:", err);
      // Revert on error — keep existing order (by date)
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                helpful: previousState.helpful,
                notHelpful: previousState.notHelpful,
                userVote: previousState.userVote,
              }
            : r
        )
      );
      alert("Error voting on review. Please try again.");
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // Optimistically update the UI
      setIsFavorite((prevState) => !prevState);

      if (isFavorite) {
        // Remove from favorites
        await axiosInstance.delete(`${API}/listings/${id}/unfavorite/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Add to favorites
        await axiosInstance.post(
          `${API}/listings/${id}/favorite/`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err: any) {
      console.error("Error toggling favorite:", err);
      // Revert on error
      setIsFavorite((prevState) => !prevState);
      alert("Error updating favorite");
    }
  };

  const setNewRatingFromStar = (n: number) => {
    setNewRating(n);
  };

  const submitReview = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (newRating <= 0 && newComment.trim() === "") {
      showToast("Please provide a rating and comment", "error");
      return;
    }

    setSubmittingReview(true);

    const tmpId = Date.now();
    const optimistic = {
      id: tmpId,
      user: {
        name: user?.username || user?.email || "You",
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
      userVote: null,
      date: new Date().toLocaleDateString(),
      raw: {},
    };

    setReviews((prev) => [optimistic, ...prev]);
    setNewComment("");
    setNewRating(0);

    try {
      const token =
        localStorage.getItem("access") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      const res = await axiosInstance.post(
        `${API}/listings/${id}/reviews/`,
        { rating: newRating, comment: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data && res.data.id) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === tmpId
              ? {
                  id: res.data.id,
                  user: {
                    name:
                      res.data.user?.username ||
                      res.data.user?.email ||
                      optimistic.user.name,
                    avatar: res.data.user?.avatar
                      ? res.data.user.avatar.startsWith("http")
                        ? res.data.user.avatar
                        : `${API}${res.data.user.avatar}`
                      : DEFAULT_AVATAR,
                  },
                  rating: res.data.rating,
                  comment: res.data.comment,
                  helpful: res.data.helpful ?? 0,
                  notHelpful: res.data.not_helpful ?? 0,
                  userVote: res.data.user_vote ?? null,
                  date: res.data.created_at
                    ? new Date(res.data.created_at).toLocaleDateString()
                    : optimistic.date,
                  raw: res.data,
                }
              : r
          )
        );
        showToast("Review submitted successfully!", "success");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.non_field_errors?.[0] ||
        "Error submitting review. Please try again.";
      showToast(errorMessage, "error");
      console.error("Error submitting review:", err);
      setReviews((prev) => prev.filter((r) => r.id !== tmpId));
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <header className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 text-white px-4 py-3 sticky top-0 z-40 shadow-md" style={{ paddingTop: "max(0.75rem, var(--safe-area-inset-top))" }}>
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 min-w-[44px] min-h-[44px] touch-target rounded-xl"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search..."
              className="w-full pl-10 min-h-[44px] bg-white border-0 text-gray-800 placeholder:text-gray-400 rounded-xl"
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-5 pb-8 sm:px-6 lg:p-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-5 lg:space-y-6">
            <Card className="overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-4 p-3 sm:p-4">
                <div className="flex flex-row sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:max-h-[500px] pb-1 sm:pb-0">
                  {images.map((url: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setMainImage(url);
                      }}
                      className={`min-w-[64px] min-h-[64px] sm:w-16 sm:h-16 border-2 rounded-xl overflow-hidden flex-shrink-0 transition-all touch-target ${
                        mainImage === url
                          ? "border-orange-500 ring-2 ring-orange-200"
                          : "border-gray-200 hover:border-gray-400 active:border-gray-500"
                      }`}
                    >
                      <img
                        src={url || "/logo.png"}
                        alt={`thumbnail ${idx}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>

                <div className="flex-1 relative group min-w-0">
                  <div className="aspect-[4/3] max-h-[50vh] sm:max-h-none overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={mainImage || images[0]}
                      alt={data.title}
                      className="w-full h-full object-cover object-center cursor-zoom-in"
                      fetchPriority="high"
                      decoding="async"
                      sizes="(max-width: 768px) 100vw, 66vw"
                      onClick={() =>
                        openFullscreen(images.indexOf(mainImage || images[0]))
                      }
                    />
                  </div>
                  <Button
                    onClick={() =>
                      openFullscreen(images.indexOf(mainImage || images[0]))
                    }
                    className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 min-h-[44px] bg-white/90 hover:bg-white text-gray-800 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-target rounded-xl"
                    size="sm"
                  >
                    <ZoomIn className="h-4 w-4 mr-2" />
                    <span className="sm:inline">Zoom</span>
                  </Button>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                    {data.title}
                  </h1>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(averageRating)
                              ? "fill-orange-500 text-orange-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-gray-700">
                      {averageRating}
                    </span>
                    <span className="text-gray-500">
                      ({reviews.length} reviews)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    onClick={() => setShowReportModal(true)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 min-h-[44px] touch-target"
                  >
                    <Flag className="h-4 w-4 mr-1" />
                    Report
                  </Button>
                  <Button
                    onClick={toggleFavorite}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-gray-100 min-w-[44px] min-h-[44px] touch-target"
                  >
                    <Heart
                      className={`h-6 w-6 transition-all ${
                        isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
                      }`}
                    />
                  </Button>
                </div>
              </div>

              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  Description
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {data.description}
                </p>
              </Card>

              <Card className="overflow-hidden">
                {/* Lender Info */}
                <div className="p-5 flex items-center gap-4 border-b border-gray-100">
                  <a href={`/user/${data.owner?.id}`} className="flex-shrink-0">
                    <img
                      src={
                        data.owner?.avatar
                          ? data.owner.avatar.startsWith("http")
                            ? data.owner.avatar
                            : `${API}${data.owner.avatar}`
                          : DEFAULT_AVATAR
                      }
                      alt={data.owner?.username || "Lender"}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 hover:ring-gray-300 transition-all cursor-pointer"
                    />
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <a href={`/user/${data.owner?.id}`} className="hover:underline">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {data.owner?.username || "Unknown"}
                        </h3>
                      </a>
                      {data.owner?.is_email_verified && (
                        <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {averageRating > 0 ? averageRating : "New"}
                      </span>
                      <span className="text-sm text-gray-400">
                        &middot; {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  {!isOwner && user && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/chat")}
                      className="flex-shrink-0 text-xs"
                    >
                      Message
                    </Button>
                  )}
                </div>

                {/* Map */}
                {data.latitude && data.longitude && (
                  <div className="p-0">
                    <LocationPicker
                      readOnly={true}
                      initialLat={data.latitude}
                      initialLng={data.longitude}
                      initialRadius={data.pickup_radius_m || 300}
                    />
                  </div>
                )}
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Leave a review
              </h2>

              {userHasReviewed ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium">
                    ✓ You have already reviewed this listing
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    You can only review a listing once.
                  </p>
                </div>
              ) : !user ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 font-medium">
                    Please log in to leave a review
                  </p>
                  <Button
                    onClick={() => router.push("/auth/login")}
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Log In
                  </Button>
                </div>
              ) : isOwner ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 font-medium">
                    You cannot review your own listing
                  </p>
                </div>
              ) : (
                <>
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
                            className={`h-6 w-6 cursor-pointer ${
                              n <= newRating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
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
                      onClick={() => {
                        setNewRating(0);
                        setNewComment("");
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Customer Reviews
              </h2>
              <div className="space-y-6">
                {reviews.length === 0 && (
                  <p className="text-gray-500">
                    No reviews yet. Be the first to review this listing.
                  </p>
                )}

                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-gray-200 pb-6 last:border-0"
                  >
                    <div className="flex items-start gap-4">
                      <a href={`/user/${review.raw?.user?.id}`} className="flex-shrink-0">
                        <img
                          src={review.user.avatar || DEFAULT_AVATAR}
                          alt={review.user.name}
                          className="w-12 h-12 rounded-full object-cover hover:ring-2 hover:ring-gray-300 transition-all cursor-pointer"
                        />
                      </a>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <a href={`/user/${review.raw?.user?.id}`} className="hover:underline">
                              <h4 className="font-semibold text-gray-800">
                                {review.user.name}
                              </h4>
                            </a>
                            <p className="text-sm text-gray-500">
                              {review.date}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-orange-500 text-orange-500"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleVote(review.id, "up")}
                            className={`flex items-center gap-2 text-sm transition-colors ${
                              review.userVote === "HELPFUL"
                                ? "text-blue-600 font-semibold"
                                : "text-gray-600 hover:text-blue-600"
                            }`}
                          >
                            <ThumbsUp
                              className={`h-4 w-4 ${
                                review.userVote === "HELPFUL"
                                  ? "fill-current"
                                  : ""
                              }`}
                            />
                            <span>Helpful ({review.helpful})</span>
                          </button>
                          <button
                            onClick={() => handleVote(review.id, "down")}
                            className={`flex items-center gap-2 text-sm transition-colors ${
                              review.userVote === "NOT_HELPFUL"
                                ? "text-red-600 font-semibold"
                                : "text-gray-600 hover:text-red-600"
                            }`}
                          >
                            <ThumbsDown
                              className={`h-4 w-4 ${
                                review.userVote === "NOT_HELPFUL"
                                  ? "fill-current"
                                  : ""
                              }`}
                            />
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
            <Card className="p-6 sticky top-24 space-y-5">
              {/* Price */}
              <div className="text-center pb-5 border-b border-gray-200">
                <div className="text-4xl font-bold text-blue-600 mb-1">
                  ${data.price_per_day}
                </div>
                <div className="text-gray-500">per day</div>
              </div>

              {/* Calendar */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Select Dates
                </h3>
                <div className="calendar-wrapper">
                  <DayPicker
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    showOutsideDays={true}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date < today) return true;
                      if (!availability?.booked_ranges?.length) return false;
                      const d = new Date(date);
                      d.setHours(0, 0, 0, 0);
                      return availability.booked_ranges.some((r) => {
                        const start = new Date(r.start);
                        const end = new Date(r.end);
                        start.setHours(0, 0, 0, 0);
                        end.setHours(0, 0, 0, 0);
                        return d >= start && d <= end;
                      });
                    }}
                    className="w-full"
                  />
                </div>

                {/* Date selection summary */}
                {dateRange?.from && (
                  <div className="mt-3 text-sm text-gray-600 text-center">
                    {dateRange.to ? (
                      <span>
                        {dateRange.from.toLocaleDateString()} &mdash; {dateRange.to.toLocaleDateString()}
                      </span>
                    ) : (
                      <span>
                        {dateRange.from.toLocaleDateString()} &mdash; <span className="text-gray-400">select end date</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              {dateRange?.from && dateRange?.to && (() => {
                const msPerDay = 1000 * 60 * 60 * 24;
                const nights = Math.max(1, Math.round((dateRange.to!.getTime() - dateRange.from!.getTime()) / msPerDay));
                const pricePerDay = parseFloat(data.price_per_day) || 0;
                const subtotal = pricePerDay * nights;
                const serviceFee = Math.round(subtotal * 0.1 * 100) / 100;
                const total = Math.round((subtotal + serviceFee) * 100) / 100;
                return (
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>${pricePerDay.toFixed(2)} &times; {nights} day{nights !== 1 ? "s" : ""}</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Service fee</span>
                      <span>${serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t border-gray-200">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Action Button */}
              <div className="pt-2">
                {user && !isOwner && (
                  <Button
                    onClick={handleRequestBooking}
                    className="w-full min-h-[48px] h-14 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all touch-target"
                  >
                    Send Request
                  </Button>
                )}
                {!user && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Please log in to request booking
                    </p>
                    <Button
                      onClick={() => router.push("/auth/login")}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                    >
                      Log In
                    </Button>
                  </div>
                )}
                {isOwner && data.is_active === false && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                    This listing is hidden from search. Only you can see it. <Link href={`/listings/${id}/edit`} className="font-medium underline">Edit</Link> to show it again.
                  </p>
                )}
                {isOwner && (
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Link href={`/listings/${id}/edit`} className="inline-flex justify-center">
                      <Button variant="outline" className="w-full sm:w-auto gap-2">
                        <Pencil className="h-4 w-4" />
                        Edit listing
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      onClick={async () => {
                        if (!confirm("Delete this listing? This cannot be undone.")) return;
                        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
                        if (!token) return;
                        try {
                          await axiosInstance.delete(`${API}/listings/${id}/`, {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          showToast("Listing deleted", "success");
                          router.push("/profile");
                        } catch (e) {
                          showToast("Could not delete listing", "error");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete listing
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4 box-border">
          <Button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 min-w-[44px] min-h-[44px] bg-white/10 hover:bg-white/20 text-white touch-target z-10"
            size="icon"
          >
            <X className="h-6 w-6" />
          </Button>
          <Button
            onClick={prevImage}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 min-w-[48px] min-h-[48px] bg-white/10 hover:bg-white/20 text-white touch-target z-10"
            size="icon"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            onClick={nextImage}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 min-w-[48px] min-h-[48px] bg-white/10 hover:bg-white/20 text-white touch-target z-10"
            size="icon"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
          <img
            src={images[fullscreenIndex] || "/placeholder.svg"}
            alt="Fullscreen view"
            className="max-w-full max-h-[85vh] sm:max-h-[90vh] w-auto h-auto object-contain"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full z-10">
            {fullscreenIndex + 1} / {images.length}
          </div>
        </div>
      )}

      {showReportModal && (
        <ReportModal
          target="listing"
          targetId={Number(id)}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
