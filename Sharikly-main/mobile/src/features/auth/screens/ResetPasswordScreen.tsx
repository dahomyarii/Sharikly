import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { postPasswordResetConfirm } from "@/services/api/endpoints/auth";
import type { AuthStackParamList } from "@/navigation/types";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react-native";
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

type Nav = NativeStackNavigationProp<AuthStackParamList, "ResetPassword">;
type R = RouteProp<AuthStackParamList, "ResetPassword">;

export function ResetPasswordScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const [uid, setUid] = useState("");
  const [token, setToken] = useState(route.params?.token ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
      if (newPassword !== confirm) throw new Error("Passwords do not match.");
      return postPasswordResetConfirm({ uid, token, new_password: newPassword });
    },
    onSuccess: () => {
      Alert.alert("Password Updated", "You can now sign in with your new password.", [
        { text: "Sign In", onPress: () => navigation.navigate("Login") },
      ]);
    },
    onError: (e: any) =>
      setError(e?.message ?? e?.response?.data?.detail ?? "Failed to reset password."),
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
            <Text style={styles.tagline}>Set a new password</Text>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter the code from your email and set a new password.</Text>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            {[
              { label: "UID (from email link)", value: uid, onChange: setUid, secure: false },
              { label: "Reset Token", value: token, onChange: setToken, secure: false },
            ].map(({ label, value, onChange }) => (
              <View key={label} style={styles.fieldWrap}>
                <Text style={styles.label}>{label}</Text>
                <View style={styles.inputWrap}>
                  <Lock size={16} color={colors.mutedForeground} />
                  <TextInput style={styles.input} value={value} onChangeText={onChange}
                    placeholder={label} placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none" autoCorrect={false} />
                </View>
              </View>
            ))}

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrap}>
                <Lock size={16} color={colors.mutedForeground} />
                <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword}
                  placeholder="Min 8 characters" placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPw} autoCapitalize="none" />
                <Pressable onPress={() => setShowPw(v => !v)} hitSlop={8}>
                  {showPw ? <EyeOff size={16} color={colors.mutedForeground} /> : <Eye size={16} color={colors.mutedForeground} />}
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrap}>
                <Lock size={16} color={colors.mutedForeground} />
                <TextInput style={styles.input} value={confirm} onChangeText={setConfirm}
                  placeholder="Repeat password" placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPw} autoCapitalize="none" />
              </View>
            </View>

            <PrimaryButton label="Update Password" onPress={() => { setError(""); mut.mutate(); }} loading={mut.isPending} fullWidth size="lg" />
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
  fieldWrap: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 50 },
  input: { flex: 1, fontSize: 15, color: colors.textPrimary },
});
