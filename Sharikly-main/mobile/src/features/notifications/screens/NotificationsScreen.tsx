import { colors, layout, radii, shadows, spacing } from "@/core/theme/tokens";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/api/endpoints/notifications";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { InboxStackParamList } from "@/navigation/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CheckCheck } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

type Nav = NativeStackNavigationProp<InboxStackParamList, "Notifications">;
type FilterTab = "All" | "Rentals" | "Bookings";

// ── Static mock data to enrich the notification cards (matches design) ──────
const AVATAR_COLORS = ["#B047F6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

function getStatusColor(label: string) {
  if (label === "Confirmed") return { bg: "#D1FAE5", text: "#065F46" };
  if (label === "Message") return { bg: "#EEE9FC", text: colors.primary };
  if (label === "Declined") return { bg: "#FEE2E2", text: "#991B1B" };
  if (label === "Cancelled") return { bg: colors.muted, text: colors.mutedForeground };
  if (label === "Payment") return { bg: "#DCFCE7", text: "#15803D" };
  if (label === "Completed") return { bg: "#DBEAFE", text: "#1E40AF" };
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
  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const title = notif.title || "Notification";
  const body = notif.body || notif.message || "";
  const type = String(notif.notification_type || notif.type || "").toUpperCase();
  const link = String(notif.link || "");
  const avatarLetter = title.charAt(0).toUpperCase();

  let statusLabel = "";
  if (type === "BOOKING_ACCEPTED") statusLabel = "Confirmed";
  else if (type === "BOOKING_DECLINED") statusLabel = "Declined";
  else if (type === "BOOKING_CANCELLED") statusLabel = "Cancelled";
  else if (type === "NEW_MESSAGE") statusLabel = "Message";
  else if (type === "PAYMENT_RECEIVED") statusLabel = "Payment";
  else if (type === "RENTAL_COMPLETED") statusLabel = "Completed";

  // Derive a single primary action from the notification's deep-link.
  const actions: string[] = [];
  if (/\/chat\/\d+/.test(link)) actions.push("View Chat");
  else if (link.toLowerCase().includes("earning")) actions.push("View Earnings");
  else if (link.toLowerCase().includes("booking")) actions.push("View Details");

  return { statusLabel, boldTitle: title, body, actions, avatarColor, avatarLetter, link };
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
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifs = notifications.filter((notif) => matchesFilterTab(notif, activeTab));

  const handleAction = (action: string, notif: any, link: string) => {
    if (!notif.read) markReadMutation.mutate(notif.id);
    if (action === "View Chat") {
      const m = link.match(/\/chat\/(\d+)/);
      const roomId = m ? Number(m[1]) : 0;
      if (roomId) (navigation as any).navigate("ChatRoom", { roomId });
    } else if (action === "View Earnings") {
      (navigation as any).navigate("ProfileTab", { screen: "HostArea" });
    } else {
      (navigation as any).navigate("BookingsTab", { screen: "Bookings" });
    }
  };

  const renderItem = ({ item: notif, index }: { item: any; index: number }) => {
    const rich = getRichData(notif, index);
    const isUnread = !notif.read;
    const timeLabel = formatRelativeTime(notif.created_at);
    const statusColors = rich.statusLabel ? getStatusColor(rich.statusLabel) : null;

    return (
      <Pressable
        style={[styles.notifCard, isUnread && styles.notifCardUnread]}
        onPress={() => { if (isUnread) markReadMutation.mutate(notif.id); }}
      >
        {isUnread && <View style={styles.unreadDot} />}
        <View style={styles.notifCardTop}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: rich.avatarColor }]}>
            <Text style={styles.avatarText}>{rich.avatarLetter}</Text>
            <View style={styles.avatarBadge}>
              <Text style={{ fontSize: 8 }}>✓</Text>
            </View>
          </View>

          <View style={styles.notifRight}>
            {/* Title + time */}
            <View style={styles.notifHeaderRow}>
              <Text style={styles.notifBoldTitle} numberOfLines={1}>{rich.boldTitle}</Text>
              <Text style={styles.notifTime}>{timeLabel}</Text>
            </View>
            {/* Status chip */}
            {!!rich.statusLabel && statusColors && (
              <View style={[styles.statusChip, { backgroundColor: statusColors.bg }]}>
                <Text style={[styles.statusChipText, { color: statusColors.text }]}>
                  {rich.statusLabel}
                </Text>
              </View>
            )}
            {!!rich.body && (
              <Text style={styles.notifBody}>{rich.body}</Text>
            )}
          </View>
        </View>

        {/* Action button */}
        {rich.actions.length > 0 && (
          <View style={styles.actionRow}>
            {rich.actions.map((a) => (
              <Pressable
                key={a}
                style={styles.actionBtnPrimary}
                onPress={() => handleAction(a, notif, rich.link)}
              >
                <Text style={styles.actionBtnPrimaryText}>{a}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </Pressable>
    );
  };

  const TABS: FilterTab[] = ["All", "Rentals", "Bookings"];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <ScreenHeader
        title="Notifications"
        right={
          <View style={styles.bellWrap}>
            <Bell size={22} color={colors.foreground} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        }
      />

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
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 16) + layout.tabBarHeight + 24 }]}
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
              colors={["#B047F6", "#7A5AFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBanner}
            >
              <Pressable onPress={() => (navigation as any).navigate("CreateListing")} style={{ alignItems: "center" }}>
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
    position: "relative",
  },
  notifCardUnread: {
    borderColor: "rgba(176,71,246,0.15)",
    backgroundColor: "#FEFCFF",
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
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
    gap: 8,
    marginBottom: 2,
  },
  statusChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    marginTop: 2,
    marginBottom: 5,
  },
  statusChipText: { fontSize: 10, fontWeight: "700" },
  notifTime: { fontSize: 11, color: colors.mutedForeground, flexShrink: 0 },
  notifBoldTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#1C1628",
    marginRight: 8,
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
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  actionBtnPrimary: {
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnPrimaryText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  // CTA Banner
  ctaBanner: {
    marginTop: 10,
    borderRadius: radii.xl,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    marginBottom: 20,
  },
  ctaBannerTitle: { fontSize: 15, fontWeight: "900", color: "#fff" },
  ctaBannerSub: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 1 },

  // States
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  mutedText: { fontSize: 15, color: colors.mutedForeground },
  errorText: { fontSize: 15, color: colors.destructive },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.foreground },
  emptyText: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
});
