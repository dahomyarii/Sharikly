"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import axiosInstance from "@/lib/axios";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListingsMap from "@/components/ListingsMap";
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
  Share2,
  MessageCircle,
  List,
} from "lucide-react";
import ReportModal from "@/components/ReportModal";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useToast } from "@/components/ui/toast";
import { safeFormatDate } from "@/lib/utils";

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

  const { data, error: listingError } = useSWR(id ? `${API}/listings/${id}/` : null, fetcher);
  const { data: availability } = useSWR<{
    booked_ranges: { start: string; end: string }[];
    blocked_ranges?: { start: string; end: string; reason?: string }[];
  }>(
    id ? `${API}/listings/${id}/availability/` : null,
    (url: string) => axiosInstance.get(url).then((r) => r.data)
  );

  const { data: similarListings = [], isLoading: similarLoading } = useSWR<any[]>(
    id && API && data ? `${API}/listings/${id}/similar/` : null,
    (url: string) => axiosInstance.get(url).then((r) => (Array.isArray(r.data) ? r.data : []))
  );

  const [user, setUser] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showMobileBooking, setShowMobileBooking] = useState(false);

  const [reviews, setReviews] = useState<any[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [hasReportedListing, setHasReportedListing] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const similarSectionRef = useRef<HTMLDivElement>(null);

  const [newRating, setNewRating] = useState<number>(0);
  const [newComment, setNewComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const { showToast } = useToast();

  const startChatWithOwner = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access") ||
          localStorage.getItem("access_token") ||
          localStorage.getItem("token")
        : null;
    if (!token || !data?.owner?.id) {
      router.push("/chat");
      return;
    }
    try {
      const res = await axiosInstance.post(
        `${API}/chat/rooms/get-or-create/`,
        { participant_id: data.owner.id, listing_id: data.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const roomId = res.data?.id;
      if (roomId) {
        router.push(`/chat/${roomId}`);
        return;
      }
    } catch (e) {
      // fall back to inbox
    }
    router.push("/chat");
  };

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
            date: safeFormatDate(r.created_at),
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
    if (!data?.id) return;
    try {
      const key = "recently_viewed_listing_ids";
      const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      const prev = raw ? (JSON.parse(raw) as number[]) : [];
      const next = [data.id, ...prev.filter((id) => id !== data.id)].slice(0, 6);
      localStorage.setItem(key, JSON.stringify(next));
    } catch (_) {}
  }, [data?.id]);

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

  const is404 = listingError?.response?.status === 404;
  if (listingError && is404) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Listing not found</h1>
          <p className="text-gray-600 mb-6">
            This listing may have been removed or the link is incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => router.push("/listings")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Browse listings
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Go back
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: data?.title || "Listing",
          text: data?.description?.slice(0, 100) || "",
          url,
        });
        showToast("Link shared", "success");
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard", "success");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url);
          showToast("Link copied to clipboard", "success");
        } catch {
          showToast("Could not share", "error");
        }
      }
    }
  };

  const scrollToSimilar = () => {
    similarSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = headerSearch.trim();
    if (q) {
      router.push(`/listings?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/listings");
    }
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
      date: safeFormatDate(new Date()),
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
                  date: safeFormatDate(res.data.created_at) || optimistic.date,
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
    <div className="min-h-screen bg-background">

      <header className="sticky top-0 z-40 border-b border-white/50 bg-background/75 px-4 py-3 backdrop-blur-xl" style={{ paddingTop: "max(0.75rem, var(--safe-area-inset-top))" }}>
        <form onSubmit={handleHeaderSearchSubmit} className="max-w-7xl mx-auto flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="min-h-[44px] min-w-[44px] rounded-full border border-white/60 bg-white/85 text-foreground shadow-sm touch-target hover:bg-accent/70"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search listings..."
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className="w-full min-h-[48px] rounded-full border-white/60 bg-white/90 pl-10"
              aria-label="Search listings"
            />
          </div>
        </form>
      </header>

      <div className="marketplace-shell py-4 pb-24 sm:pb-8 lg:py-8">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <Link href="/listings" className="transition-colors hover:text-foreground">Listings</Link>
          {data.category?.name && (
            <>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <Link href={`/listings?category=${data.category.id}`} className="max-w-[120px] truncate transition-colors hover:text-foreground sm:max-w-[200px]">
                {data.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <span className="max-w-[140px] truncate font-medium text-foreground sm:max-w-[280px]" title={data.title}>
            {data.title}
          </span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="surface-panel overflow-hidden rounded-[34px] p-2 sm:p-3">
              {/* Mobile: fixed-height Amazon-style slideshow. Desktop: normal flexible layout. */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-2 sm:p-4 md:min-h-0">
                {/* Thumbnails: horizontal strip on mobile (small), vertical on desktop */}
                <div className="flex flex-row sm:flex-col gap-1.5 sm:gap-2 overflow-x-auto sm:overflow-y-auto sm:max-h-[500px] pb-1 sm:pb-0 shrink-0 md:shrink-0 scrollbar-hide">
                  {images.map((url: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setMainImage(url);
                      }}
                      className={`min-w-[56px] w-14 h-14 sm:w-16 sm:h-16 border-2 rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-200 touch-target active:scale-95 ${
                        mainImage === url
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40 active:border-primary/50"
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

                {/* Main image: forced small box on mobile, flexible on desktop */}
                <div className="flex-1 relative group min-w-0 min-h-0">
                  <div className="h-[320px] overflow-hidden rounded-[28px] bg-muted sm:h-auto sm:max-h-[40vh] sm:aspect-[4/3] md:max-h-[420px]">
                    <img
                      src={mainImage || images[0]}
                      alt={data.title}
                      className="w-full h-full object-cover object-center cursor-zoom-in"
                      fetchPriority="high"
                      decoding="async"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, 66vw"
                      onClick={() =>
                        openFullscreen(images.indexOf(mainImage || images[0]))
                      }
                    />
                  </div>
                  <Button
                    onClick={() =>
                      openFullscreen(images.indexOf(mainImage || images[0]))
                    }
                    className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 min-h-[40px] rounded-full bg-card/90 px-3 text-sm text-foreground opacity-100 transition-opacity touch-target hover:bg-card sm:min-h-[44px] sm:opacity-0 sm:group-hover:opacity-100"
                    size="sm"
                  >
                    <ZoomIn className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Zoom</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="surface-panel space-y-4 rounded-[34px] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="mb-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
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
                    <span className="text-lg font-semibold text-foreground">
                      {averageRating}
                    </span>
                    <span className="text-muted-foreground">
                      ({reviews.length} reviews)
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 flex-shrink-0">
                  <Button
                    onClick={handleShare}
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] rounded-full border border-border bg-background/80 text-muted-foreground touch-target hover:bg-accent/70 hover:text-foreground"
                  >
                    <Share2 className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                  {similarListings.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={scrollToSimilar}
                      className="min-h-[44px] rounded-full border border-border bg-background/80 text-muted-foreground touch-target hover:bg-accent/70 hover:text-foreground"
                    >
                      <List className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Similar</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setShowReportModal(true);
                      setHasReportedListing(false);
                    }}
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] rounded-full border border-border bg-background/80 text-muted-foreground touch-target hover:bg-accent/70 hover:text-foreground"
                  >
                    <Flag className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">
                      {hasReportedListing ? "Reported" : "Report"}
                    </span>
                  </Button>
                  <Button
                    onClick={toggleFavorite}
                    variant="ghost"
                    size="icon"
                    className="min-h-[44px] min-w-[44px] rounded-full border border-border bg-background/80 touch-target hover:bg-accent/70"
                  >
                    <Heart
                      className={`h-6 w-6 transition-all ${
                        isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                      }`}
                    />
                  </Button>
                </div>
              </div>

              <div className="rounded-[28px] bg-white/70 p-5">
                <h2 className="mb-3 text-xl font-semibold text-foreground">
                  Description
                </h2>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {data.description}
                </p>
              </div>

              {data.latitude && data.longitude && (
                <div className="rounded-[28px] bg-white/70 p-4 sm:p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">
                        Pickup Location
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {data.city
                          ? `Pickup near ${data.city}`
                          : "Pickup location shown on the map"}
                      </p>
                    </div>
                    {data.pickup_radius_m && (
                      <span className="rounded-full border border-border bg-background/75 px-3 py-1 text-xs font-medium text-muted-foreground">
                        ~{(data.pickup_radius_m / 1609.34).toFixed(1)} mi radius
                      </span>
                    )}
                  </div>
                  <ListingsMap
                    listings={[
                      {
                        id: data.id,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        pickup_radius_m: data.pickup_radius_m,
                        title: data.title,
                      },
                    ]}
                    selectedId={data.id}
                    className="rounded-[26px] border-white/80 bg-white/55"
                    hideFooter
                    mapHeightClassName="min-h-[210px] sm:min-h-[230px] lg:min-h-[245px]"
                  />
                </div>
              )}
            </div>

            <div className="surface-panel rounded-[34px] p-6">
              <h2 className="mb-4 text-2xl font-black tracking-tight text-foreground">
                Leave a review
              </h2>

              {userHasReviewed ? (
                <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-4">
                  <p className="text-blue-800 font-medium">
                    ✓ You have already reviewed this listing
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    You can only review a listing once.
                  </p>
                </div>
              ) : !user ? (
                <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
                  <p className="text-gray-700 font-medium">
                    Please log in to leave a review
                  </p>
                  <Button
                    onClick={() => router.push("/auth/login")}
                    className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Log In
                  </Button>
                </div>
              ) : isOwner ? (
                <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
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
                    className="h-28 w-full resize-none rounded-2xl border border-border bg-background/90 p-3"
                  />

                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={submitReview}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
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
            </div>

            <div className="surface-panel rounded-[34px] p-6">
              <h2 className="mb-6 text-2xl font-black tracking-tight text-foreground">
                Customer Reviews
              </h2>
              <div className="space-y-6">
                {reviews.length === 0 && (
                  <p className="text-muted-foreground">
                    No reviews yet. Be the first to review this listing.
                  </p>
                )}

                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-border pb-6 last:border-0"
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
                              <h4 className="font-semibold text-foreground">
                                {review.user.name}
                              </h4>
                            </a>
                            <p className="text-sm text-muted-foreground">
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
                        <p className="mb-3 text-foreground/90">{review.comment}</p>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleVote(review.id, "up")}
                            className={`flex items-center gap-2 text-sm transition-colors ${
                              review.userVote === "HELPFUL"
                                ? "text-blue-600 font-semibold"
                                : "text-muted-foreground hover:text-blue-600"
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
                                : "text-muted-foreground hover:text-red-600"
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
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            {/* Desktop booking card */}
            <div className="surface-panel sticky top-24 hidden space-y-5 rounded-[34px] p-6 lg:block">
              {/* Price */}
              <div className="border-b border-border pb-5 text-center">
                <div className="mb-1 text-4xl font-black tracking-tight text-primary">
                  SAR {data.price_per_day}
                </div>
                <div className="text-muted-foreground">per day</div>
              </div>

              {/* Calendar */}
              <div>
                <h3 className="mb-3 text-lg font-semibold text-foreground">
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
                      if (!availability?.booked_ranges?.length && !availability?.blocked_ranges?.length) return false;
                      const d = new Date(date);
                      d.setHours(0, 0, 0, 0);
                      const isIn = (ranges: { start: string; end: string }[] | undefined) => {
                        if (!ranges?.length) return false;
                        return ranges.some((r) => {
                          const start = new Date(r.start);
                          const end = new Date(r.end);
                          start.setHours(0, 0, 0, 0);
                          end.setHours(0, 0, 0, 0);
                          return d >= start && d <= end;
                        });
                      };
                      return isIn(availability.booked_ranges) || isIn(availability.blocked_ranges);
                    }}
                    className="w-full"
                  />
                </div>

                {/* Date selection summary */}
                {dateRange?.from && (
                  <div className="mt-3 text-center text-sm text-muted-foreground">
                    {dateRange.to ? (
                      <span>
                        {dateRange.from.toLocaleDateString()} &mdash; {dateRange.to.toLocaleDateString()}
                      </span>
                    ) : (
                      <span>
                        {dateRange.from.toLocaleDateString()} &mdash; <span className="text-muted-foreground">select end date</span>
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
                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>SAR {pricePerDay.toFixed(2)} &times; {nights} day{nights !== 1 ? "s" : ""}</span>
                      <span>SAR {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Service fee</span>
                      <span>SAR {serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-3 text-base font-bold text-foreground">
                      <span>Total</span>
                      <span>SAR {total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Action Button */}
              <div className="pt-2">
                {user && !isOwner && (
                  <Button
                    onClick={handleRequestBooking}
                    className="h-14 w-full min-h-[52px] rounded-2xl text-lg font-semibold touch-target"
                  >
                    Send Request
                  </Button>
                )}
                {!user && (
                  <div className="text-center">
                    <p className="mb-3 text-sm text-muted-foreground">
                      Please log in to request booking
                    </p>
                    <Button
                      onClick={() => router.push("/auth/login")}
                      className="h-12 w-full rounded-2xl font-semibold"
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
                {similarListings.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={scrollToSimilar}
                    className="w-full gap-2 rounded-2xl"
                  >
                    <List className="h-4 w-4" />
                    View similar listings
                  </Button>
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
                          if (API) {
                            mutate(`${API}/listings/`);
                            mutate((k) => typeof k === "string" && k.includes("/listings/"), undefined, { revalidate: true });
                          }
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
            </div>

            <div className="surface-panel rounded-[34px] p-5 sm:p-6">
              <div className="flex items-start gap-4 border-b border-border pb-5">
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
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-white/80 transition-all hover:ring-primary/20"
                  />
                </a>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <a href={`/user/${data.owner?.id}`} className="min-w-0 hover:underline">
                      <h3 className="truncate text-base font-semibold text-foreground">
                        {data.owner?.username || "Unknown"}
                      </h3>
                    </a>
                    {data.owner?.is_email_verified && (
                      <Check className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                    <span className="font-medium text-foreground">
                      {averageRating > 0 ? averageRating : "New"}
                    </span>
                    <span>
                      {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {data.owner?.date_joined && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Member since{" "}
                      {new Date(data.owner.date_joined).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-5 pt-5">
                <div className="space-y-2.5">
                  <h3 className="text-base font-semibold text-foreground">
                    About the owner
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex gap-2">
                      <span className="font-medium text-foreground">
                        Identity:
                      </span>
                      <span>
                        {data.owner?.is_email_verified
                          ? "Verified account"
                          : "Identity not yet verified"}
                      </span>
                    </div>
                    {typeof data.owner?.response_rate === "number" && (
                      <div className="flex gap-2">
                        <span className="font-medium text-foreground">
                          Response rate:
                        </span>
                        <span>{data.owner.response_rate}%</span>
                      </div>
                    )}
                    {typeof data.owner?.typical_response_minutes === "number" && (
                      <div className="flex gap-2">
                        <span className="font-medium text-foreground">
                          Response time:
                        </span>
                        <span>
                          {data.owner.typical_response_minutes <= 60
                            ? "Usually within an hour"
                            : data.owner.typical_response_minutes <= 180
                            ? "Usually within a few hours"
                            : data.owner.typical_response_minutes <= 1440
                            ? "Usually within a day"
                            : "Usually within a few days"}
                        </span>
                      </div>
                    )}
                    {data.city && (
                      <div className="flex gap-2">
                        <span className="font-medium text-foreground">
                          Pickup:
                        </span>
                        <span>Near {data.city}</span>
                      </div>
                    )}
                  </div>
                  {!isOwner && (
                    <Button
                      variant="outline"
                      onClick={startChatWithOwner}
                      className="mt-2 h-11 w-full rounded-2xl"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Message user
                    </Button>
                  )}
                </div>

                <div className="border-t border-border pt-5">
                  <h3 className="mb-3 text-base font-semibold text-foreground">
                    Good to know
                  </h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="shrink-0 font-medium text-foreground">
                        Cancellation:
                      </span>
                      <span>
                        Contact the owner for cancellation policy. You can cancel
                        from My Bookings before payment.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 font-medium text-foreground">
                        What to bring:
                      </span>
                      <span>
                        Only yourself. Pick up and return at the agreed location,
                        and return the item in the same condition.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 font-medium text-foreground">
                        Questions:
                      </span>
                      <span>
                        Use the message button before booking if you want to check
                        anything with the owner first.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar / Recommended listings — real algorithm (same category + price similarity) */}
        <section
          ref={similarSectionRef}
          className="mt-8 border-t border-border pt-8 sm:mt-12 sm:pt-12"
        >
          <h2 className="mb-4 text-xl font-black tracking-tight text-foreground sm:mb-6 sm:text-2xl">
            Similar listings
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            More like this — same category, similar price
          </p>

          {similarLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-gray-100 border border-gray-200 animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!similarLoading && similarListings.length === 0 && (
            <div className="text-center py-8 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-gray-500 mb-2">No similar listings right now.</p>
              <Link href="/listings" className="text-blue-600 hover:underline font-medium">
                Browse all listings →
              </Link>
            </div>
          )}

          {!similarLoading && similarListings.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {similarListings.map((item: any) => {
                const imgUrl =
                  item.images?.[0]?.image?.startsWith("http")
                    ? item.images[0].image
                    : item.images?.[0]?.image
                      ? `${API}${item.images[0].image}`
                      : "/hero.jpg";
                return (
                  <Link
                    key={item.id}
                    href={`/listings/${item.id}`}
                    className="group block rounded-xl overflow-hidden bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider line-clamp-1">
                        {item.category?.name || "Listing"}
                      </span>
                      <h3 className="font-semibold text-gray-900 mt-0.5 line-clamp-2 group-hover:text-gray-700">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-blue-600">
                          ${item.price_per_day}
                        </span>
                        <span className="text-xs text-gray-500">/day</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Mobile bottom \"See available dates\" bar above nav */}
      {!isOwner && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+var(--safe-area-inset-bottom))] lg:hidden pointer-events-none">
          <div className="max-w-md mx-auto rounded-2xl bg-background/95 border border-purple-500/40 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl flex items-center justify-between gap-3 px-3 py-2 pointer-events-auto mobile-listing-cta-enter">
            <Button
              className="flex-1 min-h-[40px] rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold text-sm shadow-md"
              onClick={() => setShowMobileBooking(true)}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span>
                  ${data.price_per_day}
                  <span className="text-[11px] opacity-90"> /day</span>
                </span>
                <span className="opacity-80">·</span>
                <span>See available dates</span>
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Mobile full-screen booking flow (Fat Llama style) */}
      {showMobileBooking && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3" style={{ paddingTop: "max(0.75rem, var(--safe-area-inset-top))" }}>
            <h2 className="text-base font-semibold text-gray-900">
              Select rental period
            </h2>
            <button
              type="button"
              onClick={() => setShowMobileBooking(false)}
              className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-auto px-4 pt-4 pb-28">
            <div className="mb-4 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                {safeFormatDate(new Date())?.split(" ").slice(1).join(" ")}
              </p>
            </div>

            <div className="flex justify-center mb-4">
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
                  if (!availability?.booked_ranges?.length && !availability?.blocked_ranges?.length) return false;
                  const d = new Date(date);
                  d.setHours(0, 0, 0, 0);
                  const isIn = (ranges: { start: string; end: string }[] | undefined) => {
                    if (!ranges?.length) return false;
                    return ranges.some((r) => {
                      const start = new Date(r.start);
                      const end = new Date(r.end);
                      start.setHours(0, 0, 0, 0);
                      end.setHours(0, 0, 0, 0);
                      return d >= start && d <= end;
                    });
                  };
                  return isIn(availability.booked_ranges) || isIn(availability.blocked_ranges);
                }}
              />
            </div>

            {/* Pickup / Drop-off summary */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Pickup</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {dateRange?.from
                    ? dateRange.from.toLocaleDateString()
                    : "Select date"}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Drop off</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {dateRange?.to
                    ? dateRange.to.toLocaleDateString()
                    : "Select date"}
                </p>
              </div>
            </div>

            {/* Mobile price breakdown */}
            {dateRange?.from && dateRange?.to && (() => {
              const msPerDay = 1000 * 60 * 60 * 24;
              const nights = Math.max(
                1,
                Math.round(
                  (dateRange.to!.getTime() - dateRange.from!.getTime()) /
                    msPerDay
                )
              );
              const pricePerDay = parseFloat(data.price_per_day) || 0;
              const subtotal = pricePerDay * nights;
              const serviceFee = Math.round(subtotal * 0.1 * 100) / 100;
              const total = Math.round((subtotal + serviceFee) * 100) / 100;
              return (
                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>
                      ${pricePerDay.toFixed(2)} × {nights} day
                      {nights !== 1 ? "s" : ""}
                    </span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service fee</span>
                    <span>${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}

            <p className="mt-4 text-xs text-blue-600 flex items-start gap-1">
              <span className="mt-[2px]">🛡️</span>
              <span>
                No commitment when you send a request. You can ask the owner
                questions before confirming.
              </span>
            </p>
          </div>

          <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-4 pb-[calc(1rem+var(--safe-area-inset-bottom))] pt-2 lg:hidden">
            {user && !isOwner ? (
              <Button
                className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50"
                disabled={!dateRange?.from || !dateRange?.to}
                onClick={() => {
                  handleRequestBooking();
                  setShowMobileBooking(false);
                }}
              >
                Send request
              </Button>
            ) : !user ? (
              <Button
                className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold"
                onClick={() => {
                  setShowMobileBooking(false);
                  router.push("/auth/login");
                }}
              >
                Log in to continue
              </Button>
            ) : null}
          </div>
        </div>
      )}

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
          onSuccess={() => setHasReportedListing(true)}
        />
      )}
    </div>
  );
}
