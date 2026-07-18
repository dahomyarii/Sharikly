import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, radii, spacing } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { showToast } from "@/core/events/appEvents";
import { updateAvatar } from "@/services/api/endpoints/user";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, User } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";

export function EditProfileScreen(): React.ReactElement {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [pickedUri, setPickedUri] = useState<string | null>(null);

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
      showToast("Your profile has been updated.", "success");
      navigation.goBack();
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.detail || "Couldn't update your profile. Please try again.", "error");
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (asset: { uri: string; fileName?: string; mimeType?: string }) => updateAvatar(asset),
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
      showToast("Profile photo updated.", "success");
    },
    onError: () => {
      setPickedUri(null); // drop the failed preview
      showToast("Couldn't update your photo. Please try again.", "error");
    },
  });

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast("Please allow photo access to change your picture.", "warning");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setPickedUri(a.uri); // optimistic preview
    avatarMutation.mutate({ uri: a.uri, fileName: a.fileName ?? undefined, mimeType: a.mimeType ?? undefined });
  };

  const handleSave = () => {
    if (!username.trim()) {
      showToast("Username cannot be empty.", "warning");
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

  // Never render the editable form on a failed load — the fields would be blank and
  // pressing Save would PATCH those blanks over the user's real name/bio (data loss).
  if (meQ.isError || !meQ.data) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
            <ArrowLeft size={20} color={colors.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.headerTitle}>Couldn&apos;t load your profile</Text>
          <Text style={styles.errorHint}>
            Please check your connection and try again.
          </Text>
          <View style={{ marginTop: 20, alignSelf: "stretch", paddingHorizontal: spacing.xl }}>
            <PrimaryButton label="Retry" onPress={() => meQ.refetch()} variant="outline" />
          </View>
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
            <Pressable onPress={pickAvatar} disabled={avatarMutation.isPending} accessibilityRole="button" accessibilityLabel="Change profile photo">
              <View style={styles.avatar}>
                {(() => {
                  const path = meQ.data?.avatar as string | undefined;
                  const server = path
                    ? (path.startsWith("http") ? path : `${API_BASE.replace("/api", "")}${path}`)
                    : null;
                  const uri = pickedUri ?? server;
                  return uri ? (
                    <Image source={{ uri }} style={styles.avatarImg} />
                  ) : (
                    <User size={36} color="#FFF" />
                  );
                })()}
              </View>
              <View style={styles.avatarEditBadge}>
                {avatarMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Camera size={14} color="#fff" />
                )}
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
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
  errorHint: { color: colors.mutedForeground, marginTop: 8, textAlign: "center", paddingHorizontal: spacing.xl, lineHeight: 20 },
  content: { padding: spacing.md, paddingBottom: 60 },
  avatarWrap: { alignItems: "center", marginVertical: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: { fontSize: 12, color: colors.mutedForeground, marginTop: 8 },
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
