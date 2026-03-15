"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import ListingCard from "@/components/ListingCard";
import SkeletonLoader from "@/components/SkeletonLoader";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/LocaleProvider";
import { Heart, Plus } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function FavoritesPage() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setAuthChecked(true);
    if (!token) {
      router.push("/auth/login");
      return;
    }
    setLoading(true);
    setError(false);
    axiosInstance
      .get(`${API}/favorites/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const data = res.data;
        const items = Array.isArray(data) ? data : data?.results ?? [];
        setList(items);
        setNextPage(data?.next ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [router]);

  if (authChecked && !localStorage.getItem("access_token")) {
    return <div className="p-4">{t("redirecting_login")}</div>;
  }

  const loadMore = () => {
    if (!nextPage || loadingMore) return;
    const token = localStorage.getItem("access_token");
    if (!token || !API) return;
    const url = nextPage.startsWith("http") ? nextPage : `${API.replace(/\/api\/?$/, "")}${nextPage.startsWith("/") ? nextPage : `/${nextPage}`}`;
    setLoadingMore(true);
    axiosInstance
      .get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const data = res.data;
        const items = Array.isArray(data) ? data : data?.results ?? [];
        setList((prev) => [...prev, ...items]);
        setNextPage(data?.next ?? null);
      })
      .finally(() => setLoadingMore(false));
  };

  if (!list.length && !loading) {
    return (
      <div className="marketplace-shell py-4 pb-24 md:pb-12">
        <div className="surface-panel px-4 py-12 text-center sm:px-8 sm:py-16">
          <p className="section-label text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Saved
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">
            {t("my_favorites")}
          </h1>
          <div className="mx-auto mb-6 mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="mb-1 font-medium text-muted-foreground">{t("no_favorites")}</p>
          <p className="mx-auto mb-6 max-w-sm text-sm text-muted-foreground">
            Save listings you like by tapping the heart. They&apos;ll show up here.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/listings"
              className="ekra-gradient inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 py-3 font-medium text-primary-foreground touch-target"
            >
              {t("browse")}
            </Link>
            <Link
              href="/listings/new"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-border px-5 py-3 font-medium text-foreground touch-target hover:bg-accent"
            >
              <Plus className="w-4 h-4" />
              {t("list_new")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="marketplace-shell py-4 text-red-600">{t("failed_to_load")}</div>;
  }

  if (loading) {
    return (
      <div className="marketplace-shell py-4 pb-24 md:pb-10">
        <div className="mb-6">
          <p className="section-label text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Saved
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">{t("my_favorites")}</h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonLoader key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-shell py-4 pb-24 md:pb-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Saved
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">{t("my_favorites")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep your favorite rentals in one place and come back when you&apos;re ready to book.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((favorite: any) => (
          <ListingCard key={favorite.id} listing={favorite.listing} />
        ))}
      </div>
      {nextPage && (
        <div className="mt-6 flex justify-center sm:mt-8">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
            className="min-h-[44px] px-6 touch-target"
          >
            {loadingMore ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
                Loading…
              </span>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
