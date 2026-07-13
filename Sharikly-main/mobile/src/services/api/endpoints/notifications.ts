import { axiosInstance, buildApiUrl } from "@/services/api/client";

export async function getNotifications(): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl("/notifications/"));
  return data;
}

export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  const { data } = await axiosInstance.get(buildApiUrl("/notifications/unread-count/"));
  return data;
}

export async function markNotificationRead(id: number): Promise<unknown> {
  const { data } = await axiosInstance.patch(buildApiUrl("/notifications/mark-read/"), { id });
  return data;
}

export async function markAllNotificationsRead(): Promise<unknown> {
  const { data } = await axiosInstance.patch(buildApiUrl("/notifications/mark-read/"), { all: true });
  return data;
}
