/**
 * Cross-platform storage layer using expo-secure-store.
 *
 * react-native-mmkv v4 uses NitroModules which requires a custom native build
 * and is NOT compatible with Expo Go. This module replaces it with
 * expo-secure-store (already in the project, Expo Go compatible) using a
 * simple chunked approach for larger blobs, plus an in-memory fallback.
 */
import type { PersistedClient, Persister } from "@tanstack/query-persist-client-core";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// expo-secure-store has a ~2048 byte value size limit.
// We chunk large values into multiple keys.
const CHUNK_SIZE = 1800; // bytes per chunk (safe margin)
const RQ_PERSIST_KEY = "rq_persist_v1";
const MUTATION_QUEUE_KEY = "mutation_queue_v1";

// ─── Generic helpers ──────────────────────────────────────────────────────────

function isWeb(): boolean {
  return Platform.OS === "web";
}

async function secureGet(key: string): Promise<string | null> {
  if (isWeb()) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  if (isWeb()) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch { /* ignore */ }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch { /* ignore */ }
}

async function secureDelete(key: string): Promise<void> {
  if (isWeb()) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch { /* ignore */ }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch { /* ignore */ }
}

// ─── Chunked store (handles values > 2KB) ─────────────────────────────────────

async function chunkedGet(baseKey: string): Promise<string | null> {
  const metaRaw = await secureGet(`${baseKey}__meta`);
  if (!metaRaw) {
    // Try reading as a single (non-chunked) value for backwards compat
    return secureGet(baseKey);
  }
  try {
    const { chunks } = JSON.parse(metaRaw) as { chunks: number };
    const parts: string[] = [];
    for (let i = 0; i < chunks; i++) {
      const part = await secureGet(`${baseKey}__chunk_${i}`);
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join("");
  } catch {
    return null;
  }
}

async function chunkedSet(baseKey: string, value: string): Promise<void> {
  // Clear old chunks first
  await chunkedDelete(baseKey);

  if (value.length <= CHUNK_SIZE) {
    // Small enough to store directly
    await secureSet(baseKey, value);
    return;
  }

  // Split into chunks
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }

  await secureSet(`${baseKey}__meta`, JSON.stringify({ chunks: chunks.length }));
  for (let i = 0; i < chunks.length; i++) {
    await secureSet(`${baseKey}__chunk_${i}`, chunks[i]!);
  }
}

async function chunkedDelete(baseKey: string): Promise<void> {
  const metaRaw = await secureGet(`${baseKey}__meta`);
  if (metaRaw) {
    try {
      const { chunks } = JSON.parse(metaRaw) as { chunks: number };
      for (let i = 0; i < chunks; i++) {
        await secureDelete(`${baseKey}__chunk_${i}`);
      }
    } catch { /* ignore */ }
    await secureDelete(`${baseKey}__meta`);
  } else {
    await secureDelete(baseKey);
  }
}

// ─── React Query Persister ─────────────────────────────────────────────────────

export const mmkvPersister: Persister = {
  persistClient: async (persisted: PersistedClient): Promise<void> => {
    try {
      await chunkedSet(RQ_PERSIST_KEY, JSON.stringify(persisted));
    } catch { /* non-critical — graceful degradation */ }
  },
  restoreClient: async (): Promise<PersistedClient | undefined> => {
    try {
      const raw = await chunkedGet(RQ_PERSIST_KEY);
      if (!raw) return undefined;
      return JSON.parse(raw) as PersistedClient;
    } catch {
      return undefined;
    }
  },
  removeClient: async (): Promise<void> => {
    try {
      await chunkedDelete(RQ_PERSIST_KEY);
    } catch { /* ignore */ }
  },
};

// ─── Mutation Queue (synchronous interface backed by SecureStore) ──────────────

// In-memory mirror so the synchronous read/write API works without async.
// Loaded lazily on first write, flushed to SecureStore asynchronously.
let _mutationQueueMemory: string | undefined;
let _loaded = false;

async function loadMutationQueue(): Promise<void> {
  if (_loaded) return;
  _loaded = true;
  const raw = await secureGet(MUTATION_QUEUE_KEY);
  _mutationQueueMemory = raw ?? undefined;
}

// Pre-load at module import time (fire-and-forget)
void loadMutationQueue();

export function readMutationQueueRaw(): string | undefined {
  return _mutationQueueMemory;
}

export function writeMutationQueueRaw(raw: string): void {
  _mutationQueueMemory = raw;
  // Persist asynchronously — no need to await in the sync interface
  void secureSet(MUTATION_QUEUE_KEY, raw);
}
