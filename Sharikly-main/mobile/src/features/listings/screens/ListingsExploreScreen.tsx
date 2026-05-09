import { ListingCard } from "@/components/ui/ListingCard";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { SkeletonGrid } from "@/components/ui/SkeletonCard";
import { colors, radii, spacing, typography, layout, shadows } from "@/core/theme/tokens";
import type { ListingsStackParamList } from "@/navigation/types";
import { getCategories, getListings } from "@/services/api/endpoints/listings";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import {
  Camera,
  Headphones,
  Home as HomeIcon,
  Search,
  Tent,
  Inbox as EmptyIcon,
} from "lucide-react-native";
import React, { useState, useRef } from "react";
import AnimatedReanimated, { FadeInRight, FadeInDown } from "react-native-reanimated";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Nav = NativeStackNavigationProp<ListingsStackParamList, "ListingsExplore">;
type R = RouteProp<ListingsStackParamList, "ListingsExplore">;

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  camera: Camera, photo: Camera, headphone: Headphones,
  audio: Headphones, camp: Tent, tent: Tent, home: HomeIcon,
};
function getCategoryIcon(name: string): React.ElementType {
  const n = name.toLowerCase();
  for (const [key, Icon] of Object.entries(CATEGORY_ICONS)) {
    if (n.includes(key)) return Icon;
  }
  return Search;
}

export function ListingsExploreScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const [searchText, setSearchText] = useState(route.params?.search ?? "");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const listingsQ = useQuery({
    queryKey: ["listings", "explore", searchText, activeCategory],
    queryFn: () =>
      getListings({
        ...(searchText ? { search: searchText } : {}),
        ...(activeCategory ? { category: String(activeCategory) } : {}),
      }),
  });

  const listings: any[] = listingsQ.data
    ? Array.isArray(listingsQ.data)
      ? listingsQ.data
      : (listingsQ.data as any)?.results ?? []
    : [];

  const categories: any[] = categoriesQ.data
    ? Array.isArray(categoriesQ.data)
      ? categoriesQ.data
      : (categoriesQ.data as any)?.results ?? []
    : [];

  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTopInset = Math.max(insets.top, 20) + spacing.sm;
  const headerHeight = headerTopInset + 108;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, -60],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.safe}>
      {/* Header / Search bar (Glassy) */}
      <Animated.View style={[styles.headerContainer, { transform: [{ translateY: headerTranslateY }] }]}>
        <BlurView tint="light" intensity={80} style={[styles.header, { paddingTop: headerTopInset }]}>
        <AnimatedReanimated.View entering={FadeInDown.springify().damping(15)} style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Search size={18} color={colors.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search items or location..."
              placeholderTextColor={colors.mutedForeground}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={() => listingsQ.refetch()}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </AnimatedReanimated.View>

        {/* Category chips */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
            style={styles.chips}
          >
            <CategoryChip
              label="All"
              active={activeCategory === null}
              onPress={() => setActiveCategory(null)}
            />
            {categories.slice(0, 12).map((cat: any, index: number) => {
              const Icon = getCategoryIcon(cat.name);
              return (
                <AnimatedReanimated.View key={cat.id} entering={FadeInRight.delay(index * 50).springify()}>
                  <CategoryChip
                    label={cat.name}
                    icon={<Icon size={13} color={activeCategory === cat.id ? "#fff" : colors.primary} />}
                    active={activeCategory === cat.id}
                    onPress={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  />
                </AnimatedReanimated.View>
              );
            })}
          </ScrollView>
        )}
        </BlurView>
      </Animated.View>

      {/* Listings grid */}
      {listingsQ.isPending ? (
        <View style={[styles.skeletonWrap, { paddingTop: headerHeight + spacing.md }]}>
          <SkeletonGrid count={6} />
        </View>
      ) : listingsQ.isError ? (
        <View style={[styles.emptyWrap, { paddingTop: headerHeight + spacing.md }]}>
          <Text style={styles.emptyText}>Failed to load listings.</Text>
          <Pressable onPress={() => void listingsQ.refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : listings.length === 0 ? (
        <View style={[styles.emptyWrap, { paddingTop: headerHeight + spacing.md }]}>
          <View style={styles.emptyIconWrap}>
            <EmptyIcon size={48} color={colors.mutedForeground} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyText}>Try a different search or browse another category.</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={listings}
          keyExtractor={(item: any) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.gridContent, { paddingTop: headerHeight + spacing.md }]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews={true}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          renderItem={({ item, index }: { item: any; index: number }) => (
            <View style={styles.gridItem}>
              <ListingCard
                listing={item}
                index={index}
                onPress={() => navigation.navigate("ListingDetail", { id: item.id })}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124, 58, 237, 0.08)",
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.15)",
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    ...shadows.card,
    shadowOpacity: 0.05,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  chips: { marginBottom: 4 },
  chipsContent: { gap: 8, paddingBottom: 2 },
  skeletonWrap: { paddingHorizontal: spacing.md },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { ...typography.heading, color: colors.foreground, marginBottom: 8 },
  emptyText: { ...typography.body, color: colors.mutedForeground, textAlign: "center", maxWidth: 240 },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
  retryText: { ...typography.body, color: "#fff", fontWeight: "700" },
  row: { gap: 10 },
  gridContent: { 
    padding: spacing.md, 
    paddingBottom: layout.tabBarHeight + 40 
  },
  gridItem: { flex: 1 },
});
