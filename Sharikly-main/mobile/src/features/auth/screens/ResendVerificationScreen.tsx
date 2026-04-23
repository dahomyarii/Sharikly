import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { postResendVerification } from "@/services/api/endpoints/auth";
import type { AuthStackParamList } from "@/navigation/types";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = NativeStackNavigationProp<AuthStackParamList, "ResendVerification">;

export function ResendVerificationScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: () => postResendVerification(email),
    onSuccess: () => {
      Alert.alert(
        "Verification Email Sent",
        "Please check your inbox and click the verification link.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    },
    onError: (e: any) =>
      setError(e?.response?.data?.detail ?? e?.message ?? "Failed to resend verification."),
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={["#9356F5", "#6D28D9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
              <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
            </Pressable>
            <Text style={styles.brand}>Ekra</Text>
            <Text style={styles.tagline}>Resend Verification</Text>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.title}>Resend Verification Email</Text>
            <Text style={styles.subtitle}>
              Didn&apos;t receive your verification email? Enter your email below and we&apos;ll send a new one.
            </Text>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email address</Text>
              <View style={styles.inputWrap}>
                <Mail size={16} color={colors.mutedForeground} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <PrimaryButton
              label="Resend Email"
              onPress={() => { setError(""); if (!email) { setError("Please enter your email."); return; } mut.mutate(); }}
              loading={mut.isPending}
              fullWidth
              size="lg"
            />

            <Pressable style={styles.backLink} onPress={() => navigation.navigate("Login")}>
              <Text style={styles.backLinkText}>← Back to sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  header: { alignItems: "center", paddingTop: 52, paddingBottom: 52, position: "relative" },
  backBtn: { position: "absolute", top: 16, left: 16, width: 40, height: 40, borderRadius: radii.full, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 36, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  tagline: { fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  card: { flex: 1, backgroundColor: colors.background, borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl, marginTop: -radii.xxl, padding: spacing.lg, paddingTop: spacing.xl, ...shadows.cardHeavy },
  title: { fontSize: 24, fontWeight: "900", color: colors.foreground, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 4, marginBottom: spacing.lg, lineHeight: 21 },
  errorBox: { backgroundColor: "rgba(220,38,38,0.08)", borderWidth: 1, borderColor: "rgba(220,38,38,0.2)", borderRadius: radii.md, padding: 12, marginBottom: spacing.md },
  errorText: { color: colors.destructive, fontSize: 13 },
  fieldWrap: { marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 50 },
  input: { flex: 1, fontSize: 15, color: colors.textPrimary },
  backLink: { marginTop: spacing.lg, alignItems: "center", paddingVertical: 8 },
  backLinkText: { fontSize: 14, color: colors.primary, fontWeight: "600" },
});
