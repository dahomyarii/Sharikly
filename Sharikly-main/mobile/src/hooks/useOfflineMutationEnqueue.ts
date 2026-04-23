import { useOnline } from "@/hooks/useOnline";
import { enqueueMutation, type QueuedMutation } from "@/core/offline/mutationQueue";

type EnqueueInput = Omit<QueuedMutation, "id" | "createdAt"> & { id?: string };

/**
 * When offline, queues mutating API calls for later replay (see `flushMutationQueue`).
 * Payment-sensitive flows should not use this without explicit product approval.
 */
export function useOfflineMutationEnqueue(): {
  online: boolean;
  enqueue: (input: EnqueueInput) => string;
} {
  const online = useOnline();
  return {
    online,
    enqueue: enqueueMutation,
  };
}
