import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import type { ListingsStackParamList } from "@/navigation/types";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, CheckCircle, Plus } from "lucide-react-native";
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

type R = RouteProp<ListingsStackParamList, "ListingAvailability">;

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return iso; }
}

export function ListingAvailabilityScreen(): React.ReactElement {
  const navigation = useNavigation();
  const { id } = useRoute<R>().params;
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const q = useQuery({
    queryKey: ["availability", id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(buildApiUrl(`/listings/${id}/availability/`));
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(buildApiUrl(`/listings/${id}/availability/`), {
        start_date: startDate,
        end_date: endDate,
        is_available: true,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["availability", id] });
      setStartDate("");
      setEndDate("");
      Alert.alert("Availability added!");
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.detail ?? "Failed to add availability.");
    },
  });

  const handleAdd = () => {
    if (!startDate || !endDate) {
      Alert.alert("Please enter both start and end dates (YYYY-MM-DD).");
      return;
    }
    addMutation.mutate();
  };

  const availabilities: any[] = q.data
    ? Array.isArray(q.data) ? q.data : (q.data as any)?.results ?? []
    : [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Availability</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Add form */}
      <View style={styles.addCard}>
        <Text style={styles.addCardTitle}>Add Availability Window</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateInput}>
            <Text style={styles.inputLabel}>Start date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              value={startDate}
              onChangeText={setStartDate}
              keyboardType="default"
            />
          </View>
          <View style={styles.dateInput}>
            <Text style={styles.inputLabel}>End date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              value={endDate}
              onChangeText={setEndDate}
              keyboardType="default"
            />
          </View>
        </View>
        <Pressable style={styles.addBtn} onPress={handleAdd}>
          <Plus size={16} color="#fff" />
          <Text style={styles.addBtnText}>
            {addMutation.isPending ? "Adding…" : "Add Window"}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Availability Windows</Text>

      {q.isPending ? (
        <View style={styles.center}>
          <Text style={styles.mutedText}>Loading…</Text>
        </View>
      ) : availabilities.length === 0 ? (
        <View style={styles.center}>
          <Calendar size={40} color={colors.muted} />
          <Text style={styles.emptyTitle}>No availability set</Text>
          <Text style={styles.emptyText}>Add a date range when this listing is available.</Text>
        </View>
      ) : (
        <FlatList
          data={availabilities}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.avSlot}>
              <CheckCircle size={16} color={colors.success} />
              <Text style={styles.slotText}>
                {formatDate(item.start_date)} → {formatDate(item.end_date)}
              </Text>
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
  dateInput: { flex: 1 },
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
    backgroundColor: colors.primary,
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
  avSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
    ...shadows.card,
  },
  slotText: { fontSize: 14, fontWeight: "600", color: colors.foreground, flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  mutedText: { ...typography.body, color: colors.mutedForeground },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: colors.foreground },
  emptyText: { fontSize: 13, color: colors.mutedForeground, textAlign: "center" },
});
