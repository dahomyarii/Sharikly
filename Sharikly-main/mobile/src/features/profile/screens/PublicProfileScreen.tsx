import { ListingCard } from "@/components/ui/ListingCard";
import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { getListings } from "@/services/api/endpoints/listings";
import type { RootStackParamList, MainTabParamList } from "@/navigation/types";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp, RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "@tanstack/react-query";
import { showToast } from "@/core/events/appEvents";
import {
  ArrowLeft,
  Flag,
  MessageCircle,
  Package,
  Star,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOrCreateRoom } from "@/services/api/endpoints/chat";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList, "PublicProfile">,
  BottomTabNavigationProp<MainTabParamList>
>;
type R = RouteProp<RootStackParamList, "PublicProfile">;

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";

function getAvatarUrl(path: string | undefined) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_BASE.replace("/api", "")}${path}`;
}

export function PublicProfileScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { userId } = useRoute<R>().params;

  const userQ = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(buildApiUrl(`/users/${userId}/`));
      return data;
    },
  });

  const listingsQ = useQuery({
    queryKey: ["listings", "user", userId],
    queryFn: () => getListings({ owner: userId }),
  });

  const reviewsQ = useQuery({
    queryKey: ["reviews", "user", userId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(buildApiUrl(`/users/${userId}/reviews/`));
      return data;
    },
    retry: false,
  });

  const [menuVisible, setMenuVisible] = useState(false);

  const blockMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(buildApiUrl(`/users/${userId}/block/`));
    },
    onSuccess: () => {
      showToast("User blocked.", "success");
      navigation.goBack();
    },
    onError: () => showToast("Couldn't block that user. Please try again.", "error"),
  });

  const reportMutation = useMutation({
    mutationFn: () =>
      axiosInstance.post(buildApiUrl("/reports/"), {
        reported_user: userId,
        reason: "OTHER",
        details: "Reported from profile",
      }),
    onSuccess: () => showToast("Report submitted. Thanks for keeping Ekra safe.", "success"),
    onError: () => showToast("Couldn't submit your report. Please try again.", "error"),
  });

  const chatMutation = useMutation({
    mutationFn: () => getOrCreateRoom(userId),
    onSuccess: (room: any) => {
      const roomId = room?.id ?? room?.room_id;
      if (roomId) {
        navigation.navigate("ChatRoom", { roomId });
      }
    },
    onError: () => showToast("Couldn't start the chat. Please try again.", "error"),
  });

  const user: any = userQ.data;
  const avatarUrl = user ? getAvatarUrl(user.avatar) : null;
  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.username ?? "User";

  const listings: any[] = listingsQ.data
    ? Array.isArray(listingsQ.data)
      ? listingsQ.data
      : (listingsQ.data as any)?.results ?? []
    : [];

  const reviews: any[] = reviewsQ.data
    ? Array.isArray(reviewsQ.data)
      ? reviewsQ.data
      : (reviewsQ.data as any)?.results ?? []
    : [];

  if (userQ.isPending) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
            <ArrowLeft size={22} color={colors.foreground} />
          </Pressable>
          <Text style={styles.topTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.mutedText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
          <ArrowLeft size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.topTitle}>{displayName}</Text>
        <Pressable
          style={styles.iconBtn}
          hitSlop={8}
          onPress={() => setMenuVisible(true)}
        >
          <Flag size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile hero */}
        <View style={styles.profileCard}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.displayName}>{displayName}</Text>
          {user?.username && <Text style={styles.username}>@{user.username}</Text>}
          {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Package size={14} color={colors.primary} />
              <Text style={styles.statValue}>{listings.length}</Text>
              <Text style={styles.statLabel}>Listings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Star size={14} color="#F59E0B" />
              <Text style={styles.statValue}>
                {Number(user?.average_rating) > 0 ? Number(user.average_rating).toFixed(1) : "—"}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reviews.length}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={styles.messageBtn}
              onPress={() => chatMutation.mutate()}
            >
              <MessageCircle size={16} color="#fff" />
              <Text style={styles.messageBtnText}>
                {chatMutation.isPending ? "Opening…" : "Message"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Listings */}
        {listings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {displayName.split(" ")[0]}&apos;s Listings
            </Text>
            <View style={styles.listingsGrid}>
              {listings.map((listing: any) => (
                <View key={listing.id} style={styles.gridItem}>
                  <ListingCard
                    listing={listing}
                    onPress={() =>
                      navigation.push("ListingDetail", { id: listing.id })
                    }
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.map((review: any) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={{ flexDirection: "row", gap: 3, marginBottom: 6 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={13}
                      color="#F59E0B"
                      fill={s <= (review.rating ?? 0) ? "#F59E0B" : "transparent"}
                    />
                  ))}
                </View>
                {review.comment && (
                  <Text style={styles.reviewText}>{review.comment}</Text>
                )}
                {review.reviewer?.username && (
                  <Text
                    style={styles.reviewerName}
                    onPress={
                      review.reviewer?.id && review.reviewer.id !== userId
                        ? () => navigation.push("PublicProfile", { userId: review.reviewer.id })
                        : undefined
                    }
                  >
                    — {review.reviewer.username}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>{displayName}</Text>
            <Pressable style={styles.sheetBtn} onPress={() => { setMenuVisible(false); reportMutation.mutate(); }}>
              <Text style={styles.sheetBtnText}>Report user</Text>
            </Pressable>
            <Pressable style={styles.sheetBtn} onPress={() => { setMenuVisible(false); blockMutation.mutate(); }}>
              <Text style={[styles.sheetBtnText, { color: colors.destructive }]}>Block user</Text>
            </Pressable>
            <Pressable style={[styles.sheetBtn, styles.sheetCancel]} onPress={() => setMenuVisible(false)}>
              <Text style={styles.sheetBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: "rgba(249,248,255,0.97)",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground, letterSpacing: -0.3 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  mutedText: { ...typography.body, color: colors.mutedForeground },
  scrollContent: { padding: spacing.md },

  profileCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xxl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardHeavy,
  },
  avatar: { width: 84, height: 84, borderRadius: radii.full, marginBottom: spacing.md },
  avatarFallback: { backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarLetter: { color: "#fff", fontSize: 32, fontWeight: "700" },
  displayName: { fontSize: 22, fontWeight: "800", color: colors.foreground, letterSpacing: -0.4 },
  username: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  bio: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20, marginTop: 8, maxWidth: 260 },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface2,
    borderRadius: radii.xl,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    width: "100%",
  },
  statItem: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontSize: 17, fontWeight: "800", color: colors.foreground },
  statLabel: { fontSize: 11, color: colors.mutedForeground },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },

  actions: { width: "100%" },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    paddingVertical: 14,
  },
  messageBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: 10,
    marginTop: spacing.sm,
  },
  listingsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: spacing.md },
  gridItem: { width: "48%" },

  reviewCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
    ...shadows.card,
  },
  reviewText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  reviewerName: { fontSize: 11, color: colors.mutedForeground, fontStyle: "italic", marginTop: 4 },

  sheetBackdrop: { flex: 1, backgroundColor: "rgba(15,8,40,0.45)", justifyContent: "flex-end", padding: spacing.md },
  sheetCard: { backgroundColor: "#FFF", borderRadius: radii.xl, padding: spacing.sm, gap: 4 },
  sheetTitle: { ...typography.subheading, color: colors.mutedForeground, textAlign: "center", paddingVertical: 8 },
  sheetBtn: { paddingVertical: 14, alignItems: "center", borderRadius: radii.md },
  sheetCancel: { backgroundColor: colors.surface2, marginTop: 4 },
  sheetBtnText: { fontSize: 15, fontWeight: "700", color: colors.foreground },
});
