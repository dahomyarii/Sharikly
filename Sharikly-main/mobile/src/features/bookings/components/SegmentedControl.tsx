import { colors, radii, shadows } from "@/core/theme/tokens";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

/**
 * A two-way (or N-way) segmented control — the pill track with one raised
 * active segment. Purely presentational.
 */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (key: T) => void;
}): React.ReactElement {
  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(opt.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: "#F1F0F5",
    borderRadius: radii.full,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: "#FFFFFF",
    ...shadows.card,
    shadowOpacity: 0.08,
  },
  label: { fontSize: 14, fontWeight: "700", color: colors.mutedForeground },
  labelActive: { color: colors.primary },
});
