import { colors, radii } from "@/core/theme/tokens";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TAB_FILTER_LABELS, TAB_FILTERS, type TabFilter } from "../status";

/** Horizontal All / Pending / Active / Upcoming / Completed tabs with count badges. */
export function StatusTabs({
  value,
  counts,
  onChange,
}: {
  value: TabFilter;
  counts: Record<TabFilter, number>;
  onChange: (t: TabFilter) => void;
}): React.ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {TAB_FILTERS.map((t) => {
        const active = t === value;
        const n = counts[t];
        return (
          <Pressable
            key={t}
            onPress={() => onChange(t)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {TAB_FILTER_LABELS[t]}
            </Text>
            {n > 0 && (
              <View style={[styles.badge, active && styles.badgeActive]}>
                <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{n}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 8 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: "rgba(176, 71, 246, 0.05)",
  },
  tabActive: { backgroundColor: colors.primary },
  label: { fontSize: 14, fontWeight: "700", color: colors.mutedForeground },
  labelActive: { color: "#FFFFFF" },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "rgba(176, 71, 246, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeActive: { backgroundColor: "rgba(255,255,255,0.28)" },
  badgeText: { fontSize: 11, fontWeight: "800", color: colors.primary },
  badgeTextActive: { color: "#FFFFFF" },
});
