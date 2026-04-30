import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { bootstrapApiClient } from "@/services/api/client";
import { useAuthStore } from "@/store/authStore";
import type { AuthStackParamList } from "@/navigation/types";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { persistTokens } from "@/services/storage/tokenStore";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
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

type Nav = NativeStackNavigationProp<AuthStackParamList, "Register">;

const API = process.env.EXPO_PUBLIC_API_BASE ?? "";

export function RegisterScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const setHasSession = useAuthStore((s) => s.setHasSession);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!email || !username || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();
      const trimmedUsername = username.trim();

      const url = `${API}/auth/register/`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          username: trimmedUsername,
          password: trimmedPassword,
          phone_number: phone,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        setError(`Server error (${res.status}). Please try again later.`);
        return;
      }

      if (!res.ok) {
        const msg =
          data?.email?.[0] ??
          data?.username?.[0] ??
          data?.password?.[0] ??
          data?.detail ??
          "Registration failed.";
        setError(msg);
        return;
      }

      // If API returns tokens directly, login immediately
      const accessToken = data.access ?? data.access_token;
      const refreshToken = data.refresh ?? data.refresh_token;
      if (accessToken) {
        await persistTokens(accessToken, refreshToken);
        await bootstrapApiClient();
        setHasSession(true);
        navigation.getParent()?.goBack();
      } else {
        // Email verification required
        navigation.navigate("Login", {
          message: "Account created successfully. Please check your email to verify your account.",
        });
      }
    } catch (err: any) {
      const isNetworkError =
        err?.message?.includes("Network request failed") ||
        err?.message?.includes("fetch") ||
        err?.code === "ECONNREFUSED";
      if (isNetworkError) {
        setError(
          `Cannot reach server.\nAPI: ${API}\n\nCheck your network or start the backend.`
        );
      } else {
        setError(`Something went wrong: ${err?.message || "Unknown error"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    label,
    icon: Icon,
    value,
    onChange,
    placeholder,
    secure,
    keyboard,
    toggleSecure,
    showSecure,
  }: {
    label: string;
    icon: any;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    secure?: boolean;
    keyboard?: any;
    toggleSecure?: () => void;
    showSecure?: boolean;
  }) => (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Icon size={16} color={colors.mutedForeground} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={secure && !showSecure}
          keyboardType={keyboard ?? "default"}
          autoCapitalize={keyboard === "email-address" ? "none" : "words"}
          autoCorrect={false}
        />
        {toggleSecure && (
          <Pressable onPress={toggleSecure} hitSlop={8}>
            {showSecure ? (
              <EyeOff size={16} color={colors.mutedForeground} />
            ) : (
              <Eye size={16} color={colors.mutedForeground} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );

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
          {/* Header */}
          <LinearGradient
            colors={["#9356F5", "#6D28D9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Pressable
              style={styles.backBtn}
              onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.getParent()?.goBack()}
              hitSlop={12}
            >
              <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
            </Pressable>
            <Text style={styles.brand}>Ekra</Text>
            <Text style={styles.tagline}>Create your free account</Text>
          </LinearGradient>

          {/* Form */}
          <View style={styles.card}>
            <Text style={styles.title}>Join Ekra</Text>
            <Text style={styles.subtitle}>Start renting and listing in minutes</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Field
              label="Username *"
              icon={User}
              value={username}
              onChange={setUsername}
              placeholder="janedoe"
            />
            <Field
              label="Email *"
              icon={Mail}
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              keyboard="email-address"
            />
            <Field
              label="Phone"
              icon={User}
              value={phone}
              onChange={setPhone}
              placeholder="05xxxxxxxx"
              keyboard="phone-pad"
            />
            <Field
              label="Password *"
              icon={Lock}
              value={password}
              onChange={setPassword}
              placeholder="Min 8 characters"
              secure
              showSecure={showPassword}
              toggleSecure={() => setShowPassword((v) => !v)}
            />

            <PrimaryButton
              label="Create Account"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              size="lg"
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Already have an account? </Text>
              <Pressable onPress={() => navigation.navigate("Login")}>
                <Text style={styles.switchLink}>Sign in</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.guestBtn}
              onPress={() => navigation.getParent()?.goBack()}
            >
              <Text style={styles.guestText}>Continue browsing without account</Text>
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
  brand: { fontSize: 34, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  tagline: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4 },
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
  title: { fontSize: 24, fontWeight: "900", color: colors.foreground, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 4, marginBottom: spacing.lg },
  errorBox: {
    backgroundColor: "rgba(220,38,38,0.08)",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.2)",
    borderRadius: radii.md,
    padding: 12,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.destructive, fontSize: 13 },
  nameRow: { flexDirection: "row", gap: 10 },
  fieldWrap: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 },
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
  input: { flex: 1, fontSize: 15, color: colors.textPrimary },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  switchText: { fontSize: 14, color: colors.mutedForeground },
  switchLink: { fontSize: 14, color: colors.primary, fontWeight: "700" },
  guestBtn: { marginTop: spacing.md, alignItems: "center", paddingVertical: 8 },
  guestText: { fontSize: 13, color: colors.mutedForeground, textDecorationLine: "underline" },
});
