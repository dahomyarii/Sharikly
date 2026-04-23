import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import { useEffect } from "react";

import { flushMutationQueue } from "@/core/offline/mutationQueue";
import { logger } from "@/core/logging/logger";

/**
 * Keeps TanStack Query online state in sync and drains the offline mutation queue when connectivity returns.
 */
export function NetInfoSubscription(): null {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      onlineManager.setOnline(online);
      if (online) {
        void flushMutationQueue().catch((e: unknown) => {
          logger.error("flushMutationQueue failed", { error: String(e) });
        });
      }
    });

    void NetInfo.fetch().then((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      onlineManager.setOnline(online);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return null;
}
