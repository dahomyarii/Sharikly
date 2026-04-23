import { axiosInstance, buildApiUrl } from "@/services/api/client";

export type BookingParams = { role?: "renter" | "host" };

export async function getBookings(params?: BookingParams): Promise<unknown> {
  // Both renter and host bookings come from the same endpoint
  // The backend returns all bookings for the current user (as renter OR host)
  const { data } = await axiosInstance.get(buildApiUrl("/bookings/"), {
    params: params?.role === "host" ? { role: "host" } : undefined,
  });
  return data;
}

export async function getBooking(id: number | string): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl(`/bookings/${id}/`));
  return data;
}

export async function requestBooking(
  listingId: number,
  payload: { start_date: string; end_date: string; message?: string }
): Promise<unknown> {
  // POST to /bookings/ with listing field
  const { data } = await axiosInstance.post(buildApiUrl("/bookings/"), {
    listing: listingId,
    ...payload,
  });
  return data;
}

export async function acceptBooking(id: number): Promise<unknown> {
  const { data } = await axiosInstance.post(buildApiUrl(`/bookings/${id}/accept/`));
  return data;
}

export async function declineBooking(id: number): Promise<unknown> {
  const { data } = await axiosInstance.post(buildApiUrl(`/bookings/${id}/decline/`));
  return data;
}

export async function cancelBooking(id: number): Promise<unknown> {
  const { data } = await axiosInstance.post(buildApiUrl(`/bookings/${id}/cancel/`));
  return data;
}

// Legacy compatibility: maps old status calls to new endpoints
export async function updateBookingStatus(
  id: number,
  status: "approved" | "rejected" | "cancelled"
): Promise<unknown> {
  if (status === "approved") return acceptBooking(id);
  if (status === "rejected") return declineBooking(id);
  return cancelBooking(id);
}
