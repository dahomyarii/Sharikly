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
    ? "aspect-[1.12/0.78] p-1 sm:p-[5px]"
    : "aspect-[1.12/0.78] p-[5px] sm:p-[7px]";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group block h-full rounded-[10px] transition-all duration-200 sm:rounded-[12px] ${
        highlighted ? "ring-2 ring-primary/35" : ""
      }`}
    >
      <article className="h-full overflow-hidden rounded-[10px] border border-slate-200/80 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition group-hover:-translate-y-1 group-hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] sm:rounded-[12px]">
        <div className={`relative ${imageSizing}`}>
          <img
            src={imageUrl}
            alt={listing.title}
            className="h-full w-full rounded-[6px] object-contain bg-white transition duration-300 group-hover:scale-[1.02] sm:rounded-[8px]"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
          {!compact && (
            <button
              onClick={handleFavoriteClick}
              className="absolute right-1 top-1 flex h-6.5 w-6.5 items-center justify-center rounded-full bg-white/92 text-slate-700 shadow-sm touch-target sm:right-[6px] sm:top-[6px] sm:h-7.5 sm:w-7.5"
              aria-label={isFavorited ? t("remove_favorite") : t("add_favorite")}
            >
              <Heart
                className={`h-[10px] w-[10px] sm:h-[11px] sm:w-[11px] ${isFavorited ? "fill-red-500 text-red-500" : "text-slate-600"}`}
              />
            </button>
          )}
        </div>

        <div className="px-2 pb-2 pt-0 sm:px-[10px] sm:pb-[10px]">
          <h3 className="line-clamp-1 text-[10px] font-semibold leading-[1.15] text-slate-800 sm:text-[11.5px]">
            {listing.title}
          </h3>
          <div className="mt-0.5 flex items-center justify-between gap-1 sm:gap-1.5">
            <p className="whitespace-nowrap text-[10.5px] font-bold leading-none text-amber-500 sm:text-[11.5px]">
              {currency} {listing.price_per_day}
              <span className="ml-0.5 text-[8.5px] font-medium text-slate-500 sm:text-[9.5px]">
                {t("price_per_day")}
              </span>
            </p>
            <div className="flex shrink-0 items-center gap-0.5 text-[9px] font-semibold leading-none text-slate-700 sm:text-[10px]">
              <span>{displayRating}</span>
              <Star className="h-[10px] w-[10px] fill-amber-400 text-amber-400 sm:h-[11px] sm:w-[11px]" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
