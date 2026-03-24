// frontend/components/ListingCard.tsx
"use client";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Star, Bookmark } from "lucide-react";
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

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken);
    }
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
          axios
            .delete(`${API}/listings/${listing.id}/unfavorite/`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch((error) => {
              console.error("Error removing from favorites:", error);
              setIsFavorited(true);
              alert("Error updating favorite");
            });
        } else {
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
              setIsFavorited(false);
              alert("Error updating favorite");
            });
        }

        return newState;
      });
    },
    [token, listing.id],
  );

  const getImageUrl = () => {
    if (!listing?.images?.[0]?.image) return "/hero.jpg";
    const imageUrl = listing.images[0].image;
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${API?.replace("/api", "")}${imageUrl}`;
  };

  const getAvatarUrl = () => {
    const avatar = listing?.owner?.avatar || listing?.owner_avatar;
    if (!avatar) return null;
    if (avatar.startsWith("http")) return avatar;
    return `${API?.replace("/api", "")}${avatar}`;
  };

  const imageUrl = getImageUrl();
  const avatarUrl = getAvatarUrl();
  const currency = listing?.currency || "SAR";
  
  // Calculate how many stars to fill. If new, default to 5 for aesthetics if desired, but 0 is accurate. Let's use actual rating or 5 if new to match screenshot vibe.
  const ratingValue = effectiveReviewCount > 0 ? Math.round(effectiveRating) : 5; 
  const starsArray = [1, 2, 3, 4, 5];

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group block h-full w-full transition-all duration-300 ${
        highlighted ? "ring-2 ring-primary/40 ring-offset-2 rounded-[20px]" : ""
      }`}
    >
      <article className="flex flex-col h-full bg-transparent">
        {/* Image Container */}
        <div className={`relative w-full overflow-hidden rounded-[20px] bg-slate-100/50 aspect-square sm:aspect-[0.95]`}>
          <img
            src={imageUrl}
            alt={listing.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
          
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
          
          {/* Bookmark / Favorite */}
          <button
            onClick={handleFavoriteClick}
            className="absolute right-3 top-3 z-10 touch-target"
            aria-label={isFavorited ? t("remove_favorite") : t("add_favorite")}
          >
            <Bookmark
              className={`h-[22px] w-[22px] sm:h-[24px] sm:w-[24px] transition-colors ${
                isFavorited ? "fill-[#7A3E82] text-[#7A3E82]" : "text-[#7A3E82]"
              }`}
              strokeWidth={2}
            />
          </button>
          
          {/* Bottom Left: Stars */}
          <div className="absolute left-3 bottom-3 z-10 flex gap-[2px]">
             {starsArray.map((star) => (
               <Star 
                 key={star} 
                 className={`h-[14px] w-[14px] sm:h-[16px] sm:w-[16px] ${
                   star <= ratingValue ? "fill-[#F93B69] text-[#F93B69]" : "fill-white/60 text-transparent"
                 }`} 
               />
             ))}
          </div>

          {/* Bottom Right: Avatar */}
          {avatarUrl ? (
            <div className="absolute right-3 bottom-3 z-10 h-[36px] w-[36px] sm:h-[40px] sm:w-[40px] rounded-full overflow-hidden shadow-md bg-slate-200">
               <img src={avatarUrl} alt="Owner" className="h-full w-full object-cover" />
            </div>
          ) : (
             <div className="absolute right-3 bottom-3 z-10 h-[36px] w-[36px] sm:h-[40px] sm:w-[40px] rounded-full overflow-hidden shadow-md bg-[#553399] flex items-center justify-center text-white font-bold text-[14px]">
               {listing?.owner?.username?.charAt(0).toUpperCase() || "U"}
             </div>
          )}
        </div>

        {/* Text Container */}
        <div className="pt-2 sm:pt-3 px-1 flex flex-col flex-1">
          <h3 className="line-clamp-1 text-[13px] sm:text-[14px] font-[400] text-[#222222]">
            {listing.title}
          </h3>
          <p className="mt-0.5 text-[13px] sm:text-[14px] font-[500] text-[#7A3E82]">
            {currency} {listing.price_per_day} - 1/{t("day") || "day"}
          </p>
        </div>
      </article>
    </Link>
  );
}
