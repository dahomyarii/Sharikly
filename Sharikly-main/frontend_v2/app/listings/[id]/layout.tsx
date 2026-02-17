import type { Metadata } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

function getAbsoluteImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  const origin = API_BASE.replace(/\/api\/?$/, "");
  return `${origin}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API_BASE}/listings/${id}/`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { title: "Listing | EKRA" };
    const listing = await res.json();
    const title = listing.title ? `${listing.title} | EKRA` : "Listing | EKRA";
    const description =
      listing.description?.slice(0, 160) ||
      "Rent what you need, when you need it.";
    const imagePath = listing.images?.[0]?.image;
    const imageUrl = getAbsoluteImageUrl(imagePath);
    const url =
      typeof process.env.NEXT_PUBLIC_APP_URL === "string"
        ? `${process.env.NEXT_PUBLIC_APP_URL}/listings/${id}`
        : undefined;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        ...(imageUrl && { images: [{ url: imageUrl, width: 1200, height: 630 }] }),
        ...(url && { url }),
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
  } catch {
    return { title: "Listing | EKRA" };
  }
}

export default function ListingIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
