"use client";

import useSWR from "swr";
import dynamic from "next/dynamic";
import axiosInstance from "@/lib/axios";
import ListingCard from "@/components/ListingCard";
import SkeletonLoader from "@/components/SkeletonLoader";
import { Suspense, useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

const ListingsMap = dynamic(() => import("@/components/ListingsMap"), { ssr: false });

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

const inputClasses =
  "w-full pl-10 pr-3 py-2 min-h-[40px] border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm";
const selectClasses =
  "min-h-[40px] px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
const labelClasses = "block text-xs font-medium text-muted-foreground mb-1";

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
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [urlReady, setUrlReady] = useState(false);
  const hasSyncedFromUrl = useRef(false);
  const lastGoodData = useRef<{ listings: unknown[]; totalCount: number; hasNext: boolean; hasPrevious: boolean } | null>(null);

  const debouncedSearch = useDebounce(search, DEBOUNCE_MS);
  const debouncedCity = useDebounce(city, DEBOUNCE_MS);
  const debouncedMinPrice = useDebounce(minPrice, DEBOUNCE_MS);
  const debouncedMaxPrice = useDebounce(maxPrice, DEBOUNCE_MS);

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
    window.history.replaceState(null, "", qs ? `/listings?${qs}` : "/listings");
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
      if (err?.response?.status === 429) return;
      if (retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount: retryCount + 1 }), 2000);
    },
  });
  const { data: categories } = useSWR(`${API}/categories/`, fetcher);

  const listings = Array.isArray(rawData) ? rawData : rawData?.results ?? [];
  const totalCount = typeof rawData?.count === "number" ? rawData.count : listings.length;
  const hasNext = !!rawData?.next;
  const hasPrevious = !!rawData?.previous;
  const currentPage = typeof rawData?.count === "number" ? page : 1;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / 12) : 1;

  if (!error && (listings.length > 0 || totalCount === 0)) {
    lastGoodData.current = { listings, totalCount, hasNext, hasPrevious };
  }
  const display = error && lastGoodData.current ? lastGoodData.current : { listings, totalCount, hasNext, hasPrevious };
  const displayListings = display.listings as any[];
  const displayTotalCount = display.totalCount;
  const displayHasNext = display.hasNext;
  const displayHasPrevious = display.hasPrevious;
  const displayTotalPages = displayTotalCount > 0 ? Math.ceil(displayTotalCount / 12) : 1;

  return (
    <div className="mx-auto max-w-7xl px-3 py-3 pb-20 sm:px-4 md:pb-8 mobile-content">
      {error && (
        <div className="mb-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300 text-sm">
          {t("failed_load_listings")}
          {lastGoodData.current && <span className="ml-1">Showing previous results.</span>}
        </div>
      )}

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">{t("listings")}</h1>
          <p className="text-xs text-muted-foreground">{t("browse_and_find")}</p>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              aria-label={t("search_listings")}
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("search_listings")}
              className={inputClasses}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={order}
              onChange={(e) => { setOrder(e.target.value); setPage(1); }}
              className={`${selectClasses} flex-1 sm:flex-none sm:min-w-[140px]`}
            >
              <option value="newest">{t("sort_newest")}</option>
              <option value="price_asc">{t("sort_price_low")}</option>
              <option value="price_desc">{t("sort_price_high")}</option>
            </select>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-1.5 min-h-[40px] min-w-[40px] sm:min-w-0 px-3 py-2 border rounded-lg text-sm touch-target ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
            >
              <SlidersHorizontal className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-3 rounded-lg border border-border bg-card/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className={labelClasses}>{t("category")}</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className={`${selectClasses} w-full`}
              >
                <option value="">{t("all_categories")}</option>
                {(categories || []).map((cat: any) => (
                  <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>{t("city")}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => { setCity(e.target.value); setPage(1); }}
                placeholder={t("city")}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>{t("min_price")}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                placeholder="0"
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>{t("max_price")}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                placeholder="—"
                className={inputClasses}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3">
            {isLoading ? (
              [...Array(6)].map((_, i) => <SkeletonLoader key={i} />)
            ) : displayListings?.length > 0 ? (
              displayListings.map((listing: any) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  compact
                  highlighted={selectedListingId === listing.id}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10 px-4 rounded-xl border border-border bg-card/50">
                <p className="text-foreground font-medium mb-1">{t("no_listings_found")}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your filters or browse all listings.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {(debouncedSearch || category || debouncedCity || debouncedMinPrice || debouncedMaxPrice) && (
                    <Link
                      href="/listings"
                      className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 font-medium text-sm"
                    >
                      Clear filters
                    </Link>
                  )}
                  <Link
                    href="/listings/new"
                    className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm"
                  >
                    {t("list_new")}
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent font-medium text-sm"
                  >
                    {t("browse")}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {!isLoading && (displayHasNext || displayHasPrevious || displayTotalPages > 1) && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!displayHasPrevious}
                className="inline-flex items-center gap-1 min-h-[38px] px-3 py-1.5 border border-border rounded-lg font-medium text-foreground bg-card hover:bg-accent disabled:opacity-50 disabled:pointer-events-none text-sm"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {displayTotalPages}
                {displayTotalCount > 0 && <span className="ml-1">({displayTotalCount})</span>}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={!displayHasNext}
                className="inline-flex items-center gap-1 min-h-[38px] px-3 py-1.5 border border-border rounded-lg font-medium text-foreground bg-card hover:bg-accent disabled:opacity-50 disabled:pointer-events-none text-sm"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <aside className="lg:w-[min(400px,38%)] lg:flex-shrink-0">
          <div className="lg:sticky lg:top-20">
            <ListingsMap
              key={`map-${displayListings?.[0]?.id ?? "default"}-${displayListings?.length ?? 0}`}
              listings={displayListings ?? []}
              selectedId={selectedListingId}
              onSelectListing={setSelectedListingId}
              className="w-full"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function ListingsFallback() {
  return (
    <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 mobile-content">
      <div className="mb-4">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        <div className="h-3 w-52 mt-2 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {[...Array(6)].map((_, i) => (
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
