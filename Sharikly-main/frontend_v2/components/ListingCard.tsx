// frontend/components/ListingCard.tsx
"use client";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import useSWR from "swr";
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
  
  const ownerId = typeof listing.owner === "object" ? listing.owner?.id : listing.owner_id || listing.owner;
  const { data: ownerProfile } = useSWR(
    ownerId && API ? `${API}/users/${ownerId}/` : null,
    async (url) => {
      const res = await axios.get(url);
      return res.data;
    },
    { revalidateOnFocus: false, dedupingInterval: 600000 }
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
    const avatar = ownerProfile?.avatar || listing?.owner?.avatar || listing?.owner_avatar;
    if (!avatar) return null;
    if (avatar.startsWith("http")) return avatar;
    return `${API?.replace("/api", "")}${avatar}`;
  };

  const imageUrl = getImageUrl();
  const avatarUrl = getAvatarUrl();
  const ownerName = ownerProfile?.username || ownerProfile?.first_name || listing?.owner?.username || "U";
  const currency = listing?.currency || "SAR";
  
  // Calculate how many stars to fill. If new, default to 5 for aesthetics if desired, but 0 is accurate. Let's use actual rating or 5 if new to match screenshot vibe.
  const ratingValue = effectiveReviewCount > 0 ? Math.round(effectiveRating) : 5; 
  const starsArray = [1, 2, 3, 4, 5];

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`listing-card-press tap-highlight group block h-full w-full transition-all duration-300 ${
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
          
          {/* Richer bottom gradient for text legibility */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/40 via-black/15 to-transparent pointer-events-none" />
          
          {/* Bookmark / Favorite — frosted glass pill on mobile */}
          <button
            onClick={handleFavoriteClick}
            className="absolute right-2.5 top-2.5 z-10 touch-target flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black/25 backdrop-blur-sm border border-white/25 transition-all active:scale-90 active:bg-black/40 sm:h-auto sm:w-auto sm:bg-transparent sm:border-0 sm:backdrop-blur-none sm:active:bg-transparent"
            aria-label={isFavorited ? t("remove_favorite") : t("add_favorite")}
          >
            <Bookmark
              className={`h-[20px] w-[20px] sm:h-[22px] sm:w-[22px] transition-colors drop-shadow-sm ${
                isFavorited ? "fill-[#7A3E82] text-[#7A3E82]" : "text-white sm:text-[#7A3E82]"
              }`}
              strokeWidth={2}
            />
          </button>
          
          {/* Bottom Left: Stars */}
          <div className="absolute left-2.5 bottom-2.5 z-10 flex gap-[2px] drop-shadow-sm">
             {starsArray.map((star) => (
               <Star 
                 key={star} 
                 className={`h-[13px] w-[13px] sm:h-[15px] sm:w-[15px] ${
                   star <= ratingValue ? "fill-[#F93B69] text-[#F93B69]" : "fill-white/50 text-transparent"
                 }`} 
               />
             ))}
          </div>

          {/* Bottom Right: Avatar */}
          {avatarUrl ? (
            <div className="absolute right-2.5 bottom-2.5 z-10 h-[34px] w-[34px] sm:h-[38px] sm:w-[38px] rounded-full overflow-hidden shadow-md bg-slate-200 ring-2 ring-white/70">
               <img src={avatarUrl} alt="Owner" className="h-full w-full object-cover" />
            </div>
          ) : (
             <div className="absolute right-2.5 bottom-2.5 z-10 h-[34px] w-[34px] sm:h-[38px] sm:w-[38px] rounded-full overflow-hidden shadow-md bg-white border border-slate-100 flex items-center justify-center ring-2 ring-white/70">
               <img src="/logo.png" alt="EKRA" className="h-2/3 w-2/3 object-contain" />
             </div>
          )}
        </div>

        {/* Text Container */}
        <div className="pt-2 sm:pt-2.5 px-0.5 flex flex-col flex-1">
          <h3 className="line-clamp-1 text-[13px] sm:text-[14px] font-[400] text-[#222222] leading-snug">
            {listing.title}
          </h3>
          <p className="mt-0.5 text-[13px] sm:text-[14px] font-[600] text-[#7A3E82] leading-snug">
            {currency} {listing.price_per_day}<span className="font-[400] text-[11px] sm:text-[12px] text-muted-foreground"> / {t("day") || "day"}</span>
          </p>
        </div>
      </article>
    </Link>
  );
}
