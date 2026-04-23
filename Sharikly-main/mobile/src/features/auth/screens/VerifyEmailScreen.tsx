import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { getVerifyEmail } from "@/services/api/endpoints/auth";
import type { AuthStackParamList } from "@/navigation/types";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle, XCircle } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type R = RouteProp<AuthStackParamList, "VerifyEmail">;
type Nav = NativeStackNavigationProp<AuthStackParamList, "VerifyEmail">;

function stringifyParams(params: R["params"]): Record<string, string> {
  const out: Record<string, string> = {};
  if (!params) return out;
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string" && v.length > 0) out[k] = v;
  }
  return out;
}

export function VerifyEmailScreen(): React.ReactElement {
  const route = useRoute<R>();
  const navigation = useNavigation<Nav>();

  const q = useQuery({
    queryKey: ["verify-email", route.params],
    queryFn: () => getVerifyEmail(stringifyParams(route.params)),
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <LinearGradient
        colors={["#9356F5", "#6D28D9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.brand}>Ekra</Text>
        <Text style={styles.tagline}>Email Verification</Text>
      </LinearGradient>

      <View style={styles.card}>
        {q.isPending && (
          <>
            <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.title}>Verifying your email…</Text>
            <Text style={styles.subtitle}>Please wait while we confirm your account.</Text>
          </>
        )}

        {q.isSuccess && (
          <>
            <View style={styles.iconWrap}>
              <CheckCircle size={52} color={colors.success} />
            </View>
            <Text style={styles.title}>Email Verified! 🎉</Text>
            <Text style={styles.subtitle}>
              Your account is now active. You can sign in and start renting.
            </Text>
            <PrimaryButton
              label="Sign In Now"
              onPress={() => navigation.navigate("Login")}
              fullWidth
              size="lg"
            />
          </>
        )}

        {q.isError && (
          <>
            <View style={[styles.iconWrap, styles.iconError]}>
              <XCircle size={52} color={colors.destructive} />
            </View>
            <Text style={styles.title}>Verification Failed</Text>
            <Text style={styles.subtitle}>
              This link may be expired or invalid. Please request a new verification email.
            </Text>
            <PrimaryButton
              label="Back to Sign In"
              onPress={() => navigation.navigate("Login")}
              fullWidth
              size="lg"
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: { alignItems: "center", paddingTop: 52, paddingBottom: 52 },
  brand: { fontSize: 36, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  tagline: { fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    marginTop: -radii.xxl,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.cardHeavy,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radii.full,
    backgroundColor: "rgba(16,185,129,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconError: { backgroundColor: "rgba(220,38,38,0.1)" },
  title: { fontSize: 24, fontWeight: "900", color: colors.foreground, textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.mutedForeground, textAlign: "center", lineHeight: 22, marginBottom: 24 },
});
