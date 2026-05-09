export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string | null;
  bio?: string | null;
  is_email_verified: boolean;
  phone_number?: string | null;
  language: string;
}

export interface ListingImage {
  id: number;
  image: string;
  position: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  price_per_day: string | number;
  city?: string | null;
  is_active: boolean;
  images: ListingImage[];
  category?: Category | null;
  owner: Pick<User, "id" | "username" | "avatar">;
  created_at: string;
  avg_rating?: number | null;
  review_count?: number;
  is_favorited?: boolean;
}

export interface Notification {
  id: number;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge?: number;
}
