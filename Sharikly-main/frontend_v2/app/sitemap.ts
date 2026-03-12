import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ekra.com";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = APP_URL;

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/listings`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/careers`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  let listingPages: MetadataRoute.Sitemap = [];
  if (API_BASE) {
    try {
      // Respect backend pagination instead of requesting a huge "limit"
      // Cap the number of pages to avoid unbounded work if there are many listings.
      const pageSize = 100;
      const maxPages = 10;
      const listings: { id: number; updated_at?: string }[] = [];

      for (let page = 1; page <= maxPages; page += 1) {
        const res = await fetch(
          `${API_BASE}/listings/?page=${page}&page_size=${pageSize}`,
          {
            next: { revalidate: 3600 },
          },
        );
        if (!res.ok) {
          break;
        }
        const data = await res.json();
        const batch = Array.isArray(data) ? data : data?.results ?? [];
        if (!batch.length) {
          break;
        }
        listings.push(...batch);
        if (!data?.next) {
          break;
        }
      }

      listingPages = listings.map((item) => ({
        url: `${base}/listings/${item.id}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    } catch {
      // ignore fetch errors; static sitemap still works
    }
  }

  return [...staticPages, ...listingPages];
}
