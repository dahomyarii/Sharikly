"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import SkeletonLoader from "@/components/SkeletonLoader";
import ListingCard from "@/components/ListingCard";
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

function HostEarningsHighlightsCard({ className = "" }: { className?: string }) {
  return (
    <div className={`surface-panel rounded-[28px] p-3.5 sm:p-4 ${className}`.trim()}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="section-label text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Host highlights
          </p>
          <h2 className="mt-1.5 text-lg font-black tracking-tight text-foreground sm:text-xl">
            Earn with your items
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            List gear and see live totals, averages, and top hosts on the community earnings page.
          </p>
        </div>
        <Sparkles className="h-5 w-5 shrink-0 text-primary" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Link href="/listings/new">
          <Button size="lg" className="h-11 w-full rounded-full px-5 text-sm font-semibold sm:w-auto">
            <Plus className="h-4 w-4" />
            List your item
          </Button>
        </Link>
        <Button variant="ghost" size="sm" className="h-auto w-fit p-0 text-primary hover:bg-transparent hover:text-primary/90" asChild>
          <Link href="/community-earnings" className="inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline">
            Community earnings
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
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
        <div className="surface-panel relative overflow-hidden rounded-[30px] sm:rounded-[34px] lg:rounded-[36px]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/image.jpeg)", backgroundPosition: "center" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.4),rgba(255,255,255,0.25),rgba(25,17,52,0.15))]" />
          <div className="floating-orb left-[-3rem] top-[-2rem] h-24 w-24 bg-primary/15" />
          <div className="floating-orb bottom-[-2rem] right-[-1rem] h-20 w-20 bg-emerald-300/25" />
          
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.32fr_0.78fr] px-4 py-5 sm:px-7 sm:py-7 lg:px-9 lg:py-8">
            
            {/* Left Column Area */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80 sm:text-xs">
                Ekra marketplace
              </p>
              <h1 className="max-w-2xl text-[2.1rem] font-black leading-[1.02] tracking-tight text-foreground sm:text-[3.25rem] lg:text-[4rem]">
                Rent <span className="text-primary">Anything</span> from People Near You
              </h1>
              <p className="mt-2.5 max-w-xl text-[13px] font-medium leading-5 text-slate-800 sm:mt-3 sm:text-[15px] sm:leading-6">
                Search trusted local rentals, book in minutes, and start earning from the gear
                you already own.
              </p>

              {/* Mobile-only: compact single-line search pill */}
              <div className="block md:hidden mobile-search-float">
                <button
                  type="button"
                  onClick={() => router.push("/listings")}
                  className="tap-highlight flex w-full items-center gap-3 rounded-full border border-white/50 bg-white/80 backdrop-blur-md px-4 py-3 shadow-sm transition-all active:scale-[0.98] active:bg-white/90"
                >
                  <Search className="h-4 w-4 shrink-0 text-primary" />
                  <span className="flex-1 text-left text-sm text-muted-foreground">Search items or location...</span>
                  <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Search</span>
                </button>
              </div>

              {/* Desktop: full search bar */}
              <div className="hidden md:block glass-panel mt-4 rounded-[22px] p-1.5 sm:mt-5 sm:rounded-[26px] sm:p-2 border border-white/40 shadow-sm bg-white/40">
                <div className="grid gap-2 md:grid-cols-[1.7fr_1fr_1fr_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Search items or location..."
                      className="h-11 w-full rounded-[18px] border border-transparent bg-white/80 backdrop-blur pl-11 pr-4 text-sm outline-none sm:h-12 sm:rounded-[20px]"
                    />
                  </div>
                  <select
                    value={heroCategory}
                    onChange={(e) => setHeroCategory(e.target.value)}
                    className="h-11 rounded-[18px] border border-transparent bg-white/80 backdrop-blur px-4 text-sm outline-none sm:h-12 sm:rounded-[20px]"
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
                      className="h-11 w-full rounded-[18px] border border-transparent bg-white/80 backdrop-blur pl-11 pr-4 text-sm outline-none sm:h-12 sm:rounded-[20px]"
                    />
                  </div>
                  <Button
                    size="lg"
                    onClick={handleSearch}
                    className="h-11 rounded-[18px] px-5 sm:h-12 sm:rounded-[20px] sm:px-6"
                  >
                    Search
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide scroll-smooth-momentum scroll-snap-x sm:mt-4">
                {(visibleCategories.length > 0 ? visibleCategories : []).map((category: any) => {
                  const Icon = getCategoryIcon(category.name);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryOpen(category.id)}
                      className="tap-highlight scroll-snap-item flex min-w-max items-center gap-2 rounded-full border border-white/50 bg-white/60 backdrop-blur px-3 py-1.5 text-[11px] font-medium text-foreground shadow-sm hover:bg-white/80 active:scale-95 transition-all sm:px-3.5 sm:py-2 sm:text-sm"
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
                      className="flex min-w-max items-center gap-2 rounded-full border border-white/50 bg-white/60 backdrop-blur px-3 py-1.5 text-[11px] font-medium text-foreground shadow-sm sm:px-3.5 sm:py-2 sm:text-sm"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      {label}
                    </span>
                  ))}
              </div>
            </div>

            {/* Right column (desktop): same host highlights card as mobile sees below */}
            <div className="hidden min-h-[260px] flex-col justify-between lg:flex lg:pl-6 lg:border-l lg:border-white/30 lg:pt-0">
              <HostEarningsHighlightsCard className="border-white/40 bg-white/35 shadow-sm backdrop-blur-sm" />
            </div>

          </div>
        </div>
      </section>

      <section className="marketplace-shell mt-7">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="hidden sm:block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Discover</p>
            <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Popular Items
            </h2>
          </div>
          <Link
            href="/listings"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3.5 py-1.5 text-sm font-semibold text-primary shadow-sm backdrop-blur-sm transition hover:bg-accent/70"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-5">
          {listingsLoading
            ? Array.from({ length: 4 }).map((_, idx) => <SkeletonLoader key={idx} />)
            : popularListings.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} compact />
              ))}
        </div>
      </section>

      <section className="marketplace-shell mt-7">
        <div className="surface-panel rounded-[28px] p-3.5 sm:p-4">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="section-label text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Explore more
                </p>
                <h2 className="mt-1.5 text-lg font-black tracking-tight text-foreground sm:text-xl">
                  Find the right rental for every plan
                </h2>
              </div>
              <Link href="/listings" className="text-sm font-semibold text-primary">
                Browse all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {listingsLoading ? (
                Array.from({ length: 3 }).map((_, idx) => <SkeletonLoader key={idx} />)
              ) : exploreShowcase.length > 0 ? (
                exploreShowcase.map((listing: any) => (
                    <ListingCard key={listing.id} listing={listing} compact />
                  ))
              ) : (
                <div className="col-span-full grid gap-2.5 sm:grid-cols-3">
                  {(visibleCategories.length > 0 ? visibleCategories.slice(0, 3) : []).map(
                    (category: any) => {
                      const Icon = getCategoryIcon(category.name);
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategoryOpen(category.id)}
                          className="rounded-[22px] border border-white/70 bg-white/80 p-3 text-left shadow-sm"
                        >
                          <Icon className="h-5 w-5 text-primary" />
                          <p className="mt-2.5 text-sm font-semibold text-foreground">
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
            <div className="mt-3 flex flex-wrap gap-2">
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
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-5">
              {recentlyViewedListings.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="marketplace-shell mt-7 lg:hidden" aria-label="Host earning highlights">
        <HostEarningsHighlightsCard />
      </section>
    </div>
  );
}
