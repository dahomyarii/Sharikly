import { DeviceEventEmitter } from "react-native";

export type GlobalToastPayload = {
  message: string;
  type: "warning" | "error" | "info";
};

export const APP_EVENTS = {
  userLogout: "ekra:userLogout",
  globalShowToast: "ekra:globalShowToast",
} as const;

export function emitUserLogout(): void {
  DeviceEventEmitter.emit(APP_EVENTS.userLogout);
}

export function emitGlobalToast(payload: GlobalToastPayload): void {
  DeviceEventEmitter.emit(APP_EVENTS.globalShowToast, payload);
}

export function subscribeUserLogout(listener: () => void): () => void {
  const sub = DeviceEventEmitter.addListener(APP_EVENTS.userLogout, listener);
  return () => sub.remove();
}

export function subscribeGlobalToast(
  listener: (payload: GlobalToastPayload) => void
): () => void {
  const sub = DeviceEventEmitter.addListener(APP_EVENTS.globalShowToast, listener);
  return () => sub.remove();
}
