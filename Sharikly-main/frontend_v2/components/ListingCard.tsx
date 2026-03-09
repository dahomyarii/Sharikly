// frontend/components/ListingCard.tsx
"use client";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Star, User } from "lucide-react";
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

  const imageHeight = compact ? "h-24 sm:h-28" : "h-28 sm:h-44 md:h-48";
  const padding = compact ? "p-2 sm:p-3" : "p-3 sm:p-4";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`block border rounded-xl overflow-hidden transition-all duration-200 mobile-card ${
        highlighted
          ? "border-primary ring-2 ring-primary/30 shadow-md"
          : "border-border bg-card hover:shadow-md hover:border-primary/50"
      }`}
    >
      <div className={`relative ${imageHeight} bg-muted`}>
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover listing-img-mobile listing-card-img-mobile"
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full touch-target shadow-sm ${
            isFavorited
              ? "bg-red-500 text-white"
              : "bg-card/90 text-muted-foreground hover:bg-card hover:text-foreground active:scale-95"
          } transition-all duration-200`}
          aria-label={isFavorited ? t("remove_favorite") : t("add_favorite")}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill={isFavorited ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        {(listing.owner || effectiveReviewCount > 0) && (
          <div className="absolute inset-x-1.5 bottom-1.5 sm:inset-x-2 sm:bottom-2 flex items-center justify-between gap-2 rounded-full bg-black/65 text-white px-2.5 py-1 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.round(effectiveRating || 0)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-white/40"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-medium truncate">
                {effectiveReviewCount > 0
                  ? `${effectiveRating?.toFixed(1) ?? "0.0"} (${effectiveReviewCount})`
                  : t("no_reviews")}
              </span>
            </div>
            {listing.owner && (
              <div className="w-8 h-8 rounded-full bg-white/95 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/80">
                {listing.owner.avatar ? (
                  <img
                    src={
                      listing.owner.avatar.startsWith("http")
                        ? listing.owner.avatar
                        : `${API?.replace("/api", "")}${listing.owner.avatar}`
                    }
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-gray-700" />
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className={padding}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm line-clamp-2 text-foreground">{listing.title}</h3>
          <span className="text-sm font-medium text-foreground shrink-0">
            ${listing.price_per_day}
            <span className="text-muted-foreground text-xs">{t("price_per_day")}</span>
          </span>
        </div>
        {listing.category && (
          <div className="mb-1.5 inline-block bg-primary/15 text-primary dark:bg-primary/25 text-xs font-medium px-2 py-0.5 rounded">
            {listing.category.name}
          </div>
        )}
        <div className="text-xs text-muted-foreground mb-2">{listing.city || "—"}</div>

        {/* Rating + owner are overlaid inside the image to save space */}
      </div>
    </Link>
  );
}
