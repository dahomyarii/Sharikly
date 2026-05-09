import { CategoryChip } from "@/components/ui/CategoryChip";
import { FeaturedPromoCard } from "@/components/ui/FeaturedPromoCard";
import { ListingCard } from "@/components/ui/ListingCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SkeletonGrid } from "@/components/ui/SkeletonCard";
import { colors, radii, shadows, spacing, layout } from "@/core/theme/tokens";
import type { HomeStackParamList, MainTabParamList } from "@/navigation/types";
import { getCategories, getListings } from "@/services/api/endpoints/listings";
import { getTrendingSearches } from "@/services/api/endpoints/earnings";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { useAuthStore } from "@/store/authStore";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Bell,
  CalendarDays,
  Camera,
  Gamepad2,
  Headphones,
  Home as HomeIcon,
  MapPin,
  Search,
  Sparkles,
  Tent,
} from "lucide-react-native";
import React from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type HomeNav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, "Home">,
  BottomTabNavigationProp<MainTabParamList>
>;

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  camera: Camera,
  photo: Camera,
  headphone: Headphones,
  audio: Headphones,
  camp: Tent,
  tent: Tent,
  home: HomeIcon,
  house: HomeIcon,
  game: Gamepad2,
  console: Gamepad2,
};

function getCategoryIcon(name: string): React.ElementType {
  const n = name.toLowerCase();
  for (const [key, Icon] of Object.entries(CATEGORY_ICONS)) {
    if (n.includes(key)) return Icon;
  }
  return Search;
}

