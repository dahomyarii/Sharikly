import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, radii, spacing } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { useNavigation } from "@react-navigation/native";
import { Eye, EyeOff } from "lucide-react-native";
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

export function ChangePasswordScreen(): React.ReactElement {
  const navigation = useNavigation();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords Mismatch", "The new passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Invalid Password", "New password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      await axiosInstance.post(buildApiUrl("/auth/change-password/"), {
        old_password: oldPassword,
        new_password: newPassword,
      });
      Alert.alert("Success", "Your password has been changed successfully.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.detail || "Failed to change password. Please check your current password and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Change Password</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.instructions}>
            Your password must be at least 8 characters long.
          </Text>

          <View style={styles.inputGroup}>
            <Label>Current Password</Label>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showOld}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Enter current password"
                placeholderTextColor={colors.mutedForeground}
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowOld(!showOld)}>
                {showOld ? <EyeOff size={20} color={colors.mutedForeground} /> : <Eye size={20} color={colors.mutedForeground} />}
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Label>New Password</Label>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={colors.mutedForeground}
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
                {showNew ? <EyeOff size={20} color={colors.mutedForeground} /> : <Eye size={20} color={colors.mutedForeground} />}
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Label>Confirm New Password</Label>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                secureTextEntry={true}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label={isLoading ? "Saving..." : "Change Password"}
              onPress={handleSave}
              disabled={isLoading || !oldPassword || !newPassword || !confirmPassword}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  screenTitle: { fontSize: 26, fontWeight: "900", color: colors.foreground, letterSpacing: -0.5 },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 40 },
  instructions: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.foreground,
  },
  eyeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actions: {
    marginTop: spacing.xl,
  },
});
