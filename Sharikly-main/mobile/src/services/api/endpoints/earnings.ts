import { axiosInstance, buildApiUrl } from "@/services/api/client";

export async function getEarningsDashboard(): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl("/earnings/dashboard/"));
  return data;
}

export async function getPublicEarnings(): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl("/earnings/public/"));
  return data;
}

export async function getLocalRequests(): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl("/earnings/local-requests/"));
  return data;
}

export async function getTrendingSearches(): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl("/earnings/trending-searches/"));
  return data;
}

export async function getActiveBookingsCount(): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl("/earnings/active-bookings/"));
  return data;
}
