"use client";

import useSWR from "swr";
import dynamic from "next/dynamic";
import axiosInstance from "@/lib/axios";
import ListingCard from "@/components/ListingCard";
import SkeletonLoader from "@/components/SkeletonLoader";
import { Suspense, useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Camera, ChevronLeft, ChevronRight, Gamepad2, Headphones, Home, MapPin, MoreHorizontal, Search, SlidersHorizontal, Sparkles, Tent, X } from "lucide-react";
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
  rating_min: string;
  available_from: string;
  available_to: string;
  order: string;
  page: number;
}): string {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.category) sp.set("category", params.category);
  if (params.city) sp.set("city", params.city);
  if (params.min_price) sp.set("min_price", params.min_price);
  if (params.max_price) sp.set("max_price", params.max_price);
  if (params.rating_min) sp.set("rating_min", params.rating_min);
  if (params.available_from) sp.set("available_from", params.available_from);
  if (params.available_to) sp.set("available_to", params.available_to);
  if (params.order && params.order !== "newest") sp.set("order", params.order);
  if (params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return `${API}/listings/${qs ? `?${qs}` : ""}`;
}

const inputClasses =
  "w-full min-h-[48px] rounded-2xl border border-white/65 bg-background/90 px-4 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-primary/30";
const selectClasses =
  "min-h-[48px] rounded-2xl border border-white/65 bg-background/90 px-4 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-primary/30";
const labelClasses = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground";

function getCategoryIcon(categoryName: string) {
  const normalized = categoryName.toLowerCase();
  if (normalized.includes("camera") || normalized.includes("photo")) return Camera;
  if (normalized.includes("audio") || normalized.includes("head")) return Headphones;
  if (normalized.includes("camp") || normalized.includes("tent")) return Tent;
  if (normalized.includes("home") || normalized.includes("house")) return Home;
  if (normalized.includes("game") || normalized.includes("console")) return Gamepad2;
  return MoreHorizontal;
}

