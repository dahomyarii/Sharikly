import { axiosInstance, buildApiUrl } from "@/services/api/client";

export type ListingListParams = Record<string, string | number | boolean | undefined>;

export async function getListings(params?: ListingListParams): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl("/listings/"), { params });
  return data;
}

export async function getListing(id: number | string): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl(`/listings/${id}/`));
  return data;
}

export async function getCategories(): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl("/categories/"));
  return data;
}

export async function getSimilarListings(id: number | string): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl(`/listings/${id}/similar/`));
  return data;
}

export async function createListing(formData: FormData): Promise<unknown> {
  const { data } = await axiosInstance.post(buildApiUrl("/listings/"), formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateListing(id: number | string, payload: FormData | Record<string, unknown>): Promise<unknown> {
  const isFormData = payload instanceof FormData;
  const { data } = await axiosInstance.patch(buildApiUrl(`/listings/${id}/`), payload, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });
  return data;
}

export async function deleteListing(id: number | string): Promise<unknown> {
  const { data } = await axiosInstance.delete(buildApiUrl(`/listings/${id}/`));
  return data;
}

export async function submitReview(
  listingId: number | string,
  payload: { rating: number; comment: string }
): Promise<unknown> {
  const { data } = await axiosInstance.post(
    buildApiUrl(`/listings/${listingId}/reviews/`),
    payload
  );
  return data;
}

export async function searchListingsSuggest(q: string): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl("/listings/suggest/"), { params: { q } });
  return data;
}

export async function getPublicUser(userId: number | string): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl(`/users/${userId}/`));
  return data;
}
