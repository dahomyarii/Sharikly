import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import { colors, radii, shadows, spacing, layout } from "@/core/theme/tokens";
import type { BookingsStackParamList } from "@/navigation/types";
import { getBookings } from "@/services/api/endpoints/bookings";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  CalendarX,
  MapPin,
  ChevronRight,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = NativeStackNavigationProp<BookingsStackParamList, "BookingsRenter">;

export function BookingsRenterScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  const bookingsQ = useQuery({
    queryKey: ["bookings", "renter"],
    queryFn: () => getBookings({ role: "renter" }),
  });

  const ACTIVE_STATUSES = ["pending", "approved", "paid"];
  const HISTORY_STATUSES = ["completed", "cancelled", "rejected"];

  const allBookings: any[] = bookingsQ.data
    ? Array.isArray(bookingsQ.data)
      ? bookingsQ.data
      : (bookingsQ.data as any)?.results ?? []
    : [];

  const bookings = allBookings.filter((b: any) => {
    const s = String(b.status ?? "").toLowerCase();
    return activeTab === "active"
      ? ACTIVE_STATUSES.includes(s)
      : HISTORY_STATUSES.includes(s);
  });

  const onRefresh = () => {
    bookingsQ.refetch();
  };

  const navigateToExplore = (screen: "ListingsExplore" | "CreateListing", params?: Record<string, unknown>) => {
    const parent = (navigation as any).getParent?.();
    if (parent) {
      parent.navigate("ExploreTab", { screen, ...(params ? { params } : {}) });
      return;
    }
    (navigation as any).navigate("ExploreTab", { screen, ...(params ? { params } : {}) });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>Manage your rental requests</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === "active" && styles.activeTab]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[styles.tabText, activeTab === "active" && styles.activeTabText]}>Active</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}
        >
          <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>History</Text>
        </Pressable>
      </View>

      {/* List */}
      {bookingsQ.isPending && !bookingsQ.isRefetching ? (
        <View style={styles.skeletonWrap}>
          <SkeletonList count={5} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={bookingsQ.isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <CalendarX size={56} color={colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptyText}>
                {activeTab === "active" 
                  ? "You don't have any active rental requests right now." 
                  : "Your completed and cancelled bookings will appear here."}
              </Text>
              {activeTab === "active" && (
                <View style={styles.emptyActions}>
                  <PrimaryButton
                    label="Explore items to rent"
                    onPress={() => navigateToExplore("ListingsExplore")}
                    size="lg"
                  />
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => navigation.navigate("BookingReceipt", { id: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function BookingCard({ booking, onPress }: { booking: any; onPress: () => void }) {
  const listing = booking.listing_details || {};
  const status = booking.status?.toLowerCase() || "pending";
  
  const getStatusColor = () => {
    switch (status) {
      case "approved":
      case "paid":
        return colors.success;
      case "pending":
        return "#F59E0B";
      case "rejected":
      case "cancelled":
        return colors.destructive;
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case "approved":
      case "paid":
        return "#DCFCE7";
      case "pending":
        return "#FEF3C7";
      case "rejected":
      case "cancelled":
        return "#FEE2E2";
      default:
        return "#F3F4F6";
    }
  };

  const startDate = new Date(booking.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endDate = new Date(booking.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: listing.images?.[0]?.image || "https://via.placeholder.com/150" }}
          style={styles.listingImg}
        />
        <View style={styles.cardMain}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBg() }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
            <Text style={styles.priceText}>{listing.currency || "SAR"} {booking.total_price}</Text>
          </View>
          <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
          <View style={styles.locationRow}>
            <MapPin size={12} color={colors.mutedForeground} />
            <Text style={styles.locationText}>{listing.city || "Riyadh"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardFooter}>
        <View style={styles.dateWrap}>
          <Calendar size={14} color={colors.primary} />
          <Text style={styles.dateText}>{startDate} - {endDate}</Text>
        </View>
        <ChevronRight size={18} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.mutedForeground,
    fontWeight: "500",
    marginTop: 2,
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: 12,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.full,
    backgroundColor: "rgba(124, 58, 237, 0.05)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.primary,
    ...shadows.card,
    shadowOpacity: 0.05,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.mutedForeground,
  },
  activeTabText: {
    color: colors.primary,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: layout.tabBarHeight + 40,
    flexGrow: 1,
  },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.08)",
    ...shadows.card,
    shadowOpacity: 0.06,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
  },
  listingImg: {
    width: 80,
    height: 80,
    borderRadius: radii.lg,
    backgroundColor: colors.muted,
  },
  cardMain: {
    flex: 1,
    justifyContent: "center",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  priceText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.foreground,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: "500",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(124, 58, 237, 0.05)",
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  // Empty State
  skeletonWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(124, 58, 237, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.mutedForeground,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyActions: {
    width: "100%",
    paddingHorizontal: 40,
  },
});
