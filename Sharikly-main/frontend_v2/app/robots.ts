import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ekra.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/settings",
          "/bookings",
          "/notifications",
          "/chat",
          "/favorites",
          "/profile",
          "/admin/",
          "/listings/new",
          "/request_booking",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/settings",
          "/bookings",
          "/notifications",
          "/chat",
          "/favorites",
          "/profile",
          "/admin/",
          "/listings/new",
          "/request_booking",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
