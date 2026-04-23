import { ListingCard } from "@/components/ui/ListingCard";
import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { getFavorites, removeFavorite } from "@/services/api/endpoints/favorites";
import type { ProfileStackParamList, MainTabParamList } from "@/navigation/types";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Bookmark, Heart } from "lucide-react-native";
import React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, "Favorites">,
  BottomTabNavigationProp<MainTabParamList>
>;

export function FavoritesScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const q = useQuery({
    queryKey: ["favorites"],
    queryFn: () => getFavorites(),
  });

  const removeMutation = useMutation({
    mutationFn: (listingId: number) => removeFavorite(listingId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });

  const rawFavorites = q.data;
  const favorites: any[] = Array.isArray(rawFavorites)
    ? rawFavorites
    : (rawFavorites as any)?.results ?? [];

  // Favorites may come as { id, listing: {...} } or direct listing objects
  const listings = favorites.map((f: any) => f.listing ?? f).filter(Boolean);

  const navigateToExplore = (screen: "ListingsExplore" | "ListingDetail", params?: Record<string, unknown>) => {
    const parent = (navigation as any).getParent?.();
    if (parent) {
      parent.navigate("ExploreTab", { screen, ...(params ? { params } : {}) });
      return;
    }
    (navigation as any).navigate("ExploreTab", { screen, ...(params ? { params } : {}) });
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.gridItem}>
        <View style={{ position: "relative" }}>
          <ListingCard
            listing={item}
            onPress={() =>
              navigateToExplore("ListingDetail", { id: item.id })
            }
          />
          <Pressable
            style={styles.heartBtn}
            onPress={() => removeMutation.mutate(item.id)}
            hitSlop={8}
          >
            <Heart size={16} fill={colors.primary} color={colors.primary} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Bookmark size={20} color={colors.primary} />
        <Text style={styles.screenTitle}>Saved Favorites</Text>
      </View>

      {q.isPending ? (
        <View style={styles.center}>
          <Text style={styles.mutedText}>Loading favorites…</Text>
        </View>
      ) : q.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load favorites.</Text>
          <Pressable onPress={() => void q.refetch()} style={{ marginTop: 12 }}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Heart size={56} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>No saved favorites yet</Text>
          <Text style={styles.emptyText}>
            Tap the heart icon on any listing to save it here for later.
          </Text>
          <View style={styles.emptyActions}>
            <PrimaryButton
              label="Find items to love"
              onPress={() => navigateToExplore("ListingsExplore")}
              size="lg"
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  screenTitle: { fontSize: 24, fontWeight: "900", color: colors.foreground, letterSpacing: -0.5 },
  gridContent: { padding: spacing.md, paddingBottom: 100 },
  row: { gap: 10 },
  gridItem: { flex: 1, position: "relative" },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  mutedText: { ...typography.body, color: colors.mutedForeground },
  errorText: { ...typography.body, color: colors.destructive },
  retryText: { ...typography.body, color: colors.primary, fontWeight: "600" },
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
