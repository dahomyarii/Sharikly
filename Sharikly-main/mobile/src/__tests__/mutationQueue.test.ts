/* eslint-disable import/first -- jest.mock must precede imports under test */
let mockMutationQueueStored = "[]";

jest.mock("@/services/storage/mmkvStorage", () => ({
  readMutationQueueRaw: (): string | undefined => mockMutationQueueStored,
  writeMutationQueueRaw: (s: string): void => {
    mockMutationQueueStored = s;
  },
}));

import { enqueueMutation, flushMutationQueue, peekQueue } from "@/core/offline/mutationQueue";
import { axiosInstance } from "@/services/api/client";
/* eslint-enable import/first */

const requestMock = axiosInstance.request as jest.MockedFunction<typeof axiosInstance.request>;

describe("mutationQueue", () => {
  beforeEach(() => {
    mockMutationQueueStored = "[]";
    requestMock.mockReset();
  });

  it("enqueues and peeks", () => {
    const id = enqueueMutation({ method: "POST", path: "/favorites/", body: { listing_id: 1 } });
    expect(id.length).toBeGreaterThan(0);
    expect(peekQueue()).toHaveLength(1);
    expect(peekQueue()[0]?.path).toBe("/favorites/");
  });

  it("flushMutationQueue sends queued requests", async () => {
    enqueueMutation({ method: "PATCH", path: "/auth/me/", body: { first_name: "A" } });
    requestMock.mockResolvedValueOnce({ data: {} });
    await flushMutationQueue();
    expect(requestMock).toHaveBeenCalledTimes(1);
  });
});
