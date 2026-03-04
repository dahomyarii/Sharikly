/** Always returns a real Array (safe for .filter, .map, etc.). Handles null, undefined, non-arrays, and paginated { results }. */
export function toListingsArray(value: unknown): any[] {
  if (value == null) return [];
  if (Array.isArray(value)) return [...value];
  const results = (value as { results?: unknown })?.results;
  if (Array.isArray(results)) return [...results];
  if (results != null && typeof (results as any).length === "number") return Array.from(results as ArrayLike<any>);
  return [];
}

/** Safe .slice: returns a subarray only if the value is a real array; otherwise []. */
export function sliceListings(arr: unknown, start: number, end: number): any[] {
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
}): string {
  const sp = new URLSearchParams();
  if (params.search.trim()) sp.set("search", params.search.trim());
  if (params.category) sp.set("category", params.category);
  if (params.city.trim()) sp.set("city", params.city.trim());
  if (params.min_price) sp.set("min_price", params.min_price);
  if (params.max_price) sp.set("max_price", params.max_price);
  if (params.order && params.order !== "newest") sp.set("order", params.order);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
