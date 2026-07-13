import { Platform } from "react-native";
import { axiosInstance, buildApiUrl } from "@/services/api/client";

export interface UploadAsset {
  uri: string;
  name?: string;
  fileName?: string;
  mimeType?: string;
}

/**
 * Append a picked asset to a FormData field, handling web vs native:
 * - web: fetch the (blob:/data:/file) uri and append a real Blob
 * - native: append the RN { uri, name, type } shape
 */
async function appendUpload(form: FormData, field: string, asset: UploadAsset): Promise<void> {
  const uri = asset.uri;
  const name = asset.fileName || asset.name || uri.split("/").pop() || "upload";
  const type = asset.mimeType || "application/octet-stream";
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    const blob = await res.blob();
    form.append(field, blob, name);
  } else {
    // @ts-expect-error React Native FormData accepts this file shape
    form.append(field, { uri, name, type });
  }
}

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
  text: string
): Promise<unknown> {
  // Real endpoint: POST /chat/messages/ with room + text
  const { data } = await axiosInstance.post(buildApiUrl("/chat/messages/"), {
    room: roomId,
    text,
  });
  return data;
}

export async function sendImageMessage(
  roomId: number | string,
  asset: UploadAsset,
  text?: string
): Promise<unknown> {
  const form = new FormData();
  form.append("room", String(roomId));
  if (text) form.append("text", text);
  await appendUpload(form, "image", asset);
  const { data } = await axiosInstance.post(buildApiUrl("/chat/messages/"), form);
  return data;
}

export async function sendFileMessage(
  roomId: number | string,
  asset: UploadAsset,
  text?: string
): Promise<unknown> {
  const form = new FormData();
  form.append("room", String(roomId));
  if (text) form.append("text", text);
  await appendUpload(form, "file", asset);
  const { data } = await axiosInstance.post(buildApiUrl("/chat/messages/"), form);
  return data;
}

export async function sendAudioMessage(
  roomId: number | string,
  asset: UploadAsset,
  text?: string,
  durationSec?: number
): Promise<unknown> {
  const form = new FormData();
  form.append("room", String(roomId));
  if (text) form.append("text", text);
  if (durationSec != null) form.append("audio_duration", String(durationSec));
  await appendUpload(form, "audio", asset);
  const { data } = await axiosInstance.post(buildApiUrl("/chat/messages/"), form);
  return data;
}

export async function sendLocationMessage(
  roomId: number | string,
  latitude: number,
  longitude: number,
  text?: string
): Promise<unknown> {
  const { data } = await axiosInstance.post(buildApiUrl("/chat/messages/"), {
    room: roomId,
    latitude,
    longitude,
    ...(text ? { text } : {}),
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
