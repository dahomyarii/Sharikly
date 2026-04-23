import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Flag } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}

export function MyReportsScreen(): React.ReactElement {
  const navigation = useNavigation();

  const q = useQuery({
    queryKey: ["my-reports"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(buildApiUrl("/reports/my/"));
      return data;
    },
    retry: false,
  });

  const reports: any[] = q.data
    ? Array.isArray(q.data) ? q.data : (q.data as any)?.results ?? []
    : [];

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.flagIcon}>
          <Flag size={14} color={colors.destructive} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reportTitle} numberOfLines={1}>
            {item.reason ?? item.subject ?? `Report #${item.id}`}
          </Text>
          {item.created_at && <Text style={styles.reportDate}>{formatDate(item.created_at)}</Text>}
        </View>
        <View style={[styles.statusChip, { backgroundColor: item.resolved ? "#D1FAE5" : "#FEF3C7" }]}>
          <Text style={{ fontSize: 10, fontWeight: "700", color: item.resolved ? "#065F46" : "#92400E" }}>
            {item.resolved ? "Resolved" : "Pending"}
          </Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.reportDesc} numberOfLines={2}>{item.description}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>My Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      {q.isPending ? (
        <View style={styles.center}>
          <Text style={styles.mutedText}>Loading reports…</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.center}>
          <Flag size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No reports yet</Text>
          <Text style={styles.emptyText}>Reports you&apos;ve submitted will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
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
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground },
  list: { padding: spacing.md, paddingBottom: 80 },
  card: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 8,
    ...shadows.card,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  flagIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: "rgba(220,38,38,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  reportTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground },
  reportDate: { fontSize: 11, color: colors.mutedForeground, marginTop: 1 },
  statusChip: { borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 3 },
  reportDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  mutedText: { ...typography.body, color: colors.mutedForeground },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: colors.foreground },
  emptyText: { fontSize: 13, color: colors.mutedForeground, textAlign: "center" },
});
