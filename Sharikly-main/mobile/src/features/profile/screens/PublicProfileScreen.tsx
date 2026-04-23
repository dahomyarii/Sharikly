import { ListingCard } from "@/components/ui/ListingCard";
import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { getListings } from "@/services/api/endpoints/listings";
import type { ProfileStackParamList, MainTabParamList } from "@/navigation/types";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp, RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Flag,
  MessageCircle,
  Package,
  Star,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOrCreateRoom } from "@/services/api/endpoints/chat";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, "PublicProfile">,
  BottomTabNavigationProp<MainTabParamList>
>;
type R = RouteProp<ProfileStackParamList, "PublicProfile">;

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

  const blockMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(buildApiUrl(`/users/${userId}/block/`));
    },
    onSuccess: () => {
      Alert.alert("User blocked.");
      navigation.goBack();
    },
    onError: () => Alert.alert("Failed to block user."),
  });

  const chatMutation = useMutation({
    mutationFn: () => getOrCreateRoom(userId),
    onSuccess: (room: any) => {
      const roomId = room?.id ?? room?.room_id;
      if (roomId) {
        navigation.navigate("ProfileTab" as any, {
          screen: "ChatRoom",
          params: { roomId },
        } as any);
      }
    },
    onError: () => Alert.alert("Could not start chat."),
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
          onPress={() =>
            Alert.alert(
              "Report or Block",
              `What would you like to do with ${displayName}?`,
              [
                {
                  text: "Report",
                  onPress: () =>
                    Alert.alert("Report submitted", "Thank you for keeping Ekra safe."),
                },
                {
                  text: "Block",
                  style: "destructive",
                  onPress: () =>
                    Alert.alert(
                      "Block User",
                      `Block ${displayName}? You won't see their content anymore.`,
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Block", style: "destructive", onPress: () => blockMutation.mutate() },
                      ]
                    ),
                },
                { text: "Cancel", style: "cancel" },
              ]
            )
          }
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
                {user?.average_rating?.toFixed(1) ?? "—"}
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
                      navigation.navigate("ExploreTab", {
                        screen: "ListingDetail",
                        params: { id: listing.id },
                      } as any)
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
                  <Text style={styles.reviewerName}>— {review.reviewer.username}</Text>
                )}
              </View>
            ))}
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
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
});
