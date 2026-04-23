import { subscribeGlobalToast } from "@/core/events/appEvents";
import { useUiStore } from "@/store/uiStore";
import { useEffect } from "react";
import { Alert } from "react-native";

/**
 * Surfaces interceptor-driven toasts (429 / network) using native alerts.
 * Can be swapped for an in-app toast UI without changing API client code.
 */
export function ToastBridge(): null {
  const setLastToast = useUiStore((s) => s.setLastToast);

  useEffect(() => {
    return subscribeGlobalToast((payload) => {
      setLastToast(payload);
      const title =
        payload.type === "warning" ? "Please wait" : payload.type === "error" ? "Connection" : "Notice";
      Alert.alert(title, payload.message);
    });
  }, [setLastToast]);

  return null;
}
