import type { PersistedClient, Persister } from "@tanstack/query-persist-client-core";
import { createMMKV } from "react-native-mmkv";
import type { MMKV } from "react-native-mmkv";

const STORAGE_ID = "ekra-app-storage";
const RQ_PERSIST_KEY = "react_query_persist_v1";
const MUTATION_QUEUE_KEY = "mutation_queue_v1";

let mmkvInstance: MMKV | null = null;

function getMmkv(): MMKV {
  if (!mmkvInstance) {
    mmkvInstance = createMMKV({ id: STORAGE_ID });
  }
  return mmkvInstance;
}

export const mmkvPersister: Persister = {
  persistClient: async (persisted: PersistedClient): Promise<void> => {
    getMmkv().set(RQ_PERSIST_KEY, JSON.stringify(persisted));
  },
  restoreClient: async (): Promise<PersistedClient | undefined> => {
    const raw = getMmkv().getString(RQ_PERSIST_KEY);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as PersistedClient;
    } catch {
      return undefined;
    }
  },
  removeClient: async (): Promise<void> => {
    getMmkv().remove(RQ_PERSIST_KEY);
  },
};

export function readMutationQueueRaw(): string | undefined {
  return getMmkv().getString(MUTATION_QUEUE_KEY);
}

export function writeMutationQueueRaw(raw: string): void {
  getMmkv().set(MUTATION_QUEUE_KEY, raw);
}
