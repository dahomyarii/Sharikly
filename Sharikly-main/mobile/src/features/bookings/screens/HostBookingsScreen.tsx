import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { getBookings, updateBookingStatus } from "@/services/api/endpoints/bookings";
import type { BookingsStackParamList } from "@/navigation/types";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  MessageCircle,
  Package,
  XCircle,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = NativeStackNavigationProp<BookingsStackParamList, "HostBookings">;

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";

function getImageUrl(path: string | undefined) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_BASE.replace("/api", "")}${path}`;
}

type StatusTab = "Pending" | "Active" | "Upcoming" | "Completed";

function formatDateRange(start: string, end: string): string {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    const sLabel = s.toLocaleDateString("en", { month: "short", day: "numeric" });
    const eLabel = sameMonth
      ? e.toLocaleDateString("en", { day: "numeric" })
      : e.toLocaleDateString("en", { month: "short", day: "numeric" });
    return `${sLabel} - ${eLabel}`;
  } catch { return `${start} → ${end}`; }
}

export function HostBookingsScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<StatusTab>("Pending");

  const q = useQuery({
    queryKey: ["bookings", "host"],
    queryFn: () => getBookings({ role: "host" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "approved" | "rejected" | "cancelled" }) =>
      updateBookingStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bookings", "host"] });
    },
    onError: () => Alert.alert("Failed to update booking status."),
  });

  const bookings: any[] = q.data
    ? Array.isArray(q.data) ? q.data : (q.data as any)?.results ?? []
    : [];

  // Mock data if API empty
  const displayBookings = bookings.length > 0 ? bookings : [
    { id: 1, status: "pending", listing: { title: "Sony A7III Camera" }, renter: { username: "Ahmed", average_rating: 4.7, review_count: 24 }, start_date: "2026-04-25", end_date: "2026-04-27", total_price: "340", currency: "SAR", city: "Al Murooj, Riyadh" },
    { id: 2, status: "pending", listing: { title: "DJI Mini 4" }, renter: { username: "Saad", average_rating: 4.8, review_count: 56 }, start_date: "2026-04-30", end_date: "2026-05-02", total_price: "600", currency: "SAR", city: "Olaya, Riyadh" },
    { id: 3, status: "approved", listing: { title: "Camping Kit" }, renter: { username: "Khalid", average_rating: 4.8, review_count: 56 }, start_date: "2026-04-23", end_date: "2026-04-25", total_price: "270", currency: "SAR", city: "Drom 126, 1.7km" },
  ];

  const pendingBookings = displayBookings.filter((b) => b.status === "pending");
  const activeBookings = displayBookings.filter((b) => b.status === "approved" || b.status === "active");
  const upcomingBookings = displayBookings.filter((b) => b.status === "upcoming");
  const completedBookings = displayBookings.filter((b) => b.status === "completed");
  const pendingCount = pendingBookings.length;
  const activeCount = activeBookings.length;

  const handleAction = (booking: any, action: "approved" | "rejected") => {
    Alert.alert(
      `${action === "approved" ? "Accept" : "Decline"} Booking`,
      `Are you sure you want to ${action === "approved" ? "accept" : "decline"} this booking?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action === "approved" ? "Accept" : "Decline",
          style: action === "approved" ? "default" : "destructive",
          onPress: () => updateMutation.mutate({ id: booking.id, status: action }),
        },
      ]
    );
  };

  const TABS: StatusTab[] = ["Pending", "Active", "Upcoming", "Completed"];
  const tabBookings = activeTab === "Pending" ? pendingBookings
    : activeTab === "Active" ? activeBookings
    : activeTab === "Upcoming" ? upcomingBookings
    : completedBookings;

  const renderPendingCard = (booking: any) => {
    const listing = booking.listing;
    const imageUrl = listing?.images?.[0] ? getImageUrl(listing.images[0].image) : null;
    const currency = booking.currency ?? "SAR";
    const renterName = booking.renter?.username ?? "Renter";
    const rating = booking.renter?.average_rating ?? 4.7;
    const reviews = booking.renter?.review_count ?? 24;

    return (
      <View key={booking.id} style={styles.bookingCard}>
        <View style={styles.bookingCardTop}>
          {/* Thumbnail */}
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <Image source={require("../../../../assets/images/featured_canon.png")} style={styles.thumb} resizeMode="cover" />
          )}
          <View style={styles.bookingInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.listingTitle} numberOfLines={1}>{listing?.title ?? `Booking #${booking.id}`}</Text>
              <Pressable
                onPress={() =>
                  Alert.alert("Booking options", "", [
                    { text: "View details", onPress: () => navigation.navigate("BookingReceipt", { id: booking.id }) },
                    { text: "Cancel", style: "cancel" },
                  ])
                }
                accessibilityRole="button"
                accessibilityLabel="Open booking options"
              >
                <Text style={styles.dotsMenu}>···</Text>
              </Pressable>
            </View>
            {/* Dates */}
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaText}>{formatDateRange(booking.start_date, booking.end_date)}</Text>
            </View>
            {/* Renter */}
            <View style={styles.renterRow}>
              <Text style={styles.fromText}>From</Text>
              <View style={styles.renterAvatar}>
                <Text style={styles.renterAvatarText}>{renterName.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.renterName}>{renterName}</Text>
              {[1,2,3,4].map(i => <Text key={i} style={styles.starIcon}>⭐</Text>)}
              <Text style={styles.ratingText}>{rating} ({reviews})</Text>
            </View>
            {/* Location */}
            <Text style={styles.locationText}>Pick up: {booking.city ?? "Al Murooj, Riyadh"}</Text>
          </View>
        </View>

        {/* Status + Price */}
        <View style={styles.statusPriceRow}>
          <View style={styles.pendingChip}>
            <Text style={styles.pendingChipText}>Pending Response...</Text>
          </View>
          <Text style={styles.totalPrice}>{currency} {booking.total_price}</Text>
          <Text style={styles.totalLabel}>Total</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.acceptBtn, updateMutation.isPending && styles.btnDisabled]}
            onPress={() => handleAction(booking, "approved")}
            disabled={updateMutation.isPending}
          >
            <CheckCircle size={16} color="#fff" />
            <Text style={styles.acceptBtnText}>
              {updateMutation.isPending ? "Saving..." : "Accept"}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.declineBtn, updateMutation.isPending && styles.btnDisabled]}
            onPress={() => handleAction(booking, "rejected")}
            disabled={updateMutation.isPending}
          >
            <XCircle size={16} color={colors.destructive} />
            <Text style={styles.declineBtnText}>Decline</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderActiveCard = (booking: any) => {
    const listing = booking.listing;
    const imageUrl = listing?.images?.[0] ? getImageUrl(listing.images[0].image) : null;
    const currency = booking.currency ?? "SAR";
    const renterName = booking.renter?.username ?? "Renter";
    const rating = booking.renter?.average_rating ?? 4.8;
    const reviews = booking.renter?.review_count ?? 56;

    return (
      <View key={booking.id} style={styles.activeCard}>
        {/* Header: title + Ongoing chip */}
        <View style={styles.activeTitleRow}>
          <Text style={styles.activeListingTitle} numberOfLines={1}>{listing?.title ?? `Booking #${booking.id}`}</Text>
          <View style={styles.ongoingChip}>
            <Text style={styles.ongoingChipText}>Ongoing</Text>
          </View>
        </View>

        <View style={styles.activeCardInner}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.activeThumb} resizeMode="cover" />
          ) : (
            <Image source={require("../../../../assets/images/featured_canon.png")} style={styles.activeThumb} resizeMode="cover" />
          )}
          <View style={styles.activeInfo}>
            {/* Dates */}
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaText}>{formatDateRange(booking.start_date, booking.end_date)}</Text>
            </View>
            {/* Renter */}
            <View style={styles.renterRow}>
              <Text style={styles.fromText}>From</Text>
              <View style={[styles.renterAvatar, { backgroundColor: "#10B981" }]}>
                <Text style={styles.renterAvatarText}>{renterName.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.renterName}>{renterName}</Text>
              {[1,2,3,4].map(i => <Text key={i} style={styles.starIcon}>⭐</Text>)}
              <Text style={styles.ratingText}>{rating} ({reviews})</Text>
            </View>
            {/* Location */}
            <Text style={styles.locationText}>{booking.city ?? "Drom 126, 1.7 km away"}</Text>
            {/* Price */}
            <View style={styles.activePriceRow}>
              <Text style={styles.activePrice}>{currency} {booking.total_price}</Text>
              <Text style={styles.activePriceLabel}>  Total {currency} {booking.total_price}</Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Pressable
            style={styles.chatWithBtn}
            onPress={() => (navigation as any).navigate("ProfileTab", { screen: "ChatInbox" })}
          >
            <MessageCircle size={14} color="#fff" />
            <Text style={styles.chatWithBtnText}>Open Messages</Text>
          </Pressable>
          <Pressable
            style={styles.viewDetailsBtn}
            onPress={() => navigation.navigate("BookingReceipt", { id: booking.id })}
          >
            <Package size={14} color={colors.primary} />
            <Text style={styles.viewDetailsBtnText}>View Details</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>My Bookings</Text>
        <Pressable
          style={styles.bellWrap}
          onPress={() => (navigation as any).navigate("ProfileTab", { screen: "Notifications" })}
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
        >
          <Bell size={22} color={colors.foreground} />
          {pendingCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const count = tab === "Pending" ? pendingCount : tab === "Active" ? activeCount : 0;
          return (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}{count > 0 ? ` ${count}` : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Alert Banner */}
      {activeTab === "Pending" && pendingCount > 0 && (
        <View style={styles.alertBanner}>
          <Clock size={16} color="#92400E" />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertBannerTitle}>
              You have {pendingCount} new booking request{pendingCount > 1 ? "s" : ""}
            </Text>
            <Text style={styles.alertBannerSub}>Confirm them before they expire.</Text>
          </View>
          <Pressable style={styles.viewRequestsBtn} onPress={() => setActiveTab("Pending")}>
            <Text style={styles.viewRequestsBtnText}>View Requests</Text>
          </Pressable>
        </View>
      )}

      {/* List */}
      <FlatList
        data={tabBookings}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          item.status === "pending" ? renderPendingCard(item) : renderActiveCard(item)
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.muted} />
            <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} bookings</Text>
            <Text style={styles.emptyText}>
              {activeTab === "Pending"
                ? "Booking requests from renters will appear here."
                : "Your active bookings will appear here."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  screenTitle: { fontSize: 20, fontWeight: "800", color: "#1C1628", letterSpacing: -0.3 },
  bellWrap: { position: "relative", padding: 4 },
  bellBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },

  // Tabs
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    gap: 4,
    marginBottom: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: "#EEE9FC",
  },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
  tabTextActive: { color: colors.primary, fontWeight: "700" },

  // Alert Banner
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    marginHorizontal: spacing.md,
    marginBottom: 8,
    borderRadius: radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  alertBannerTitle: { fontSize: 13, fontWeight: "700", color: "#92400E" },
  alertBannerSub: { fontSize: 11, color: "#B45309" },
  viewRequestsBtn: {
    backgroundColor: "#F59E0B",
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewRequestsBtnText: { fontSize: 11, fontWeight: "700", color: "#fff" },

  list: { paddingHorizontal: spacing.md, paddingBottom: 100, gap: 12 },

  // Pending Booking Card
  bookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card,
    shadowOpacity: 0.07,
    borderWidth: 1,
    borderColor: "rgba(120,80,220,0.08)",
  },
  bookingCardTop: { flexDirection: "row", gap: 12, marginBottom: 10 },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    backgroundColor: colors.muted,
    flexShrink: 0,
  },
  bookingInfo: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  listingTitle: { fontSize: 15, fontWeight: "700", color: "#1C1628", flex: 1 },
  dotsMenu: { fontSize: 18, color: colors.mutedForeground, paddingLeft: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  metaIcon: { fontSize: 11 },
  metaText: { fontSize: 12, color: "#6B5E8F", fontWeight: "500" },
  renterRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  fromText: { fontSize: 12, color: colors.mutedForeground },
  renterAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  renterAvatarText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  renterName: { fontSize: 12, fontWeight: "700", color: "#1C1628" },
  starIcon: { fontSize: 9 },
  ratingText: { fontSize: 11, color: colors.mutedForeground },
  locationText: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },

  statusPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(120,80,220,0.07)",
  },
  pendingChip: {
    backgroundColor: "#FEF3C7",
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flex: 1,
  },
  pendingChipText: { fontSize: 11, fontWeight: "600", color: "#92400E" },
  totalPrice: { fontSize: 14, fontWeight: "800", color: "#1C1628" },
  totalLabel: { fontSize: 11, color: colors.mutedForeground },

  actionRow: { flexDirection: "row", gap: 8 },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#16A34A",
    borderRadius: radii.lg,
    paddingVertical: 11,
  },
  acceptBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  declineBtn: {
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
  declineBtnText: { fontSize: 14, fontWeight: "700", color: colors.destructive },
  btnDisabled: { opacity: 0.65 },

  // Active Booking Card
  activeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card,
    shadowOpacity: 0.07,
    borderWidth: 1,
    borderColor: "rgba(120,80,220,0.08)",
  },
  activeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  activeListingTitle: { fontSize: 15, fontWeight: "700", color: "#1C1628", flex: 1 },
  ongoingChip: {
    backgroundColor: "#D1FAE5",
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ongoingChipText: { fontSize: 11, fontWeight: "700", color: "#065F46" },
  activeCardInner: { flexDirection: "row", gap: 12, marginBottom: 10 },
  activeThumb: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    backgroundColor: colors.muted,
    flexShrink: 0,
  },
  activeInfo: { flex: 1 },
  activePriceRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  activePrice: { fontSize: 13, fontWeight: "700", color: "#1C1628" },
  activePriceLabel: { fontSize: 11, color: colors.mutedForeground },
  chatWithBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 10,
  },
  chatWithBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  viewDetailsBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 10,
    backgroundColor: "#F5F0FF",
  },
  viewDetailsBtnText: { fontSize: 13, fontWeight: "700", color: colors.primary },

  // Empty state
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.foreground },
  emptyText: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
});
