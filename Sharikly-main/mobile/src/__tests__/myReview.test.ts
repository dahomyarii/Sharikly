import { findMyReview } from "@/features/reviews/myReview";

const reviews = [
  { id: 1, user: { id: 7 }, rating: 4, comment: "ok" },
  { id: 2, user: { id: 12 }, rating: 5, comment: "great" },
];

describe("findMyReview", () => {
  it("returns the current user's review when present", () => {
    expect(findMyReview(reviews, 12)).toEqual({ rating: 5, comment: "great" });
  });

  it("returns null when the user has not reviewed", () => {
    expect(findMyReview(reviews, 99)).toBeNull();
  });

  it("returns null when the user id is unknown", () => {
    expect(findMyReview(reviews, undefined)).toBeNull();
  });

  it("returns null when reviews is missing", () => {
    expect(findMyReview(undefined, 12)).toBeNull();
  });
});
