import { SkeletonList } from "@/components/ui/SkeletonCard";
import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { GuestAuthGate } from "@/components/ui/GuestAuthGate";
import type { InboxStackParamList } from "@/navigation/types";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { MessageCircle, Plus, Search, Check, MoreHorizontal, Navigation, CircleDashed } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = NativeStackNavigationProp<InboxStackParamList, "ChatInbox">;

export function ChatInboxScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const navigateToExplore = (screen: "ListingsExplore" | "CreateListing", params?: Record<string, unknown>) => {
    const parent = (navigation as any).getParent?.();
    if (parent) {
      parent.navigate("ExploreTab", { screen, ...(params ? { params } : {}) });
      return;
    }
    (navigation as any).navigate("ExploreTab", { screen, ...(params ? { params } : {}) });
  };

  const MOCK_ROOMS = [
    {
      id: "1",
      name: "Saad",
      avatar: "https://i.pravatar.cc/150?u=saad",
      message: "Got it! I'll see you then.",
      time: "12:40 PM",
      status: "On the way",
      statusColor: "green", // #10B981
      dotIcon: "circle-dashed", // represents green circle
      dotColor: "#10B981",
    },
    {
      id: "2",
      name: "Khalid",
      avatar: "https://i.pravatar.cc/150?u=khalid",
      message: "Sounds good. See you tomorrow",
      time: "Tue, 1:15 PM",
      dotIcon: "navigation", // represents blue ^
      dotColor: colors.primary,
    },
    {
      id: "3",
      name: "Nora",
      avatar: "https://i.pravatar.cc/150?u=nora",
      message: "Almost there, I'll be there in 5 mins",
      time: "Mon, 11:20 PM",
      dotIcon: "circle", // just blue
      dotColor: colors.primary,
    },
    {
      id: "4",
      name: "Faisal",
      avatar: "https://i.pravatar.cc/150?u=faisal",
      message: "Okay! I'm here, where are you?",
      time: "Sat, Apr 14 >",
      status: "Delivered",
      statusColor: "gray",
      dotIcon: "navigation", // yellow
      dotColor: "#F59E0B",
    },
    {
      id: "5",
      name: "Sarah",
      avatar: "https://i.pravatar.cc/150?u=sarah",
      message: "Sure, I'll cancel. Sorry for any troubles!",
      time: "Sun, Apr 13 >",
      dotIcon: "navigation", // blue
      dotColor: colors.primary,
      hasReplies: true,
    },
    {
      id: "6",
      name: "Anas",
      avatar: "https://i.pravatar.cc/150?u=anas",
      message: "Please confirm our pickup today",
      time: "Fri, Apr 12",
      dotIcon: "navigation", // yellow
      dotColor: "#F59E0B",
    },
  ];

  const filteredRooms = MOCK_ROOMS.filter((room) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return room.name.toLowerCase().includes(query) || room.message.toLowerCase().includes(query);
  });

  const renderRoom = ({ item }: { item: typeof MOCK_ROOMS[0] }) => {
    return (
      <Pressable
        style={({ pressed }) => [styles.roomCard, pressed && { opacity: 0.85 }]}
        onPress={() => navigation.navigate("ChatRoom", { roomId: Number(item.id) })}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View style={styles.avatarBadge}>
            {item.dotIcon === "circle-dashed" && <CircleDashed size={10} color="#fff" />}
            {item.dotIcon === "navigation" && <Navigation size={8} color="#fff" style={{ transform: [{ rotate: "45deg" }] }} />}
            {item.dotIcon === "circle" && <View style={{ width: 6, height: 6, backgroundColor: "#fff", borderRadius: 4 }} />}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: item.dotColor, opacity: 0.85, borderRadius: 10, zIndex: -1 }]} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.roomContent}>
          <View style={styles.roomHeaderRow}>
            <View style={styles.roomNameGroup}>
              <Text style={styles.roomName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.status && (
                <View style={[styles.statusBadge, { backgroundColor: item.statusColor === "green" ? "#D1FAE5" : "#F3F4F6" }]}>
                  <Text style={[styles.statusBadgeText, { color: item.statusColor === "green" ? "#065F46" : colors.mutedForeground }]}>
                    {item.status}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          <Text style={styles.msgPreview} numberOfLines={1}>
            {item.message}
          </Text>

          {item.hasReplies && (
            <View style={styles.quickRepliesRow}>
              <Pressable style={styles.quickReplyBtn} onPress={() => Alert.alert("Reply Sent", "'Got it'")}>
                <Text style={styles.quickReplyText}>Got it</Text>
              </Pressable>
              <View style={styles.quickReplyDivider} />
              <Pressable style={styles.quickReplyBtn} onPress={() => Alert.alert("Reply Sent", "'No worries'")}>
                <Text style={styles.quickReplyText}>No worries</Text>
              </Pressable>
              <View style={styles.quickReplyDivider} />
              <Pressable style={styles.quickReplyIconBtn} onPress={() => Alert.alert("Mark Done")}>
                <Check size={14} color={colors.textSecondary} strokeWidth={3} />
              </Pressable>
              <Pressable style={styles.quickReplyIconBtn} onPress={() => Alert.alert("More Options")}>
                <MoreHorizontal size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <GuestAuthGate
      title="Your Messages"
      subtitle="Sign in to view conversations with hosts and renters."
      icon={<MessageCircle size={32} color={colors.primary} />}
    >
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* ─── CUSTOM HEADER ─── */}
        <View style={styles.header}>
          <View style={styles.headerLeftSpacer} />
          <Text style={styles.screenTitle}>Chat</Text>
          <Pressable style={styles.headerAddBtn} onPress={() => Alert.alert("New Chat", "Select a host or contact support.")}>
            <Plus size={20} color={colors.foreground} />
          </Pressable>
        </View>

        {/* ─── SEARCH BAR ─── */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View style={styles.filterBtn}>
              <View style={styles.filterLine} />
              <View style={[styles.filterLine, { width: 10 }]} />
              <View style={[styles.filterLine, { width: 4 }]} />
            </View>
          </View>
        </View>

        {/* ─── LIST VIEW ─── */}
        {isLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonList count={6} />
          </View>
        ) : (
          <FlatList
            data={filteredRooms}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={renderRoom}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                  <MessageCircle size={56} color={colors.primary} strokeWidth={1.5} />
                </View>
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptyText}>
                  When you contact hosts or renters, your conversations will appear here.
                </Text>
                <View style={styles.emptyActions}>
                  <PrimaryButton
                    label="Browse Listings"
                    onPress={() => navigateToExplore("ListingsExplore")}
                    size="lg"
                  />
                </View>
              </View>
            }
          />
        )}

        {/* ─── BOTTOM FLOATING PROMO ─── */}
        <Pressable style={styles.bottomPromoWrap} onPress={() => navigateToExplore("CreateListing")}>
          <LinearGradient
            colors={["#7C3AED", "#5B21B6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bottomPromoBg}
          >
            <Text style={styles.promoTitle}>+ Start Earning Today</Text>
            <Text style={styles.promoSub}>Earn up to SAR <Text style={{ fontWeight: "900" }}>500</Text>/week</Text>
          </LinearGradient>
        </Pressable>
      </SafeAreaView>
    </GuestAuthGate>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDFDFD" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: "#FDFDFD",
  },
  headerLeftSpacer: {
    width: 32,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
  },
  headerAddBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  // Search
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.foreground,
  },
  filterBtn: {
    width: 24,
    height: 24,
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 3,
  },
  filterLine: {
    height: 2,
    width: 14,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  // List
  skeletonWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 160,
    gap: 12,
  },

  // Card
  roomCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card,
    shadowOpacity: 0.05,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    gap: 12,
  },

  // Avatar
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.muted,
  },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  // Content
  roomContent: {
    flex: 1,
  },
  roomHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  roomNameGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roomName: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.mutedForeground,
  },
  msgPreview: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },

  // Quick Replies
  quickRepliesRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    gap: 8,
  },
  quickReplyBtn: {
    paddingHorizontal: 4,
  },
  quickReplyText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  quickReplyDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
  },
  quickReplyIconBtn: {
    paddingHorizontal: 4,
  },

  bottomPromoWrap: {
    position: "absolute",
    bottom: 24,
    left: spacing.md,
    right: spacing.md,
    ...shadows.cardHeavy,
    borderRadius: radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.3,
  },
  bottomPromoBg: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: radii.xl,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  promoSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  
  // Empty State
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
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
    fontSize: 22,
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
  },
  emptyActions: {
    marginTop: 32,
    width: "100%",
    paddingHorizontal: 40,
    alignItems: "center",
  },
});
