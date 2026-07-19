import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";

/**
 * Current user's id, read from the shared ["auth","me"] query cache. Uses the same
 * key/fetcher as other screens so React Query dedupes it to a single request.
 */
export function useCurrentUserId(): number | undefined {
  const hasSession = useAuthStore((s) => s.hasSession);
  const q = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => axiosInstance.get(buildApiUrl("/auth/me/")).then((r) => r.data),
    enabled: hasSession,
  });
  return (q.data as { id?: number } | undefined)?.id;
}
