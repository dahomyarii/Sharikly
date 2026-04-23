import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

let memoryAccess: string | null = null;

function isWeb(): boolean {
  return Platform.OS === "web";
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb()) {
    try {
      if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
        const ls = (globalThis as unknown as { localStorage: Storage }).localStorage;
        return ls.getItem(key);
      }
    } catch {
      return null;
    }
    return null;
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb()) {
    try {
      if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
        const ls = (globalThis as unknown as { localStorage: Storage }).localStorage;
        ls.setItem(key, value);
      }
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb()) {
    try {
      if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
        const ls = (globalThis as unknown as { localStorage: Storage }).localStorage;
        ls.removeItem(key);
      }
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* key may not exist */
  }
}

export function getAccessTokenMemory(): string | null {
  return memoryAccess;
}

export function setAccessTokenMemory(token: string | null): void {
  memoryAccess = token;
}

export async function loadTokensIntoMemory(): Promise<void> {
  const access = await getItem(ACCESS_KEY);
  memoryAccess = access;
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_KEY);
}

export async function persistTokens(access: string, refresh?: string | null): Promise<void> {
  await setItem(ACCESS_KEY, access);
  memoryAccess = access;
  if (refresh !== undefined && refresh !== null && refresh.length > 0) {
    await setItem(REFRESH_KEY, refresh);
  }
}

export async function clearStoredTokens(): Promise<void> {
  memoryAccess = null;
  await removeItem(ACCESS_KEY);
  await removeItem(REFRESH_KEY);
}
