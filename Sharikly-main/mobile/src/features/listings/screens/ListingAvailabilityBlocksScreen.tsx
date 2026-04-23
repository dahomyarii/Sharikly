import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import type { ListingsStackParamList } from "@/navigation/types";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type R = RouteProp<ListingsStackParamList, "ListingAvailabilityBlocks">;

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return iso; }
}

export function ListingAvailabilityBlocksScreen(): React.ReactElement {
  const navigation = useNavigation();
  const { id } = useRoute<R>().params;
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const q = useQuery({
    queryKey: ["availability-blocks", id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(buildApiUrl(`/listings/${id}/availability-blocks/`));
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(buildApiUrl(`/listings/${id}/availability-blocks/`), {
        start_date: startDate,
        end_date: endDate,
        reason,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["availability-blocks", id] });
      setStartDate("");
      setEndDate("");
      setReason("");
      Alert.alert("Block added! ✅");
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.detail ?? "Failed to add block.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (blockId: number) =>
      axiosInstance.delete(buildApiUrl(`/listings/${id}/availability-blocks/${blockId}/`)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["availability-blocks", id] }),
    onError: () => Alert.alert("Failed to remove block."),
  });

  const handleAdd = () => {
    if (!startDate || !endDate) {
      Alert.alert("Please enter both start and end dates (YYYY-MM-DD).");
      return;
    }
    addMutation.mutate();
  };

  const blocks: any[] = q.data
    ? Array.isArray(q.data) ? q.data : (q.data as any)?.results ?? []
    : [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Blocked Dates</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Ban size={16} color={colors.destructive} />
        <Text style={styles.infoText}>
          Blocked dates prevent renters from booking during these periods.
        </Text>
      </View>

      {/* Add block form */}
      <View style={styles.addCard}>
        <Text style={styles.addCardTitle}>Block a date range</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.inputLabel}>Start</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.inputLabel}>End</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </View>
        <Text style={styles.inputLabel}>Reason (optional)</Text>
        <TextInput
          style={[styles.input, { marginBottom: 12 }]}
          placeholder="e.g., Personal use, maintenance, etc."
          placeholderTextColor={colors.mutedForeground}
          value={reason}
          onChangeText={setReason}
          maxLength={100}
        />
        <Pressable
          style={[styles.addBtn, addMutation.isPending && { opacity: 0.7 }]}
          onPress={handleAdd}
          disabled={addMutation.isPending}
        >
          <Ban size={15} color="#fff" />
          <Text style={styles.addBtnText}>
            {addMutation.isPending ? "Blocking…" : "Block Dates"}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Active Blocks ({blocks.length})</Text>

      {q.isPending ? (
        <View style={styles.center}>
          <Text style={styles.mutedText}>Loading…</Text>
        </View>
      ) : blocks.length === 0 ? (
        <View style={styles.center}>
          <Ban size={40} color={colors.muted} />
          <Text style={styles.emptyTitle}>No blocks</Text>
          <Text style={styles.emptyText}>All dates are currently available for booking.</Text>
        </View>
      ) : (
        <FlatList
          data={blocks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.blockRow}>
              <Ban size={14} color={colors.destructive} />
              <View style={{ flex: 1 }}>
                <Text style={styles.blockDates}>
                  {formatDate(item.start_date)} → {formatDate(item.end_date)}
                </Text>
                {item.reason && (
                  <Text style={styles.blockReason}>{item.reason}</Text>
                )}
              </View>
              <Pressable
                style={styles.deleteBtn}
                onPress={() =>
                  Alert.alert("Remove block?", "", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Remove", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
                  ])
                }
                hitSlop={8}
              >
                <Trash2 size={14} color={colors.destructive} />
              </Pressable>
            </View>
          )}
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
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    margin: spacing.md,
    marginBottom: 0,
    backgroundColor: "rgba(220,38,38,0.07)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.2)",
    padding: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.destructive, lineHeight: 18 },
  addCard: {
    margin: spacing.md,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  addCardTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 },
  dateRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  dateField: { flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground, marginBottom: 4 },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.destructive,
    borderRadius: radii.lg,
    paddingVertical: 12,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
    paddingHorizontal: spacing.md,
    marginBottom: 8,
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: 80 },
  blockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.15)",
    padding: 12,
    marginBottom: 8,
    ...shadows.card,
  },
  blockDates: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  blockReason: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: radii.md,
    backgroundColor: "rgba(220,38,38,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  mutedText: { ...typography.body, color: colors.mutedForeground },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: colors.foreground },
  emptyText: { fontSize: 13, color: colors.mutedForeground, textAlign: "center" },
});
