import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { ReactNode } from "react";
import { useState } from "react";

import { createAppQueryClient } from "@/core/providers/createQueryClient";
import { mmkvPersister } from "@/services/storage/mmkvStorage";

const CACHE_BUSTER = "ekra-v1";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

type QueryProviderProps = {
  children: ReactNode;
};

export function QueryProvider({ children }: QueryProviderProps): React.ReactElement {
  const [client] = useState(() => createAppQueryClient());

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister: mmkvPersister,
        buster: CACHE_BUSTER,
        maxAge: MAX_AGE_MS,
        dehydrateOptions: {
          shouldDehydrateQuery: (q) => q.state.status === "success",
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
