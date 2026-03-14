// frontend/components/ListingCard.tsx
"use client";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Heart, Star } from "lucide-react";
import { useLocale } from "./LocaleProvider";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function ListingCard({
  listing,
  compact = false,
  highlighted = false,
}: { listing: any; compact?: boolean; highlighted?: boolean }) {
  const [isFavorited, setIsFavorited] = useState(
    listing?.is_favorited || false,
  );
  const [token, setToken] = useState<string>("");
  const hasRatingFromListing =
    listing?.average_rating != null ||
    (Array.isArray(listing?.reviews) && listing.reviews.length > 0);
  const listingRating =
    listing?.average_rating != null
      ? listing.average_rating
      : Array.isArray(listing?.reviews) && listing.reviews.length > 0
        ? Math.round(
            (listing.reviews.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) /
              listing.reviews.length) * 10
          ) / 10
        : 0;
  const listingReviewCount = Array.isArray(listing?.reviews) ? listing.reviews.length : 0;

  const [averageRating, setAverageRating] = useState<number>(
    hasRatingFromListing ? listingRating : 0,
  );
  const [reviewCount, setReviewCount] = useState<number>(
    hasRatingFromListing ? listingReviewCount : 0,
  );
  const effectiveRating = hasRatingFromListing ? listingRating : averageRating;
  const effectiveReviewCount = hasRatingFromListing ? listingReviewCount : reviewCount;
  const { t } = useLocale();

  // Never fetch reviews per card — use only listing data to avoid 429

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken);
    }
    // Update favorited status when listing prop changes
    setIsFavorited(listing?.is_favorited || false);
  }, [listing?.id, listing?.is_favorited]);

  const handleFavoriteClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();

      if (!token) {
        alert("Please login to add favorites");
        return;
      }

      setIsFavorited((prevState: boolean) => {
        const newState = !prevState;

        if (prevState) {
          // Optimistically remove from favorites
          // Make the API call
          axios
            .delete(`${API}/listings/${listing.id}/unfavorite/`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch((error) => {
              console.error("Error removing from favorites:", error);
              // Revert on error
              setIsFavorited(true);
              alert("Error updating favorite");
            });
        } else {
          // Optimistically add to favorites
          // Make the API call
          axios
            .post(
              `${API}/listings/${listing.id}/favorite/`,
              {},
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            )
            .catch((error) => {
              console.error("Error adding to favorites:", error);
              // Revert on error
              setIsFavorited(false);
              alert("Error updating favorite");
            });
        }

        return newState;
      });
    },
    [token, listing.id],
  );

  // Handle both full URLs and relative paths
  const getImageUrl = () => {
    if (!listing?.images?.[0]?.image) return "/hero.jpg";
    const imageUrl = listing.images[0].image;
    // Check if it's already a full URL
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }
    // If it's a relative path, prepend the API base
    return `${API?.replace("/api", "")}${imageUrl}`;
  };

  const imageUrl = getImageUrl();
  const currency = listing?.currency || "SAR";
  const displayRating = effectiveReviewCount > 0 ? (effectiveRating || 0).toFixed(1) : "New";
  const imageSizing = compact
    ? "aspect-[1.04/0.82] p-3 sm:p-4"
    : "aspect-[1.04/0.82] p-4";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group block rounded-[18px] transition-all duration-200 ${
        highlighted ? "ring-2 ring-primary/35" : ""
      }`}
    >
      <article className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition group-hover:-translate-y-1 group-hover:shadow-[0_16px_36px_rgba(15,23,42,0.1)]">
        <div className={`relative ${imageSizing}`}>
          <img
            src={imageUrl}
            alt={listing.title}
            className="h-full w-full rounded-[14px] object-contain bg-white transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
          {!compact && (
            <button
              onClick={handleFavoriteClick}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/92 text-slate-700 shadow-sm"
              aria-label={isFavorited ? t("remove_favorite") : t("add_favorite")}
            >
              <Heart
                className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-slate-600"}`}
              />
            </button>
          )}
        </div>

        <div className="px-3 pb-3.5 pt-0.5 sm:px-4 sm:pb-4">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-[1.25] text-slate-800 sm:text-[14px]">
            {listing.title}
          </h3>
          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="text-[15px] font-bold leading-none text-amber-500 sm:text-base">
              {currency} {listing.price_per_day}
              <span className="ml-1 text-[12px] font-medium text-slate-500">
                {t("price_per_day")}
              </span>
            </p>
            <div className="flex items-center gap-1 text-[14px] font-semibold leading-none text-slate-700">
              <span>{displayRating}</span>
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
