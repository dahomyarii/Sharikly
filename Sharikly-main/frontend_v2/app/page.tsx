"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
  Search,
  Heart,
  Sparkles,
  Briefcase,
  Music,
  Camera,
  Utensils,
  Mic,
  Plus,
  Star,
  User,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import SkeletonLoader from "@/components/SkeletonLoader";
import { useLocale } from "@/components/LocaleProvider";

const API = process.env.NEXT_PUBLIC_API_BASE;

function buildListingsQuery(params: {
  search: string;
  category: string;
  city: string;
  min_price: string;
  max_price: string;
  order: string;
}): string {
  const sp = new URLSearchParams();
  if (params.search.trim()) sp.set("search", params.search.trim());
  if (params.category) sp.set("category", params.category);
  if (params.city.trim()) sp.set("city", params.city.trim());
  if (params.min_price) sp.set("min_price", params.min_price);
  if (params.max_price) sp.set("max_price", params.max_price);
  if (params.order && params.order !== "newest") sp.set("order", params.order);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export default function HomePage() {
  const { t } = useLocale();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const heroSearchInputRef = useRef<HTMLInputElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [token, setToken] = useState<string>("");
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Hero expandable search
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showHeroFilters, setShowHeroFilters] = useState(false);
  const [heroSearch, setHeroSearch] = useState("");
  const [heroCategory, setHeroCategory] = useState("");
  const [heroCity, setHeroCity] = useState("");
  const [heroMinPrice, setHeroMinPrice] = useState("");
  const [heroMaxPrice, setHeroMaxPrice] = useState("");
  const [heroSort, setHeroSort] = useState("newest");

  // Initialize token from localStorage
  useEffect(() => {
    const loadToken = () => {
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) {
        setToken(storedToken);
      }
      setTokenLoaded(true);
    };

    loadToken();

    // Listen for login events to update token and refresh data
    const handleLogin = (event: CustomEvent) => {
      const newToken =
        event.detail?.token || localStorage.getItem("access_token");
      if (newToken) {
        setToken(newToken);
        // Revalidate SWR data with new token
        if (API) {
          mutate(`${API}/listings/`);
        }
      }
    };

    // Listen for logout events to clear token
    const handleLogout = () => {
      setToken("");
      if (API) {
        mutate(`${API}/listings/`);
      }
    };

    window.addEventListener("userLogin", handleLogin as EventListener);
    window.addEventListener("userLogout", handleLogout as EventListener);

    return () => {
      window.removeEventListener("userLogin", handleLogin as EventListener);
      window.removeEventListener("userLogout", handleLogout as EventListener);
    };
  }, []);

  // Custom fetcher for public endpoints (like listings)
  // Don't send token for public endpoints - if token is expired, it causes 401 errors
  const fetcher = useCallback((url: string) => {
    if (!url || !API) {
      return Promise.resolve([]);
    }

    // For public endpoints like /listings/, don't send token
    // The endpoint has AllowAny permission, so token is optional
    // If token is expired, sending it causes 401 errors
    return axiosInstance
      .get(url)
      .then((res) => res.data)
      .catch((error) => {
        // If 401 occurs, the interceptor will clear the token
        // Retry once without token for public endpoints
        if (error.response?.status === 401 && url.includes("/listings/")) {
          // Token was cleared by interceptor, retry without token
          return axiosInstance
            .get(url)
            .then((res) => res.data)
            .catch(() => []);
        }

        // Silently handle expected errors (400, 401, 403, 404)
        // Only log unexpected errors
        if (
          error.response?.status &&
          ![400, 401, 403, 404].includes(error.response.status)
        ) {
          console.error("Error fetching listings:", error);
        }
        return [];
      });
  }, []);

  // Fetch listings immediately - it's a public endpoint, no token needed
  const { data: listings, isLoading: isListingsLoading } = useSWR(
    API ? `${API}/listings/` : null,
    fetcher,
    {
      onError: (error: any) => {
        // Silently handle expected errors (400, 401, 403, 404)
        // Only log unexpected errors
        if (
          error?.response?.status &&
          ![400, 401, 403, 404].includes(error.response.status)
        ) {
          console.error("SWR error:", error);
        }
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    },
  );
  // Normalize: API may return paginated { results } or plain array
  const listingsArray = Array.isArray(listings)
    ? listings
    : (listings?.results ?? []);

  // Filter listings based on selected category
  const filteredListings = selectedCategory
    ? listingsArray.filter(
        (listing: any) => listing.category?.id === selectedCategory,
      )
    : listingsArray;

  const featuredService = filteredListings?.[0];
  const hotServices = filteredListings?.slice(1, 4) ?? [];
  const recommendations = filteredListings?.slice(4, 10) ?? [];

  // Set initial favorite state from listings data
  useEffect(() => {
    const arr = Array.isArray(listings) ? listings : (listings?.results ?? []);
    if (arr.length > 0) {
      const favoriteIds = new Set<number>();
      arr.forEach((listing: any) => {
        if (listing.is_favorited) {
          favoriteIds.add(listing.id);
        }
      });
      setFavorites(favoriteIds);
    }
  }, [listings]);

  const handleFavoriteClick = useCallback(
    async (e: React.MouseEvent, listingId: number) => {
      e.preventDefault();

      if (!token) {
        alert(t("please_login_favorites"));
        return;
      }

      setFavorites((prevFavorites) => {
        const isFavorited = prevFavorites.has(listingId);

        if (isFavorited) {
          // Optimistically remove from favorites
          const newSet = new Set(prevFavorites);
          newSet.delete(listingId);

          // Make the API call
          axiosInstance
            .delete(`${API}/listings/${listingId}/unfavorite/`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch((error) => {
              console.error("Error removing from favorites:", error);
              // Revert on error
              setFavorites((prev) => new Set(prev).add(listingId));
              alert("Error updating favorite");
            });

          return newSet;
        } else {
          // Optimistically add to favorites
          const newSet = new Set(prevFavorites);
          newSet.add(listingId);

          // Make the API call
          axiosInstance
            .post(
              `${API}/listings/${listingId}/favorite/`,
              {},
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            )
            .catch((error) => {
              console.error("Error adding to favorites:", error);
              // Revert on error
              setFavorites((prev) => {
                const reverted = new Set(prev);
                reverted.delete(listingId);
                return reverted;
              });
              alert("Error updating favorite");
            });

          return newSet;
        }
      });
    },
    [token],
  );

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let lastTimestamp = 0;
    const scrollSpeed = 0.5;

    const smoothScroll = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (isAutoScrolling && scrollContainer) {
        const newScrollLeft =
          scrollContainer.scrollLeft + scrollSpeed * deltaTime;
        if (
          newScrollLeft >=
          scrollContainer.scrollWidth - scrollContainer.clientWidth
        ) {
          scrollContainer.scrollLeft = 0;
        } else {
          scrollContainer.scrollLeft = newScrollLeft;
        }
      }

      animationFrameId = requestAnimationFrame(smoothScroll);
    };

    animationFrameId = requestAnimationFrame(smoothScroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoScrolling]);

  const handleMouseEnter = () => setIsAutoScrolling(false);
  const handleMouseLeave = () => setIsAutoScrolling(true);

  // Fetch categories from the backend
  useEffect(() => {
    if (!API) {
      return;
    }
    axiosInstance
      .get(`${API}/categories/`)
      .then((res) => setCategories(res.data))
      .catch((err) => {
        // Silently handle expected errors (400, 401, 403, 404)
        // Only log unexpected errors
        if (
          err.response?.status &&
          ![400, 401, 403, 404].includes(err.response.status)
        ) {
          console.error("Failed to fetch categories:", err);
        }
        setCategories([]);
      });
  }, []);

  // Focus search input when hero search expands
  useEffect(() => {
    if (searchExpanded) {
      const id = setTimeout(() => heroSearchInputRef.current?.focus(), 150);
      return () => clearTimeout(id);
    }
  }, [searchExpanded]);

  const handleHeroSearchSubmit = () => {
    const query = buildListingsQuery({
      search: heroSearch,
      category: heroCategory,
      city: heroCity,
      min_price: heroMinPrice,
      max_price: heroMaxPrice,
      order: heroSort,
    });
    router.push(`/listings${query}`);
  };

  // Map category names to icons and colors for display
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: { icon: any; color: string } } = {
      Weddings: { icon: Sparkles, color: "from-pink-500 to-rose-500" },
      Corporate: { icon: Briefcase, color: "from-blue-500 to-cyan-500" },
      Music: { icon: Music, color: "from-purple-500 to-violet-500" },
      Photography: { icon: Camera, color: "from-orange-500 to-amber-500" },
      Catering: { icon: Utensils, color: "from-green-500 to-emerald-500" },
      Audio: { icon: Mic, color: "from-red-500 to-pink-500" },
    };

    // Try exact match first, then partial match
    if (iconMap[categoryName]) return iconMap[categoryName];

    for (const [key, value] of Object.entries(iconMap)) {
      if (categoryName.includes(key) || key.includes(categoryName)) {
        return value;
      }
    }

    // Default icon
    return { icon: Sparkles, color: "from-blue-500 to-cyan-500" };
  };

  // Use listing.average_rating / listing.reviews when present to avoid extra API calls (prevents 429)
  const RatingDisplay = ({
    listing,
  }: {
    listing: { id: number; average_rating?: number; reviews?: any[] };
  }) => {
    const fromListing =
      listing.average_rating != null ||
      (Array.isArray(listing.reviews) && listing.reviews.length > 0);
    const computedRating =
      listing.average_rating != null
        ? listing.average_rating
        : Array.isArray(listing.reviews) && listing.reviews.length > 0
          ? Math.round(
              (listing.reviews.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) /
                listing.reviews.length) * 10
            ) / 10
          : 0;
    const computedCount = Array.isArray(listing.reviews) ? listing.reviews.length : 0;

    const [rating, setRating] = useState<number>(fromListing ? computedRating : 0);
    const [reviewCount, setReviewCount] = useState<number>(fromListing ? computedCount : 0);
    const [fetched, setFetched] = useState(false);

    useEffect(() => {
      if (fromListing || fetched) return;
      const fetchRating = async () => {
        try {
          const response = await axiosInstance.get(
            `${API}/reviews/?listing=${listing.id}`,
          );
          setFetched(true);
          if (Array.isArray(response.data)) {
            const reviews = response.data;
            const count = reviews.length;
            const avg =
              count > 0
                ? Math.round(
                    (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
                      count) * 10,
                  ) / 10
                : 0;
            setRating(avg);
            setReviewCount(count);
          }
        } catch (error: any) {
          if (error?.response?.status !== 429) {
            console.error("Error fetching rating:", error);
          }
          setFetched(true);
        }
      };
      fetchRating();
    }, [listing.id, fromListing, fetched]);

    const displayRating = fromListing ? computedRating : rating;
    const displayCount = fromListing ? computedCount : reviewCount;

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.round(displayRating)
                  ? "fill-orange-500 text-orange-500"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">
          ({displayCount} {displayCount === 1 ? t("review") : t("reviews")})
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero — keep image, refined overlay and content */}
      <section className="relative min-h-[42vh] sm:min-h-[48vh] md:min-h-[52vh] flex flex-col justify-center overflow-hidden">
        <img
          src="/image.jpeg"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-4 sm:mb-5">
            {t("hero_title")}
          </h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-8 sm:mb-10 font-medium">
            {t("hero_sub")}
          </p>

          {/* Expandable search: Browse button → search bar + filters */}
          <div className="w-full max-w-2xl mx-auto">
            {!searchExpanded ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Button
                  size="lg"
                  onClick={() => setSearchExpanded(true)}
                  className="w-full sm:w-auto min-h-[48px] bg-white text-neutral-900 hover:bg-neutral-100 rounded-full px-8 text-base font-semibold shadow-lg transition-all duration-300"
                >
                  <Search className="h-5 w-5 mr-2" />
                  {t("browse")}
                </Button>
                <Link href="/listings/new" className="w-full sm:w-auto touch-target">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto min-h-[48px] border-2 border-white text-white hover:bg-white/10 rounded-full px-8 text-base font-semibold bg-transparent"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {t("list_new")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div
                className="rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl border border-white/20 overflow-hidden transition-all duration-300 ease-out hero-search-expand"
              >
                <div className="flex flex-col sm:flex-row gap-0">
                  <div className="relative flex-1 flex items-center">
                    <Search className="absolute left-4 h-5 w-5 text-neutral-400 pointer-events-none" />
                    <input
                      ref={heroSearchInputRef}
                      type="search"
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleHeroSearchSubmit();
                        if (e.key === "Escape") setSearchExpanded(false);
                      }}
                      placeholder={t("search_listings")}
                      className="w-full pl-12 pr-4 py-3.5 sm:py-4 text-neutral-900 placeholder:text-neutral-400 bg-transparent border-0 focus:outline-none focus:ring-0 text-base"
                      aria-label={t("search_listings")}
                    />
                    <button
                      type="button"
                      onClick={() => setSearchExpanded(false)}
                      className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors touch-target"
                      aria-label="Close search"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex border-t sm:border-t-0 sm:border-l border-neutral-200/60">
                    <button
                      type="button"
                      onClick={() => setShowHeroFilters(!showHeroFilters)}
                      className={`flex items-center gap-2 px-4 py-3.5 sm:py-4 text-sm font-medium transition-colors touch-target ${showHeroFilters ? "text-neutral-900 bg-neutral-100" : "text-neutral-600 hover:bg-neutral-50"}`}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                    </button>
                    <Button
                      size="lg"
                      onClick={handleHeroSearchSubmit}
                      className="rounded-none min-h-[52px] px-6 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold"
                    >
                      Search
                    </Button>
                  </div>
                </div>

                {/* Filters panel — smooth height + content fade */}
                <div
                  className={`hero-filters-grid grid ${
                    showHeroFilters ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div
                      className={`border-t border-neutral-200/60 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-neutral-50/80 ${
                        showHeroFilters ? "hero-filters-enter" : ""
                      }`}
                    >
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                          {t("category")}
                        </label>
                        <select
                          value={heroCategory}
                          onChange={(e) => setHeroCategory(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                        >
                          <option value="">{t("all_categories")}</option>
                          {(categories || []).map((cat: any) => (
                            <option key={cat.id} value={String(cat.id)}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                          {t("city")}
                        </label>
                        <input
                          type="text"
                          value={heroCity}
                          onChange={(e) => setHeroCity(e.target.value)}
                          placeholder={t("city")}
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                          {t("min_price")}
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={heroMinPrice}
                          onChange={(e) => setHeroMinPrice(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                          {t("max_price")}
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={heroMaxPrice}
                          onChange={(e) => setHeroMaxPrice(e.target.value)}
                          placeholder="—"
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 flex flex-wrap items-center gap-3 bg-neutral-50/80">
                      <span className="text-xs font-medium text-neutral-500">
                        Sort:
                      </span>
                      <select
                        value={heroSort}
                        onChange={(e) => setHeroSort(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                      >
                        <option value="newest">{t("sort_newest")}</option>
                        <option value="price_asc">{t("sort_price_low")}</option>
                        <option value="price_desc">{t("sort_price_high")}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="bg-white">
        {/* Categories — clean horizontal scroll / grid */}
        <section className="border-b border-neutral-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
              {t("category")}
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all touch-target ${
                  selectedCategory === null
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                {t("all_categories")}
              </button>
              {categories.map((cat) => {
                const { icon: IconComponent, color } = getCategoryIcon(cat.name);
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all touch-target ${
                      isSelected
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured — one hero-style card */}
        {featuredService && (
          <section className="py-12 md:py-16 bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                {t("featured")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-8">
                {t("hero_title")}
              </h2>

              <Link href={`/listings/${featuredService.id}`} className="block group">
                <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200/80 hover:shadow-xl hover:ring-neutral-300/80 transition-all duration-300">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[380px] bg-neutral-100 overflow-hidden">
                      {featuredService.images?.[0]?.image && (
                        <img
                          src={
                            featuredService.images[0].image.startsWith("http")
                              ? featuredService.images[0].image
                              : `${API}${featuredService.images[0].image}`
                          }
                          alt={featuredService.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                          fetchPriority="high"
                          decoding="async"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      )}
                    </div>
                    <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-between">
                      <div>
                        <span className="inline-block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
                          {featuredService.category?.name || t("listings")}
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3 group-hover:text-neutral-700">
                          {featuredService.title}
                        </h3>
                        <p className="text-neutral-600 mb-5 line-clamp-3">
                          {featuredService.description}
                        </p>
                        <div className="mb-6">
                          <RatingDisplay listing={featuredService} />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-neutral-100">
                        <div>
                          <span className="text-3xl font-bold text-neutral-900">
                            ${featuredService.price_per_day}
                          </span>
                          <span className="text-neutral-500 ml-1 text-sm">
                            {t("price_per_day")}
                          </span>
                        </div>
                        <span className="inline-flex items-center text-sm font-semibold text-neutral-900 group-hover:underline">
                          {t("request_book")}
                          <span className="ml-1">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            </div>
          </section>
        )}

        {/* Popular listings — grid */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  {t("listings")}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                  Popular right now
                </h2>
              </div>
              <Link
                href="/listings"
                className="text-sm font-semibold text-neutral-900 hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {isListingsLoading
                ? [...Array(6)].map((_, i) => <SkeletonLoader key={i} />)
                : hotServices.map((service: any) => (
                    <Link
                      key={service.id}
                      href={`/listings/${service.id}`}
                      className="group block"
                    >
                      <article className="overflow-hidden rounded-2xl bg-white border border-neutral-200/80 hover:border-neutral-300 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                        <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                          {service.images?.[0]?.image && (
                            <img
                              src={
                                service.images[0].image.startsWith("http")
                                  ? service.images[0].image
                                  : `${API}${service.images[0].image}`
                              }
                              alt={service.title}
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                              loading="lazy"
                              decoding="async"
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleFavoriteClick(e, service.id);
                            }}
                            className={`absolute top-3 right-3 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center shadow-sm transition-opacity touch-target ${
                              favorites.has(service.id)
                                ? "bg-red-500 text-white"
                                : "bg-white/95 text-neutral-600 hover:bg-white"
                            }`}
                          >
                            <Heart
                              className="h-5 w-5"
                              fill={
                                favorites.has(service.id)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>
                        </div>
                        <div className="p-4 sm:p-5 flex flex-col flex-1">
                          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            {service.category?.name || t("listing")}
                          </span>
                          <h3 className="text-lg font-semibold text-neutral-900 mt-1 mb-2 line-clamp-2 group-hover:text-neutral-700">
                            {service.title}
                          </h3>
                          {service.owner && (
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded-full bg-neutral-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {service.owner.avatar ? (
                                  <img
                                    src={
                                      service.owner.avatar.startsWith("http")
                                        ? service.owner.avatar
                                        : `${API?.replace("/api", "")}${service.owner.avatar}`
                                    }
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-3.5 h-3.5 text-neutral-400" />
                                )}
                              </div>
                              <span className="text-xs text-neutral-500 truncate">
                                {service.owner.username || service.owner.email}
                              </span>
                            </div>
                          )}
                          <div className="mb-4 mt-auto">
                            <RatingDisplay listing={service} />
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                            <span className="text-xl font-bold text-neutral-900">
                              ${service.price_per_day}
                              <span className="text-sm font-normal text-neutral-500">
                                {" "}
                                {t("price_per_day")}
                              </span>
                            </span>
                            <span className="text-sm font-semibold text-neutral-900 group-hover:underline">
                              {t("book_now")} →
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
            </div>
          </div>
        </section>

        {/* More to explore — horizontal scroll */}
        <section className="py-12 md:py-16 bg-neutral-50 border-t border-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Explore
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                  More to explore
                </h2>
              </div>
              <Link
                href="/listings"
                className="hidden sm:block text-sm font-semibold text-neutral-900 hover:underline"
              >
                View all
              </Link>
            </div>
            <div
              className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
              ref={scrollContainerRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {isListingsLoading
                ? [...Array(6)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-[280px]">
                      <SkeletonLoader />
                    </div>
                  ))
                : recommendations.map((service: any) => (
                    <Link
                      key={service.id}
                      href={`/listings/${service.id}`}
                      className="group flex-shrink-0 w-[280px] block"
                    >
                      <article className="overflow-hidden rounded-2xl bg-white border border-neutral-200/80 hover:border-neutral-300 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                        <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                          {service.images?.[0]?.image && (
                            <img
                              src={
                                service.images[0].image.startsWith("http")
                                  ? service.images[0].image
                                  : `${API}${service.images[0].image}`
                              }
                              alt={service.title}
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                              loading="lazy"
                              decoding="async"
                              sizes="280px"
                            />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleFavoriteClick(e, service.id);
                            }}
                            className={`absolute top-3 right-3 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center shadow-sm touch-target ${
                              favorites.has(service.id)
                                ? "bg-red-500 text-white"
                                : "bg-white/95 text-neutral-600 hover:bg-white"
                            }`}
                          >
                            <Heart
                              className="h-5 w-5"
                              fill={
                                favorites.has(service.id)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            {service.category?.name || t("listing")}
                          </span>
                          <h3 className="text-base font-semibold text-neutral-900 mt-1 mb-2 line-clamp-2 group-hover:text-neutral-700">
                            {service.title}
                          </h3>
                          <div className="mb-3 mt-auto">
                            <RatingDisplay listing={service} />
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                            <span className="text-lg font-bold text-neutral-900">
                              ${service.price_per_day}
                              <span className="text-xs font-normal text-neutral-500">
                                /day
                              </span>
                            </span>
                            <span className="text-sm font-semibold text-neutral-900 group-hover:underline">
                              {t("view")} →
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
