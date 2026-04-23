import axios, { type AxiosInstance } from "axios";

import { API_BASE } from "@/core/config/env";
import { emitGlobalToast, emitUserLogout } from "@/core/events/appEvents";
import {
  clearStoredTokens,
  getAccessTokenMemory,
  getRefreshToken,
  loadTokensIntoMemory,
  persistTokens,
  setAccessTokenMemory,
} from "@/services/storage/tokenStore";

const DEFAULT_TIMEOUT_MS = 30_000;
const REFRESH_PATH = "/auth/token/refresh/";

let refreshPromise: Promise<string | null> | null = null;

export function buildApiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

async function clearStoredAuth(): Promise<void> {
  await clearStoredTokens();
  delete axiosInstance.defaults.headers.common.Authorization;
  delete axios.defaults.headers.common.Authorization;
  emitUserLogout();
}

/** Clears tokens and notifies listeners (mirrors web logout + `userLogout` event). */
export async function performLogout(): Promise<void> {
  await clearStoredAuth();
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken || !API_BASE) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ access?: string; refresh?: string }>(
        buildApiUrl(REFRESH_PATH),
        { refresh: refreshToken },
        { timeout: DEFAULT_TIMEOUT_MS }
      )
      .then(async (response) => {
        const nextAccessToken = response.data?.access;
        const nextRefreshToken = response.data?.refresh;

        if (!nextAccessToken) {
          return null;
        }

        await persistTokens(
          nextAccessToken,
          nextRefreshToken !== undefined ? nextRefreshToken : undefined
        );
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${nextAccessToken}`;
        return nextAccessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export const axiosInstance: AxiosInstance = axios.create({
  timeout: DEFAULT_TIMEOUT_MS,
});

axiosInstance.interceptors.request.use(async (config) => {
  let token = getAccessTokenMemory();
  if (!token) {
    await loadTokensIntoMemory();
    token = getAccessTokenMemory();
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const err = error as {
      response?: { status?: number };
      config?: import("@/services/api/axiosTypes").EkraAxiosRequestConfig;
      code?: string;
      message?: string;
      request?: unknown;
    };
    const config = err.config;

    if (err.response?.status === 401) {
      const url = config?.url ?? "";
      const isAuthEndpoint =
        url.includes("/auth/token") ||
        url.includes("/auth/register") ||
        url.includes(REFRESH_PATH);
      const hadAuthorizationHeader = Boolean(
        config?.headers?.Authorization ?? config?.headers?.authorization
      );

      if (!isAuthEndpoint && !config?.__retried401 && hadAuthorizationHeader) {
        const nextAccessToken = await refreshAccessToken();

        if (nextAccessToken && config) {
          config.__retried401 = true;
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${nextAccessToken}`;
          return axiosInstance.request(config);
        }
      }

      if (!isAuthEndpoint) {
        await clearStoredAuth();
      }
    }

    if (err.response?.status === 429) {
      emitGlobalToast({
        message: "Too many requests. Please wait a moment and try again.",
        type: "warning",
      });
    }

    const isTimeout =
      err.code === "ECONNABORTED" ||
      (typeof err.message === "string" && err.message.toLowerCase().includes("timeout"));
    const isNetworkError = !err.response && Boolean(err.request);
    if (isTimeout || isNetworkError) {
      emitGlobalToast({
        message: isTimeout
          ? "Request took too long. Please try again."
          : "Network error. Please check your connection and try again.",
        type: "error",
      });
    }

    if (!err.response && config && !config.__retried && (config.method === "get" || config.method === "GET")) {
      config.__retried = true;
      return axiosInstance.request(config);
    }

    return Promise.reject(error);
  }
);

export async function applyTokenToAxiosDefaults(access: string): Promise<void> {
  setAccessTokenMemory(access);
  await persistTokens(access);
  axiosInstance.defaults.headers.common.Authorization = `Bearer ${access}`;
}

export async function bootstrapApiClient(): Promise<void> {
  await loadTokensIntoMemory();
  const t = getAccessTokenMemory();
  if (t) {
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${t}`;
  }
}
