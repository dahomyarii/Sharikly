import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { getEarningsDashboard } from "@/services/api/endpoints/earnings";
import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react-native";
import React from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Circle, Defs, LinearGradient as SvgGrad, Stop, Rect, Line, Text as SvgText } from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");

function formatSar(v: string | number | undefined) {
  if (!v && v !== 0) return "SAR 0";
  const n = parseFloat(String(v));
  if (isNaN(n)) return "SAR 0";
  if (n >= 1000) return `SAR ${(n / 1000).toFixed(1)}k`;
  return `SAR ${n.toFixed(0)}`;
}

function EarningsChart({ data }: { data: { earnings: string; label: string }[] }) {
  if (!data.length) {
    return (
      <View style={{ height: 130, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>No earnings data yet</Text>
      </View>
    );
  }
  const W = SCREEN_W - 80;
  const H = 130;
  const pad = { top: 10, right: 10, bottom: 20, left: 44 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const vals = data.map((p) => parseFloat(p.earnings) || 0);
  const maxVal = Math.max(...vals, 1);
  const xStep = chartW / Math.max(data.length - 1, 1);
  const yScale = (v: number) => pad.top + chartH - (v / maxVal) * chartH;
  const pts = data.map((p, i) => ({
    x: pad.left + i * xStep,
    y: yScale(parseFloat(p.earnings) || 0),
    label: p.label.split(" ")[0],
    v: parseFloat(p.earnings) || 0,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${H - pad.bottom} L${pad.left},${H - pad.bottom} Z`;
  const lastGrowth = data.length >= 2
    ? Math.round(((vals[vals.length - 1] - vals[vals.length - 2]) / Math.max(vals[vals.length - 2], 1)) * 100)
    : null;

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>Monthly Earnings</Text>
        {lastGrowth !== null && (
          <View style={{ borderRadius: 99, backgroundColor: lastGrowth >= 0 ? "#D1FAE5" : "#FEE2E2", paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: lastGrowth >= 0 ? "#065F46" : "#991B1B" }}>
              {lastGrowth >= 0 ? "▲" : "▼"} {Math.abs(lastGrowth)}%
            </Text>
          </View>
        )}
      </View>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <SvgGrad id="eg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.22" />
            <Stop offset="1" stopColor={colors.primary} stopOpacity="0.01" />
          </SvgGrad>
        </Defs>
        {[maxVal, maxVal * 0.5, 0].map((v, i) => (
          <React.Fragment key={i}>
            <Line x1={pad.left} y1={yScale(v)} x2={W - pad.right} y2={yScale(v)} stroke="#f1f5f9" strokeWidth="1" />
            <SvgText x={pad.left - 4} y={yScale(v) + 4} textAnchor="end" fontSize="9" fill="#94a3b8">
              {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}
            </SvgText>
          </React.Fragment>
        ))}
        {pts.map((p, i) => {
          const bW = Math.max(8, xStep * 0.4);
          const bH = H - pad.bottom - p.y;
          return <Rect key={i} x={p.x - bW / 2} y={p.y} width={bW} height={Math.max(0, bH)} fill="#ede9fe" rx="3" />;
        })}
        <Path d={area} fill="url(#eg)" />
        <Path d={line} fill="none" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r="4.5" fill={i === pts.length - 1 ? colors.primary : colors.success} stroke="white" strokeWidth="2" />
        ))}
        {pts.map((p, i) => (
          <SvgText key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize="9" fill="#94a3b8">{p.label}</SvgText>
        ))}
      </Svg>
    </View>
  );
}

export function HostEarningsScreen(): React.ReactElement {
  const q = useQuery({
    queryKey: ["earnings", "dashboard"],
    queryFn: () => getEarningsDashboard(),
  });
  const dash: any = q.data;
  const monthly: any[] = dash?.chart?.monthly ?? [];
  const total = dash?.summary?.total_earnings ?? 0;
  const thisMonth = dash?.summary?.this_month_earnings ?? 0;
  const lastMonth = dash?.summary?.last_month_earnings ?? 0;
  const rentals = dash?.summary?.rentals_count ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Earnings</Text>
        <Text style={styles.screenSub}>Your host earnings overview</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {q.isPending ? (
          <View style={styles.center}>
            <Text style={styles.mutedText}>Loading earnings…</Text>
          </View>
        ) : (
          <>
            {/* Hero total */}
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <Wallet size={24} color="#fff" />
              </View>
              <Text style={styles.heroLabel}>Total Earnings</Text>
              <Text style={styles.heroValue}>{formatSar(total)}</Text>
              <Text style={styles.heroSub}>{rentals} completed rentals</Text>
            </View>

            {/* Month cards */}
            <View style={styles.monthRow}>
              <View style={styles.monthCard}>
                <Text style={styles.monthLabel}>This Month</Text>
                <Text style={styles.monthValue}>{formatSar(thisMonth)}</Text>
              </View>
              <View style={styles.monthCard}>
                <Text style={styles.monthLabel}>Last Month</Text>
                <Text style={styles.monthValue}>{formatSar(lastMonth)}</Text>
              </View>
            </View>

            {/* Chart */}
            {monthly.length > 0 && (
              <View style={styles.chartCard}>
                <EarningsChart data={monthly.slice(-6)} />
              </View>
            )}

            {/* Monthly breakdown rows */}
            {monthly.length > 0 && (
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>Monthly Breakdown</Text>
                {[...monthly].reverse().slice(0, 12).map((m: any, i: number) => (
                  <View key={i} style={[styles.breakdownRow, i < monthly.length - 1 && styles.breakdownDivider]}>
                    <Text style={styles.breakdownMonth}>{m.label}</Text>
                    <Text style={styles.breakdownValue}>{formatSar(m.earnings)}</Text>
                  </View>
                ))}
              </View>
            )}
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

  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.md,
    ...shadows.cardHeavy,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  heroLabel: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: "600", marginBottom: 4 },
  heroValue: { fontSize: 38, fontWeight: "900", color: "#fff", letterSpacing: -1, marginBottom: 4 },
  heroSub: { fontSize: 12, color: "rgba(255,255,255,0.65)" },

  monthRow: { flexDirection: "row", gap: 10, marginBottom: spacing.md },
  monthCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  monthLabel: { fontSize: 11, color: colors.mutedForeground, marginBottom: 6 },
  monthValue: { fontSize: 20, fontWeight: "800", color: colors.foreground },

  chartCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },

  breakdownCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  breakdownDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  breakdownMonth: { fontSize: 14, color: colors.textSecondary },
  breakdownValue: { fontSize: 14, fontWeight: "700", color: colors.foreground },
});
