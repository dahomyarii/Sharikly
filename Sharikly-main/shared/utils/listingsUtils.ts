/**
 * Shared listing helpers — used by web and mobile.
 */

/** Always returns a real Array. Handles null, undefined, non-arrays, and paginated { results }. */
export function toListingsArray(value: unknown): unknown[] {
  if (value == null) return [];
  if (Array.isArray(value)) return [...value];
  const results = (value as { results?: unknown })?.results;
  if (Array.isArray(results)) return [...results];
  if (results != null && typeof (results as { length?: number }).length === "number") {
    return Array.from(results as ArrayLike<unknown>);
  }
  return [];
}

/** Safe .slice for listings array. */
export function sliceListings(arr: unknown, start: number, end: number): unknown[] {
  if (!Array.isArray(arr)) return [];
  return arr.slice(start, end);
}

export function buildListingsQuery(params: {
  search: string;
  category: string;
  city: string;
  min_price: string;
  max_price: string;
  order: string;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.category) sp.set("category", params.category);
  if (params.city?.trim()) sp.set("city", params.city.trim());
  if (params.min_price) sp.set("min_price", params.min_price);
  if (params.max_price) sp.set("max_price", params.max_price);
  if (params.order && params.order !== "newest") sp.set("order", params.order);
  if (params.page != null && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
