"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import axiosInstance from "@/lib/axios";
import ListingCard from "@/components/ListingCard";
import SkeletonLoader from "@/components/SkeletonLoader";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

const API = process.env.NEXT_PUBLIC_API_BASE;
const fetcher = (url: string, token: string) =>
  axiosInstance
    .get(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => res.data);

export default function FavoritesPage() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (!storedToken) {
      router.push("/auth/login");
    } else {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, [router]);

  const {
    data: favorites,
    error,
    isLoading,
  } = useSWR(
    isAuthenticated && token ? [`${API}/favorites/`, token] : null,
    ([url, tok]) => fetcher(url, tok),
  );

  if (!isAuthenticated) {
    return <div className="p-4">{t("redirecting_login")}</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{t("failed_to_load")}</div>;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <h1 className="text-3xl font-bold mb-8">{t("my_favorites")}</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonLoader key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="mx-auto max-w-5xl p-4 text-center py-16">
        <h1 className="text-2xl font-bold mb-4">{t("my_favorites")}</h1>
        <p className="text-gray-500 mb-6">{t("no_favorites")}</p>
        <Link
          href="/listings"
          className="inline-block px-5 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
        >
          {t("browse")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="text-3xl font-bold mb-8">{t("my_favorites")}</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((favorite: any) => (
          <ListingCard key={favorite.id} listing={favorite.listing} />
        ))}
      </div>
    </div>
  );
}
