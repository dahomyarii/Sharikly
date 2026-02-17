const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/**
 * Wrap an existing absolute image URL with a Cloudinary "fetch" URL
 * to apply automatic format/quality enhancements.
 *
 * If Cloudinary is not configured or the URL is already a Cloudinary URL,
 * the original URL is returned unchanged.
 */
export function getEnhancedImageUrl(src: string | null | undefined): string {
  if (!src) return "";
  if (!CLOUD_NAME) return src;
  if (src.includes("res.cloudinary.com")) return src;

  const encoded = encodeURIComponent(src);
  /**
   * Transformations used:
   * - f_auto           → automatic format (WebP/AVIF/etc. when supported)
   * - q_auto:best      → highest reasonable quality (still optimized)
   * - e_auto_enhance   → general image enhancement
   * - e_auto_contrast  → improve contrast
   * - e_auto_color     → improve colors
   */
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/f_auto,q_auto:best,e_auto_enhance,e_auto_contrast,e_auto_color/${encoded}`;
}

