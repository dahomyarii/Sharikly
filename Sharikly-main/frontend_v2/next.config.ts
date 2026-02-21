import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "9bed6963e2503c0492c7d2e6c526a3c7.r2.cloudflarestorage.com",
        pathname: "/**",
      },
    ],
  },
  reactStrictMode: false,
  // Cache static assets for 1 year; improve repeat visits and Speed Index
  async headers() {
    return [
      {
        source: "/image.jpeg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/logo.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  // Reduce client JS: enable experimental optimizePackageImports for lucide etc. if available
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
