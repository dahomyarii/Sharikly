import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { getPublicEarnings } from "@/services/api/endpoints/earnings";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Trophy, Users, Wallet } from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// type Nav = NativeStackNavigationProp<HostStackParamList, "CommunityEarnings">;

function formatSar(value: string | number | undefined) {
  if (value === undefined || value === null) return "SAR 0";
  const n = parseFloat(String(value));
  if (isNaN(n)) return "SAR 0";
  if (n >= 1000000) return `SAR ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `SAR ${(n / 1000).toFixed(1)}k`;
  return `SAR ${n.toFixed(0)}`;
}

export function CommunityEarningsScreen(): React.ReactElement {

  const q = useQuery({
    queryKey: ["earnings", "public"],
    queryFn: () => getPublicEarnings(),
  });

  const data: any = q.data;

  const totalEarnings = data?.total_earnings ?? data?.community_total ?? "0";
  const totalHosts = data?.total_hosts ?? data?.lessors_count ?? 0;
  const topEarners: any[] = data?.top_earners ?? data?.leaderboard ?? [];
  const avgEarnings = data?.average_earnings ?? null;

  const statCards = [
    {
      label: "Total Community Earnings",
      value: formatSar(totalEarnings),
      icon: Wallet,
      bg: "#EDE9FE",
      color: colors.primary,
    },
    {
      label: "Active Hosts",
      value: `${totalHosts}`,
      icon: Users,
      bg: "#D1FAE5",
      color: "#059669",
    },
    {
      label: "Avg. Earnings/Host",
      value: avgEarnings ? formatSar(avgEarnings) : "—",
      icon: TrendingUp,
      bg: "#FEF3C7",
      color: "#D97706",
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Community Earnings</Text>
        <Text style={styles.screenSub}>
          See how the Ekra community is growing
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Stat cards */}
        {q.isPending ? (
          <View style={styles.center}>
            <Text style={styles.mutedText}>Loading community data…</Text>
          </View>
        ) : (
          <>
            <View style={styles.statGrid}>
              {statCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <View key={i} style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: card.bg }]}>
                      <Icon size={18} color={card.color} />
                    </View>
                    <Text style={styles.statValue}>{card.value}</Text>
                    <Text style={styles.statLabel}>{card.label}</Text>
                  </View>
                );
              })}
            </View>

            {/* Top earners */}
            {topEarners.length > 0 && (
              <>
                <View style={styles.leaderboardHeader}>
                  <Trophy size={18} color="#D97706" />
                  <Text style={styles.leaderboardTitle}>Top Earners</Text>
                </View>
                <View style={styles.leaderboardCard}>
                  {topEarners.slice(0, 10).map((earner: any, i: number) => (
                    <View key={i} style={[styles.earnerRow, i < topEarners.length - 1 && styles.earnerDivider]}>
                      <View style={[
                        styles.rankBadge,
                        i === 0 && { backgroundColor: "#F59E0B" },
                        i === 1 && { backgroundColor: "#9CA3AF" },
                        i === 2 && { backgroundColor: "#B45309" },
                      ]}>
                        <Text style={styles.rankText}>{i + 1}</Text>
                      </View>
                      <View style={styles.earnerAvatar}>
                        <Text style={styles.earnerAvatarLetter}>
                          {(earner.username ?? earner.name ?? "U").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.earnerInfo}>
                        <Text style={styles.earnerName} numberOfLines={1}>
                          {earner.username ?? earner.name ?? `Host #${i + 1}`}
                        </Text>
                        <Text style={styles.earnerCity}>
                          {earner.city ?? earner.location ?? ""}
                        </Text>
                      </View>
                      <Text style={styles.earnerAmount}>
                        {formatSar(earner.total_earnings ?? earner.earnings ?? 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Encouragement banner */}
            <View style={styles.banner}>
              <TrendingUp size={24} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Start hosting today</Text>
                <Text style={styles.bannerText}>
                  Join thousands of hosts earning passive income on Ekra by renting out their unused items.
                </Text>
              </View>
            </View>
          </>
        )}

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
  center: { padding: 40, alignItems: "center" },
  mutedText: { ...typography.body, color: colors.mutedForeground },

  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    gap: 6,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 20, fontWeight: "900", color: colors.foreground, letterSpacing: -0.3 },
  statLabel: { fontSize: 11, color: colors.mutedForeground, lineHeight: 16 },

  leaderboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    marginTop: spacing.sm,
  },
  leaderboardTitle: { fontSize: 17, fontWeight: "800", color: colors.foreground },

  leaderboardCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadows.card,
  },
  earnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  earnerDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontSize: 11, fontWeight: "800", color: "#fff" },
  earnerAvatar: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  earnerAvatarLetter: { color: "#fff", fontWeight: "700", fontSize: 14 },
  earnerInfo: { flex: 1 },
  earnerName: { fontSize: 14, fontWeight: "700", color: colors.foreground },
  earnerCity: { fontSize: 11, color: colors.mutedForeground },
  earnerAmount: { fontSize: 14, fontWeight: "800", color: colors.primary },

  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: colors.accent,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  bannerTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 4 },
  bannerText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
});
