// frontend/components/ListingCard.tsx
"use client";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Crown, Heart, MapPin, Star, User } from "lucide-react";
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
  const imageHeight = compact ? "h-32 sm:h-36" : "h-44 sm:h-52";
  const currency = listing?.currency || "SAR";
  const locationText = listing?.city || listing?.location || listing?.address || "Near you";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group block overflow-hidden rounded-[28px] transition-all duration-200 ${
        highlighted ? "ring-2 ring-primary/35" : ""
      }`}
    >
      <article className="surface-panel mobile-card overflow-hidden rounded-[28px] bg-card/95 group-hover:-translate-y-1">
        <div className={`relative overflow-hidden rounded-[24px] ${imageHeight}`}>
          <img
            src={imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] listing-img-mobile listing-card-img-mobile"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
            <div className="rounded-full border border-white/65 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm">
              {listing?.category?.name || "Popular"}
            </div>
            <button
              onClick={handleFavoriteClick}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/90 shadow-sm transition hover:scale-105"
              aria-label={isFavorited ? t("remove_favorite") : t("add_favorite")}
            >
              <Heart
                className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-foreground"}`}
              />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-bold leading-6 text-foreground sm:text-base">
                {listing.title}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{locationText}</span>
              </div>
            </div>
            {listing.owner && (
              <div className="relative flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white shadow-sm">
                  {listing.owner.avatar ? (
                    <img
                      src={
                        listing.owner.avatar.startsWith("http")
                          ? listing.owner.avatar
                          : `${API?.replace("/api", "")}${listing.owner.avatar}`
                      }
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-gray-700" />
                  )}
                </div>
                {listing.owner.is_super_host && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm ring-2 ring-white/80">
                    <Crown className="h-2.5 w-2.5 fill-current" />
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mb-3 flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              <Star className="h-3.5 w-3.5 fill-current" />
              {effectiveReviewCount > 0 ? (effectiveRating || 0).toFixed(1) : "New"}
            </div>
            <span className="text-xs text-muted-foreground">
              {effectiveReviewCount > 0 ? `${effectiveReviewCount} reviews` : "No reviews yet"}
            </span>
          </div>

          <div className="flex items-end justify-between gap-3">
            <p className="text-lg font-black tracking-tight text-primary">
              {currency} {listing.price_per_day}
              <span className="ml-1 text-xs font-medium text-muted-foreground">
                {t("price_per_day")}
              </span>
            </p>
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              Rent now
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
