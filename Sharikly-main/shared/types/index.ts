/**
 * Shared types matching Django REST API (marketplace/accounts serializers).
 * Used by both Next.js web and React Native mobile.
 */

export interface User {
  id: number;
  username: string;
  email?: string;
  avatar: string | null;
  bio: string | null;
  is_email_verified?: boolean;
  date_joined?: string;
  listings_count?: number;
  average_rating?: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string | null;
}

export interface ListingImage {
  id: number;
  image: string;
}

export interface Review {
  id: number;
  user: User;
  listing: number;
  rating: number;
  comment: string;
  created_at: string;
  helpful?: number;
  not_helpful?: number;
  user_vote?: string | null;
}

export interface Listing {
  id: number;
  owner: User;
  title: string;
  description: string;
  price_per_day: string;
  city: string;
  is_active: boolean;
  latitude?: number | null;
  longitude?: number | null;
  pickup_radius_m?: number | null;
  created_at: string;
  category: Category;
  category_id?: number;
  images: ListingImage[];
  average_rating: number;
  reviews?: Review[];
  is_favorited?: boolean;
  favorites_count?: number;
}

export interface Booking {
  id: number;
  listing: Listing;
  renter: User;
  start_date: string;
  end_date: string;
  total_price: string;
  status: string;
  payment_status?: string;
  created_at: string;
}

export interface Message {
  id: number;
  room: number;
  sender: User;
  text: string;
  image?: string | null;
  image_url?: string | null;
  audio?: string | null;
  audio_url?: string | null;
  created_at: string;
}

export interface ChatRoom {
  id: number;
  participants: User[];
  created_at: string;
  last_message?: Message | null;
}

export interface Notification {
  id: number;
  notification_type: string;
  title?: string;
  body?: string;
  link?: string;
  created_at: string;
  read: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TokenResponse {
  access: string;
  refresh: string;
}
