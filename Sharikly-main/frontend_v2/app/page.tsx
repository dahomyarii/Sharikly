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
  Compass,
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
  const featuredListing = listings[0];
  const popularListings = listings.slice(0, 6);
  const visibleCategories = categories.slice(0, 6);
  const exploreListings = listings.slice(6, 12);

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
        <div className="grid gap-4 lg:grid-cols-[1.45fr_0.9fr]">
          <div className="surface-panel relative overflow-hidden rounded-[40px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="floating-orb left-[-3rem] top-[-2rem] h-28 w-28 bg-primary/15" />
            <div className="floating-orb bottom-[-2rem] right-[-1rem] h-24 w-24 bg-emerald-300/25" />
            <div className="relative z-10">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-primary/80">
                Ekra marketplace
              </p>
              <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Rent <span className="text-primary">Anything</span> from People Near You
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                Search trusted local rentals, book in minutes, and start earning from the gear
                you already own.
              </p>

              <div className="glass-panel mt-8 rounded-[30px] p-2">
                <div className="grid gap-2 md:grid-cols-[1.7fr_1fr_1fr_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Search items or location..."
                      className="h-14 w-full rounded-[22px] border border-transparent bg-white/95 pl-11 pr-4 text-sm outline-none"
                    />
                  </div>
                  <select
                    value={heroCategory}
                    onChange={(e) => setHeroCategory(e.target.value)}
                    className="h-14 rounded-[22px] border border-transparent bg-white/95 px-4 text-sm outline-none"
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
                      className="h-14 w-full rounded-[22px] border border-transparent bg-white/95 pl-11 pr-4 text-sm outline-none"
                    />
                  </div>
                  <Button
                    size="lg"
                    onClick={handleSearch}
                    className="h-14 rounded-[22px] px-8"
                  >
                    Search
                  </Button>
                </div>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {(visibleCategories.length > 0 ? visibleCategories : []).map((category: any) => {
                  const Icon = getCategoryIcon(category.name);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryOpen(category.id)}
                      className="flex min-w-max items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-3 text-sm font-medium text-foreground shadow-sm"
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
                      className="flex min-w-max items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-3 text-sm font-medium text-foreground shadow-sm"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      {label}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="surface-panel relative overflow-hidden rounded-[36px] p-5 sm:p-6">
              <div className="floating-orb right-0 top-0 h-24 w-24 bg-primary/18" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Start earning
                  </p>
                  <h2 className="mt-3 text-3xl font-black leading-tight text-foreground">
                    Turn your items into monthly income
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    List your camera gear, gaming devices, tools, and more. Meet renters nearby
                    and get paid securely.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[26px] bg-white/90 p-4 shadow-sm">
                    <p className="text-sm text-muted-foreground">Estimated earnings</p>
                    <p className="mt-1 text-4xl font-black text-emerald-500">SAR 2,300</p>
                    <p className="text-sm text-muted-foreground">/ month</p>
                  </div>
                  <div className="rounded-[26px] ekra-gradient-soft p-4">
                    <p className="text-sm font-semibold text-foreground">Fast payouts</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      Verified renters, secure bookings, and simple listing management.
                    </p>
                  </div>
                </div>
                <Link href="/listings/new">
                  <Button size="lg" className="w-full justify-center">
                    <Plus className="h-4 w-4" />
                    List Your Item
                  </Button>
                </Link>
              </div>
            </div>

            <div className="surface-panel overflow-hidden rounded-[36px] p-5 sm:hidden">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Featured rental
              </p>
              {featuredListing ? (
                <div className="mt-3">
                  <ListingCard listing={featuredListing} compact />
                </div>
              ) : (
                <SkeletonLoader />
              )}
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
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="surface-panel rounded-[36px] p-5 sm:p-6">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="section-label text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Explore more
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                  Find the right rental for every plan
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {listingsLoading
                ? Array.from({ length: 6 }).map((_, idx) => <SkeletonLoader key={idx} />)
                : exploreListings.map((listing: any) => (
                    <ListingCard key={listing.id} listing={listing} compact />
                  ))}
            </div>
          </div>

          <div className="surface-panel rounded-[36px] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="section-label text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Host highlights
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">
                  Earn with your items
                </h2>
              </div>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="grid gap-3">
              <div className="rounded-[28px] bg-white/90 p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Top hosts this month</span>
                  <span className="success-chip rounded-full px-3 py-1 text-xs font-semibold">
                    Growing
                  </span>
                </div>
                <div className="space-y-3 text-sm">
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
              <div className="rounded-[28px] ekra-gradient p-5 text-primary-foreground shadow-[0_18px_40px_rgba(124,58,237,0.28)]">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-foreground/75">
                  Start today
                </p>
                <h3 className="mt-2 text-2xl font-black">Have a similar item?</h3>
                <p className="mt-2 text-sm leading-7 text-primary-foreground/85">
                  Turn it into income on Ekra and start receiving requests from renters nearby.
                </p>
                <Link href="/listings/new" className="mt-4 inline-flex">
                  <Button variant="soft" size="lg" className="text-sm font-semibold">
                    + List your item
                  </Button>
                </Link>
              </div>
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
