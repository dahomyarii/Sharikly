import { axiosInstance, buildApiUrl } from "@/services/api/client";

export async function getFavorites(): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl("/favorites/"));
  return data;
}

export async function addFavorite(listingId: number): Promise<unknown> {
  // Real endpoint: POST /listings/{listing_id}/favorite/
  const { data } = await axiosInstance.post(buildApiUrl(`/listings/${listingId}/favorite/`));
  return data;
}

export async function removeFavorite(listingId: number): Promise<unknown> {
  // Real endpoint: DELETE /listings/{listing_id}/unfavorite/
  const { data } = await axiosInstance.delete(buildApiUrl(`/listings/${listingId}/unfavorite/`));
  return data;
}
