import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, radii, spacing } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

export function EditProfileScreen(): React.ReactElement {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");

  const meQ = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(buildApiUrl("/auth/me/"));
      return data;
    },
  });

  useEffect(() => {
    if (meQ.data) {
      setUsername(meQ.data.username || "");
      setFirstName(meQ.data.first_name || "");
      setLastName(meQ.data.last_name || "");
      setBio(meQ.data.bio || "");
    }
  }, [meQ.data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        username,
        first_name: firstName,
        last_name: lastName,
        bio,
      };
      const { data } = await axiosInstance.patch(buildApiUrl("/auth/me/"), payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
      Alert.alert("Profile Updated", "Your profile has been successfully updated.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        "Update Failed",
        err?.response?.data?.detail || "Could not update your profile."
      );
    },
  });

  const handleSave = () => {
    if (!username.trim()) {
      Alert.alert("Error", "Username cannot be empty.");
      return;
    }
    updateMutation.mutate();
  };

  if (meQ.isPending) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <User size={36} color="#FFF" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="First name"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Last name"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell others about yourself..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={{ marginTop: 20 }}>
            <PrimaryButton
              label={updateMutation.isPending ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              size="lg"
              disabled={updateMutation.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.md, paddingBottom: 60 },
  avatarWrap: { alignItems: "center", marginVertical: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 14,
    fontSize: 15,
    color: colors.foreground,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
});
