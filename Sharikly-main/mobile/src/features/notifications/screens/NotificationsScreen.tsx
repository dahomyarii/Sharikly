import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/api/endpoints/notifications";
import { updateBookingStatus } from "@/services/api/endpoints/bookings";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { InboxStackParamList } from "@/navigation/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CheckCheck } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

type Nav = NativeStackNavigationProp<InboxStackParamList, "Notifications">;
type FilterTab = "All" | "Rentals" | "Bookings";

// ── Static mock data to enrich the notification cards (matches design) ──────
const AVATAR_COLORS = ["#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

function getStatusColor(label: string) {
  if (label === "On the way" || label === "Today") return { bg: "#EEE9FC", text: colors.primary };
  if (label === "Paid") return { bg: "#D1FAE5", text: "#065F46" };
  if (label === "Pending") return { bg: "#FEF3C7", text: "#92400E" };
  return { bg: colors.muted, text: colors.mutedForeground };
}

function formatRelativeTime(iso: string) {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return new Date(iso).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function getRichData(notif: any, idx: number) {
  const type = notif.notification_type ?? notif.type ?? "";
  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const avatarLetter = notif.title?.charAt(0)?.toUpperCase() ?? "N";

  if (type.includes("booking_completed") || type.includes("completed")) {
    return {
      name: "Khalid",
      statusLabel: "On the way",
      boldTitle: "Booking Completed",
      body: `Khalid completed their booking.\nYou've earned 130 SAR!`,
      actions: ["View Details", "Rate Guest"],
      avatarColor,
      avatarLetter: "K",
    };
  }
  if (type.includes("payment") || type.includes("payment_received")) {
    return {
      name: "Saad",
      statusLabel: "Paid",
      boldTitle: "Payment Received",
      body: `You've earned 930 SAR from Saad's booking.\n10% fee is applied in the total amount.`,
      actions: ["View Earnings"],
      avatarColor: "#10B981",
      avatarLetter: "S",
    };
  }
  if (type.includes("pickup") || type.includes("reminder")) {
    return {
      name: "Saad",
      statusLabel: "",
      boldTitle: "Reminder Pickup Today",
      boldTitlePrefix: "Reminder ",
      body: `Saad is scheduled to pick up\nthe DJI Mini A! ✨ today at 5:30 PM.\nDon't forget to prepare the item!`,
      actions: ["Decline", "Accept →"],
      avatarColor: "#F59E0B",
      avatarLetter: "S",
    };
  }
  if (type.includes("new_booking") || type.includes("request")) {
    return {
      name: "Faisal",
      statusLabel: "",
      boldTitle: "New Booking Request",
      body: `Faisal requested to rent your GoPro Hero10\nstarting Apr 27. Confirm pickup?`,
      actions: ["Decline", "Accept"],
      avatarColor: "#7C3AED",
      avatarLetter: "F",
    };
  }
  return {
    name: notif.title ?? "Notification",
    statusLabel: "",
    boldTitle: notif.message ?? notif.title ?? "New notification",
    body: "",
    actions: [],
    avatarColor,
    avatarLetter,
  };
}

function matchesFilterTab(notif: any, tab: FilterTab): boolean {
  if (tab === "All") return true;
  const type = String(notif.notification_type ?? notif.type ?? "").toLowerCase();
  if (tab === "Rentals") {
    return (
      type.includes("payment") ||
      type.includes("earning") ||
      type.includes("completed")
    );
  }
  return (
    type.includes("booking") ||
    type.includes("pickup") ||
    type.includes("request") ||
    type.includes("reminder")
  );
}

export function NotificationsScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  const bookingActionMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "approved" | "rejected" }) =>
      updateBookingStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    onError: () => Alert.alert("Action failed", "Please try again."),
  });

  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const rawNotifs = q.data;
  const notifications: any[] = Array.isArray(rawNotifs)
    ? rawNotifs
    : (rawNotifs as any)?.results ?? [];

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── Fallback mock notifications if API returns nothing ──────────────────
  const displayNotifs = notifications.length > 0 ? notifications : [
    { id: 1, notification_type: "booking_completed", is_read: false, created_at: new Date().toISOString() },
    { id: 2, notification_type: "payment_received", is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, notification_type: "pickup_reminder", is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 4, notification_type: "new_booking_request", is_read: true, created_at: new Date(Date.now() - 172800000).toISOString() },
  ];
  const filteredNotifs = displayNotifs.filter((notif) => matchesFilterTab(notif, activeTab));

  const renderItem = ({ item: notif, index }: { item: any; index: number }) => {
    const rich = getRichData(notif, index);
    const isUnread = !notif.is_read;
    const timeLabel = formatRelativeTime(notif.created_at);
    const statusColors = rich.statusLabel ? getStatusColor(rich.statusLabel) : null;
    const hasDecline = rich.actions.some((a) => a === "Decline" || a === "Decline");
    const hasAccept = rich.actions.some((a) => a.startsWith("Accept"));
    const hasViewDetails = rich.actions.some((a) => a === "View Details");
    const hasRateGuest = rich.actions.some((a) => a === "Rate Guest");
    const hasViewEarnings = rich.actions.some((a) => a === "View Earnings");

    return (
      <Pressable
        style={[styles.notifCard, isUnread && styles.notifCardUnread]}
        onPress={() => { if (isUnread) markReadMutation.mutate(notif.id); }}
      >
        <View style={styles.notifCardTop}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: rich.avatarColor }]}>
            <Text style={styles.avatarText}>{rich.avatarLetter}</Text>
            <View style={styles.avatarBadge}>
              <Text style={{ fontSize: 8 }}>✓</Text>
            </View>
          </View>

          {/* Header row */}
          <View style={styles.notifRight}>
            <View style={styles.notifHeaderRow}>
              <Text style={styles.notifName}>{rich.name}</Text>
              {!!rich.statusLabel && statusColors && (
                <View style={[styles.statusChip, { backgroundColor: statusColors.bg }]}>
                  <Text style={[styles.statusChipText, { color: statusColors.text }]}>
                    {rich.statusLabel}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }} />
              <Text style={styles.notifTime}>{timeLabel}</Text>
            </View>
            <Text style={styles.notifBoldTitle}>{rich.boldTitle}</Text>
            {!!rich.body && (
              <Text style={styles.notifBody}>{rich.body}</Text>
            )}
          </View>
        </View>

        {/* Action buttons */}
        {rich.actions.length > 0 && (
          <View style={styles.actionRow}>
            {hasViewDetails && (
              <Pressable
                style={styles.actionBtnOutline}
                onPress={() => {
                  const bookingId = notif.booking_id ?? notif.id;
                  (navigation as any).navigate("BookingsTab", { screen: "BookingReceipt", params: { id: bookingId } });
                }}
              >
                <Text style={styles.actionBtnOutlineText}>View Details</Text>
              </Pressable>
            )}
            {hasRateGuest && (
              <Pressable
                style={styles.actionBtnPrimary}
                onPress={() => {
                  const userId = Number(notif.actor_id ?? notif.user_id ?? 0);
                  if (userId > 0) {
                    (navigation as any).navigate("ProfileTab", {
                      screen: "PublicProfile",
                      params: { userId },
                    });
                    return;
                  }
                  const bookingId = notif.booking_id ?? notif.id;
                  (navigation as any).navigate("BookingsTab", {
                    screen: "BookingReceipt",
                    params: { id: bookingId },
                  });
                }}
              >
                <Text style={styles.actionBtnPrimaryText}>Rate Guest</Text>
              </Pressable>
            )}
            {hasViewEarnings && (
              <Pressable
                style={[styles.actionBtnOutline, { flex: 0, paddingHorizontal: 20 }]}
                onPress={() => (navigation as any).navigate("ProfileTab", { screen: "HostArea" })}
              >
                <Text style={styles.actionBtnOutlineText}>View Earnings</Text>
              </Pressable>
            )}
            {hasDecline && (
              <Pressable
                style={styles.actionBtnGhost}
                onPress={() => {
                  const bookingId = notif.booking_id ?? notif.id;
                  Alert.alert("Decline Booking", "Are you sure?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Decline", style: "destructive", onPress: () => bookingActionMutation.mutate({ id: bookingId, status: "rejected" }) },
                  ]);
                }}
              >
                <Text style={styles.actionBtnGhostText}>Decline</Text>
              </Pressable>
            )}
            {hasAccept && (
              <Pressable
                style={styles.actionBtnPrimary}
                onPress={() => {
                  const bookingId = notif.booking_id ?? notif.id;
                  Alert.alert("Accept Booking", "Confirm acceptance?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Accept", onPress: () => bookingActionMutation.mutate({ id: bookingId, status: "approved" }) },
                  ]);
                }}
              >
                <Text style={styles.actionBtnPrimaryText}>
                  {rich.actions.find((a) => a.startsWith("Accept")) ?? "Accept"}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  const TABS: FilterTab[] = ["All", "Rentals", "Bookings"];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Notifications</Text>
        <View style={styles.bellWrap}>
          <Bell size={22} color={colors.foreground} />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
        {unreadCount > 0 && (
          <Pressable
            style={[styles.markAllBtn, markAllMutation.isPending && styles.markAllBtnDisabled]}
            onPress={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            <CheckCheck size={12} color={colors.primary} />
            <Text style={styles.markAllText}>
              {markAllMutation.isPending ? "Updating..." : "Mark all read"}
            </Text>
          </Pressable>
        )}
      </View>

      {/* List */}
      {q.isPending ? (
        <View style={styles.center}>
          <Bell size={32} color={colors.muted} />
          <Text style={styles.mutedText}>Loading notifications…</Text>
        </View>
      ) : q.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load notifications.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.center}>
              <BellOff size={48} color={colors.muted} />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>
                You will see booking updates, messages, and more here.
              </Text>
            </View>
          }
          ListFooterComponent={
            /* Bottom CTA Banner */
            <LinearGradient
              colors={["#7C3AED", "#5B21B6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBanner}
            >
              <Pressable onPress={() => (navigation as any).navigate("ExploreTab", { screen: "CreateListing" })} style={{ alignItems: "center" }}>
                <Text style={styles.ctaBannerTitle}>+ List Your Equipment</Text>
                <Text style={styles.ctaBannerSub}>Earn up to SAR 500/week</Text>
              </Pressable>
            </LinearGradient>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  screenTitle: { fontSize: 20, fontWeight: "800", color: "#1C1628", letterSpacing: -0.4 },
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

  // Filter tabs
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: "transparent",
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.mutedForeground },
  tabTextActive: { color: "#FFFFFF" },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
  },
  markAllText: { fontSize: 11, fontWeight: "700", color: colors.primary },
  markAllBtnDisabled: { opacity: 0.65 },

  list: { paddingHorizontal: spacing.md, paddingBottom: 20, gap: 10 },

  // Notification card
  notifCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card,
    shadowOpacity: 0.06,
    borderWidth: 1,
    borderColor: "rgba(120,80,220,0.07)",
  },
  notifCardUnread: {
    borderColor: "rgba(124,58,237,0.15)",
    backgroundColor: "#FEFCFF",
  },
  notifCardTop: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  notifRight: { flex: 1 },
  notifHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  notifName: { fontSize: 14, fontWeight: "700", color: "#1C1628" },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  statusChipText: { fontSize: 10, fontWeight: "700" },
  notifTime: { fontSize: 11, color: colors.mutedForeground },
  notifBoldTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1C1628",
    marginBottom: 3,
  },
  notifBody: {
    fontSize: 13,
    color: "#6B5E8F",
    lineHeight: 18,
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  actionBtnOutline: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnOutlineText: { fontSize: 13, fontWeight: "700", color: colors.primary },
  actionBtnPrimary: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnPrimaryText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  actionBtnGhost: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },
  actionBtnGhostText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },

  // CTA Banner
  ctaBanner: {
    marginTop: 10,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: 20,
  },
  ctaBannerTitle: { fontSize: 18, fontWeight: "900", color: "#fff" },
  ctaBannerSub: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 },

  // States
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  mutedText: { fontSize: 15, color: colors.mutedForeground },
  errorText: { fontSize: 15, color: colors.destructive },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.foreground },
  emptyText: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
});
