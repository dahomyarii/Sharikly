import { describe, it, expect } from "vitest";
import { toListingsArray, sliceListings, buildListingsQuery } from "@/lib/listingsUtils";

describe("toListingsArray", () => {
  it("returns [] for null and undefined", () => {
    expect(toListingsArray(null)).toEqual([]);
    expect(toListingsArray(undefined)).toEqual([]);
  });

  it("returns copy of array for array input", () => {
    const arr = [{ id: 1 }];
    expect(toListingsArray(arr)).toEqual(arr);
    expect(toListingsArray(arr)).not.toBe(arr);
  });

  it("normalizes paginated { results } to array", () => {
    expect(toListingsArray({ results: [{ id: 1 }, { id: 2 }] })).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("returns [] for empty or invalid input", () => {
    expect(toListingsArray({})).toEqual([]);
    expect(toListingsArray("string")).toEqual([]);
  });
});

describe("sliceListings", () => {
  it("slices array", () => {
    expect(sliceListings([1, 2, 3, 4], 1, 3)).toEqual([2, 3]);
  });

  it("returns [] for non-array", () => {
    expect(sliceListings(null, 0, 1)).toEqual([]);
    expect(sliceListings({}, 0, 1)).toEqual([]);
  });
});

describe("buildListingsQuery", () => {
  it("returns empty string when no params", () => {
    expect(
      buildListingsQuery({
        search: "",
        category: "",
        city: "",
        min_price: "",
        max_price: "",
        order: "newest",
      })
    ).toBe("");
  });

  it("includes search and category in query", () => {
    const q = buildListingsQuery({
      search: "photo",
      category: "2",
      city: "",
      min_price: "",
      max_price: "",
      order: "price_asc",
    });
    expect(q).toContain("search=photo");
    expect(q).toContain("category=2");
    expect(q).toContain("order=price_asc");
  });
});
