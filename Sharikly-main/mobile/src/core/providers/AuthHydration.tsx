import { subscribeUserLogout } from "@/core/events/appEvents";
import { logger } from "@/core/logging/logger";
import { bootstrapApiClient } from "@/services/api/client";
import { getAccessTokenMemory } from "@/services/storage/tokenStore";
import { useAuthStore } from "@/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

/**
 * Loads secure tokens into memory, syncs Zustand session flags, and clears React Query on logout.
 */
export function AuthHydration(): null {
  const queryClient = useQueryClient();
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const setHasSession = useAuthStore((s) => s.setHasSession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await bootstrapApiClient();
        if (!cancelled) {
          setHasSession(getAccessTokenMemory() !== null);
        }
      } catch (e) {
        logger.error("AuthHydration.bootstrap failed", { error: String(e) });
      } finally {
        if (!cancelled) {
          setHydrated(true);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setHydrated, setHasSession]);

  useEffect(() => {
    if (!ready) return;
    return subscribeUserLogout(() => {
      setHasSession(false);
      void queryClient.clear();
    });
  }, [queryClient, ready, setHasSession]);

  return null;
}
