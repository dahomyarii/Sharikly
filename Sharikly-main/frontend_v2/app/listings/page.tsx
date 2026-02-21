"use client";

import useSWR from "swr";
import axiosInstance from "@/lib/axios";
import ListingCard from "@/components/ListingCard";
import SkeletonLoader from "@/components/SkeletonLoader";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

const API = process.env.NEXT_PUBLIC_API_BASE;
const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);

function buildListingsUrl(params: {
  search: string;
  category: string;
  city: string;
  min_price: string;
  max_price: string;
  order: string;
}): string {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.category) sp.set("category", params.category);
  if (params.city) sp.set("city", params.city);
  if (params.min_price) sp.set("min_price", params.min_price);
  if (params.max_price) sp.set("max_price", params.max_price);
  if (params.order && params.order !== "newest") sp.set("order", params.order);
  const qs = sp.toString();
  return `${API}/listings/${qs ? `?${qs}` : ""}`;
}

export default function ListingsPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [order, setOrder] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const listingsUrl = useMemo(
    () =>
      buildListingsUrl({
        search,
        category,
        city,
        min_price: minPrice,
        max_price: maxPrice,
        order,
      }),
    [search, category, city, minPrice, maxPrice, order]
  );

  const { data: listings, error, isLoading } = useSWR(listingsUrl, fetcher);
  const { data: categories } = useSWR(`${API}/categories/`, fetcher);

  if (error)
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <div className="text-red-600 text-center py-12">
          {t("failed_load_listings")}
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 pb-6 sm:px-6 md:p-8">
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_listings")}
              className="w-full pl-11 pr-4 py-3.5 min-h-[44px] sm:min-h-0 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-base"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
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
                onChange={(e) => setCategory(e.target.value)}
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
                onChange={(e) => setCity(e.target.value)}
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
                onChange={(e) => setMinPrice(e.target.value)}
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
                onChange={(e) => setMaxPrice(e.target.value)}
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
        ) : listings?.length > 0 ? (
          listings.map((listing: any) => (
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
    </div>
  );
}