export function HomeScreen(): React.ReactElement {
  const navigation = useNavigation<HomeNav>();
  const [searchText] = React.useState("");
  const { hasSession } = useAuthStore();
  
  const userQ = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => axiosInstance.get(buildApiUrl("/auth/me/")).then((res: any) => res.data),
    enabled: hasSession,
  });
  const user = userQ.data;

  const firstName = user?.first_name || user?.username || "Guest";
  const avatarUrl = user?.avatar ? (user.avatar.startsWith("http") ? user.avatar : `${process.env.EXPO_PUBLIC_API_BASE?.replace("/api", "") || ""}${user.avatar}`) : null;

  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const listingsQ = useQuery({
    queryKey: ["listings", "home"],
    queryFn: () => getListings({ page_size: 12 }),
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

  const popularListings = listings.slice(0, 6);
  const exploreListings = listings.slice(6, 9);

  const trendingQ = useQuery({
    queryKey: ["earnings", "trending"],
    queryFn: () => getTrendingSearches(),
  });
  const trending: any[] = Array.isArray(trendingQ.data) ? trendingQ.data : [];

  const handleSearch = () => {
    navigation.navigate("ExploreTab", {
      screen: "ListingsExplore",
      params: searchText ? { search: searchText } : undefined,
    } as any);
  };

  const handleCategoryPress = (categoryId: number) => {
    navigation.navigate("ExploreTab", {
      screen: "ListingsExplore",
      params: { category: String(categoryId) },
    } as any);
  };

  const handleListingPress = (id: number) => {
    navigation.navigate("ExploreTab", {
      screen: "ListingDetail",
      params: { id },
    } as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ─── CUSTOM HEADER (Glassy) ─── */}
      <View style={styles.topHeader}>
        <View style={styles.headerLogoWrap}>
          <Image 
            source={require("../../../../assets/logo.png")} 
            style={styles.headerLogoImage} 
            resizeMode="contain"
          />
          <Text style={styles.headerLogoText}>EKRA</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable 
            style={styles.headerIconBtn}
            onPress={() => hasSession ? (navigation as any).navigate("ProfileTab", { screen: "Notifications" }) : (navigation as any).navigate("Auth", { screen: "Login" })}
          >
            <Bell size={22} color={colors.primary} />
            {hasSession && <View style={styles.notifDot} />}
          </Pressable>
          <Pressable 
            style={styles.avatarMini}
            onPress={() => navigation.navigate("ProfileTab")}
          >
            {hasSession && avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarImg, styles.avatarFallback]}>
                <Text style={styles.avatarFallbackText}>
                  {hasSession ? firstName?.charAt(0).toUpperCase() : "👤"}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HERO IMAGE ─── */}
        <View style={styles.heroWrap}>
          <ImageBackground
            source={require("../../../../assets/images/hero_canyon.png")}
            style={styles.heroBg}
            imageStyle={{ borderRadius: radii.xl }}
          >
            <LinearGradient
              colors={["transparent", "rgba(12, 8, 30, 0.7)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>
                {hasSession ? `Hey ${firstName} 👋` : "Welcome to Ekra 👋"}
              </Text>
              <Text style={styles.heroSubtitle}>What do you want to rent today?</Text>

              {/* Search Pill overlay */}
              <Pressable style={styles.heroSearchPill} onPress={handleSearch}>
                <Search size={20} color="#6B7280" />
                <Text style={styles.heroSearchText}>
                  Search cameras, gear, tools...
                </Text>
              </Pressable>

              {/* Filters overlay */}
              <View style={styles.heroFilters}>
                <Pressable 
                  style={styles.filterPill}
                  onPress={() => navigation.navigate("ExploreTab", { screen: "ListingsExplore" } as any)}
                >
                  <MapPin size={14} color={colors.primary} />
                  <Text style={styles.filterPillText}>Near me ▾</Text>
                </Pressable>
                <Pressable 
                  style={styles.filterPill}
                  onPress={() => navigation.navigate("ExploreTab", { screen: "ListingsExplore" } as any)}
                >
                  <CalendarDays size={14} color={colors.primary} />
                  <Text style={styles.filterPillText}>Any date ▾</Text>
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </View>

              {/* Category chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryScrollContent}
              >
                {categories.slice(0, 5).map((cat: any) => {
                  const Icon = getCategoryIcon(cat.name);
                  return (
                    <CategoryChip
                      key={cat.id}
                      label={cat.name}
                      icon={<Icon size={16} color={colors.foreground} />}
                      onPress={() => handleCategoryPress(cat.id)}
                    />
                  );
                })}
                <CategoryChip label="More ›" onPress={() => navigation.navigate("ExploreTab", { screen: "ListingsExplore" } as any)} />
              </ScrollView>

        {/* ─── FEATURED CANON PROMO ─── */}
        <FeaturedPromoCard 
          onPress={() => navigation.navigate("ExploreTab", { screen: "ListingsExplore" } as any)}
          onBookNow={() => navigation.navigate("ExploreTab", { screen: "ListingsExplore", params: { search: "Canon" } } as any)}
        />

        {/* ─── POPULAR NEAR YOU ─── */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Popular near you</Text>
          {listingsQ.isPending ? (
            <SkeletonGrid count={2} />
          ) : (
            <View style={styles.grid}>
              {popularListings.slice(0, 2).map((listing: any) => (
                <View key={listing.id} style={styles.gridItem}>
                  <ListingCard
                    listing={listing}
                    onPress={() => handleListingPress(listing.id)}
                  />
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* ─── PEOPLE ALSO RENTED ─── */}
        {exploreListings.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
            <Text style={styles.sectionTitle}>People also rented</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalCardScroll}
            >
              {exploreListings.map((listing: any) => (
                <Pressable
                  key={listing.id}
                  style={styles.smallCard}
                  onPress={() => handleListingPress(listing.id)}
                >
                  <Image
                    source={{ uri: listing.images?.[0]?.image ?? "https://via.placeholder.com/150" }}
                    style={styles.smallCardImg}
                  />
                  <Text style={styles.smallCardTitle} numberOfLines={1}>
                    {listing.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ─── PEOPLE ARE LOOKING FOR ─── */}
        {trending.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>People are looking for</Text>
          <View style={styles.requestsCard}>
            <View style={styles.requestsList}>
              {trending.slice(0, 3).map((item: any, i: number) => {
                  const Icon = getCategoryIcon(item.name || "");
                  return (
                    <View key={item.id ?? i} style={styles.requestItem}>
                      <Icon size={16} color={colors.primary} />
                      <Text style={styles.requestText}>
                        <Text style={styles.requestTextBold}>{item.name}</Text> · {item.booking_count ?? 0} requests
                      </Text>
                    </View>
                  );
                })}
            </View>
            <View style={styles.requestBtnWrap}>
              <PrimaryButton
                label="List yours & earn"
                onPress={() => navigation.navigate("ExploreTab", { screen: "CreateListing" } as any)}
                size="sm"
              />
            </View>
          </View>
        </Animated.View>
        )}

        {/* ─── BOTTOM PROMO HERO ─── */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.section}>
          <LinearGradient
            colors={["#7C3AED", "#5B21B6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomPromo}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.bottomPromoTitle}>Ready to Earn?</Text>
              <Text style={styles.bottomPromoSub}>
                List your camera, tools, or gear & earn extra income!
              </Text>
            </View>
            <Pressable
              style={styles.bottomPromoBtn}
              onPress={() => navigation.navigate("ExploreTab", { screen: "CreateListing" } as any)}
            >
              <Text style={styles.bottomPromoBtnText}>List Your Item</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>

        {/* System Padding for Tab Bar */}
        <View style={{ height: layout.tabBarHeight + 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { flexGrow: 1 },

  // Header
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(249, 248, 255, 0.94)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124, 58, 237, 0.08)",
  },
  headerLogoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLogoImage: {
    width: 32,
    height: 32,
  },
  headerLogoText: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.destructive,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },

  // Hero Image
  heroWrap: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radii.xl,
    overflow: "hidden",
    ...shadows.card,
  },
  heroBg: {
    minHeight: 280,
    justifyContent: "flex-end",
  },
  heroContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.95)",
    marginBottom: spacing.md,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroSearchPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: radii.full,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  heroSearchText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  heroFilters: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: radii.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.foreground,
  },

  // Category Scroll
  categoryScroll: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryScrollContent: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },

  // Generic Sections
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: spacing.md,
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
  },

  // Horizontal Scroll
  horizontalCardScroll: {
    gap: 12,
    paddingRight: spacing.md,
  },
  smallCard: {
    width: 140,
    backgroundColor: "#FFF",
    borderRadius: radii.lg,
    padding: spacing.xs,
    ...shadows.card,
    borderWidth: 1,
    borderColor: "rgba(120,80,220,0.05)",
  },
  smallCardImg: {
    width: "100%",
    height: 90,
    borderRadius: radii.md,
    marginBottom: 8,
  },
  smallCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
    paddingHorizontal: 4,
  },

  // Requests block
  requestsCard: {
    backgroundColor: "#F8F5FF",
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.08)",
  },
  requestsList: {
    gap: 12,
    marginBottom: spacing.md,
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requestText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  requestTextBold: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  requestBtnWrap: {
    alignItems: "flex-end",
  },

  // Bottom Promo
  bottomPromo: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.xl,
    padding: spacing.md,
    paddingVertical: 20,
    ...shadows.cardHeavy,
  },
  bottomPromoTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  bottomPromoSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 16,
  },
  bottomPromoBtn: {
    backgroundColor: "#FFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.full,
  },
  bottomPromoBtnText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 13,
  },
});

