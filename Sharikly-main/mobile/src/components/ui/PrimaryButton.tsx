import { colors, shadows } from "@/core/theme/tokens";
import { hapticImpact } from "@/utils/haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "gradient" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "gradient",
  size = "md",
  fullWidth = false,
  icon,
}: PrimaryButtonProps) {
  const sizeStyles = {
    sm: { height: 38, paddingHorizontal: 16, fontSize: 13, borderRadius: 12 },
    md: { height: 48, paddingHorizontal: 20, fontSize: 15, borderRadius: 16 },
    lg: { height: 56, paddingHorizontal: 28, fontSize: 16, borderRadius: 20 },
  }[size];

  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) return;
    hapticImpact();
    onPress?.();
  };

  if (variant === "gradient") {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.base,
          { alignSelf: fullWidth ? "stretch" : "flex-start" },
          pressed && !isDisabled && styles.pressed,
          isDisabled && styles.disabled,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
      >
        <LinearGradient
          colors={["#9356F5", "#6D28D9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            {
              height: sizeStyles.height,
              paddingHorizontal: sizeStyles.paddingHorizontal,
              borderRadius: sizeStyles.borderRadius,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.row}>
              {icon && <View style={styles.iconWrap}>{icon}</View>}
              <Text style={[styles.label, { fontSize: sizeStyles.fontSize }]}>{label}</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === "outline") {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.outline,
          {
            height: sizeStyles.height,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            borderRadius: sizeStyles.borderRadius,
            alignSelf: fullWidth ? "stretch" : "flex-start",
          },
          pressed && !isDisabled && styles.pressed,
          isDisabled && styles.disabled,
        ]}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <View style={styles.row}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.outlineLabel, { fontSize: sizeStyles.fontSize }]}>{label}</Text>
          </View>
        )}
      </Pressable>
    );
  }

  // ghost
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.ghost,
        {
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: sizeStyles.borderRadius,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        pressed && !isDisabled && { opacity: 0.7 },
        isDisabled && styles.disabled,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.ghostLabel, { fontSize: sizeStyles.fontSize }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
    ...shadows.fab,
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.5,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineLabel: {
    color: colors.primary,
    fontWeight: "600",
  },
  ghost: {
    alignItems: "center",
    justifyContent: "center",
  },
  ghostLabel: {
    color: colors.primary,
    fontWeight: "600",
  },
});
