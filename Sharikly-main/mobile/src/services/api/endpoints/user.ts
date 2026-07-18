import { Platform } from "react-native";
import { axiosInstance, buildApiUrl } from "@/services/api/client";

export interface AvatarAsset {
  uri: string;
  fileName?: string;
  mimeType?: string;
}

/**
 * Upload/replace the current user's avatar via multipart PATCH /auth/me/.
 * Handles web (real Blob) vs native (RN { uri, name, type } file shape).
 */
export async function updateAvatar(asset: AvatarAsset): Promise<any> {
  const form = new FormData();
  const uri = asset.uri;
  const name = asset.fileName || uri.split("/").pop() || "avatar.jpg";
  const type = asset.mimeType || "image/jpeg";

  if (Platform.OS === "web") {
    const res = await fetch(uri);
    const blob = await res.blob();
    form.append("avatar", blob, name);
  } else {
    // @ts-expect-error React Native FormData accepts this file shape
    form.append("avatar", { uri, name, type });
  }

  const { data } = await axiosInstance.patch(buildApiUrl("/auth/me/"), form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
