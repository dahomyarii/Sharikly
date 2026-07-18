import { z } from "zod";

import { emitGlobalToast } from "@/core/events/appEvents";
import { logger } from "@/core/logging/logger";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { readMutationQueueRaw, writeMutationQueueRaw } from "@/services/storage/mmkvStorage";

const queuedMutationSchema = z.object({
  id: z.string(),
  method: z.enum(["POST", "PATCH", "PUT", "DELETE"]),
  path: z.string(),
  body: z.unknown().optional(),
  createdAt: z.number(),
  tries: z.number().optional(),
});

const MAX_FLUSH_TRIES = 5;

export type QueuedMutation = z.infer<typeof queuedMutationSchema>;

function readQueue(): QueuedMutation[] {
  const raw = readMutationQueueRaw();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    const arr = z.array(queuedMutationSchema).safeParse(parsed);
    return arr.success ? arr.data : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedMutation[]): void {
  writeMutationQueueRaw(JSON.stringify(items));
}

export function enqueueMutation(input: Omit<QueuedMutation, "id" | "createdAt"> & { id?: string }): string {
  const id =
    input.id ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const item: QueuedMutation = {
    id,
    method: input.method,
    path: input.path,
    body: input.body,
    createdAt: Date.now(),
  };
  const q = readQueue();
  q.push(item);
  writeQueue(q);
  logger.info("mutationQueue.enqueued", { id, method: item.method, path: item.path });
  return id;
}

export function dequeueMutation(id: string): void {
  const q = readQueue().filter((x) => x.id !== id);
  writeQueue(q);
}

export function peekQueue(): readonly QueuedMutation[] {
  return readQueue();
}

export async function flushMutationQueue(): Promise<void> {
  const pending = readQueue();
  if (pending.length === 0) return;

  const remaining: QueuedMutation[] = [];
  let hadConflict = false;

  for (const item of pending) {
    try {
      await axiosInstance.request({
        method: item.method,
        url: buildApiUrl(item.path),
        data: item.body,
      });
      logger.info("mutationQueue.flushed", { id: item.id });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      // A 4xx (other than 408/429) will never succeed on retry, so drop it instead of
      // letting it block the queue forever. Everything else retries up to MAX_FLUSH_TRIES.
      // Crucially we do NOT break — one bad item must not stall the rest of the queue.
      const isPermanent =
        status !== undefined && status >= 400 && status < 500 && status !== 408 && status !== 429;
      const tries = (item.tries ?? 0) + 1;
      if (isPermanent || tries >= MAX_FLUSH_TRIES) {
        if (status === 409 || status === 422) hadConflict = true;
        logger.warn("mutationQueue.dropped", { id: item.id, status, tries });
        continue;
      }
      remaining.push({ ...item, tries });
      logger.warn("mutationQueue.retryLater", { id: item.id, status, tries });
    }
  }

  writeQueue(remaining);

  if (hadConflict) {
    emitGlobalToast({
      message: "Some offline changes conflicted with the server and were discarded.",
      type: "warning",
    });
  }
}
