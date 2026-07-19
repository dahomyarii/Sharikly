import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import {
  BadgeCheck,
  Calendar,
  CheckCircle,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  XCircle,
} from "lucide-react-native";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { bookingTab, deriveStatus, STATUS_LABELS, type BookingTab } from "../status";
import { LeaveReviewButton } from "@/features/reviews/LeaveReviewButton";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";

function imgUrl(path?: string | null): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_BASE.replace("/api", "")}${path}`;
}

function fmt(d?: string): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type ActionPending = "accept" | "decline" | "cancel" | null;

/** Status chip shown above the price, driven by role + lifecycle tab. */
function chipFor(role: "renter" | "host", tab: BookingTab, booking: any): { label: string; color: string; bg: string } {
  if (tab === "pending") {
    return role === "host"
      ? { label: "Pending Response…", color: "#B45309", bg: "#FEF3C7" }
      : { label: "Awaiting response", color: "#B45309", bg: "#FEF3C7" };
  }
  if (tab === "active") return { label: "Ongoing", color: "#065F46", bg: "#D1FAE5" };
  if (tab === "upcoming") return { label: "Upcoming", color: colors.primary, bg: "#EEE9FC" };
  // completed bucket → reflect the real terminal status
  const s = deriveStatus(booking);
  if (s === "rejected") return { label: "Declined", color: "#DC2626", bg: "#FEE2E2" };
  if (s === "cancelled") return { label: "Cancelled", color: "#6B7280", bg: "#F3F4F6" };
  return { label: STATUS_LABELS.completed, color: "#1E40AF", bg: "#DBEAFE" };
}

/**
 * Rich booking card for both roles.
 * - role "host": counterparty is the renter; pending → Accept/Decline.
 * - role "renter": counterparty is the listing owner; pending → Cancel request.
 * Active/upcoming (both) → Chat + View Details.
 */
export function BookingCard({
  booking,
  role,
  onPress,
  onAccept,
  onDecline,
  onCancel,
  onChat,
  actionPending,
  disabled,
}: {
  booking: any;
  role: "renter" | "host";
  onPress: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onChat?: () => void;
  actionPending?: ActionPending;
  disabled?: boolean;
}): React.ReactElement {
  const listing = booking.listing || booking.listing_details || {};
  const tab = bookingTab(booking);
  const chip = chipFor(role, tab, booking);

  const image = listing.images?.[0]?.image ? imgUrl(listing.images[0].image) : null;

  const isHost = role === "host";
  const cp = isHost ? booking.renter : listing.owner;
  const cpName = cp?.first_name || cp?.username || (isHost ? "Renter" : "Host");
  const cpAvatar = imgUrl(cp?.avatar);
  const superHost = !!cp?.is_super_host;
  const reviews = cp?.reviews_count ?? 0;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]} onPress={onPress}>
      {/* Top: image + details */}
      <View style={styles.header}>
        {image ? (
          <Image source={{ uri: image }} style={styles.img} />
        ) : (
          <View style={[styles.img, styles.imgFallback]}>
            <Package size={26} color={colors.mutedForeground} />
          </View>
        )}
        <View style={styles.main}>
          <Text style={styles.title} numberOfLines={1}>
            {listing.title || `Booking #${booking.id}`}
          </Text>
          <View style={styles.metaRow}>
            <Calendar size={13} color={colors.mutedForeground} />
            <Text style={styles.metaText}>
              {fmt(booking.start_date)} — {fmt(booking.end_date)}
            </Text>
          </View>
          <View style={styles.fromRow}>
            <Text style={styles.fromLabel}>From</Text>
            {cpAvatar ? (
              <Image source={{ uri: cpAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{cpName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.cpName} numberOfLines={1}>{cpName}</Text>
            {superHost && <BadgeCheck size={13} color={colors.primary} />}
            {reviews > 0 && <Text style={styles.reviews}>({reviews})</Text>}
          </View>
          {!!listing.city && (
            <View style={styles.pickRow}>
              <MapPin size={12} color={colors.mutedForeground} />
              <Text style={styles.pickText} numberOfLines={1}>Pick up: {listing.city}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Status + price */}
      <View style={styles.statusPriceRow}>
        <View style={[styles.chip, { backgroundColor: chip.bg }]}>
          <Text style={[styles.chipText, { color: chip.color }]}>{chip.label}</Text>
        </View>
        <View style={styles.priceWrap}>
          <Text style={styles.price}>{listing.currency || "SAR"} {booking.total_price}</Text>
          <Text style={styles.totalLabel}>Total</Text>
        </View>
      </View>

      {/* Actions */}
      {renderActions()}
    </Pressable>
  );

  function renderActions(): React.ReactElement | null {
    // Host — pending request needs a decision.
    if (isHost && tab === "pending" && onAccept && onDecline) {
      return (
        <View style={styles.actionRow}>
          <Pressable style={[styles.accept, disabled && styles.dim]} onPress={onAccept} disabled={disabled}>
            <CheckCircle size={16} color="#fff" />
            <Text style={styles.acceptText}>{actionPending === "accept" ? "Accepting…" : "Accept"}</Text>
          </Pressable>
          <Pressable style={[styles.decline, disabled && styles.dim]} onPress={onDecline} disabled={disabled}>
            <XCircle size={16} color={colors.destructive} />
            <Text style={styles.declineText}>{actionPending === "decline" ? "Declining…" : "Decline"}</Text>
          </Pressable>
        </View>
      );
    }
    // Renter — pending request can be withdrawn.
    if (!isHost && tab === "pending" && onCancel) {
      return (
        <View style={styles.actionRow}>
          <Pressable style={[styles.decline, styles.fullBtn, disabled && styles.dim]} onPress={onCancel} disabled={disabled}>
            <XCircle size={16} color={colors.destructive} />
            <Text style={styles.declineText}>{actionPending === "cancel" ? "Cancelling…" : "Cancel request"}</Text>
          </Pressable>
        </View>
      );
    }
    // Active / upcoming — chat + details.
    if (tab === "active" || tab === "upcoming") {
      return (
        <View style={styles.actionRow}>
          {onChat && (
            <Pressable style={[styles.chatBtn, disabled && styles.dim]} onPress={onChat} disabled={disabled}>
              <MessageCircle size={15} color="#fff" />
              <Text style={styles.chatText} numberOfLines={1}>Chat</Text>
            </Pressable>
          )}
          <Pressable style={styles.detailsBtn} onPress={onPress}>
            <FileText size={15} color={colors.primary} />
            <Text style={styles.detailsText}>View Details</Text>
          </Pressable>
        </View>
      );
    }
    // Completed / declined / cancelled. Renters can review a completed rental.
    const canReview = role === "renter" && deriveStatus(booking) === "completed" && !!listing?.id;
    return (
      <View style={styles.actionRow}>
        <Pressable style={[styles.detailsBtn, !canReview && styles.fullBtn]} onPress={onPress}>
          <FileText size={15} color={colors.primary} />
          <Text style={styles.detailsText}>View Details</Text>
        </Pressable>
        {canReview && (
          <View style={styles.fullBtn}>
            <LeaveReviewButton listingId={listing.id} size="sm" fullWidth />
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(176, 71, 246, 0.08)",
    ...shadows.card,
    shadowOpacity: 0.06,
  },
  header: { flexDirection: "row", gap: 12 },
  img: { width: 84, height: 84, borderRadius: radii.lg, backgroundColor: colors.muted },
  imgFallback: { alignItems: "center", justifyContent: "center" },
  main: { flex: 1, justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "800", color: colors.foreground, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
  metaText: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  fromRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
  fromLabel: { fontSize: 12, color: colors.mutedForeground },
  avatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.muted },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  avatarInitial: { fontSize: 10, fontWeight: "700", color: "#fff" },
  cpName: { fontSize: 13, fontWeight: "700", color: colors.foreground, maxWidth: 120 },
  reviews: { fontSize: 12, color: colors.mutedForeground },
  pickRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  pickText: { fontSize: 12, color: colors.mutedForeground, flex: 1 },

  statusPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(176, 71, 246, 0.06)",
  },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.full },
  chipText: { fontSize: 12, fontWeight: "700" },
  priceWrap: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  price: { fontSize: 15, fontWeight: "800", color: colors.foreground },
  totalLabel: { fontSize: 12, color: colors.mutedForeground },

  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  fullBtn: { flex: 1 },
  accept: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#16A34A",
    borderRadius: radii.lg,
    paddingVertical: 11,
  },
  acceptText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  decline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.destructive,
    borderRadius: radii.lg,
    paddingVertical: 11,
    backgroundColor: "#FFF5F5",
  },
  declineText: { fontSize: 14, fontWeight: "700", color: colors.destructive },
  chatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 11,
  },
  chatText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  detailsBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 11,
    backgroundColor: "#F5F0FF",
  },
  detailsText: { fontSize: 13, fontWeight: "700", color: colors.primary },
  dim: { opacity: 0.6 },
});
