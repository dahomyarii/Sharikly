import { subscribeGlobalToast, type GlobalToastPayload } from "@/core/events/appEvents";
import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = GlobalToastPayload["type"];

const CONFIG: Record<ToastType, { accent: string; Icon: typeof Info }> = {
  success: { accent: colors.success, Icon: CheckCircle },
  error: { accent: colors.destructive, Icon: XCircle },
  warning: { accent: colors.warning, Icon: AlertTriangle },
  info: { accent: colors.primary, Icon: Info },
};

const DURATION_MS: Record<ToastType, number> = {
  success: 3000,
  info: 3000,
  warning: 4000,
  error: 4500,
};

/**
 * Single in-app toast overlay, mounted once at the app root. Subscribes to the global
 * toast event bus and animates a themed banner in from the top. Cross-platform (uses
 * core Animated + View/Text, so it works on web where Alert.alert is a no-op). A new
 * toast replaces the current one; tapping dismisses early.
 */
export function ToastHost(): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<GlobalToastPayload | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -24, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [opacity, translateY]);

  useEffect(() => {
    return subscribeGlobalToast((payload) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast(payload);
      opacity.setValue(0);
      translateY.setValue(-24);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
      hideTimer.current = setTimeout(dismiss, DURATION_MS[payload.type] ?? 3000);
    });
  }, [dismiss, opacity, translateY]);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  if (!toast) return null;
  const cfg = CONFIG[toast.type] ?? CONFIG.info;
  const Icon = cfg.Icon;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + spacing.sm }]}>
      <Animated.View style={[styles.animated, { opacity, transform: [{ translateY }] }]}>
        <Pressable
          onPress={dismiss}
          accessibilityRole="alert"
          accessibilityLabel={toast.message}
          style={[styles.toast, { borderLeftColor: cfg.accent }]}
        >
          <Icon size={20} color={cfg.accent} />
          <Text style={styles.text} numberOfLines={3}>
            {toast.message}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: spacing.md,
    zIndex: 9999,
    elevation: 9999,
  },
  animated: { width: "100%", maxWidth: 520, alignSelf: "center" },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...shadows.cardHeavy,
  },
  text: {
    flex: 1,
    color: colors.textPrimary,
    ...typography.bodySmall,
    fontWeight: "600",
  },
});
