import axiosInstance from "./axios";

/**
 * SWR-compatible fetcher backed by the app's axios instance.
 * Using axios here means auth headers, token refresh, and rate-limit
 * toasts all apply automatically — no duplicated fetch() calls in pages.
 */
export const fetcher = async (url: string) => {
  const res = await axiosInstance.get(url);
  return res.data;
};

/**
 * The backend API root. Every page that hits the API should import this
 * rather than re-reading process.env inline — makes refactors and tests easier.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;
