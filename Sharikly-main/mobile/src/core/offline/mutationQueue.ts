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
});

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
      if (status === 409 || status === 422) {
        emitGlobalToast({
          message: "Some offline changes conflicted with the server. Please review and try again.",
          type: "warning",
        });
        logger.warn("mutationQueue.conflict", { id: item.id, status });
        remaining.push(item);
        break;
      }
      remaining.push(item);
      logger.warn("mutationQueue.retryLater", { id: item.id, status });
    }
  }

  writeQueue(remaining);
}
