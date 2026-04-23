import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl, performLogout } from "@/services/api/client";
import { useAuthStore } from "@/store/authStore";
import type { ProfileStackParamList, MainTabParamList } from "@/navigation/types";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronRight,
  Globe,
  Heart,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  Shield,
  Trash2,
  User,
  UserX,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, "Settings">,
  BottomTabNavigationProp<MainTabParamList>
>;

function SettingsRow({
  icon: Icon,
  label,
  sublabel,
  onPress,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Icon size={18} color={danger ? colors.destructive : colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      <ChevronRight size={16} color={danger ? colors.destructive : colors.mutedForeground} />
    </Pressable>
  );
}

export function SettingsScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const setHasSession = useAuthStore((s) => s.setHasSession);

  const meQ = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(buildApiUrl("/auth/me/"));
      return data;
    },
    retry: false,
  });

  const user: any = meQ.data;

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: async () => {
            try {
              await axiosInstance.delete(buildApiUrl("/auth/delete-account/"));
              await performLogout();
              setHasSession(false);
            } catch {
              Alert.alert("Failed to delete account. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await performLogout();
          setHasSession(false);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Account section */}
        {user && (
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarLetter}>
                {(user.username ?? user.first_name ?? "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.username ?? "User"}
              </Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </View>
          </View>
        )}

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon={User}
              label="Profile"
              sublabel="Edit your name, bio, and avatar"
              onPress={() => navigation.navigate("Profile")}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Lock}
              label="Change Password"
              sublabel="Update your account password"
              onPress={() => {
                // Navigate to change password using auth endpoints
                Alert.alert("Change Password", "Feature coming soon.");
              }}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Bell}
              label="Notification Preferences"
              sublabel="Manage what you receive"
              onPress={() => Alert.alert("Notification preferences coming soon.")}
            />
          </View>
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon={Shield}
              label="Privacy"
              sublabel="Manage your data and visibility"
              onPress={() => navigation.navigate("Privacy")}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={UserX}
              label="Blocked Users"
              sublabel="Manage blocked accounts"
              onPress={() => Alert.alert("Blocked users list coming soon.")}
            />
          </View>
        </View>

        {/* Help & About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & About</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon={HelpCircle}
              label="How Ekra Works"
              onPress={() => navigation.navigate("HowItWorks")}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Info}
              label="About Ekra"
              onPress={() => navigation.navigate("About")}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Globe}
              label="Terms of Service"
              onPress={() => navigation.navigate("Terms")}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Heart}
              label="Favorites"
              onPress={() => navigation.navigate("Favorites")}
            />
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon={LogOut}
              label="Sign Out"
              onPress={handleSignOut}
              danger
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Trash2}
              label="Delete Account"
              sublabel="Permanently remove your account"
              onPress={handleDeleteAccount}
              danger
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
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
  scrollContent: { padding: spacing.md },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarLetter: { color: "#fff", fontSize: 22, fontWeight: "700" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: "700", color: colors.foreground },
  profileEmail: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },

  section: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 56 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: 12,
  },
  rowPressed: { backgroundColor: colors.accent + "44" },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconDanger: { backgroundColor: "rgba(220,38,38,0.08)" },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  rowLabelDanger: { color: colors.destructive },
  rowSublabel: { fontSize: 12, color: colors.mutedForeground, marginTop: 1 },
});
