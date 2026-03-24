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
      className={`group block h-full rounded-[16px] sm:rounded-[24px] transition-all duration-300 ${
        highlighted ? "ring-2 ring-primary/40 ring-offset-2" : ""
      }`}
    >
      <article className="h-full overflow-hidden rounded-[16px] sm:rounded-[24px] border border-slate-200/50 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] flex flex-col">
        <div className={`relative w-full overflow-hidden bg-slate-100 ${compact ? "aspect-[1.1]" : "aspect-[4/3] sm:aspect-[1.25]"}`}>
          <img
            src={imageUrl}
            alt={listing.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent opacity-0 mix-blend-multiply transition-opacity duration-300 group-hover:opacity-100" />
          
          <button
            onClick={handleFavoriteClick}
            className="absolute right-2 top-2 sm:right-3 sm:top-3 flex h-[28px] w-[28px] sm:h-[32px] sm:w-[32px] items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.1)] backdrop-blur transition-transform hover:scale-110 active:scale-95 z-10"
            aria-label={isFavorited ? t("remove_favorite") : t("add_favorite")}
          >
            <Heart
              className={`h-[14px] w-[14px] sm:h-[15px] sm:w-[15px] ${isFavorited ? "fill-rose-500 text-rose-500" : "text-slate-400"}`}
            />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-2.5 sm:p-4">
          <div className="flex items-start justify-between gap-1 sm:gap-2 mb-1">
            <h3 className="line-clamp-1 text-[13px] sm:text-[15px] font-bold tracking-tight text-slate-800">
              {listing.title}
            </h3>
            <div className="flex shrink-0 items-center justify-center gap-1 rounded-md bg-transparent px-0 py-0 sm:bg-slate-50 sm:px-1.5 sm:py-0.5">
              <Star className="h-[11px] w-[11px] sm:h-3 sm:w-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] sm:text-[12px] font-bold text-slate-700">{displayRating}</span>
            </div>
          </div>
          
          <p className="line-clamp-1 text-[11px] sm:text-[13px] text-slate-500 font-medium mb-1.5 sm:mb-2.5">
             {listing.city || "Riyadh"}
          </p>

          <div className="mt-auto pt-2 flex items-center justify-between border-t border-slate-100 border-dashed">
            <p className="text-[13px] sm:text-[15px] font-black text-slate-900">
              {currency} {listing.price_per_day}
              <span className="ml-1 text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {t("price_per_day")}
              </span>
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}
