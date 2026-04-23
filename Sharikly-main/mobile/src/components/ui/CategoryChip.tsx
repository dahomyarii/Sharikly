import { colors, radii, spacing, shadows } from "@/core/theme/tokens";
import { hapticSelection } from "@/utils/haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface CategoryChipProps {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
}

export function CategoryChip({ label, icon, active = false, onPress }: CategoryChipProps) {
  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: "#FFFFFF",
    ...shadows.card,
    marginVertical: 4,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
  iconWrap: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280", // Gray text for inactive
  },
  labelActive: {
    color: colors.primaryForeground, // White text for active
    fontWeight: "800",
  },
});
