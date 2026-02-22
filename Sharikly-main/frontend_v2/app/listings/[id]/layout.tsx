import type { Metadata } from "next";
import { cache } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ekra.com";

function getAbsoluteImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  const origin = API_BASE.replace(/\/api\/?$/, "");
  return `${origin}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

const getListing = cache(async (id: string) => {
  try {
    const res = await fetch(`${API_BASE}/listings/${id}/`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
});

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Listing | EKRA" };
  const title = listing.title ? `${listing.title} | EKRA` : "Listing | EKRA";
  const description =
    listing.description?.slice(0, 160) ||
    "Rent what you need, when you need it.";
  const imagePath = listing.images?.[0]?.image;
  const imageUrl = getAbsoluteImageUrl(imagePath);
  const url = `${APP_URL}/listings/${id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      ...(imageUrl && { images: [{ url: imageUrl, width: 1200, height: 630 }] }),
      url,
      type: "website",
      siteName: "EKRA",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default async function ListingIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);
  let jsonLd: object | null = null;
  if (listing) {
    const imageUrl = getAbsoluteImageUrl(listing.images?.[0]?.image);
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: listing.title,
      description: listing.description?.slice(0, 500) || undefined,
      ...(imageUrl && { image: imageUrl }),
      ...(listing.price_per_day != null && {
        offers: {
          "@type": "Offer",
          price: listing.price_per_day,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
      }),
      url: `${APP_URL}/listings/${id}`,
    };
  }
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
