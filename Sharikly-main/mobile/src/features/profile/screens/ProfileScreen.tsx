import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, radii, shadows, spacing, layout } from "@/core/theme/tokens";
import type { ProfileStackParamList } from "@/navigation/types";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { getEarningsDashboard } from "@/services/api/endpoints/earnings";
import { clearStoredTokens } from "@/services/storage/tokenStore";
import { useAuthStore } from "@/store/authStore";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hapticImpact } from "@/utils/haptics";
import {
  Bell,
  ChevronRight,
  CreditCard,
  HelpCircle,
  LogOut,
  Settings,
  ShieldCheck,
  Star,
  User,
  Package,
  Camera,
  AlertCircle,
} from "lucide-react-native";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = NativeStackNavigationProp<ProfileStackParamList, "Profile">;

export function ProfileScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { hasSession, setHasSession } = useAuthStore();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const userQ = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => axiosInstance.get(buildApiUrl("/auth/me/")).then((res) => res.data),
    enabled: hasSession,
  });

  const user = userQ.data;
  const avatarUrl = user?.avatar ? (user.avatar.startsWith("http") ? user.avatar : `${process.env.EXPO_PUBLIC_API_BASE?.replace("/api", "") || ""}${user.avatar}`) : null;

  const earningsQ = useQuery({
    queryKey: ["earnings", "dashboard"],
    queryFn: () => getEarningsDashboard(),
    enabled: hasSession,
  });
  const dash: any = earningsQ.data;
  const rentalsCount = dash?.summary?.rentals_count ?? 0;
  const rentalsTarget = 15;
  const rentalsProgress = Math.min(100, Math.max(0, (rentalsCount / rentalsTarget) * 100));

  const handleLogout = async () => {
    hapticImpact();
    try {
      await clearStoredTokens();
    } catch {
      // ignore
    }
    setHasSession(false);
    queryClient.clear();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    hapticImpact();
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
      queryClient.invalidateQueries({ queryKey: ["earnings", "dashboard"] })
    ]).finally(() => setRefreshing(false));
  }, [queryClient]);

  if (!hasSession) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconWrap}>
            <User size={64} color={colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Welcome to Ekra</Text>
          <Text style={styles.guestSubtitle}>
            Log in to manage your rentals, list items, and chat with hosts.
          </Text>
          <PrimaryButton
            label="Log In or Sign Up"
            onPress={() => (navigation as any).navigate("Auth", { screen: "Login" })}
            size="lg"
            variant="gradient"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (userQ.isError) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.guestContainer}>
          <View style={[styles.guestIconWrap, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
            <AlertCircle size={64} color={colors.destructive} />
          </View>
          <Text style={styles.guestTitle}>Oops! Something went wrong.</Text>
          <Text style={styles.guestSubtitle}>
            We couldn't load your profile. Please check your connection and try again.
          </Text>
          <PrimaryButton
            label="Retry"
            onPress={() => {
              hapticImpact();
              queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
            }}
            size="lg"
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (userQ.isPending || earningsQ.isPending) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.primary} 
            colors={[colors.primary]} 
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarLetter}>
                  {(user?.first_name || user?.username || "U").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.editAvatarBtn,
                pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }
              ]}
              onPress={() => {
                hapticImpact();
                navigation.navigate("Settings");
              }}
              accessibilityRole="button"
              accessibilityLabel="Edit profile picture"
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Camera size={14} color="#FFF" />
            </Pressable>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.first_name} {user?.last_name || user?.username}</Text>
            <View style={styles.userBadge}>
              <ShieldCheck size={14} color={colors.primary} />
              <Text style={styles.userBadgeText}>Verified Renter</Text>
            </View>
          </View>
        </View>

        {/* Super Host Progress */}
        <View style={styles.hostCard}>
          <View style={styles.hostCardHeader}>
            <View>
              <Text style={styles.hostCardTitle}>Become a Super Host</Text>
              <Text style={styles.hostCardSub}>Earn more trust and visibility</Text>
            </View>
            <Star size={24} color="#F59E0B" fill="#F59E0B" />
          </View>
          <View style={styles.progressWrap}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${rentalsProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{rentalsCount} / {rentalsTarget} rentals completed</Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <MenuItem
            icon={<User size={20} color={colors.primary} />}
            label="Personal Information"
            onPress={() => navigation.navigate("Settings")}
          />
          <MenuItem
            icon={<Package size={20} color={colors.primary} />}
            label="My Listings"
            onPress={() => navigation.navigate("HostArea")}
          />
          <MenuItem
            icon={<CreditCard size={20} color={colors.primary} />}
            label="Payments & Payouts"
            onPress={() => navigation.navigate("HostArea")}
          />
          <MenuItem
            icon={<Bell size={20} color={colors.primary} />}
            label="Notifications"
            onPress={() => navigation.navigate("Notifications")}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          <MenuItem
            icon={<HelpCircle size={20} color={colors.primary} />}
            label="Help Center"
            onPress={() => navigation.navigate("Contact")}
          />
          <MenuItem
            icon={<ShieldCheck size={20} color={colors.primary} />}
            label="Safety Centre"
            onPress={() => navigation.navigate("MyReports")}
          />
          <MenuItem
            icon={<LogOut size={20} color={colors.destructive} />}
            label="Log Out"
            onPress={handleLogout}
            isLast
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Ekra v1.2.0</Text>
        </View>

        <View style={{ height: layout.tabBarHeight + 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        !isLast && styles.menuItemBorder,
        pressed && styles.menuItemPressed,
      ]}
      onPress={() => {
        hapticImpact();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Navigate to ${label}`}
    >
      <View style={styles.menuItemIcon}>{icon}</View>
      <Text style={styles.menuItemLabel}>{label}</Text>
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg },

  // Guest State
  guestContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  guestIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(124, 58, 237, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.foreground,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  guestSubtitle: {
    fontSize: 15,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  avatarWrap: {
    position: "relative",
    marginRight: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.muted,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: "#FFF", fontSize: 28, fontWeight: "800" },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.foreground,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userBadgeText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "700",
  },

  // Host Card
  hostCard: {
    backgroundColor: "#F8F5FF",
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.08)",
    ...shadows.card,
    shadowOpacity: 0.04,
  },
  hostCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  hostCardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: 2,
  },
  hostCardSub: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  progressWrap: { gap: 8 },
  progressBar: {
    height: 10,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  // Menu
  menuSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.md,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124, 58, 237, 0.05)",
  },
  menuItemPressed: {
    opacity: 0.7,
    backgroundColor: "rgba(124, 58, 237, 0.02)",
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(124, 58, 237, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
  versionText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },
});
