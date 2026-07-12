import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
import { colors, spacing } from "@/core/theme/tokens";

interface ScreenHeaderProps {
  /** Header title text */
  title: string;
  /** Optional element rendered before the title (e.g. a small icon) */
  icon?: React.ReactNode;
  /** Optional element rendered on the far right (e.g. a bell / action button) */
  right?: React.ReactNode;
  /** Override the default goBack() behaviour */
  onBack?: () => void;
}

/**
 * Shared in-content header with a back arrow + title.
 * Replaces React Navigation's default (bland) native header so every screen
 * uses the same styled header. Native headers are hidden per-stack via
 * `screenOptions={{ headerShown: false }}`.
 */
export function ScreenHeader({ title, icon, right, onBack }: ScreenHeaderProps) {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => (onBack ? onBack() : navigation.goBack())}
        hitSlop={10}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={24} color={colors.primary} />
      </Pressable>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {right ? <View style={styles.rightWrap}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -6,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: colors.foreground,
    letterSpacing: -0.4,
  },
  rightWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
