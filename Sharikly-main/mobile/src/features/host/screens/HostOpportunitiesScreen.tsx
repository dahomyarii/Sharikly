import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { getLocalRequests, getTrendingSearches } from "@/services/api/endpoints/earnings";
import type { HostStackParamList, MainTabParamList } from "@/navigation/types";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Camera, ChevronRight, Flame, MapPin, TrendingUp } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HostStackParamList, "HostOpportunities">,
  BottomTabNavigationProp<MainTabParamList>
>;

export function HostOpportunitiesScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  const localQ = useQuery({
    queryKey: ["earnings", "local-requests"],
    queryFn: () => getLocalRequests(),
  });

  const trendQ = useQuery({
    queryKey: ["earnings", "trending"],
    queryFn: () => getTrendingSearches(),
  });

  const localRequests: any[] = Array.isArray(localQ.data) ? localQ.data : [];
  const trending: any[] = Array.isArray(trendQ.data) ? trendQ.data : [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Opportunities</Text>
        <Text style={styles.screenSub}>
          Discover what renters want in your area
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Local Requests */}
        <View style={styles.sectionHeader}>
          <Flame size={16} color="#F97316" />
          <Text style={styles.sectionTitle}>Local Rental Requests</Text>
        </View>
        <Text style={styles.sectionSub}>
          Items being searched in your area. List these to earn!
        </Text>

        {localQ.isPending ? (
          <Text style={styles.mutedText}>Loading local requests…</Text>
        ) : localRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No local requests yet. Check back soon!</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {localRequests.map((req: any, i: number) => (
              <View key={req.id ?? i} style={[styles.requestRow, i < localRequests.length - 1 && styles.requestDivider]}>
                <View style={styles.requestIcon}>
                  <Camera size={14} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestTitle} numberOfLines={1}>{req.title}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <MapPin size={10} color={colors.mutedForeground} />
                    <Text style={styles.requestMeta}>
                      {req.city ?? ""} • SAR {parseFloat(req.price_per_day ?? "0").toFixed(0)}/day • {req.booking_count ?? 0} bookings
                    </Text>
                  </View>
                </View>
                <TrendingUp size={16} color={colors.success} />
              </View>
            ))}
          </View>
        )}

        {/* Trending Searches */}
        <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
          <TrendingUp size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Trending Searches</Text>
        </View>
        <Text style={styles.sectionSub}>
          Categories with the most search activity on Ekra
        </Text>

        {trendQ.isPending ? (
          <Text style={styles.mutedText}>Loading trending searches…</Text>
        ) : trending.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No trending data available.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {trending.map((item: any, i: number) => (
              <Pressable
                key={item.id ?? i}
                style={[styles.trendRow, i < trending.length - 1 && styles.requestDivider]}
                onPress={() =>
                  navigation.navigate("ExploreTab", {
                    screen: "ListingsExplore",
                  } as any)
                }
              >
                <View style={styles.trendEmoji}>
                  <Text style={{ fontSize: 16 }}>{item.icon || "🔍"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trendName}>{item.name}</Text>
                  <Text style={styles.trendCount}>{item.booking_count ?? 0} bookings</Text>
                </View>
                <ChevronRight size={14} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        )}

        {/* CTA to create listing */}
        <Pressable
          style={styles.ctaBtn}
          onPress={() => navigation.navigate("ExploreTab", { screen: "CreateListing" } as any)}
        >
          <Text style={styles.ctaBtnText}>+ List an Item to Capitalize on These Trends</Text>
        </Pressable>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3EDFF" },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: "rgba(249,248,255,0.97)",
  },
  screenTitle: { fontSize: 26, fontWeight: "900", color: colors.foreground, letterSpacing: -0.5 },
  screenSub: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  scrollContent: { padding: spacing.md },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.foreground },
  sectionSub: { fontSize: 13, color: colors.mutedForeground, marginBottom: 12, lineHeight: 18 },

  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
    marginBottom: spacing.sm,
  },
  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  emptyText: { fontSize: 13, color: colors.mutedForeground, textAlign: "center" },

  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  requestDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  requestIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  requestTitle: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  requestMeta: { fontSize: 11, color: colors.mutedForeground },

  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  trendEmoji: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  trendName: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  trendCount: { fontSize: 11, color: colors.mutedForeground },

  ctaBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.md,
    ...shadows.fab,
  },
  ctaBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  mutedText: { ...typography.body, color: colors.mutedForeground, marginBottom: 12 },
});
