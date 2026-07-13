import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { API_BASE } from "@/core/config/env";
import { axiosInstance, bootstrapApiClient, buildApiUrl } from "@/services/api/client";
import type { AuthStackParamList } from "@/navigation/types";
import { useAuthStore } from "@/store/authStore";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { persistTokens } from "@/services/storage/tokenStore";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
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
import Animated, { FadeInDown, SlideInDown } from "react-native-reanimated";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Login">;

export function LoginScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<AuthStackParamList, "Login">>();
  const setHasSession = useAuthStore((s) => s.setHasSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const successMessage = route.params?.message;

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      // Route through the shared axios client (interceptors, timeout, error toasts).
      // The 401 interceptor deliberately skips /auth/token, so a bad-credentials
      // response surfaces here instead of triggering a logout.
      const res = await axiosInstance.post(buildApiUrl("/auth/token/"), {
        email: trimmedEmail,
        password: trimmedPassword,
      });
      const data: any = res.data ?? {};

      // Store tokens (platform-aware: SecureStore on mobile, localStorage on web)
      const accessToken = data.access ?? data.access_token;
      const refreshToken = data.refresh ?? data.refresh_token;
      if (accessToken) {
        await persistTokens(accessToken, refreshToken);
      }

      // Re-bootstrap the API client so Authorization header is set
      await bootstrapApiClient();

      // Update auth store — this collapses the Auth modal and returns to Main
      setHasSession(true);

      // If the user was gated into login by an action (e.g. "Send Request"),
      // run it after dismissing the modal so they return to what they wanted.
      const pending = useAuthStore.getState().pendingAction;
      useAuthStore.getState().setPendingAction(null);

      // Dismiss the Auth modal. Prefer goBack() so the screens the user was on
      // (their tab/stack state) are preserved — this is what lets the pending
      // action navigate them back to where they wanted to go. Fall back to a
      // reset only if there's nothing to go back to.
      const parent = navigation.getParent();
      if (parent?.canGoBack()) {
        parent.goBack();
      } else {
        parent?.reset({ index: 0, routes: [{ name: "Main" as never }] });
      }

      if (pending) setTimeout(() => pending(), 80);

    } catch (err: any) {
      if (err?.response) {
        const data = err.response.data;
        setError(
          data?.detail ??
          data?.non_field_errors?.[0] ??
          "Login failed. Check your email and password."
        );
      } else {
        setError(`Cannot reach the server.\nAPI: ${API_BASE}\n\nCheck your network or start the backend.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cancel login: discard any pending gated action and dismiss the Auth modal.
  const closeAuth = () => {
    useAuthStore.getState().setPendingAction(null);
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.getParent()?.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Purple gradient header with back button */}
          <LinearGradient
            colors={["#C164FF", "#7A5AFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* Back / close button */}
            <Pressable
              style={styles.backBtn}
              onPress={closeAuth}
              hitSlop={12}
            >
              <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
            </Pressable>
            <Text style={styles.brand}>Ekra</Text>
            <Text style={styles.tagline}>Rent Anything Nearby</Text>
          </LinearGradient>

          {/* Form Card */}
          <Animated.View entering={SlideInDown.springify().damping(18)} style={styles.card}>
            {successMessage ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.fieldWrap}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Mail size={16} color={colors.mutedForeground} />
                <TextInput
                  testID="login-email"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </Animated.View>

            {/* Password */}
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.fieldWrap}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Lock size={16} color={colors.mutedForeground} />
                <TextInput
                  testID="login-password"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  {showPassword ? (
                    <EyeOff size={16} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={16} color={colors.mutedForeground} />
                  )}
                </Pressable>
              </View>
            </Animated.View>

            {/* Forgot password & Resend verification */}
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.linksRow}>
              <Pressable onPress={() => navigation.navigate("ResendVerification")}>
                <Text style={styles.secondaryLink}>Resend verification</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </Animated.View>

            {/* Login button */}
            <Animated.View entering={FadeInDown.delay(400).springify()}>
            <PrimaryButton
              label="Log In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
            />

            {/* Sign up link */}
            </Animated.View>

            {/* Sign up link */}
            <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.switchRow}>
              <Text style={styles.switchText}>Don&apos;t have an account? </Text>
              <Pressable onPress={() => navigation.navigate("Register")}>
                <Text style={styles.switchLink}>Sign up free</Text>
              </Pressable>
            </Animated.View>

            {/* Browse without account */}
            <Animated.View entering={FadeInDown.delay(600).springify()}>
            <Pressable
              style={styles.guestBtn}
              onPress={closeAuth}
            >
              <Text style={styles.guestText}>Continue browsing without signing in</Text>
            </Pressable>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  header: {
    alignItems: "center",
    paddingTop: 52,
    paddingBottom: 52,
    position: "relative",
  },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: 36,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    marginTop: -radii.xxl,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    ...shadows.cardHeavy,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  errorBox: {
    backgroundColor: "rgba(220,38,38,0.08)",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.2)",
    borderRadius: radii.md,
    padding: 12,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.destructive, fontSize: 13 },
  fieldWrap: { marginBottom: spacing.md },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  linksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  secondaryLink: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: "500",
  },
  forgotText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  switchText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  switchLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "700",
  },
  guestBtn: {
    marginTop: spacing.md,
    alignItems: "center",
    paddingVertical: 8,
  },
  guestText: {
    fontSize: 13,
    color: colors.mutedForeground,
    textDecorationLine: "underline",
  },
  successBox: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    borderRadius: radii.md,
    padding: 12,
    marginBottom: spacing.md,
  },
  successText: { 
    color: "#16a34a", 
    fontSize: 13,
    fontWeight: "500",
  },
});
