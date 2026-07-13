import { axiosInstance, buildApiUrl } from "@/services/api/client";

export type BookingParams = { role?: "renter" | "host" };

export async function getBookings(params?: BookingParams): Promise<unknown> {
  // Same endpoint for both sides; the `role` param scopes the result:
  //   role=renter → bookings I made,  role=host → requests for my items.
  // With no role the backend returns the union of both, so always forward it.
  const { data } = await axiosInstance.get(buildApiUrl("/bookings/"), {
    params: params?.role ? { role: params.role } : undefined,
  });
  return data;
}

export async function getBooking(id: number | string): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl(`/bookings/${id}/`));
  return data;
}

export async function requestBooking(
  listingId: number,
  payload: { start_date: string; end_date: string; total_price: number; message?: string }
): Promise<unknown> {
  // POST to /bookings/ with listing field. total_price is required by the API.
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
