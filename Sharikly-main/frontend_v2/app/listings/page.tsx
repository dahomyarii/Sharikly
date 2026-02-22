"use client";

import useSWR from "swr";
import axiosInstance from "@/lib/axios";
import ListingCard from "@/components/ListingCard";
import SkeletonLoader from "@/components/SkeletonLoader";
import { Suspense, useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

const DEBOUNCE_MS = 400;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const API = process.env.NEXT_PUBLIC_API_BASE;
const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);

function buildListingsUrl(params: {
  search: string;
  category: string;
  city: string;
  min_price: string;
  max_price: string;
  order: string;
  page: number;
}): string {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.category) sp.set("category", params.category);
  if (params.city) sp.set("city", params.city);
  if (params.min_price) sp.set("min_price", params.min_price);
  if (params.max_price) sp.set("max_price", params.max_price);
  if (params.order && params.order !== "newest") sp.set("order", params.order);
  if (params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return `${API}/listings/${qs ? `?${qs}` : ""}`;
}

function ListingsPageContent() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [order, setOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [urlReady, setUrlReady] = useState(false);
  const hasSyncedFromUrl = useRef(false);
  const lastGoodData = useRef<{ listings: unknown[]; totalCount: number; hasNext: boolean; hasPrevious: boolean } | null>(null);

  const debouncedSearch = useDebounce(search, DEBOUNCE_MS);
  const debouncedCity = useDebounce(city, DEBOUNCE_MS);
  const debouncedMinPrice = useDebounce(minPrice, DEBOUNCE_MS);
  const debouncedMaxPrice = useDebounce(maxPrice, DEBOUNCE_MS);

  // Read initial state from URL once on mount (shareable links / refresh)
  useEffect(() => {
    if (hasSyncedFromUrl.current) return;
    hasSyncedFromUrl.current = true;
    const q = searchParams.get("search") ?? "";
    const cat = searchParams.get("category") ?? "";
    const c = searchParams.get("city") ?? "";
    const min = searchParams.get("min_price") ?? "";
    const max = searchParams.get("max_price") ?? "";
    const ord = searchParams.get("order") ?? "newest";
    const p = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    setSearch(q);
    setCategory(cat);
    setCity(c);
    setMinPrice(min);
    setMaxPrice(max);
    setOrder(ord);
    setPage(p);
    setUrlReady(true);
  }, [searchParams]);

  // Persist filters to URL when they change (so share/refresh keeps state)
  useEffect(() => {
    if (!urlReady || typeof window === "undefined") return;
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (category) sp.set("category", category);
    if (city) sp.set("city", city);
    if (minPrice) sp.set("min_price", minPrice);
    if (maxPrice) sp.set("max_price", maxPrice);
    if (order && order !== "newest") sp.set("order", order);
    if (page > 1) sp.set("page", String(page));
    const qs = sp.toString();
    const url = qs ? `/listings?${qs}` : "/listings";
    window.history.replaceState(null, "", url);
  }, [urlReady, search, category, city, minPrice, maxPrice, order, page]);

  const listingsUrl = useMemo(
    () =>
      buildListingsUrl({
        search: debouncedSearch,
        category,
        city: debouncedCity,
        min_price: debouncedMinPrice,
        max_price: debouncedMaxPrice,
        order,
        page,
      }),
    [debouncedSearch, category, debouncedCity, debouncedMinPrice, debouncedMaxPrice, order, page]
  );

  const { data: rawData, error, isLoading } = useSWR(urlReady ? listingsUrl : null, fetcher, {
    onErrorRetry: (err: any, _key, _config, revalidate, { retryCount }) => {
      if (err?.response?.status === 429) return; // don't retry rate limit
      if (retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount: retryCount + 1 }), 2000);
    },
  });
  const { data: categories } = useSWR(`${API}/categories/`, fetcher);

  // Support both paginated ({ results, count, next, previous }) and plain array
  const listings = Array.isArray(rawData) ? rawData : rawData?.results ?? [];
  const totalCount = typeof rawData?.count === "number" ? rawData.count : listings.length;
  const hasNext = !!rawData?.next;
  const hasPrevious = !!rawData?.previous;
  const currentPage = typeof rawData?.count === "number" ? page : 1;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / 12) : 1;

  // Keep last successful data so listings don't disappear on error (e.g. 429)
  if (!error && (listings.length > 0 || totalCount === 0)) {
    lastGoodData.current = { listings, totalCount, hasNext, hasPrevious };
  }
  const display =
    error && lastGoodData.current
      ? lastGoodData.current
      : { listings, totalCount, hasNext, hasPrevious };
  const displayListings = display.listings as unknown[];
  const displayTotalCount = display.totalCount;
  const displayHasNext = display.hasNext;
  const displayHasPrevious = display.hasPrevious;
  const displayTotalPages = displayTotalCount > 0 ? Math.ceil(displayTotalCount / 12) : 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 pb-6 sm:px-6 md:p-8">
      {error && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
          {t("failed_load_listings")}
          {lastGoodData.current && (
            <span className="ml-1"> Showing previous results.</span>
          )}
        </div>
      )}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">{t("listings")}</h1>
        <p className="text-sm text-gray-600">{t("browse_and_find")}</p>
      </div>

      {/* Search + filters row — touch-friendly on mobile */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              aria-label={t("search_listings")}
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("search_listings")}
              className="w-full pl-11 pr-4 py-3.5 min-h-[44px] sm:min-h-0 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-base"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={order}
              onChange={(e) => { setOrder(e.target.value); setPage(1); }}
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm touch-target"
            >
              <option value="newest">{t("sort_newest")}</option>
              <option value="price_asc">{t("sort_price_low")}</option>
              <option value="price_desc">{t("sort_price_high")}</option>
            </select>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] sm:min-w-0 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm touch-target ${showFilters ? "border-orange-500 text-orange-600" : "border-gray-300"}`}
            >
              <SlidersHorizontal className="h-5 w-5 flex-shrink-0" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t("category")}
              </label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm"
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
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t("city")}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => { setCity(e.target.value); setPage(1); }}
                placeholder={t("city")}
                className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t("min_price")}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                placeholder="0"
                className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t("max_price")}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                placeholder="—"
                className="w-full min-h-[44px] px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {isLoading ? (
          [...Array(8)].map((_, i) => <SkeletonLoader key={i} />)
        ) : displayListings?.length > 0 ? (
          displayListings.map((listing: any) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 sm:py-16 px-4">
            <p className="text-gray-500 mb-6">{t("no_listings_found")}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/listings/new"
                className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 font-medium touch-target"
              >
                {t("list_new")}
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium touch-target"
              >
                {t("browse")}
              </Link>
            </div>
          </div>
        )}
      </div>

      {!isLoading && (displayHasNext || displayHasPrevious || displayTotalPages > 1) && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!displayHasPrevious}
            className="inline-flex items-center gap-1 min-h-[44px] px-4 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-5 w-5" /> Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {displayTotalPages}
            {displayTotalCount > 0 && (
              <span className="ml-1">({displayTotalCount} results)</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!displayHasNext}
            className="inline-flex items-center gap-1 min-h-[44px] px-4 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
          >
            Next <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function ListingsFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-5 pb-6 sm:px-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-64 mt-2 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, i) => (
          <SkeletonLoader key={i} />
        ))}
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<ListingsFallback />}>
      <ListingsPageContent />
    </Suspense>
  );
}
