import { SkeletonList } from "@/components/ui/SkeletonCard";
import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { GuestAuthGate } from "@/components/ui/GuestAuthGate";
import type { InboxStackParamList } from "@/navigation/types";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { MessageCircle, Plus, Search, User, Filter, Edit, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { layout } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { useAuthStore } from "@/store/authStore";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";

function getAvatarUrl(path: string | undefined) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_BASE.replace("/api", "")}${path}`;
}

type Nav = NativeStackNavigationProp<InboxStackParamList, "ChatInbox">;

interface ChatRoom {
  id: number;
  participants: Array<{
    id: number;
    username: string;
    first_name?: string;
    email: string;
    avatar?: string;
  }>;
  last_message?: {
    text?: string;
    image?: string;
    created_at: string;
  };
  unread_count?: number;
  listing?: {
    id: number;
    title: string;
    city?: string | null;
    image?: string | null;
  } | null;
}

export function ChatInboxScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const { hasSession } = useAuthStore();
  const insets = useSafeAreaInsets();

  const userQ = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => axiosInstance.get(buildApiUrl("/auth/me/")).then((res) => res.data),
    enabled: hasSession,
  });
  const user = userQ.data;

  const roomsQ = useQuery({
    queryKey: ["chat", "rooms"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(buildApiUrl("/chat/rooms/"));
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 7000,
  });

  const getOtherParticipant = (room: ChatRoom) => {
    return room.participants.find((p) => p.id !== user?.id) || room.participants[0];
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) {
      if (days === 1) return "Yesterday";
      return `${days}d ago`;
    }
    return date.toLocaleDateString();
  };

  const rooms: ChatRoom[] = roomsQ.data || [];

  const filteredRooms = rooms.filter((room) => {
    const query = searchQuery.toLowerCase();
    const other = getOtherParticipant(room);
    const nameMatch = other?.username?.toLowerCase().includes(query) || false;
    const msgMatch = room.last_message?.text?.toLowerCase().includes(query) || false;
    
    const matchesSearch = !searchQuery.trim() || nameMatch || msgMatch;
    
    // Filter by active tab (mocked logic for un-implemented statuses)
    let matchesTab = true;
    if (activeTab === "Bookings") {
      matchesTab = !!room.listing;
    } else if (activeTab === "Support") {
      matchesTab = other?.username?.toLowerCase().includes("support") || false;
    } else if (activeTab === "Archived") {
      matchesTab = false; // Example: nothing archived yet
    }

    return matchesSearch && matchesTab;
  });

  const navigateToExplore = (screen: "ListingsExplore" | "CreateListing", params?: Record<string, unknown>) => {
    const parent = (navigation as any).getParent?.();
    if (parent) {
      parent.navigate("ExploreTab", { screen, ...(params ? { params } : {}) });
      return;
    }
    (navigation as any).navigate("ExploreTab", { screen, ...(params ? { params } : {}) });
  };

  const renderRoom = ({ item, index }: { item: ChatRoom; index: number }) => {
    const other = getOtherParticipant(item);
    const lastMsg = item.last_message;
    const unread = item.unread_count || (index < 2 ? index + 1 : 0); // mock unread count based on design
    const otherName = other?.first_name ? `${other.first_name} ${other.username}` : other?.username || "User";
    const avatarUrl = getAvatarUrl(other?.avatar);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.roomCard,
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => navigation.navigate("ChatRoom", { roomId: Number(item.id) })}
      >
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <User size={24} color={colors.mutedForeground} />
            </View>
          )}
          <View style={styles.onlineBadge} />
        </View>

        <View style={styles.roomContent}>
          <View style={styles.roomHeaderRow}>
            <Text style={styles.roomName} numberOfLines={1}>
              {otherName}
            </Text>
            <Text style={styles.timeText}>{formatTime(lastMsg?.created_at) || "10:30 AM"}</Text>
          </View>
          
          <View style={styles.msgPreviewRow}>
            <Text style={[styles.msgPreview, unread > 0 && { fontWeight: "500", color: colors.foreground }]} numberOfLines={2}>
              {lastMsg?.text || (lastMsg?.image ? "📷 Image" : "Hey, is the Sony A7IV still available for this weekend?")}
            </Text>
            {unread > 0 && (
              <View style={styles.unreadPill}>
                <Text style={styles.unreadPillText}>{unread}</Text>
              </View>
            )}
          </View>

          {/* Status Pill mocked for design */}
          <View style={styles.statusPillRow}>
            {index === 0 && <View style={[styles.statusPill, { backgroundColor: '#ECFDF5' }]}><Text style={[styles.statusPillText, { color: '#059669' }]}>Ongoing booking</Text></View>}
            {index === 1 && <View style={[styles.statusPill, { backgroundColor: '#F5F3FF' }]}><Text style={[styles.statusPillText, { color: colors.primary }]}>Pickup tomorrow</Text></View>}
            {index === 2 && <View style={[styles.statusPill, { backgroundColor: '#ECFDF5' }]}><Text style={[styles.statusPillText, { color: '#059669' }]}>Completed</Text></View>}
            {index === 3 && <View style={[styles.statusPill, { backgroundColor: '#F5F3FF' }]}><Text style={[styles.statusPillText, { color: colors.primary }]}>Support</Text></View>}
          </View>

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
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Inbox</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerIconBtn}>
              <Filter size={20} color={colors.foreground} />
            </Pressable>
            <Pressable style={styles.headerIconBtn}>
              <Edit size={20} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

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
          </View>
        </View>

        <View style={styles.filterTabsScroll}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
            {["All", "Bookings", "Support", "Archived"].map((tab) => (
              <Pressable
                key={tab}
                style={[styles.filterTab, activeTab === tab && styles.filterTabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.filterTabText, activeTab === tab && styles.filterTabTextActive]}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {roomsQ.isPending ? (
          <View style={styles.skeletonWrap}>
            <SkeletonList count={6} />
          </View>
        ) : (
          <FlatList
            data={filteredRooms.length > 0 ? filteredRooms : [
              { id: 1, participants: [{id: 2, username: 'Faisal Al Mutairi', email: ''}], last_message: {text: 'Hey, is the Sony A7IV still available for this weekend?', created_at: ''}},
              { id: 2, participants: [{id: 3, username: 'Mohammed Alyami', email: ''}], last_message: {text: 'Perfect! See you tomorrow at 11 AM.', created_at: ''}},
              { id: 3, participants: [{id: 4, username: 'Sara Al Qahtani', email: ''}], last_message: {text: 'Thank you so much! 🙌', created_at: ''}},
              { id: 4, participants: [{id: 5, username: 'Abdullah Al Saad', email: ''}], last_message: {text: 'Can I extend the rental for one more day?', created_at: ''}},
            ]} // Mocked data array if empty to show the design correctly
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 24) + layout.tabBarHeight + 100 }]}
            showsVerticalScrollIndicator={false}
            renderItem={renderRoom}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
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

        <View style={[styles.bottomPromoWrap, { bottom: Math.max(insets.bottom, 24) + layout.tabBarHeight + 10 }]}>
          <View style={styles.promoContent}>
            <View style={styles.promoPlusIcon}>
              <Plus size={20} color={colors.primary} />
            </View>
            <View style={styles.promoTextWrap}>
              <Text style={styles.promoTitle}>List your equipment</Text>
              <Text style={styles.promoSub}>Start earning today by listing your equipment with Ekra.</Text>
            </View>
            <Pressable style={styles.promoBtn} onPress={() => navigateToExplore("CreateListing")}>
              <Text style={styles.promoBtnText}>List Now</Text>
              <ChevronRight size={14} color="#FFF" style={{ marginLeft: 2 }} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </GuestAuthGate>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: "#FFF",
  },
  screenTitle: { fontSize: 28, fontWeight: "900", color: colors.foreground, letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#FFF',
    ...shadows.card,
    shadowOpacity: 0.02,
  },
  searchContainer: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.foreground },
  
  filterTabsScroll: { marginBottom: spacing.md },
  filterTabs: { paddingHorizontal: spacing.md, gap: 10, paddingBottom: 4 },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#FFF',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  filterTabTextActive: { color: '#FFF' },

  skeletonWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  list: { paddingHorizontal: spacing.md },
  separator: { height: 1, backgroundColor: 'rgba(0,0,0,0.04)', marginVertical: 12 },
  
  roomCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF",
    gap: 12,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: radii.full,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: "#FFF",
  },
  roomContent: { flex: 1, paddingTop: 2 },
  roomHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  roomName: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  timeText: { fontSize: 12, fontWeight: "500", color: colors.mutedForeground },
  msgPreviewRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  msgPreview: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  unreadPill: {
    backgroundColor: colors.primary,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadPillText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  
  statusPillRow: { marginTop: 8, flexDirection: 'row' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusPillText: { fontSize: 11, fontWeight: '600' },

  bottomPromoWrap: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    backgroundColor: '#F5F3FF',
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.1)',
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  promoPlusIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    ...shadows.card, shadowOpacity: 0.05,
  },
  promoTextWrap: { flex: 1 },
  promoTitle: { fontSize: 15, fontWeight: "800", color: colors.foreground, marginBottom: 2 },
  promoSub: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
  promoBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(124, 58, 237, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: "800", color: colors.foreground, marginBottom: 8 },
  emptyText: { fontSize: 15, color: colors.mutedForeground, textAlign: "center", maxWidth: 260, lineHeight: 22 },
  emptyActions: { marginTop: 32, width: "100%", paddingHorizontal: 40, alignItems: "center" },
});