function getListingImage(listing: any) {
  const imageUrl = listing?.images?.[0]?.image;
  if (!imageUrl) return "/image.jpeg";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${API?.replace("/api", "")}${imageUrl}`;
}

function ListingsPageContent() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [ratingMin, setRatingMin] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [order, setOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [urlReady, setUrlReady] = useState(false);
  const hasSyncedFromUrl = useRef(false);
  const lastGoodData = useRef<{ listings: unknown[]; totalCount: number; hasNext: boolean; hasPrevious: boolean } | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [canUseSavedSearches, setCanUseSavedSearches] = useState(false);

  const debouncedSearch = useDebounce(search, DEBOUNCE_MS);
  const debouncedCity = useDebounce(city, DEBOUNCE_MS);
  const debouncedMinPrice = useDebounce(minPrice, DEBOUNCE_MS);
  const debouncedMaxPrice = useDebounce(maxPrice, DEBOUNCE_MS);
  const debouncedRatingMin = useDebounce(ratingMin, DEBOUNCE_MS);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("access") ||
      localStorage.getItem("access_token".toUpperCase());
    setCanUseSavedSearches(!!token);
  }, []);

  useEffect(() => {
    if (hasSyncedFromUrl.current) return;
    hasSyncedFromUrl.current = true;
    const q = searchParams.get("search") ?? "";
    const cat = searchParams.get("category") ?? "";
    const c = searchParams.get("city") ?? "";
    const min = searchParams.get("min_price") ?? "";
    const max = searchParams.get("max_price") ?? "";
    const rmin = searchParams.get("rating_min") ?? "";
    const af = searchParams.get("available_from") ?? "";
    const at = searchParams.get("available_to") ?? "";
    const ord = searchParams.get("order") ?? "newest";
    const p = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    setSearch(q);
    setCategory(cat);
    setCity(c);
    setMinPrice(min);
    setMaxPrice(max);
    setRatingMin(rmin);
    setAvailableFrom(af);
    setAvailableTo(at);
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
    if (ratingMin) sp.set("rating_min", ratingMin);
    if (availableFrom) sp.set("available_from", availableFrom);
    if (availableTo) sp.set("available_to", availableTo);
    if (order && order !== "newest") sp.set("order", order);
    if (page > 1) sp.set("page", String(page));
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `/listings?${qs}` : "/listings");
  }, [urlReady, search, category, city, minPrice, maxPrice, ratingMin, availableFrom, availableTo, order, page]);

  const listingsUrl = useMemo(
    () =>
      buildListingsUrl({
        search: debouncedSearch,
        category,
        city: debouncedCity,
        min_price: debouncedMinPrice,
        max_price: debouncedMaxPrice,
        rating_min: debouncedRatingMin,
        available_from: availableFrom,
        available_to: availableTo,
        order,
        page,
      }),
    [debouncedSearch, category, debouncedCity, debouncedMinPrice, debouncedMaxPrice, debouncedRatingMin, availableFrom, availableTo, order, page]
  );

  const { data: rawData, error, isLoading } = useSWR(urlReady ? listingsUrl : null, fetcher, {
    onErrorRetry: (err: any, _key, _config, revalidate, { retryCount }) => {
      if (err?.response?.status === 429) return;
      if (retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount: retryCount + 1 }), 2000);
    },
  });
  const { data: categories } = useSWR(`${API}/categories/`, fetcher);
  const { data: savedSearches, mutate: mutateSavedSearches } = useSWR(
    urlReady && canUseSavedSearches ? `${API}/saved-searches/` : null,
    fetcher
  );

  const { data: suggestData } = useSWR(
    urlReady && debouncedSearch.trim().length >= 2 ? `${API}/listings/suggest/?q=${encodeURIComponent(debouncedSearch.trim())}` : null,
    fetcher
  );
  const titles: string[] = Array.isArray(suggestData?.titles) ? suggestData.titles : [];
  const citiesSuggest: string[] = Array.isArray(suggestData?.cities) ? suggestData.cities : [];
  const categoriesSuggest: Array<{ id: number; name: string }> = Array.isArray(suggestData?.categories) ? suggestData.categories : [];
  const hasSuggest = titles.length + citiesSuggest.length + categoriesSuggest.length > 0;

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
  const activeMapListing =
    displayListings.find((listing: any) => listing.id === selectedListingId) ?? displayListings[0] ?? null;

  return (
    <div className="marketplace-shell py-4 pb-24 md:pb-10">
      {error && (
        <div className="mb-4 rounded-[24px] border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {t("failed_load_listings")}
          {lastGoodData.current && <span className="ml-1">Showing previous results.</span>}
        </div>
      )}

      <section className="surface-panel relative overflow-hidden rounded-[40px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="floating-orb right-0 top-0 h-24 w-24 bg-primary/15" />
        <div className="relative z-10">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-label text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Browse
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                Discover rentals near you
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Search, filter, save your favorite searches, and compare listings on the map.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex rounded-full border border-white/60 bg-white/80 p-1 md:hidden">
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  className={`min-h-[40px] rounded-full px-4 text-sm font-medium transition ${
                    mobileView === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setMobileView("map")}
                  className={`min-h-[40px] rounded-full px-4 text-sm font-medium transition ${
                    mobileView === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  Map
                </button>
              </div>
              <Button
                variant="soft"
                onClick={() => setShowFilters(!showFilters)}
                className="min-h-[44px]"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
              <Button
                variant="outline"
                disabled={!canUseSavedSearches || (!search && !category && !city && !minPrice && !maxPrice && !ratingMin && !availableFrom && !availableTo)}
                onClick={async () => {
                  if (!canUseSavedSearches || typeof window === "undefined") return;
                  const qs = window.location.search || "";
                  if (!qs) return;
                  try {
                    await axiosInstance.post(`${API}/saved-searches/`, { query: qs });
                    mutateSavedSearches();
                  } catch {}
                }}
              >
                Save search
              </Button>
            </div>
          </div>

          <div className="glass-panel rounded-[30px] p-2 sm:p-3">
            <div className="grid gap-2 lg:grid-cols-[1.8fr_1fr_1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  aria-label={t("search_listings")}
                  type="search"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); setShowSuggest(true); }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                  placeholder={t("search_listings")}
                  className="w-full rounded-[22px] border border-transparent bg-white/95 pl-11 pr-4 min-h-[52px] text-sm outline-none"
                />
                {showSuggest && debouncedSearch.trim().length >= 2 && (
                  <div className={`surface-panel absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-[24px] bg-popover/95 ${hasSuggest ? "" : "hidden"}`}>
                    <div className="max-h-72 overflow-y-auto">
                      {titles.length > 0 && (
                        <div className="py-2">
                          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Titles
                          </div>
                          {titles.map((v) => (
                            <button
                              key={`t-${v}`}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => { setSearch(v); setPage(1); setShowSuggest(false); }}
                              className="w-full px-4 py-2.5 text-left text-sm transition hover:bg-accent/60"
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      )}
                      {citiesSuggest.length > 0 && (
                        <div className="border-t border-border py-2">
                          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Cities
                          </div>
                          {citiesSuggest.map((v) => (
                            <button
                              key={`c-${v}`}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => { setCity(v); setShowFilters(true); setPage(1); setShowSuggest(false); }}
                              className="w-full px-4 py-2.5 text-left text-sm transition hover:bg-accent/60"
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      )}
                      {categoriesSuggest.length > 0 && (
                        <div className="border-t border-border py-2">
                          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Categories
                          </div>
                          {categoriesSuggest.map((cat) => (
                            <button
                              key={`cat-${cat.id}`}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => { setCategory(String(cat.id)); setShowFilters(true); setPage(1); setShowSuggest(false); }}
                              className="w-full px-4 py-2.5 text-left text-sm transition hover:bg-accent/60"
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setPage(1); }}
                  placeholder={t("city")}
                  className="w-full rounded-[22px] border border-transparent bg-white/95 pl-11 pr-4 min-h-[52px] text-sm outline-none"
                />
              </div>
              <select
                value={order}
                onChange={(e) => { setOrder(e.target.value); setPage(1); }}
                className="min-h-[52px] rounded-[22px] border border-transparent bg-white/95 px-4 text-sm outline-none"
              >
                <option value="newest">{t("sort_newest")}</option>
                <option value="price_asc">{t("sort_price_low")}</option>
                <option value="price_desc">{t("sort_price_high")}</option>
              </select>
              <Button size="lg" className="min-h-[52px] px-6" onClick={() => setShowFilters(true)}>
                Search
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid gap-3 rounded-[30px] bg-white/60 p-4 sm:grid-cols-2 xl:grid-cols-6">
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
              <div>
                <label className={labelClasses}>Min rating</label>
                <select
                  value={ratingMin}
                  onChange={(e) => { setRatingMin(e.target.value); setPage(1); }}
                  className={`${selectClasses} w-full`}
                >
                  <option value="">Any</option>
                  <option value="4">4+</option>
                  <option value="4.5">4.5+</option>
                  <option value="5">5</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Available from</label>
                <input
                  type="date"
                  value={availableFrom}
                  onChange={(e) => { setAvailableFrom(e.target.value); setPage(1); }}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Available to</label>
                <input
                  type="date"
                  value={availableTo}
                  onChange={(e) => { setAvailableTo(e.target.value); setPage(1); }}
                  className={inputClasses}
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {Array.isArray(categories) && categories.slice(0, 8).map((cat: any) => {
              const Icon = getCategoryIcon(cat.name || "");
              const isActive = category === String(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(isActive ? "" : String(cat.id));
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background/90 text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.name}
                </button>
              );
            })}
            {(search || category || city || minPrice || maxPrice || ratingMin || availableFrom || availableTo) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setCity("");
                  setMinPrice("");
                  setMaxPrice("");
                  setRatingMin("");
                  setAvailableFrom("");
                  setAvailableTo("");
                  setOrder("newest");
                  setPage(1);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2 text-xs font-semibold text-foreground shadow-sm"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
            {Array.isArray(savedSearches) && savedSearches.length > 0 && (
              savedSearches.map((s: any) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    const qs = s.query || "";
                    window.location.href = `/listings${qs.startsWith("?") ? qs : qs ? `?${qs}` : ""}`;
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2 text-xs font-semibold text-foreground shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {s.label || s.query.replace(/^\?/, "") || "Saved search"}
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.28fr)_320px] xl:grid-cols-[minmax(0,1.35fr)_340px]">
        <div className={`min-w-0 ${mobileView === "map" ? "hidden md:block" : ""}`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {displayTotalCount} stays and rentals
              </p>
              <p className="text-sm text-muted-foreground">
                Refined results for your search
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3">
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
              <div className="surface-panel col-span-full rounded-[32px] px-4 py-12 text-center">
                <p className="text-foreground font-medium mb-1">{t("no_listings_found")}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your filters or browse all listings.
                </p>
                <div className="flex flex-col justify-center gap-2 sm:flex-row">
                  {(debouncedSearch || category || debouncedCity || debouncedMinPrice || debouncedMaxPrice) && (
                    <Link
                      href="/listings"
                      className="inline-flex items-center justify-center min-h-[44px] rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                    >
                      Clear filters
                    </Link>
                  )}
                  <Link
                    href="/listings/new"
                    className="ekra-gradient inline-flex items-center justify-center min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    {t("list_new")}
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center min-h-[44px] rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    {t("browse")}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {!isLoading && (displayHasNext || displayHasPrevious || displayTotalPages > 1) && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!displayHasPrevious}
                className="inline-flex min-h-[42px] items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
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
                className="inline-flex min-h-[42px] items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <aside className={`${mobileView === "list" ? "hidden md:block" : "block"} lg:sticky lg:top-24 lg:h-fit`}>
          <div className="surface-panel overflow-hidden rounded-[30px] p-2.5">
            <div className="mb-2 flex items-center justify-between px-1">
              <div>
                <p className="text-sm font-semibold text-foreground">Map view</p>
                <p className="text-xs text-muted-foreground">Tap a marker to highlight a card</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {displayListings.length} shown
              </span>
            </div>
            {activeMapListing && (
              <Link
                href={`/listings/${activeMapListing.id}`}
                className="mb-2.5 flex items-center gap-3 rounded-[24px] border border-white/70 bg-white/80 p-2.5 shadow-sm transition hover:bg-white"
              >
                <img
                  src={getListingImage(activeMapListing)}
                  alt={activeMapListing.title}
                  className="h-14 w-16 rounded-[16px] object-cover"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Selected listing
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm font-semibold text-foreground">
                    {activeMapListing.title}
                  </p>
                  <p className="mt-1 text-sm font-bold text-amber-500">
                    {activeMapListing.currency || "SAR"} {activeMapListing.price_per_day}
                  </p>
                </div>
              </Link>
            )}
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
