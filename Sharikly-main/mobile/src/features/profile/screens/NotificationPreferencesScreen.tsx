import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function NotificationPreferencesScreen(): React.ReactElement {
  const queryClient = useQueryClient();

  const prefsQ = useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(buildApiUrl("/notifications/preferences/"));
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (patch: any) => {
      await axiosInstance.patch(buildApiUrl("/notifications/preferences/"), patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "preferences"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.detail || "Failed to update preferences.");
    },
  });

  const prefs = prefsQ.data || {
    inapp_booking_updates: true,
    inapp_messages: true,
    email_booking_updates: true,
    email_messages: false,
  };

  const handleToggle = (key: string, value: boolean) => {
    updateMutation.mutate({ [key]: value });
  };

  if (prefsQ.isPending) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Notifications</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.instructions}>
          Choose how you want to hear about bookings and messages. Payment emails are managed separately.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In-App Notifications</Text>
          <View style={styles.card}>
            <PreferenceRow
              title="Booking Updates"
              description="Show notifications when a booking is accepted, declined or cancelled."
              value={prefs.inapp_booking_updates}
              onValueChange={(val) => handleToggle("inapp_booking_updates", val)}
              disabled={updateMutation.isPending}
            />
            <View style={styles.divider} />
            <PreferenceRow
              title="New Messages"
              description="Badge and feed when someone sends you a new message."
              value={prefs.inapp_messages}
              onValueChange={(val) => handleToggle("inapp_messages", val)}
              disabled={updateMutation.isPending}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Notifications</Text>
          <View style={styles.card}>
            <PreferenceRow
              title="Booking Updates"
              description="Email you when a booking is accepted, declined or cancelled."
              value={prefs.email_booking_updates}
              onValueChange={(val) => handleToggle("email_booking_updates", val)}
              disabled={updateMutation.isPending}
            />
            <View style={styles.divider} />
            <PreferenceRow
              title="New Messages"
              description="Optional: email when you receive a new message (no payment info)."
              value={prefs.email_messages}
              onValueChange={(val) => handleToggle("email_messages", val)}
              disabled={updateMutation.isPending}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PreferenceRow({
  title,
  description,
  value,
  onValueChange,
  disabled,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.borderStrong, true: colors.primary }}
        thumbColor={"#FFF"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  screenTitle: { fontSize: 26, fontWeight: "900", color: colors.foreground, letterSpacing: -0.5 },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 40 },
  instructions: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    gap: 16,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: 4,
  },
  rowDesc: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },
});
