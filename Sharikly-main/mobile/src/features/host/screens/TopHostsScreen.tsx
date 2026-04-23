import { colors, radii, spacing } from "@/core/theme/tokens";
import { getPublicEarnings } from "@/services/api/endpoints/earnings";
import { useQuery } from "@tanstack/react-query";
import { Star, Trophy, Award } from "lucide-react-native";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
function formatSar(v: string | number | undefined) {
  if (!v && v !== 0) return "SAR 0";
  const n = parseFloat(String(v));
  if (isNaN(n)) return "SAR 0";
  if (n >= 1000) return `SAR ${(n / 1000).toFixed(1)}k`;
  return `SAR ${n.toFixed(0)}`;
}

export function TopHostsScreen(): React.ReactElement {

  const q = useQuery({
    queryKey: ["earnings", "public"],
    queryFn: () => getPublicEarnings(),
  });

  const data: any = q.data;
  const topEarners: any[] = data?.top_earners ?? data?.leaderboard ?? [];

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const initial = (item.username ?? item.name ?? "H").charAt(0).toUpperCase();
    const rankColors = ["#F59E0B", "#9CA3AF", "#B45309"];

    return (
      <View style={[styles.hostCard, index < topEarners.length - 1 && styles.hostDivider]}>
        <View style={[styles.rankBadge, { backgroundColor: rankColors[index] ?? colors.muted }]}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarLetter}>{initial}</Text>
        </View>
        <View style={styles.hostInfo}>
          <Text style={styles.hostName} numberOfLines={1}>
            {item.username ?? item.name ?? `Top Host #${index + 1}`}
          </Text>
          {item.city && <Text style={styles.hostCity}>{item.city}</Text>}
          <View style={styles.ratingRow}>
            <Star size={11} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>{(item.rating ?? 5).toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.earnings}>{formatSar(item.total_earnings ?? item.earnings)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Hero gradient */}
      <LinearGradient
        colors={["#9356F5", "#6D28D9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.heroIcon}>
          <Trophy size={28} color="#F59E0B" />
        </View>
        <Text style={styles.heroTitle}>Top Hosts</Text>
        <Text style={styles.heroSub}>
          Our highest-earning hosts on Ekra this month
        </Text>
      </LinearGradient>

      {q.isPending ? (
        <View style={styles.center}>
          <Text style={{ color: colors.mutedForeground }}>Loading top hosts…</Text>
        </View>
      ) : topEarners.length === 0 ? (
        <View style={styles.center}>
          <Award size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptyText}>Be the first to top the leaderboard!</Text>
        </View>
      ) : (
        <FlatList
          data={topEarners.slice(0, 20)}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          ListHeaderComponent={
            <Text style={styles.listLabel}>Leaderboard</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  heroGradient: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 28,
    alignItems: "center",
    gap: 6,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: { fontSize: 26, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", textAlign: "center" },
  listContent: { padding: spacing.md, paddingBottom: 80 },
  listLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  hostCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  hostDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontSize: 11, fontWeight: "800", color: "#fff" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: "#fff", fontWeight: "700", fontSize: 17 },
  hostInfo: { flex: 1 },
  hostName: { fontSize: 14, fontWeight: "700", color: colors.foreground },
  hostCity: { fontSize: 11, color: colors.mutedForeground },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  ratingText: { fontSize: 11, fontWeight: "600", color: "#D97706" },
  earnings: { fontSize: 14, fontWeight: "800", color: colors.primary },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: colors.foreground },
  emptyText: { fontSize: 13, color: colors.mutedForeground, textAlign: "center" },
});
