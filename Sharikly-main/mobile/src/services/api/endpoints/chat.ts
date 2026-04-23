import { axiosInstance, buildApiUrl } from "@/services/api/client";

// Real backend: /chat/rooms/ (list), /chat/rooms/get-or-create/, /chat/messages/<room_id>/
export async function getChatRooms(): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl("/chat/rooms/"));
  return data;
}

export async function getChatRoom(roomId: number | string): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl(`/chat/rooms/${roomId}/`));
  return data;
}

export async function getChatMessages(roomId: number | string): Promise<unknown> {
  // Real endpoint: GET /chat/messages/<room_id>/
  const { data } = await axiosInstance.get(buildApiUrl(`/chat/messages/${roomId}/`));
  return data;
}

export async function sendMessage(
  roomId: number | string,
  content: string
): Promise<unknown> {
  // Real endpoint: POST /chat/messages/ with room + content
  const { data } = await axiosInstance.post(buildApiUrl("/chat/messages/"), {
    room: roomId,
    content,
  });
  return data;
}

export async function getOrCreateRoom(participantId: number, listingId?: number): Promise<unknown> {
  const { data } = await axiosInstance.post(buildApiUrl("/chat/rooms/get-or-create/"), {
    participant_id: participantId,
    ...(listingId ? { listing_id: listingId } : {}),
  });
  return data;
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const { data } = await axiosInstance.get(buildApiUrl("/chat/unread-count/"));
  return data;
}
