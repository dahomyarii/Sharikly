import Constants from "expo-constants";

function readExtra(key: string): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  return typeof extra?.[key] === "string" ? extra[key] : undefined;
}

/**
 * Same contract as web `NEXT_PUBLIC_API_BASE`: scheme + host + `/api`, no trailing slash.
 */
export const API_BASE: string =
  process.env.EXPO_PUBLIC_API_BASE ??
  readExtra("apiBase") ??
  "http://127.0.0.1:8000/api";

export const APP_SCHEME = "ekra";
