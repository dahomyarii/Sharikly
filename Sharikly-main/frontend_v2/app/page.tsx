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
import { toListingsArray, sliceListings, buildListingsQuery } from "@/lib/listingsUtils";
import ListingCard from "@/components/ListingCard";

const API = process.env.NEXT_PUBLIC_API_BASE;

// Unselected: outline only (border + text, less bright)
const CATEGORY_OUTLINE_COLORS = [
  "border-pink-300/80 text-pink-700 bg-transparent dark:border-pink-500/50 dark:text-pink-300 dark:bg-transparent",
  "border-sky-300/80 text-sky-700 bg-transparent dark:border-sky-500/50 dark:text-sky-300 dark:bg-transparent",
  "border-violet-300/80 text-violet-700 bg-transparent dark:border-violet-500/50 dark:text-violet-300 dark:bg-transparent",
  "border-amber-300/80 text-amber-700 bg-transparent dark:border-amber-500/50 dark:text-amber-300 dark:bg-transparent",
  "border-emerald-300/80 text-emerald-700 bg-transparent dark:border-emerald-500/50 dark:text-emerald-300 dark:bg-transparent",
  "border-rose-300/80 text-rose-700 bg-transparent dark:border-rose-500/50 dark:text-rose-300 dark:bg-transparent",
];

// Selected: filled background (softer, not bright)
const CATEGORY_FILLED_COLORS = [
  "border-pink-300 bg-pink-200/90 text-pink-800 dark:border-pink-500/60 dark:bg-pink-900/50 dark:text-pink-100",
  "border-sky-300 bg-sky-200/90 text-sky-800 dark:border-sky-500/60 dark:bg-sky-900/50 dark:text-sky-100",
  "border-violet-300 bg-violet-200/90 text-violet-800 dark:border-violet-500/60 dark:bg-violet-900/50 dark:text-violet-100",
  "border-amber-300 bg-amber-200/90 text-amber-800 dark:border-amber-500/60 dark:bg-amber-900/50 dark:text-amber-100",
  "border-emerald-300 bg-emerald-200/90 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-900/50 dark:text-emerald-100",
  "border-rose-300 bg-rose-200/90 text-rose-800 dark:border-rose-500/60 dark:bg-rose-900/50 dark:text-rose-100",
];

const getCategoryOutlineById = (id: number) => {
  if (!CATEGORY_OUTLINE_COLORS.length) return CATEGORY_OUTLINE_COLORS[0];
  const safeId = Number.isFinite(id) ? Math.abs(id) : 0;
  const index = safeId % CATEGORY_OUTLINE_COLORS.length;
  return CATEGORY_OUTLINE_COLORS[index];
};

