import { colors, spacing, typography } from "@/core/theme/tokens";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export function LoadingState({ message = "Loading…" }: { message?: string }): React.ReactElement {
  return (
    <View style={styles.center} accessibilityLabel="Loading">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.caption}>{message}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  message,
}: {
  title: string;
  message?: string;
}): React.ReactElement {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.caption}>{message}</Text> : null}
    </View>
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}): React.ReactElement {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title ?? "Something went wrong"}</Text>
      <Text style={styles.caption}>{message}</Text>
      {onRetry ? (
        <Text style={styles.retry} onPress={onRetry}>
          Tap to retry
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.title,
    color: colors.foreground,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  caption: {
    ...typography.caption,
    color: colors.mutedForeground,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  retry: {
    marginTop: spacing.md,
    color: colors.primary,
    fontWeight: "600",
  },
});
