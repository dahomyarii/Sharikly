import { QueryClient } from "@tanstack/react-query";

import { logger } from "@/core/logging/logger";

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false;
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status !== undefined && status >= 400 && status < 500 && status !== 408) {
    return false;
  }
  return true;
}

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 1000 * 60 * 60 * 24,
        retry: (failureCount, error) => shouldRetry(failureCount, error),
        networkMode: "offlineFirst",
      },
      mutations: {
        networkMode: "offlineFirst",
        retry: (failureCount, error) => shouldRetry(failureCount, error),
        onError: (error) => {
          logger.warn("mutation failed", { error: String(error) });
        },
      },
    },
  });
}
