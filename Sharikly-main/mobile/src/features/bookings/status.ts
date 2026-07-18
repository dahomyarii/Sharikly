/**
 * Shared booking status helpers, used by both the "Renting" and "My Items"
 * segments so the two sides stay consistent.
 *
 * The backend only stores status = PENDING | CONFIRMED | DECLINED | CANCELLED
 * (plus a separate payment_status), and has no "completed" state — a rental is
 * complete once it's CONFIRMED and its end_date has passed. We derive a single
 * display status here so the UI filters/labels/colors all agree.
 */
export type DisplayStatus =
  | "pending"
  | "approved"
  | "paid"
  | "completed"
  | "rejected"
  | "cancelled";

export function deriveStatus(b: any): DisplayStatus {
  const s = String(b?.status ?? "").toUpperCase();
  const pay = String(b?.payment_status ?? "").toUpperCase();
  if (s === "PENDING") return "pending";
  if (s === "DECLINED") return "rejected";
  if (s === "CANCELLED") return "cancelled";
  if (s === "CONFIRMED") {
    const end = b?.end_date ? new Date(b.end_date) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (end && end < today) return "completed";
    return pay === "PAID" ? "paid" : "approved";
  }
  return s.toLowerCase() as DisplayStatus;
}

/**
 * Lifecycle tab a booking belongs to:
 *   pending   – awaiting the host's Accept/Decline
 *   active    – confirmed and happening now (start ≤ today ≤ end)
 *   upcoming  – confirmed but not started yet (start > today)
 *   completed – finished, declined, or cancelled (terminal)
 */
export type BookingTab = "pending" | "active" | "upcoming" | "completed";

export const BOOKING_TABS: BookingTab[] = ["pending", "active", "upcoming", "completed"];
export const BOOKING_TAB_LABELS: Record<BookingTab, string> = {
  pending: "Pending",
  active: "Active",
  upcoming: "Upcoming",
  completed: "Completed",
};

export function bookingTab(b: any): BookingTab {
  const s = deriveStatus(b);
  if (s === "pending") return "pending";
  if (s === "rejected" || s === "cancelled" || s === "completed") return "completed";
  // approved | paid → confirmed and not yet ended
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = b?.start_date ? new Date(b.start_date) : null;
  if (start && start > today) return "upcoming";
  return "active";
}

export function tabCounts(rows: any[]): Record<BookingTab, number> {
  const c: Record<BookingTab, number> = { pending: 0, active: 0, upcoming: 0, completed: 0 };
  for (const b of rows) c[bookingTab(b)] += 1;
  return c;
}

/** The selectable filters shown as tabs — an "All" view plus each lifecycle bucket. */
export type TabFilter = "all" | BookingTab;

export const TAB_FILTERS: TabFilter[] = ["all", "pending", "active", "upcoming", "completed"];

export const TAB_FILTER_LABELS: Record<TabFilter, string> = {
  all: "All",
  pending: "Pending",
  active: "Active",
  upcoming: "Upcoming",
  completed: "Completed",
};

/** Counts for every filter, including the "all" total. */
export function filterCounts(rows: any[]): Record<TabFilter, number> {
  return { all: rows.length, ...tabCounts(rows) };
}

export function matchesTab(b: any, t: TabFilter): boolean {
  return t === "all" ? true : bookingTab(b) === t;
}

/** Sort order used for the "All" view so action-needing items float to the top. */
const TAB_PRIORITY: Record<BookingTab, number> = { pending: 0, active: 1, upcoming: 2, completed: 3 };
export function byTabPriority(a: any, b: any): number {
  return TAB_PRIORITY[bookingTab(a)] - TAB_PRIORITY[bookingTab(b)];
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Confirmed",
  paid: "Paid",
  completed: "Completed",
  rejected: "Declined",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  approved: { color: "#16A34A", bg: "#DCFCE7" },
  paid: { color: "#16A34A", bg: "#DCFCE7" },
  pending: { color: "#B45309", bg: "#FEF3C7" },
  completed: { color: "#1E40AF", bg: "#DBEAFE" },
  rejected: { color: "#DC2626", bg: "#FEE2E2" },
  cancelled: { color: "#DC2626", bg: "#FEE2E2" },
};

/** Normalize a paginated or plain-array bookings response to an array. */
export function toBookingArray(data: unknown): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return (data as any)?.results ?? [];
}
