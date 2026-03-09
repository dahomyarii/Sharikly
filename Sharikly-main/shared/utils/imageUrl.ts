/**
 * Build full image URL from API base and relative path.
 * Shared between web and mobile.
 */
export function buildImageUrl(apiBase: string | undefined, path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = apiBase?.replace(/\/api\/?$/, "") ?? "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
