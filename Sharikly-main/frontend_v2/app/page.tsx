"use client";

import { useMemo, useEffect, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetcher, API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import SkeletonLoader from "@/components/SkeletonLoader";
import ListingCard from "@/components/ListingCard";
import { CategorySelect } from "@/components/CategorySelect";
import { useLocale } from "@/components/LocaleProvider";
import { buildListingsQuery, toListingsArray } from "@/lib/listingsUtils";
import type { Listing, Category } from "@/types";
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
  type LucideIcon,
} from "lucide-react";

const API = API_BASE;

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  camera: Camera, photo: Camera,
  audio: Headphones, head: Headphones,
  camp: Tent, tent: Tent,
  home: Home, house: Home,
  game: Gamepad2, console: Gamepad2,
  speaker: Speaker,
};

function getCategoryIcon(categoryName: string): LucideIcon {
  const lower = categoryName.toLowerCase();
  const match = Object.keys(CATEGORY_ICON_MAP).find((key) => lower.includes(key));
  return match ? CATEGORY_ICON_MAP[match] : MoreHorizontal;
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
        <Button variant="ghost" size="sm" className="h-auto w-fit self-center p-0 text-primary hover:bg-transparent hover:text-primary/90 sm:self-auto" asChild>
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

  const listings: Listing[] = useMemo(() => toListingsArray(listingsData), [listingsData]);
  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : [];
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
            style={{ backgroundImage: "url(/image.jpeg)" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.75),rgba(255,255,255,0.6),rgba(236,233,246,0.45))]" />
          <div className="floating-orb left-[-3rem] top-[-2rem] h-24 w-24 bg-primary/10" />
          <div className="floating-orb bottom-[-2rem] right-[-1rem] h-20 w-20 bg-emerald-300/15" />
          
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.32fr_0.78fr] px-4 py-5 sm:px-7 sm:py-7 lg:px-9 lg:py-8">
            
            {/* Left Column Area */}
            <div className="min-w-0">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80 sm:text-xs">
                Ekra marketplace
              </p>
              <h1 className="max-w-2xl t-display text-foreground">
                Rent <span className="text-primary">Anything</span> from People Near You
              </h1>
              <p className="mt-3 max-w-xl t-body-lg text-muted-foreground">
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
              <div className="hidden md:block mt-4 rounded-2xl p-1.5 sm:mt-5 border border-border bg-card shadow-sm">
                <div className="grid gap-2 md:grid-cols-[1.7fr_1fr_1fr_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Search items or location..."
                      className="h-10 w-full rounded-[18px] border border-transparent bg-white/80 backdrop-blur pl-11 pr-4 text-sm outline-none sm:h-11 sm:rounded-[20px]"
                    />
                  </div>
                  <CategorySelect
                    value={heroCategory}
                    onChange={setHeroCategory}
                    options={categories}
                    placeholder={t("all_categories")}
                  />
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={heroCity}
                      onChange={(e) => setHeroCity(e.target.value)}
                      placeholder="Select city"
                      className="h-10 w-full rounded-[18px] border border-transparent bg-white/80 backdrop-blur pl-11 pr-4 text-sm outline-none sm:h-11 sm:rounded-[20px]"
                    />
                  </div>
                  <Button
                    size="lg"
                    onClick={handleSearch}
                    className="h-10 rounded-[18px] px-5 sm:h-11 sm:rounded-[20px] sm:px-6"
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

            {/* Right column: host highlights card, visible at all breakpoints */}
            <div className="flex min-w-0 flex-col justify-center gap-3 lg:min-h-[260px] lg:justify-between lg:pl-6 lg:border-l lg:border-border">
              <HostEarningsHighlightsCard className="border-border bg-card shadow-sm" />
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

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6">
          {listingsLoading
            ? Array.from({ length: 6 }).map((_, idx) => <SkeletonLoader key={idx} />)
            : popularListings.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} compact />
              ))}
        </div>
      </section>

      <section className="marketplace-shell mt-7">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#1b1233] via-[#2a1a4d] to-[#3a2266] px-5 py-5 shadow-lg shadow-primary/10 sm:px-8 sm:py-6">
          <div className="floating-orb right-[-1rem] top-[-1.5rem] h-24 w-24 bg-primary/25" />
          <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-lg font-black tracking-tight text-white sm:text-2xl">
              Start <span className="text-emerald-300">Earning</span> Today — Turn Your{" "}
              <span className="text-emerald-300">Items</span> into Income!
            </h2>
            <Link href="/listings/new" className="shrink-0">
              <Button size="lg" variant="soft" className="rounded-full px-6">
                <Plus className="h-4 w-4" />
                List Your Item Now
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
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-5">
              {recentlyViewedListings.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} compact />
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
