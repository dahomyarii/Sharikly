import { LinearGradient } from "expo-linear-gradient";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, radii, shadows, spacing, layout } from "@/core/theme/tokens";
import type { ProfileStackParamList, RootStackParamList } from "@/navigation/types";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { axiosInstance, buildApiUrl, performLogout } from "@/services/api/client";
import { getEarningsDashboard } from "@/services/api/endpoints/earnings";
import { useAuthStore } from "@/store/authStore";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hapticImpact } from "@/utils/haptics";
import {
  Bell,
  ChevronRight,
  Settings,
  BadgeCheck,
  Star,
  User,
  AlertCircle,
  Plus,
  Calendar,
  Clock,
  Wallet,
  MessageSquare,
  Heart,
} from "lucide-react-native";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, "Profile">,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ProfileScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { hasSession, setHasSession } = useAuthStore();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
  // Number(): the API serializes rating as a string (DRF DecimalField); "4.5".toFixed() throws.
  const averageRating = Number(dash?.summary?.rating) || 0;
  const responseRate = user?.response_rate ?? 0;
  
  const superHostReqs = dash?.super_host?.requirements || [];
  const completedSteps = superHostReqs.filter((r: any) => r.met).length;
  const totalSteps = superHostReqs.length || 3;
  const superHostProgress = Math.min(100, Math.max(0, (completedSteps / totalSteps) * 100));

  const openLogoutConfirm = () => {
    hapticImpact();
    setLogoutVisible(true);
  };

  const confirmSignOut = async () => {
    setLoggingOut(true);
    hapticImpact();
    try {
      // Full logout: clears tokens AND the axios Authorization header. Plain
      // clearStoredTokens left a stale bearer on axios defaults, so subsequent
      // requests kept authenticating as the logged-out user until the next login.
      await performLogout();
    } catch {
      // ignore — we still drop the local session below
    }
    setLogoutVisible(false);
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
            We couldn&apos;t load your profile. Please check your connection and try again.
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#C4B0F5', '#E4D8FF', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.32 }}
      />
      
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
          <View style={styles.topBar}>
            <Text style={styles.screenTitle}>Profile</Text>
            <View style={styles.topBarActions}>
              <Pressable style={styles.actionIcon} onPress={() => navigation.navigate("Notifications")}>
                <View style={styles.notificationDot} />
                <Bell size={24} color={colors.foreground} />
              </Pressable>
              <Pressable style={styles.actionIcon} onPress={() => navigation.navigate("Settings")}>
                <Settings size={24} color={colors.foreground} />
              </Pressable>
            </View>
          </View>

          <View style={styles.userInfoSection}>
            <View style={styles.avatarWrap}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarLetter}>
                    {(user?.first_name || user?.username || "A").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {user?.is_email_verified && (
                <View style={styles.verifiedBadge}>
                  <BadgeCheck size={26} color={colors.primary} fill={colors.primary} strokeWidth={1.5} stroke="#FFF" />
                </View>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.first_name || user?.username || 'User'} {user?.last_name || ''}</Text>
              <View style={styles.ratingRow}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>
                  {averageRating > 0 ? averageRating.toFixed(1) : "—"}
                  {" "}
                  <Text style={styles.reviewsText}>
                    {rentalsCount > 0 ? `(${rentalsCount} rentals)` : "No rentals yet"}
                  </Text>
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.listEqWrapper}>
            <Pressable 
              style={({ pressed }) => [styles.listEqBtn, pressed && styles.listEqBtnPressed]}
              onPress={() => navigation.navigate("HostArea")}
            >
              <LinearGradient
                colors={['#B047F6', '#7A5AFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.listEqGradient}
              >
                <Plus size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.listEqText}>List Your Equipment</Text>
              </LinearGradient>
            </Pressable>
            <Text style={styles.earnUpToText}>Earn up to SAR 500/week</Text>
          </View>

          <View style={styles.mainWhiteCard}>
            
            <View style={styles.superHostCard}>
              <View style={styles.superHostHeader}>
                <Text style={styles.superHostTitle}>Super Host progress</Text>
                <Text style={styles.superHostCount}>{completedSteps}/{totalSteps} completed</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${superHostProgress}%` }]} />
              </View>
              <Text style={styles.superHostSub}>
                {completedSteps === totalSteps 
                  ? "You are a Super Host!" 
                  : `Complete ${totalSteps - completedSteps} more steps to unlock Super Host benefits`}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Calendar size={22} color="#B047F6" />
                <Text style={styles.statValue}>{rentalsCount}</Text>
                <Text style={styles.statLabel}>Rentals{"\n"}completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Clock size={22} color="#B047F6" />
                <Text style={styles.statValue}>{responseRate}%</Text>
                <Text style={styles.statLabel}>Response{"\n"}rate</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Star size={22} color="#B047F6" />
                <Text style={styles.statValue}>{averageRating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Average{"\n"}rating</Text>
              </View>
            </View>

            <View style={styles.menuList}>
              <MenuItem 
                icon={<Calendar size={20} color="#B047F6" />} 
                label="My Listings" 
                value={user?.listings_count != null ? `${user.listings_count} item${user.listings_count !== 1 ? 's' : ''}` : "—"} 
                onPress={() => navigation.navigate("HostArea")} 
              />
              <MenuItem
                icon={<Calendar size={20} color="#B047F6" />}
                label="My Bookings"
                value={user?.bookings_count != null ? `${user.bookings_count} booking${user.bookings_count !== 1 ? 's' : ''}` : "—"}
                onPress={() => (navigation as any).navigate("BookingsTab", { screen: "Bookings" })}
              />
              <MenuItem 
                icon={<Wallet size={20} color="#B047F6" />} 
                label="Earnings" 
                value={user?.total_earnings != null ? `SAR ${Number(user.total_earnings).toLocaleString('en-SA', { maximumFractionDigits: 0 })}` : "—"} 
                onPress={() => navigation.navigate("HostArea")} 
              />
              <MenuItem
                icon={<MessageSquare size={20} color="#B047F6" />}
                label="Reviews"
                value={user?.reviews_count != null ? `${user.reviews_count} review${user.reviews_count !== 1 ? 's' : ''}` : "—"}
                onPress={() => user?.id && navigation.navigate("PublicProfile", { userId: user.id })}
              />
              <MenuItem
                icon={<Heart size={20} color="#B047F6" />}
                label="Saved Items"
                value={user?.saved_items_count != null ? `${user.saved_items_count} item${user.saved_items_count !== 1 ? 's' : ''}` : "—"}
                onPress={() => navigation.navigate("Favorites")}
                isLast
              />
            </View>

            <View style={styles.promoBanner}>
              <LinearGradient
                colors={['#F5F3FF', '#EDE9FE']}
                style={StyleSheet.absoluteFillObject}
              />
              <Image
                source={require("../../../../assets/images/equipment_promo.png")}
                style={styles.promoImage}
                resizeMode="cover"
              />
              <View style={styles.promoContent}>
                <Text style={styles.promoTitle}>Start earning today!</Text>
                <Text style={styles.promoSub}>List more equipment and reach more people around you.</Text>
                <Pressable
                  style={styles.promoBtn}
                  onPress={() => (navigation as any).navigate("CreateListing")}
                >
                  <Text style={styles.promoBtnText}>List Now</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ marginTop: spacing.xl, marginBottom: spacing.xxl }}>
               <PrimaryButton
                 label="Log Out"
                 onPress={openLogoutConfirm}
                 variant="outline"
                 style={{ borderColor: colors.destructive }}
                 textStyle={{ color: colors.destructive }}
               />
            </View>
            
            <View style={{ height: layout.tabBarHeight + 20 }} />
          </View>
        </ScrollView>

        {/* Log out confirmation */}
        <Modal
          visible={logoutVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLogoutVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Log out</Text>
              <Text style={styles.modalBody}>
                Are you sure you want to log out of your account?
              </Text>
              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnGhost]}
                  onPress={() => setLogoutVisible(false)}
                  disabled={loggingOut}
                >
                  <Text style={styles.modalBtnGhostText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnDanger]}
                  onPress={confirmSignOut}
                  disabled={loggingOut}
                >
                  {loggingOut ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.modalBtnDangerText}>Log out</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  value,
  onPress,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
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
    >
      <View style={styles.menuItemIcon}>{icon}</View>
      <Text style={styles.menuItemLabel}>{label}</Text>
      {value && <Text style={styles.menuItemValue}>{value}</Text>}
      <ChevronRight size={18} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingBottom: 0 },

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
    backgroundColor: "rgba(176, 71, 246, 0.08)",
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

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.foreground,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.destructive,
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#FFF',
  },

  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFF',
    backgroundColor: colors.muted,
  },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: "#FFF", fontSize: 28, fontWeight: "800" },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
    marginLeft: 4,
  },
  reviewsText: {
    fontWeight: '400',
    color: colors.textSecondary,
  },

  listEqWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  listEqBtn: {
    width: '100%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.card,
  },
  listEqBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  listEqGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  listEqText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  earnUpToText: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  mainWhiteCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    flex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },

  superHostCard: {
    backgroundColor: '#FFF',
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(176, 71, 246, 0.1)',
    ...shadows.card,
    shadowOpacity: 0.03,
  },
  superHostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  superHostTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.foreground,
  },
  superHostCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F3E8FF',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  superHostSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    ...shadows.card,
    shadowOpacity: 0.02,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.foreground,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 8,
  },

  menuList: {
    backgroundColor: '#FFF',
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    ...shadows.card,
    shadowOpacity: 0.02,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  menuItemPressed: {
    opacity: 0.7,
    backgroundColor: "rgba(0,0,0,0.01)",
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },
  menuItemValue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },

  promoBanner: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
    height: 140,
  },
  promoContent: {
    padding: spacing.lg,
    width: '65%',
    zIndex: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 4,
  },
  promoSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  promoBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  promoBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  promoImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '52%',
    height: '100%',
  },

  // Log out confirmation modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 8, 40, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.cardHeavy,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  modalBtn: {
    minWidth: 96,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalBtnGhost: {
    backgroundColor: '#F3F4F6',
  },
  modalBtnGhostText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
  },
  modalBtnDanger: {
    backgroundColor: colors.destructive,
  },
  modalBtnDangerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
