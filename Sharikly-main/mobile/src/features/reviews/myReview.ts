/**
 * The current user's own review for a listing, extracted from the reviews array
 * that the API already embeds on `listing.reviews` (each review carries `user.id`).
 * Returns null when the user hasn't reviewed, or when we don't yet know who they are.
 */
export interface MyReview {
  rating: number;
  comment?: string;
}

export function findMyReview(
  reviews: any[] | undefined | null,
  myId: number | undefined | null
): MyReview | null {
  if (!Array.isArray(reviews) || myId == null) return null;
  const mine = reviews.find((r) => r?.user?.id === myId);
  return mine ? { rating: mine.rating, comment: mine.comment } : null;
}