const getCategoryFilledById = (id: number) => {
  if (!CATEGORY_FILLED_COLORS.length) return CATEGORY_FILLED_COLORS[0];
  const safeId = Number.isFinite(id) ? Math.abs(id) : 0;
  const index = safeId % CATEGORY_FILLED_COLORS.length;
  return CATEGORY_FILLED_COLORS[index];
};

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
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<number[]>([]);

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
      .then((res) => {
        const data = res.data;
        // Normalize: always return a plain array so component never sees paginated/non-array shape
        return toListingsArray(data);
      })
      .catch((error) => {
        // If 401 occurs, the interceptor will clear the token
        // Retry once without token for public endpoints
        if (error.response?.status === 401 && url.includes("/listings/")) {
          // Token was cleared by interceptor, retry without token
          return axiosInstance
            .get(url)
            .then((res) => toListingsArray(res.data))
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
  // Single source of truth: always a real array (fetcher normalizes, but guard for SWR cache/undefined)
  const listingsArray: any[] = toListingsArray(listings);

  // Filter by category; still an array
  const filteredListings: any[] = selectedCategory
    ? listingsArray.filter(
        (listing: any) => listing.category?.id === selectedCategory,
      )
    : listingsArray;

  // Only ever call .slice on a value we know is an array
  const safeList: any[] = toListingsArray(filteredListings);
  const featuredService = safeList[0];
  const hotServices = sliceListings(safeList, 1, 4);
  const recommendations = sliceListings(safeList, 4, 10);

  // Set initial favorite state from listings data
  useEffect(() => {
    const arr = toListingsArray(listings);
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

  // Recently viewed: read from localStorage (client-only)
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("recently_viewed_listing_ids") : null;
      if (raw) {
        const ids = JSON.parse(raw) as number[];
        if (Array.isArray(ids)) setRecentlyViewedIds(ids);
      }
    } catch (_) {}
  }, []);

  // Recently viewed listings: from current listings, ordered by recent ids (max 4)
  const recentlyViewedListings = recentlyViewedIds
    .map((rid) => listingsArray.find((l: any) => l.id === rid))
    .filter(Boolean)
    .slice(0, 4) as any[];

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
    const iconMap: { [key: string]: { icon: any } } = {
      Weddings: { icon: Sparkles },
      Corporate: { icon: Briefcase },
      Music: { icon: Music },
      Photography: { icon: Camera },
      Catering: { icon: Utensils },
      Audio: { icon: Mic },
    };

    // Try exact match first, then partial match
    if (iconMap[categoryName]) return iconMap[categoryName];

    for (const [key, value] of Object.entries(iconMap)) {
      if (categoryName.includes(key) || key.includes(categoryName)) {
        return value;
      }
    }

    // Default icon
    return { icon: Sparkles };
  };

  // Use only listing.average_rating / listing.reviews — never fetch (prevents 429)
  const RatingDisplay = ({
    listing,
  }: {
    listing: { id: number; average_rating?: number; reviews?: any[] };
  }) => {
    const hasData =
      listing.average_rating != null ||
      (Array.isArray(listing.reviews) && listing.reviews.length > 0);
    const displayRating =
      listing.average_rating != null
        ? listing.average_rating
        : hasData && Array.isArray(listing.reviews)
          ? Math.round(
              (listing.reviews.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) /
                listing.reviews.length) * 10
            ) / 10
          : 0;
    const displayCount = Array.isArray(listing.reviews) ? listing.reviews.length : 0;

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
    <div className="min-h-screen bg-background">
      {/* Hero — smaller on mobile for better phone fit */}
      <section className="relative min-h-[32vh] sm:min-h-[42vh] md:min-h-[48vh] lg:min-h-[52vh] flex flex-col justify-center overflow-hidden">
        <img
          src="/image.jpeg"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center brightness-110"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 text-center mobile-content">
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-3 sm:mb-5 drop-shadow-md [text-shadow:0_2px_8px_rgba(0,0,0,0.3)]">
            {t("hero_title")}
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-white max-w-2xl mx-auto mb-5 sm:mb-8 font-medium tracking-tight [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]">
            {t("hero_sub")}
          </p>

          {/* Expandable search: Browse button → search bar + filters */}
          <div className="w-full max-w-2xl mx-auto">
            {!searchExpanded ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Button
                  size="lg"
                  onClick={() => setSearchExpanded(true)}
                  className="w-full sm:w-auto min-h-[48px] bg-white text-neutral-900 hover:bg-neutral-50 rounded-full px-8 text-base font-semibold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <Search className="h-5 w-5 mr-2" />
                  {t("browse")}
                </Button>
                <Link href="/listings/new" className="w-full sm:w-auto touch-target">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto min-h-[48px] border-2 border-white text-white hover:bg-white/15 hover:border-white/90 rounded-full px-8 text-base font-semibold bg-transparent transition-all duration-200 active:scale-[0.98]"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {t("list_new")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div
                className="rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl shadow-black/10 border border-white/30 overflow-hidden transition-all duration-300 ease-out hero-search-expand"
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
                          className="input-focus-ring w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm focus:outline-none focus:border-neutral-400"
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
                          className="input-focus-ring w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
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
                          className="input-focus-ring w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
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
                          className="input-focus-ring w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
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
                        className="input-focus-ring px-3 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-900 text-sm focus:outline-none focus:border-neutral-400"
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

      <div className="bg-card">
        {/* Categories — outlined pills, softer colors */}
        <section className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <p className="section-label text-xs uppercase tracking-wider text-muted-foreground mb-4">
              {t("category")}
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all touch-target border-2 ${
                  selectedCategory === null
                    ? "bg-primary border-primary text-primary-foreground pill-active"
                    : "border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                {t("all_categories")}
              </button>
              {categories.map((cat) => {
                const { icon: IconComponent } = getCategoryIcon(cat.name);
                const isSelected = selectedCategory === cat.id;
                const outlineClasses = getCategoryOutlineById(cat.id);
                const filledClasses = getCategoryFilledById(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all touch-target border-2 ${
                      isSelected ? filledClasses : outlineClasses
                    } ${isSelected ? "scale-[1.02] pill-active shadow-sm" : "hover:opacity-90"}`}
                  >
                    <IconComponent className="h-4 w-4" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Popular listings — grid; tighter on mobile */}
        <section className="py-6 sm:py-10 md:py-16 bg-card">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mobile-content">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
              <div>
                <p className="section-label text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  {t("listings")}
                </p>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  Popular right now
                </h2>
              </div>
              <Link
                href="/listings"
                className="link-arrow inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
                <span className="arrow">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {isListingsLoading
                ? [...Array(6)].map((_, i) => <SkeletonLoader key={i} />)
                : hotServices.map((service: any) => (
                  <ListingCard key={service.id} listing={service} compact />
                  ))}
            </div>
          </div>
        </section>

        {/* More to explore — 2-col grid on mobile for better phone layout */}
        <section className="py-6 sm:py-10 md:py-16 bg-muted/50 border-t border-border">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mobile-content">
            <div className="flex items-end justify-between mb-4 sm:mb-6">
              <div>
                <p className="section-label text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Explore
                </p>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  More to explore
                </h2>
              </div>
              <Link
                href="/listings"
                className="link-arrow hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
                <span className="arrow">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {isListingsLoading
                ? [...Array(6)].map((_, i) => (
                    <div key={i}>
                      <SkeletonLoader />
                    </div>
                  ))
                : recommendations.map((service: any) => (
                    <ListingCard key={service.id} listing={service} compact />
                  ))}
            </div>
          </div>
        </section>

        {/* Recently viewed — from localStorage, only listings in current feed */}
        {recentlyViewedListings.length > 0 && !isListingsLoading && (
          <section className="py-6 sm:py-8 border-t border-border bg-card">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mobile-content">
              <p className="section-label text-xs uppercase tracking-wider text-neutral-400 mb-1">
                {t("listings")}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-4 sm:mb-6">
                Recently viewed
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {recentlyViewedListings.map((service: any) => (
                  <Link
                    key={service.id}
                    href={`/listings/${service.id}`}
                    className="group block"
                  >
                    <article className="card-hover overflow-hidden rounded-xl sm:rounded-2xl bg-card border border-border hover:border-border shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                      <div className="relative aspect-[4/3] max-h-[140px] sm:max-h-none bg-muted overflow-hidden">
                        {service.images?.[0]?.image && (
                          <img
                            src={
                              service.images[0].image.startsWith("http")
                                ? service.images[0].image
                                : `${API}${service.images[0].image}`
                            }
                            alt={service.title}
                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300 ease-out"
                            loading="lazy"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        )}
                      </div>
                      <div className="p-3">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider line-clamp-1">
                          {service.category?.name || t("listing")}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground mt-0.5 line-clamp-2 group-hover:text-muted-foreground">
                          {service.title}
                        </h3>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-base font-bold text-foreground">
                            ${service.price_per_day}
                          </span>
                          <span className="text-xs text-muted-foreground">/day</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
