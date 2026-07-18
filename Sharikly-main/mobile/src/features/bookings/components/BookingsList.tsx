import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import { colors, layout, radii, shadows, spacing } from "@/core/theme/tokens";
import { acceptBooking, cancelBooking, declineBooking, getBookings } from "@/services/api/endpoints/bookings";
import { getOrCreateRoom } from "@/services/api/endpoints/chat";
import { useAuthStore } from "@/store/authStore";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Package, X } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { byTabPriority, filterCounts, matchesTab, toBookingArray, type TabFilter } from "../status";
import { BookingCard } from "./BookingCard";
import { StatusTabs } from "./StatusTabs";

type ActionKind = "accept" | "decline" | "cancel";

/** The bookings list for one role — host ("My Items") or renter ("Renting"). */
export function BookingsList({ role }: { role: "renter" | "host" }): React.ReactElement {
  const navigation = useNavigation<any>();
  const { hasSession } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabFilter>("all");
  const [confirmTarget, setConfirmTarget] = useState<{ booking: any; action: ActionKind } | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const q = useQuery({
    queryKey: ["bookings", role],
    queryFn: () => getBookings({ role }),
    enabled: hasSession,
  });

  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: ActionKind }) =>
      action === "accept" ? acceptBooking(id) : action === "decline" ? declineBooking(id) : cancelBooking(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bookings", "host"] });
      void queryClient.invalidateQueries({ queryKey: ["bookings", "renter"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => setErrorText("Could not update the booking. Please try again."),
  });

  const busyId = mutation.isPending ? mutation.variables?.id : undefined;
  const busyAction = mutation.isPending ? mutation.variables?.action : undefined;

  const all = toBookingArray(q.data);
  const counts = filterCounts(all);
  const rows = all.filter((b) => matchesTab(b, tab));
  // In the "All" view, float action-needing items (pending) to the top.
  if (tab === "all") rows.sort(byTabPriority);

  const runConfirm = () => {
    if (!confirmTarget) return;
    mutation.mutate({ id: confirmTarget.booking.id, action: confirmTarget.action });
    setConfirmTarget(null);
  };

  const openChat = async (booking: any) => {
    try {
      const cpId = role === "host" ? booking.renter?.id : booking.listing?.owner?.id;
      if (!cpId) return;
      const res: any = await getOrCreateRoom(cpId, booking.listing?.id);
      const roomId = res?.id;
      if (roomId) {
        (navigation as any).navigate("ChatRoom", { roomId });
      }
    } catch {
      setErrorText("Couldn't open the chat. Please try again.");
    }
  };

  const goCreateListing = () => {
    (navigation as any).navigate("CreateListing");
  };
  const goExplore = () => {
    (navigation.getParent?.() ?? navigation).navigate("ExploreTab", { screen: "ListingsExplore" });
  };

  if (hasSession && q.isPending && !q.isRefetching) {
    return (
      <View style={styles.skeletonWrap}>
        <SkeletonList count={5} />
      </View>
    );
  }

  const showBanner = role === "host" && counts.pending > 0 && !bannerDismissed;
  const confirmIsAccept = confirmTarget?.action === "accept";
  const confirmVerb = confirmTarget?.action === "cancel" ? "cancel" : confirmTarget?.action;

  return (
    <View style={styles.fill}>
      <View style={styles.tabsWrap}>
        <StatusTabs value={tab} counts={counts} onChange={setTab} />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          showBanner ? (
            <View style={styles.banner}>
              <Clock size={18} color="#B45309" />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>
                  You have {counts.pending} new booking request{counts.pending > 1 ? "s" : ""}
                </Text>
                <Text style={styles.bannerSub}>Confirm them before they expire.</Text>
              </View>
              <Pressable style={styles.bannerBtn} onPress={() => setTab("pending")}>
                <Text style={styles.bannerBtnText}>View Requests</Text>
              </Pressable>
              <Pressable onPress={() => setBannerDismissed(true)} hitSlop={8} style={styles.bannerClose}>
                <X size={16} color="#B45309" />
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            role={role}
            onPress={() => navigation.navigate("BookingReceipt", { id: item.id })}
            onAccept={() => setConfirmTarget({ booking: item, action: "accept" })}
            onDecline={() => setConfirmTarget({ booking: item, action: "decline" })}
            onCancel={() => setConfirmTarget({ booking: item, action: "cancel" })}
            onChat={() => openChat(item)}
            actionPending={busyId === item.id ? (busyAction as ActionKind) : null}
            disabled={mutation.isPending}
          />
        )}
        ListEmptyComponent={<EmptyState role={role} tab={tab} onCreate={goCreateListing} onExplore={goExplore} />}
      />

      {/* Accept / Decline / Cancel confirmation */}
      <Modal visible={!!confirmTarget} transparent animationType="fade" onRequestClose={() => setConfirmTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {confirmIsAccept ? "Accept booking" : confirmTarget?.action === "cancel" ? "Cancel request" : "Decline booking"}
            </Text>
            <Text style={styles.modalBody}>
              Are you sure you want to {confirmVerb} the booking for "{confirmTarget?.booking?.listing?.title ?? "this item"}"?
              {!confirmIsAccept ? " This can't be undone." : ""}
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => setConfirmTarget(null)}>
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, confirmIsAccept ? styles.modalBtnAccept : styles.modalBtnDanger]}
                onPress={runConfirm}
              >
                <Text style={styles.modalBtnPrimaryText}>
                  {confirmIsAccept ? "Accept" : confirmTarget?.action === "cancel" ? "Cancel request" : "Decline"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error feedback */}
      <Modal visible={!!errorText} transparent animationType="fade" onRequestClose={() => setErrorText(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Something went wrong</Text>
            <Text style={styles.modalBody}>{errorText}</Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => setErrorText(null)}>
                <Text style={styles.modalBtnGhostText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {mutation.isPending && (
        <View pointerEvents="none" style={styles.savingHint}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

function EmptyState({
  role,
  tab,
  onCreate,
  onExplore,
}: {
  role: "renter" | "host";
  tab: TabFilter;
  onCreate: () => void;
  onExplore: () => void;
}): React.ReactElement {
  const messages: Record<TabFilter, string> = {
    all:
      role === "host"
        ? "Booking requests and rentals for your items will show up here."
        : "Items you rent from others will show up here.",
    pending:
      role === "host"
        ? "New booking requests from renters will show up here."
        : "Requests you've sent that are awaiting a host's response will show here.",
    active: "Rentals happening right now will show here.",
    upcoming: "Confirmed rentals that haven't started yet will show here.",
    completed: "Finished, declined and cancelled bookings will show here.",
  };
  const noun = role === "host" ? "bookings" : "rentals";
  const titles: Record<TabFilter, string> = {
    all: role === "host" ? "No bookings yet" : "No rentals yet",
    pending: "No pending requests",
    active: `No active ${noun}`,
    upcoming: `No upcoming ${noun}`,
    completed: `No past ${noun}`,
  };
  const showCta = tab === "all" || tab === "pending" || tab === "active";
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <Package size={52} color={colors.primary} strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyTitle}>{titles[tab]}</Text>
      <Text style={styles.emptyText}>{messages[tab]}</Text>
      {showCta && (
        <View style={styles.emptyActions}>
          <PrimaryButton
            label={role === "host" ? "List an item" : "Explore items to rent"}
            onPress={role === "host" ? onCreate : onExplore}
            size="lg"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  tabsWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarHeight + 40, flexGrow: 1 },
  skeletonWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  // Alert banner
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEF3C7",
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  bannerTitle: { fontSize: 14, fontWeight: "800", color: "#92400E" },
  bannerSub: { fontSize: 12, color: "#B45309", marginTop: 1 },
  bannerBtn: { backgroundColor: "#F59E0B", borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 8 },
  bannerBtnText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  bannerClose: { padding: 2 },

  // Empty state
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 56 },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(176, 71, 246, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: colors.foreground, marginBottom: 8 },
  emptyText: { fontSize: 15, color: colors.mutedForeground, textAlign: "center", maxWidth: 280, lineHeight: 22, marginBottom: 24 },
  emptyActions: { width: "100%", paddingHorizontal: 40 },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 8, 40, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: { width: "100%", maxWidth: 360, backgroundColor: "#FFFFFF", borderRadius: radii.xl, padding: spacing.lg, ...shadows.cardHeavy },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.foreground, marginBottom: 8 },
  modalBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  modalBtn: { minWidth: 96, height: 44, borderRadius: radii.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  modalBtnGhost: { backgroundColor: "#F3F4F6" },
  modalBtnGhostText: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  modalBtnAccept: { backgroundColor: "#16A34A" },
  modalBtnDanger: { backgroundColor: colors.destructive },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

  savingHint: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: radii.full,
    padding: 8,
    ...shadows.card,
  },
});
