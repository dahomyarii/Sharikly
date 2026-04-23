import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertTriangle,
  BarChart2,
  Briefcase,
  Calendar,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Hourglass,
  MessageSquare,
  Star,
  TrendingUp,
  MapPin
} from "lucide-react-native";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, shadows, spacing } from "@/core/theme/tokens";

export function HostOverviewScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const { hasSession } = useAuthStore();
  
  const userQ = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => axiosInstance.get(buildApiUrl("/auth/me/")).then((res: any) => res.data),
    enabled: hasSession,
  });
  const user = userQ.data;

  const avatarUrl = user?.avatar ? (user.avatar.startsWith("http") ? user.avatar : `${process.env.EXPO_PUBLIC_API_BASE?.replace("/api", "") || ""}${user.avatar}`) : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ─── CUSTOM HEADER ─── */}
      <View style={styles.topHeader}>
        <View style={styles.headerLogoWrap}>
          <Image 
            source={require("../../../../assets/logo.png")} 
            style={styles.headerLogoImage} 
            resizeMode="contain"
          />
          <Text style={styles.headerLogoText}>EKRA</Text>
        </View>
        <Text style={styles.headerTitle}>Host Dashboard</Text>
        <Pressable style={styles.avatarWrap} onPress={() => navigation.navigate("ProfileTab")}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarImg, { backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }]}>
               <Text style={{ color: "white", fontWeight: "700" }}>
                 {user?.first_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || "👤"}
               </Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── EARNINGS HERO ─── */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsTitleRow}>
            <View style={styles.earningsIconBg}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
            </View>
            <Text style={styles.earningsTitle}>Earnings</Text>
          </View>
          <Text style={styles.earningsAmount}>SAR 4,320.00</Text>
          <View style={styles.earningsTrendRow}>
            <TrendingUp size={14} color={colors.success} strokeWidth={3} />
            <Text style={styles.earningsTrendText}>SAR 680 this week</Text>
          </View>
        </View>

        {/* ─── STATS ROW ─── */}
        <View style={styles.statsCardRow}>
          <View style={styles.statCol}>
            <View style={styles.statColIconRow}>
              <Hourglass size={14} color={colors.mutedForeground} />
              <Text style={styles.statColLabel}>Requests</Text>
            </View>
            <Text style={styles.statColValue}>8 pending</Text>
          </View>
          <View style={styles.statColDivider} />
          <View style={styles.statCol}>
            <View style={styles.statColIconRow}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.statColLabel}>Rating</Text>
            </View>
            <Text style={styles.statColValue}>4.9</Text>
          </View>
          <View style={styles.statColDivider} />
          <View style={styles.statCol}>
            <View style={styles.statColIconRow}>
              <Briefcase size={14} color={colors.primary} />
              <Text style={styles.statColLabel}>Items Listed</Text>
            </View>
            <Text style={styles.statColValue}>5</Text>
          </View>
        </View>

        {/* ─── MANAGE BOOKINGS ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleText}>Manage Bookings</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>3</Text>
            <ChevronRight size={12} color={colors.primary} />
          </View>
        </View>
        <Pressable
          style={styles.bookingCard}
          onPress={() => navigation.navigate("BookingsTab", { screen: "HostBookings" })}
          accessibilityRole="button"
        >
          <Image
            source={require("../../../../assets/images/featured_canon.png")}
            style={styles.bookingImg}
          />
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingTitle}>Canon R5 Creator Kit</Text>
            <View style={styles.bookingLocRow}>
              <CalendarDays size={12} color={colors.primary} />
              <Text style={styles.bookingRowText}> Apr 25 at 1:00 PM</Text>
            </View>
            <View style={styles.bookingLocRow}>
              <MapPin size={12} color={colors.primary} />
              <Text style={styles.bookingRowText}> Aqiq, Riyadh</Text>
            </View>
            <View style={styles.bookingBottomRow}>
              <View style={styles.bookingLocRow}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.bookingRowText}> SAR 860</Text>
              </View>
              <Text style={styles.bookingPriceBold}>SAR 860</Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} style={{ alignSelf: "center", marginLeft: 4 }} />
        </Pressable>

        {/* ─── MANAGE ITEMS ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleText}>Manage Items</Text>
        </View>
        <View style={styles.itemsCard}>
          <View style={styles.itemAlertRow}>
            <MessageSquare size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={styles.itemAlertContent}>
              <Text style={styles.itemAlertTitle}>
                New request for <Text style={styles.itemAlertTitleBold}>DJI Mini 4 Combo</Text>
              </Text>
              <Text style={styles.itemAlertSub}>Listing paused due to high demand</Text>
            </View>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </View>
          <View style={styles.itemAlertDivider} />
          
          <View style={styles.itemAlertRow}>
            <Calendar size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={styles.itemAlertContent}>
              <Text style={styles.itemAlertTitle}>
                Booking ending soon for <Text style={styles.itemAlertTitleBold}>DJI Ronin Gimbal</Text>
              </Text>
              <Text style={styles.itemAlertSub}>Offer extension or discount?</Text>
            </View>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </View>
          <View style={styles.itemAlertDivider} />

          <View style={styles.itemAlertRow}>
            <CheckCircle2 size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={styles.itemAlertContent}>
              <Text style={styles.itemAlertTitle}>
                Your <Text style={styles.itemAlertTitleBold}>Lighting Kit</Text> is in high demand
              </Text>
              <Text style={styles.itemAlertSub}>You can increase the rental price</Text>
            </View>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </View>
        </View>

        {/* ─── QUICK ACTIONS ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleText}>Quick Actions</Text>
        </View>
        <View style={styles.quickActionsGrid}>
          <Pressable style={styles.qaCard} onPress={() => navigation.navigate("ExploreTab", { screen: "CreateListing" } as any)}>
            <LinearGradient colors={["#6D28D9", "#4C1D95"]} style={styles.qaIconBg}>
              <Camera size={20} color="#fff" />
            </LinearGradient>
            <Text style={styles.qaText}>List new item</Text>
          </Pressable>

          <Pressable style={styles.qaCard} onPress={() => navigation.navigate("HostListings" as any)}>
            <View style={[styles.qaIconBg, { backgroundColor: "transparent" }]}>
              <BarChart2 size={28} color={colors.primary} />
            </View>
            <Text style={[styles.qaText, { color: colors.primary, fontWeight: "700" }]}>Stats</Text>
          </Pressable>

          <Pressable style={styles.qaCard} onPress={() => navigation.navigate("HostEarnings")}>
            <View style={[styles.qaIconBg, { backgroundColor: "transparent" }]}>
              <CalendarDays size={28} color={colors.primary} />
            </View>
            <Text style={[styles.qaText, { color: colors.primary, fontWeight: "700" }]}>Calendar</Text>
          </Pressable>
        </View>

        {/* ─── REPORT ISSUE ─── */}
        <Pressable style={styles.reportBtn} onPress={() => (navigation as any).navigate("ProfileTab", { screen: "AdminSupportThread" })}>
          <AlertTriangle size={16} color={colors.destructive} />
          <Text style={styles.reportBtnText}>Report Issue</Text>
          <View style={{ flex: 1 }} />
          <ChevronRight size={16} color={colors.mutedForeground} />
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#EEE9FC" },
  scrollContent: { paddingBottom: 120 },

  // Header
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: "#EEE9FC",
  },
  headerLogoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLogoImage: {
    width: 30,
    height: 30,
  },
  headerLogoText: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.foreground,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    overflow: "hidden",
    backgroundColor: colors.muted,
  },
  avatarImg: { width: "100%", height: "100%" },

  // Earnings Hero
  earningsCard: {
    marginHorizontal: spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.card,
    shadowOpacity: 0.07,
    borderWidth: 1,
    borderColor: "rgba(120,80,220,0.08)",
    marginBottom: spacing.md,
  },
  earningsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  earningsIconBg: {
    width: 24,
    height: 24,
    borderRadius: radii.md,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  earningsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.foreground,
    letterSpacing: -1,
    marginBottom: 4,
  },
  earningsTrendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  earningsTrendText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.success,
  },

  // Stats Row
  statsCardRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: spacing.md,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    ...shadows.card,
    shadowOpacity: 0.07,
    borderWidth: 1,
    borderColor: "rgba(120,80,220,0.08)",
    marginBottom: spacing.lg,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statColDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  statColIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  statColLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: "500",
  },
  statColValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },
  sectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3EDFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    gap: 2,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
  },

  // Booking Card
  bookingCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.sm,
    ...shadows.card,
    shadowOpacity: 0.07,
    borderWidth: 1,
    borderColor: "rgba(120,80,220,0.08)",
    marginBottom: spacing.lg,
    gap: 12,
    alignItems: "center",
  },
  bookingImg: {
    width: 80,
    height: 80,
    borderRadius: radii.lg,
  },
  bookingInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  bookingRowText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  bookingLocRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookingBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  bookingPriceBold: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.foreground,
  },

  // Items Alerts Card
  itemsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card,
    shadowOpacity: 0.07,
    borderWidth: 1,
    borderColor: "rgba(120,80,220,0.08)",
    marginBottom: spacing.lg,
  },
  itemAlertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 4,
  },
  itemAlertContent: {
    flex: 1,
  },
  itemAlertTitle: {
    fontSize: 13,
    color: colors.foreground,
    marginBottom: 2,
    fontWeight: "500",
  },
  itemAlertTitleBold: {
    fontWeight: "800",
  },
  itemAlertSub: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  itemAlertDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
    opacity: 0.5,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    gap: 12,
  },
  qaCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
    shadowOpacity: 0.07,
    borderWidth: 1,
    borderColor: "rgba(120,80,220,0.08)",
    gap: 10,
  },
  qaIconBg: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  qaText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.foreground,
  },

  // Report Issue
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card,
    shadowOpacity: 0.07,
    borderWidth: 1,
    borderColor: "rgba(120,80,220,0.08)",
    gap: 12,
  },
  reportBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  notLoggedIn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  notLoggedInTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground, textAlign: "center" },
  notLoggedInSub: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
  signInBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  signInBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    borderRadius: radii.xl,
    overflow: "hidden",
    ...shadows.fab,
  },
  fabGradient: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
});
