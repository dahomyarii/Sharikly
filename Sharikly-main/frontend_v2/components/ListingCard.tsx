// frontend/components/ListingCard.tsx
"use client";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Star, User } from "lucide-react";
import { useLocale } from "./LocaleProvider";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function ListingCard({ listing }: { listing: any }) {
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

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="block border rounded-2xl overflow-hidden hover:shadow-md active:opacity-95 transition"
    >
      <div className="relative h-28 sm:h-44 md:h-48 bg-gray-100">
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
          className={`absolute top-3 right-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full touch-target ${
            isFavorited
              ? "bg-red-500 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100 active:bg-gray-200"
          } transition shadow-sm`}
          aria-label={isFavorited ? t("remove_favorite") : t("add_favorite")}
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
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
      </div>
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{listing.title}</h3>
          <span className="text-sm">
            ${listing.price_per_day} {t("price_per_day")}
          </span>
        </div>
        {listing.category && (
          <div className="mb-2 inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
            {listing.category.name}
          </div>
        )}
        <div className="text-sm text-gray-500 mb-3">{listing.city || "—"}</div>

        {/* Lender/Owner Info */}
        {listing.owner && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {listing.owner.avatar ? (
                <img
                  src={
                    listing.owner.avatar.startsWith("http")
                      ? listing.owner.avatar
                      : `${API?.replace("/api", "")}${listing.owner.avatar}`
                  }
                  alt={listing.owner.username || listing.owner.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500">{t("lender")}</div>
              <span className="text-sm font-medium text-gray-700 truncate block">
                {listing.owner.username || listing.owner.email}
              </span>
            </div>
          </div>
        )}

        {/* Rating and Reviews */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(hasRatingFromListing ? listingRating : averageRating)
                    ? "fill-orange-500 text-orange-500"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {(hasRatingFromListing ? listingReviewCount : reviewCount) > 0
              ? `${hasRatingFromListing ? listingRating : averageRating}`
              : t("no_ratings")}
          </span>
          <span className="text-xs text-gray-500">
            ({(hasRatingFromListing ? listingReviewCount : reviewCount)}{" "}
            {(hasRatingFromListing ? listingReviewCount : reviewCount) === 1 ? t("review") : t("reviews")})
          </span>
        </div>
      </div>
    </Link>
  );
}
