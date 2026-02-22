"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import ListingCard from "@/components/ListingCard";
import SkeletonLoader from "@/components/SkeletonLoader";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/LocaleProvider";

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
      <div className="mx-auto max-w-5xl px-3 py-4 sm:p-4 mobile-content text-center py-12 sm:py-16 pb-20 md:pb-12">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{t("my_favorites")}</h1>
        <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">{t("no_favorites")}</p>
        <Link
          href="/listings"
          className="inline-block px-5 py-3 min-h-[44px] flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 font-medium touch-target"
        >
          {t("browse")}
        </Link>
      </div>
    );
  }

  if (error) {
    return <div className="px-3 py-4 mobile-content text-red-600">{t("failed_to_load")}</div>;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-4 sm:p-4 mobile-content pb-20 md:pb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-8">{t("my_favorites")}</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonLoader key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:p-4 mobile-content pb-20 md:pb-8">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-8">{t("my_favorites")}</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {list.map((favorite: any) => (
          <ListingCard key={favorite.id} listing={favorite.listing} />
        ))}
      </div>
      {nextPage && (
        <div className="mt-6 sm:mt-8 flex justify-center">
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
