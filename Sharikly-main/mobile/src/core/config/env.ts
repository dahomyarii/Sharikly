import Constants from "expo-constants";

function readExtra(key: string): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  return typeof extra?.[key] === "string" ? extra[key] : undefined;
}

/**
 * Same contract as web `NEXT_PUBLIC_API_BASE`: scheme + host + `/api`, no trailing slash.
 */
const resolvedApiBase = process.env.EXPO_PUBLIC_API_BASE ?? readExtra("apiBase");

if (!resolvedApiBase && !__DEV__) {
  // A release build must never silently target localhost — that request will just fail.
  // eslint-disable-next-line no-console
  console.error(
    "[Ekra] EXPO_PUBLIC_API_BASE is not set. Release build is falling back to localhost and will not reach the API."
  );
}

export const API_BASE: string = resolvedApiBase ?? "http://127.0.0.1:8000/api";

export const APP_SCHEME = "ekra";
