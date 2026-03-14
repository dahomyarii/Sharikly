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
import { buildListingsQuery, toListingsArray } from "@/lib/listingsUtils";
import {
  Camera,
  ChevronRight,
  Gamepad2,
  Headphones,
  Home,
  MapPin,
  Plus,
  MoreHorizontal,
  Search,
  Speaker,
  Sparkles,
  Tent,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE;

const fetcher = async (url: string) => {
  const res = await axiosInstance.get(url);
  return res.data;
};

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
  const [heroCategory, setHeroCategory] = useState("");
  const [heroCity, setHeroCity] = useState("");
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
  const popularListings = listings.slice(0, 4);
  const visibleCategories = categories.slice(0, 6);
  const exploreListings = listings.slice(4, 7);
  const exploreShowcase = exploreListings.length > 0 ? exploreListings : popularListings.slice(0, 3);
  const averageDailyRate = useMemo(() => {
    const prices = listings
      .map((listing: any) => Number(listing?.price_per_day))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (prices.length === 0) return 190;
    return Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length);
  }, [listings]);
  const estimatedMonthlyEarnings = averageDailyRate * 12;

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
    const query = buildListingsQuery({
      search: heroSearch,
      category: heroCategory,
      city: heroCity,
      min_price: "",
      max_price: "",
      order: "newest",
    });
    router.push(`/listings${query}`);
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
        <div className="grid gap-3 lg:grid-cols-[1.32fr_0.78fr]">
          <div className="surface-panel relative overflow-hidden rounded-[34px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
            <div className="floating-orb left-[-3rem] top-[-2rem] h-24 w-24 bg-primary/15" />
            <div className="floating-orb bottom-[-2rem] right-[-1rem] h-20 w-20 bg-emerald-300/25" />
            <div className="relative z-10">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80 sm:text-xs">
                Ekra marketplace
              </p>
              <h1 className="max-w-2xl text-[2.6rem] font-black leading-[1.02] tracking-tight text-foreground sm:text-[3.25rem] lg:text-[4rem]">
                Rent <span className="text-primary">Anything</span> from People Near You
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                Search trusted local rentals, book in minutes, and start earning from the gear
                you already own.
              </p>

              <div className="glass-panel mt-5 rounded-[26px] p-2">
                <div className="grid gap-2 md:grid-cols-[1.7fr_1fr_1fr_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Search items or location..."
                      className="h-12 w-full rounded-[20px] border border-transparent bg-white/95 pl-11 pr-4 text-sm outline-none"
                    />
                  </div>
                  <select
                    value={heroCategory}
                    onChange={(e) => setHeroCategory(e.target.value)}
                    className="h-12 rounded-[20px] border border-transparent bg-white/95 px-4 text-sm outline-none"
                  >
                    <option value="">{t("all_categories")}</option>
                    {categories.map((category: any) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={heroCity}
                      onChange={(e) => setHeroCity(e.target.value)}
                      placeholder="Select city"
                      className="h-12 w-full rounded-[20px] border border-transparent bg-white/95 pl-11 pr-4 text-sm outline-none"
                    />
                  </div>
                  <Button
                    size="lg"
                    onClick={handleSearch}
                    className="h-12 rounded-[20px] px-6"
                  >
                    Search
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {(visibleCategories.length > 0 ? visibleCategories : []).map((category: any) => {
                  const Icon = getCategoryIcon(category.name);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryOpen(category.id)}
                      className="flex min-w-max items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3.5 py-2 text-xs font-medium text-foreground shadow-sm sm:text-sm"
                    >
                      <Icon className="h-4 w-4 text-primary" />
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
                      className="flex min-w-max items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3.5 py-2 text-xs font-medium text-foreground shadow-sm sm:text-sm"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      {label}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="surface-panel relative overflow-hidden rounded-[32px] border border-white/70 p-3 sm:p-4">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url(/image.jpeg)" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(25,17,52,0.18),rgba(25,17,52,0.54))]" />
            <div className="relative z-10 flex min-h-[260px] flex-col justify-between sm:min-h-[300px]">
              <div className="max-w-[280px] rounded-[24px] bg-white/78 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-md">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Start earning
                  </p>
                  <h2 className="mt-2 text-2xl font-black leading-tight text-foreground">
                    Turn your items into income
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    List your camera gear, gaming devices, tools, and more with the same premium
                    flow.
                  </p>
                </div>
              </div>
              <div className="max-w-[280px] rounded-[24px] bg-white/84 p-3.5 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-md">
                <Link href="/listings/new">
                  <Button size="lg" className="h-11 w-full justify-center rounded-full">
                    <Plus className="h-4 w-4" />
                    List Your Item
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketplace-shell mt-7">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Popular Items
          </h2>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {listingsLoading
            ? Array.from({ length: 4 }).map((_, idx) => <SkeletonLoader key={idx} />)
            : popularListings.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} compact />
              ))}
        </div>
      </section>

      <section className="marketplace-shell mt-7">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="surface-panel rounded-[32px] p-4 sm:p-5">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="section-label text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Explore more
                </p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-foreground sm:text-2xl">
                  Find the right rental for every plan
                </h2>
              </div>
              <Link href="/listings" className="text-sm font-semibold text-primary">
                Browse all
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {listingsLoading ? (
                Array.from({ length: 3 }).map((_, idx) => <SkeletonLoader key={idx} />)
              ) : exploreShowcase.length > 0 ? (
                exploreShowcase.map((listing: any) => (
                    <ListingCard key={listing.id} listing={listing} compact />
                  ))
              ) : (
                <div className="col-span-full grid gap-3 sm:grid-cols-3">
                  {(visibleCategories.length > 0 ? visibleCategories.slice(0, 3) : []).map(
                    (category: any) => {
                      const Icon = getCategoryIcon(category.name);
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategoryOpen(category.id)}
                          className="rounded-[24px] border border-white/70 bg-white/80 p-4 text-left shadow-sm"
                        >
                          <Icon className="h-5 w-5 text-primary" />
                          <p className="mt-3 text-sm font-semibold text-foreground">
                            {category.name}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            Quick access to current rentals in this category.
                          </p>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {visibleCategories.slice(0, 4).map((category: any) => {
                const Icon = getCategoryIcon(category.name);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryOpen(category.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="surface-panel rounded-[32px] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="section-label text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Host highlights
                </p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-foreground sm:text-2xl">
                  Earn with your items
                </h2>
              </div>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="grid gap-3">
              <div className="rounded-[24px] bg-white/90 p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Top hosts this month</span>
                  <span className="success-chip rounded-full px-3 py-1 text-xs font-semibold">
                    Growing
                  </span>
                </div>
                <div className="space-y-2.5 text-sm">
                  {[
                    ["Ahmed", "SAR 18,200"],
                    ["Khalid", "SAR 14,400"],
                    ["Saud", "SAR 11,900"],
                  ].map(([name, earnings]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{name}</span>
                      <span className="font-semibold text-emerald-500">{earnings}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] ekra-gradient-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Estimated earnings
                  </p>
                  <p className="mt-2 text-3xl font-black text-emerald-500">
                    SAR {estimatedMonthlyEarnings.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Approximate monthly income from the current average daily rate.
                  </p>
                </div>
                <div className="rounded-[24px] bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Avg daily rate
                  </p>
                  <p className="mt-2 text-3xl font-black text-foreground">SAR {averageDailyRate}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    A quick benchmark from the live listings shown on the marketplace.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/listings/new">
                  <Button size="lg" className="h-11 rounded-full px-5 text-sm font-semibold">
                    <Plus className="h-4 w-4" />
                    List your item
                  </Button>
                </Link>
                <Link href="/community-earnings">
                  <Button variant="outline" size="lg" className="h-11 rounded-full px-5 text-sm font-semibold">
                    View earnings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketplace-shell mt-6">
        <div className="overflow-hidden rounded-[24px] bg-[#241d48] px-5 py-4 text-white shadow-[0_18px_50px_rgba(25,17,52,0.18)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-black tracking-tight sm:text-xl">
                Start Earning Today <span className="font-medium text-white/80">Turn Your Items into Income!</span>
              </p>
            </div>
            <Link href="/listings/new">
              <Button variant="soft" size="lg" className="min-h-[44px] rounded-full px-5 text-sm font-semibold">
                + List Your Item Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {recentlyViewedListings.length > 0 && !listingsLoading && (
        <section className="marketplace-shell mt-10">
          <div className="surface-panel rounded-[36px] p-5 sm:p-6">
            <p className="section-label text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Recently viewed
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">
              Pick up where you left off
            </h2>
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
