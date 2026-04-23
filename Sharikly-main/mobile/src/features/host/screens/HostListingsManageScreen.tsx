import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { getListings } from "@/services/api/endpoints/listings";
import type { ProfileStackParamList, MainTabParamList } from "@/navigation/types";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { Edit3, Package, Plus, Trash2, ToggleLeft } from "lucide-react-native";
import React from "react";
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
import { LinearGradient } from "expo-linear-gradient";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, "HostArea">,
  BottomTabNavigationProp<MainTabParamList>
>;

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";

function getImageUrl(path: string | undefined) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_BASE.replace("/api", "")}${path}`;
}

export function HostListingsManageScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const q = useQuery({
    queryKey: ["listings", "mine"],
    queryFn: () => getListings({ mine: 1 }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      axiosInstance.patch(buildApiUrl(`/listings/${id}/`), { is_active: isActive }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["listings", "mine"] }),
    onError: () => Alert.alert("Failed to update listing."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(buildApiUrl(`/listings/${id}/`)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["listings", "mine"] }),
    onError: () => Alert.alert("Failed to delete listing."),
  });

  const listings: any[] = q.data
    ? Array.isArray(q.data)
      ? q.data
      : (q.data as any)?.results ?? []
    : [];

  const renderItem = ({ item }: { item: any }) => {
    const imageUrl = item.images?.[0] ? getImageUrl(item.images[0].image) : null;
    const isActive = item.is_active !== false;

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]}>
              <Package size={20} color={colors.mutedForeground} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.listingPrice}>SAR {item.price_per_day}/day</Text>
            <View style={[styles.statusChip, { backgroundColor: isActive ? "#D1FAE5" : "#F3F4F6" }]}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: isActive ? "#065F46" : "#6B7280" }}>
                {isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => navigation.navigate("ExploreTab", { screen: "EditListing", params: { id: item.id } } as any)}
          >
            <Edit3 size={14} color={colors.primary} />
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() =>
              toggleMutation.mutate({ id: item.id, isActive: !isActive })
            }
          >
            <ToggleLeft size={14} color={isActive ? colors.mutedForeground : colors.success} />
            <Text style={[styles.actionText, { color: isActive ? colors.mutedForeground : colors.success }]}>
              {isActive ? "Deactivate" : "Activate"}
            </Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() =>
              Alert.alert("Delete Listing", "Are you sure? This cannot be undone.", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => deleteMutation.mutate(item.id),
                },
              ])
            }
          >
            <Trash2 size={14} color={colors.destructive} />
            <Text style={[styles.actionText, { color: colors.destructive }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>My Listings</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => navigation.navigate("ExploreTab", { screen: "CreateListing" } as any)}
        >
          <LinearGradient colors={["#9356F5", "#6D28D9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addBtnGradient}>
            <Plus size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add Item</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {q.isPending ? (
        <View style={styles.center}>
          <Text style={styles.mutedText}>Loading your listings…</Text>
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.center}>
          <Package size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No listings yet</Text>
          <Text style={styles.emptyText}>Add your first item to start earning on Ekra.</Text>
          <Pressable
            style={styles.emptyBtn}
            onPress={() => navigation.navigate("ExploreTab", { screen: "CreateListing" } as any)}
          >
            <Text style={styles.emptyBtnText}>Add Item</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3EDFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: "rgba(249,248,255,0.97)",
  },
  screenTitle: { fontSize: 22, fontWeight: "900", color: colors.foreground, letterSpacing: -0.5 },
  addBtn: { borderRadius: radii.xl, overflow: "hidden" },
  addBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  list: { padding: spacing.md, paddingBottom: 100 },
  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  cardRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  thumb: { width: 64, height: 64, borderRadius: radii.md, backgroundColor: colors.muted },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  listingTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 4 },
  listingPrice: { fontSize: 13, color: colors.mutedForeground, marginBottom: 6 },
  statusChip: {
    alignSelf: "flex-start",
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
  },
  actionText: { fontSize: 11, fontWeight: "600", color: colors.primary },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  mutedText: { ...typography.body, color: colors.mutedForeground },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.foreground },
  emptyText: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700" },
});
