"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import SkeletonLoader from "@/components/SkeletonLoader";
import ListingCard from "@/components/ListingCard";
import { CommunityEarningsSection } from "@/components/earnings/CommunityEarningsSection";
import { useLocale } from "@/components/LocaleProvider";
import { toListingsArray } from "@/lib/listingsUtils";
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Gamepad2,
  Headphones,
  Home,
  MapPin,
  MoreHorizontal,
  Search,
  Speaker,
  Tent,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE;

const fetcher = async (url: string) => {
  const res = await axiosInstance.get(url);
  return res.data;
};

function getListingImageUrl(listing: any) {
  const imageUrl = listing?.images?.[0]?.image;
  if (!imageUrl) return "/image.jpeg";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${API?.replace("/api", "")}${imageUrl}`;
}

function getCategoryIcon(categoryName: string) {
  const normalized = categoryName.toLowerCase();
  if (normalized.includes("camera") || normalized.includes("photo")) return Camera;
  if (normalized.includes("audio") || normalized.includes("head")) return Headphones;
  if (normalized.includes("camp") || normalized.includes("tent")) return Tent;
  if (normalized.includes("home") || normalized.includes("house")) return Home;
  if (normalized.includes("game") || normalized.includes("console")) return Gamepad2;
  if (normalized.includes("speaker")) return Speaker;
  return MoreHorizontal;
}

export default function HomePage() {
  const { t } = useLocale();
  const router = useRouter();
  const [heroSearch, setHeroSearch] = useState("");
  const [heroCity, setHeroCity] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [showDateFields, setShowDateFields] = useState(false);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<number[]>([]);

  const { data: listingsData, isLoading: listingsLoading } = useSWR(
    API ? `${API}/listings/` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  const { data: categoriesData = [] } = useSWR(
    API ? `${API}/categories/` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const listings = useMemo(() => toListingsArray(listingsData), [listingsData]);
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const featuredListing = listings[0];
  const popularListings = listings.slice(0, 6);
  const visibleCategories = categories.slice(0, 6);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("recently_viewed_listing_ids");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setRecentlyViewedIds(parsed);
    } catch {}
  }, []);

  const recentlyViewedListings = recentlyViewedIds
    .map((id) => listings.find((listing: any) => listing.id === id))
    .filter(Boolean)
    .slice(0, 4) as any[];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (heroSearch.trim()) params.set("search", heroSearch.trim());
    if (heroCity.trim()) params.set("city", heroCity.trim());
    if (availableFrom) params.set("available_from", availableFrom);
    if (availableTo) params.set("available_to", availableTo);
    const query = params.toString();
    router.push(`/listings${query ? `?${query}` : ""}`);
  };

  const handleCategoryOpen = (categoryId: number) => {
    const params = new URLSearchParams();
    params.set("category", String(categoryId));
    if (heroCity.trim()) params.set("city", heroCity.trim());
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <div className="pb-8">
      <section className="marketplace-shell pt-4 sm:pt-6">
        <div className="grid gap-4 lg:grid-cols-[1.38fr_0.92fr]">
          <div className="rounded-[36px] bg-white px-6 py-7 shadow-[0_18px_50px_rgba(25,17,52,0.06)] sm:px-8 sm:py-8 lg:px-10">
            <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
              Rent <span className="text-primary">Anything</span> from People Near You
            </h1>

            <div className="mt-7 rounded-[22px] border border-slate-200 bg-slate-50 p-2 shadow-inner">
              <div className="grid gap-2 md:grid-cols-[1.65fr_1fr_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search items or location..."
                    className="h-12 w-full rounded-[16px] border border-transparent bg-white pl-11 pr-4 text-sm text-slate-900 outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowDateFields((value) => !value)}
                  className="flex h-12 items-center justify-start gap-3 rounded-[16px] bg-white px-4 text-sm font-medium text-slate-500"
                >
                  <CalendarDays className="h-4 w-4" />
                  {availableFrom && availableTo ? `${availableFrom} - ${availableTo}` : "Select dates"}
                </button>

                <Button
                  size="lg"
                  onClick={handleSearch}
                  className="h-12 rounded-[16px] px-8 shadow-none"
                >
                  Search
                </Button>
              </div>

              {showDateFields && (
                <div className="mt-2 grid gap-2 rounded-[18px] bg-white p-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      From
                    </label>
                    <input
                      type="date"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      className="h-11 w-full rounded-[14px] border border-slate-200 px-3 text-sm text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      To
                    </label>
                    <input
                      type="date"
                      value={availableTo}
                      onChange={(e) => setAvailableTo(e.target.value)}
                      className="h-11 w-full rounded-[14px] border border-slate-200 px-3 text-sm text-slate-900 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(visibleCategories.length > 0 ? visibleCategories : []).map((category: any) => {
                const Icon = getCategoryIcon(category.name);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryOpen(category.id)}
                    className="flex min-w-max items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    <Icon className="h-4 w-4 text-slate-500" />
                    {category.name}
                  </button>
                );
              })}
              {visibleCategories.length === 0 &&
                [
                  ["Cameras", Camera],
                  ["Headphones", Headphones],
                  ["Camping", Tent],
                  ["Home", Home],
                ].map(([label, Icon]: any) => (
                  <span
                    key={label}
                    className="flex min-w-max items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    <Icon className="h-4 w-4 text-slate-500" />
                    {label}
                  </span>
                ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[36px] bg-gradient-to-br from-white to-violet-50 shadow-[0_18px_50px_rgba(25,17,52,0.06)]">
            <div className="grid h-full md:grid-cols-[1fr_1.05fr]">
              <div className="p-6 sm:p-7">
                <p className="text-4xl font-black tracking-tight text-slate-900">Start Earning</p>
                <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">with Your Items</p>
                <p className="mt-4 text-sm text-slate-600">List now & make money!</p>
                <Link href="/listings/new" className="mt-6 inline-flex">
                  <Button size="lg" className="h-12 rounded-[16px] px-6 shadow-none">
                    + List Your Item
                  </Button>
                </Link>
              </div>
              <div className="relative min-h-[220px] overflow-hidden">
                <img
                  src={featuredListing ? getListingImageUrl(featuredListing) : "/image.jpeg"}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketplace-shell mt-9">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Popular Items</h2>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {listingsLoading
            ? Array.from({ length: 6 }).map((_, idx) => <SkeletonLoader key={idx} />)
            : popularListings.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} compact />
              ))}
        </div>
      </section>

      <section className="marketplace-shell mt-9">
        <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_18px_50px_rgba(25,17,52,0.06)]">
          <div className="grid gap-5 p-6 lg:grid-cols-[1.2fr_0.65fr_0.8fr] lg:p-8">
            <div>
              <h3 className="text-[2rem] font-black tracking-tight text-slate-900">
                Earn with Your Items on Ekra
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-7 text-slate-500">
                Join thousands of people earning extra income by renting their stuff.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {["Fast Payments", "Secure & Trusted", "24/7 Support"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">Top Hosts This Month</p>
              <div className="mt-4 space-y-3">
                {[
                  ["Ahmed", "SAR 18,200"],
                  ["Khalid", "SAR 14,400"],
                  ["Saud", "SAR 11,900"],
                ].map(([name, earnings], index) => (
                  <div key={name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-amber-500">{index + 1}</span>
                      <span className="text-sm font-semibold text-slate-800">{name}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-500">{earnings}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] bg-gradient-to-br from-emerald-50 to-white p-5">
              <p className="text-sm font-bold text-emerald-500">Estimated Earnings</p>
              <p className="mt-2 text-5xl font-black tracking-tight text-emerald-500">SAR 2,300</p>
              <p className="mt-1 text-sm text-slate-500">/ month</p>
              <Link href="/listings/new" className="mt-5 inline-flex">
                <Button size="lg" className="h-12 rounded-[16px] px-6 shadow-none">
                  List Your Item
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="marketplace-shell mt-8">
        <div className="overflow-hidden rounded-[28px] bg-[#241d48] px-6 py-5 text-white shadow-[0_18px_50px_rgba(25,17,52,0.18)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-2xl font-black tracking-tight">
                Start Earning Today <span className="font-medium text-white/80">Turn Your Items into Income!</span>
              </p>
            </div>
            <Link href="/listings/new">
              <Button variant="soft" size="lg" className="min-h-[48px] rounded-full px-6 text-sm font-semibold">
                + List Your Item Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {recentlyViewedListings.length > 0 && !listingsLoading && (
        <section className="marketplace-shell mt-9">
          <div className="rounded-[32px] bg-white p-6 shadow-[0_18px_50px_rgba(25,17,52,0.06)]">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Recently Viewed</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {recentlyViewedListings.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mt-10">
        <CommunityEarningsSection />
      </div>
    </div>
  );
}
