import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { getEarningsDashboard } from "@/services/api/endpoints/earnings";
import { getBookings } from "@/services/api/endpoints/bookings";
import { getListings } from "@/services/api/endpoints/listings";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertTriangle,
  BarChart2,
  Briefcase,
  Calendar,
  CalendarDays,
  Camera,
  ChevronRight,
  Hourglass,
  MapPin,
  Package,
  Plus,
  Star,
  TrendingUp,
} from "lucide-react-native";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, shadows, spacing } from "@/core/theme/tokens";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";

function getImageUrl(path: string | undefined) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_BASE.replace("/api", "")}${path}`;
}

function formatSar(v: string | number | undefined) {
  if (!v && v !== 0) return "SAR 0";
  const n = parseFloat(String(v));
  if (isNaN(n)) return "SAR 0";
  if (n >= 1000) return `SAR ${(n / 1000).toFixed(1)}k`;
  return `SAR ${n.toFixed(0)}`;
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

export function HostOverviewScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const { hasSession } = useAuthStore();

  // ── Auth / User ──
  const userQ = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => axiosInstance.get(buildApiUrl("/auth/me/")).then((res: any) => res.data),
    enabled: hasSession,
  });
  const user = userQ.data;
  const avatarUrl = user?.avatar ? getImageUrl(user.avatar) : null;

  // ── Earnings Dashboard ──
  const earningsQ = useQuery({
    queryKey: ["earnings", "dashboard"],
    queryFn: () => getEarningsDashboard(),
    enabled: hasSession,
  });
  const dash: any = earningsQ.data;
  const totalEarnings = dash?.summary?.total_earnings ?? 0;
  const thisWeek = dash?.summary?.this_week_earnings ?? dash?.summary?.this_month_earnings ?? 0;

  // ── Host Bookings ──
  const bookingsQ = useQuery({
    queryKey: ["bookings", "host"],
    queryFn: () => getBookings({ role: "host" }),
    enabled: hasSession,
  });
  const allBookings: any[] = bookingsQ.data
    ? Array.isArray(bookingsQ.data)
      ? bookingsQ.data
      : (bookingsQ.data as any)?.results ?? []
    : [];
  const pendingBookings = allBookings.filter((b) => b.status === "PENDING" || b.status === "pending");
  const pendingCount = pendingBookings.length;
  const latestBooking = allBookings[0] ?? null;

  // ── My Listings ──
  const listingsQ = useQuery({
    queryKey: ["listings", "mine"],
    queryFn: () => getListings({ mine: 1 }),
    enabled: hasSession,
  });
  const myListings: any[] = listingsQ.data
    ? Array.isArray(listingsQ.data)
      ? listingsQ.data
      : (listingsQ.data as any)?.results ?? []
    : [];
  const itemCount = myListings.length;

  // ── Average Rating from my listings ──
  const totalRating = myListings.reduce((sum, l) => {
    const r = parseFloat(l.average_rating ?? l.rating ?? "0");
    return isNaN(r) ? sum : sum + r;
  }, 0);
  const ratedListings = myListings.filter((l) => l.average_rating != null || l.rating != null);
  const avgRating = ratedListings.length > 0 ? (totalRating / ratedListings.length).toFixed(1) : "—";

  const isLoading = userQ.isPending || earningsQ.isPending || bookingsQ.isPending || listingsQ.isPending;

  if (!hasSession) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.notLoggedIn}>
          <Text style={styles.notLoggedInTitle}>Host Dashboard</Text>
          <Text style={styles.notLoggedInSub}>Sign in to manage your listings and earnings.</Text>
          <Pressable style={styles.signInBtn} onPress={() => navigation.navigate("Auth", { screen: "Login" })}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ─── EARNINGS HERO ─── */}
          <View style={styles.earningsCard}>
            <View style={styles.earningsTitleRow}>
              <View style={styles.earningsIconBg}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
              </View>
              <Text style={styles.earningsTitle}>Earnings</Text>
            </View>
            <Text style={styles.earningsAmount}>{formatSar(totalEarnings)}</Text>
            <View style={styles.earningsTrendRow}>
              <TrendingUp size={14} color={colors.success} strokeWidth={3} />
              <Text style={styles.earningsTrendText}>{formatSar(thisWeek)} this period</Text>
            </View>
          </View>

          {/* ─── STATS ROW ─── */}
          <View style={styles.statsCardRow}>
            <View style={styles.statCol}>
              <View style={styles.statColIconRow}>
                <Hourglass size={14} color={colors.mutedForeground} />
                <Text style={styles.statColLabel}>Requests</Text>
              </View>
              <Text style={styles.statColValue}>{pendingCount > 0 ? `${pendingCount} pending` : "No pending"}</Text>
            </View>
            <View style={styles.statColDivider} />
            <View style={styles.statCol}>
              <View style={styles.statColIconRow}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.statColLabel}>Rating</Text>
              </View>
              <Text style={styles.statColValue}>{avgRating}</Text>
            </View>
            <View style={styles.statColDivider} />
            <View style={styles.statCol}>
              <View style={styles.statColIconRow}>
                <Briefcase size={14} color={colors.primary} />
                <Text style={styles.statColLabel}>Items Listed</Text>
              </View>
              <Text style={styles.statColValue}>{itemCount}</Text>
            </View>
          </View>

          {/* ─── LATEST BOOKING ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleText}>Recent Bookings</Text>
            {pendingCount > 0 && (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{pendingCount}</Text>
                <ChevronRight size={12} color={colors.primary} />
              </View>
            )}
          </View>

          {latestBooking ? (
            <Pressable
              style={styles.bookingCard}
              onPress={() => navigation.navigate("BookingsTab", { screen: "HostBookings" })}
              accessibilityRole="button"
            >
              {(() => {
                const imageUrl = latestBooking.listing?.images?.[0]?.image
                  ? getImageUrl(latestBooking.listing.images[0].image)
                  : null;
                return imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.bookingImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.bookingImg, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
                    <Package size={24} color={colors.mutedForeground} />
                  </View>
                );
              })()}
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingTitle} numberOfLines={1}>
                  {latestBooking.listing?.title ?? "Listing"}
                </Text>
                <View style={styles.bookingLocRow}>
                  <CalendarDays size={12} color={colors.primary} />
                  <Text style={styles.bookingRowText}> {formatDate(latestBooking.start_date)}</Text>
                </View>
                {latestBooking.listing?.city && (
                  <View style={styles.bookingLocRow}>
                    <MapPin size={12} color={colors.primary} />
                    <Text style={styles.bookingRowText}> {latestBooking.listing.city}</Text>
                  </View>
                )}
                <View style={styles.bookingBottomRow}>
                  <View style={[styles.statusChip, {
                    backgroundColor:
                      latestBooking.status === "CONFIRMED" ? "#D1FAE5" :
                        latestBooking.status === "PENDING" ? "#FEF3C7" : "#FEE2E2"
                  }]}>
                    <Text style={{
                      fontSize: 10, fontWeight: "700",
                      color:
                        latestBooking.status === "CONFIRMED" ? "#065F46" :
                          latestBooking.status === "PENDING" ? "#92400E" : "#991B1B"
                    }}>
                      {latestBooking.status ?? "—"}
                    </Text>
                  </View>
                  <Text style={styles.bookingPriceBold}>
                    {formatSar(latestBooking.total_price)}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.mutedForeground} style={{ alignSelf: "center", marginLeft: 4 }} />
            </Pressable>
          ) : (
            <View style={styles.emptyCard}>
              <Calendar size={28} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>No bookings yet</Text>
            </View>
          )}

          {/* ─── MANAGE ITEMS ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleText}>My Items</Text>
          </View>

          {myListings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Package size={28} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>No listings yet. Add your first item!</Text>
            </View>
          ) : (
            <View style={styles.itemsCard}>
              {myListings.slice(0, 3).map((listing: any, i: number) => {
                const imageUrl = listing.images?.[0]?.image ? getImageUrl(listing.images[0].image) : null;
                const isActive = listing.is_active !== false;
                return (
                  <Pressable
                    key={listing.id}
                    style={[styles.itemAlertRow, i < Math.min(myListings.length, 3) - 1 && styles.itemAlertDivider]}
                    onPress={() => navigation.navigate("HostListings")}
                  >
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.itemThumb} resizeMode="cover" />
                    ) : (
                      <View style={[styles.itemThumb, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
                        <Package size={16} color={colors.mutedForeground} />
                      </View>
                    )}
                    <View style={styles.itemAlertContent}>
                      <Text style={styles.itemAlertTitle} numberOfLines={1}>{listing.title}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <View style={[styles.statusChip, { backgroundColor: isActive ? "#D1FAE5" : "#F3F4F6" }]}>
                          <Text style={{ fontSize: 9, fontWeight: "700", color: isActive ? "#065F46" : "#6B7280" }}>
                            {isActive ? "Active" : "Inactive"}
                          </Text>
                        </View>
                        <Text style={styles.itemAlertSub}>SAR {listing.price_per_day}/day</Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color={colors.mutedForeground} />
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* ─── QUICK ACTIONS ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleText}>Quick Actions</Text>
          </View>
          <View style={styles.quickActionsGrid}>
            <Pressable
              style={styles.qaCard}
              onPress={() => navigation.navigate("ExploreTab", { screen: "CreateListing" } as any)}
            >
              <LinearGradient colors={["#6D28D9", "#4C1D95"]} style={styles.qaIconBg}>
                <Plus size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.qaText}>Add Item</Text>
            </Pressable>

            <Pressable style={styles.qaCard} onPress={() => navigation.navigate("HostListings" as any)}>
              <View style={[styles.qaIconBg, { backgroundColor: colors.accent }]}>
                <BarChart2 size={22} color={colors.primary} />
              </View>
              <Text style={[styles.qaText, { color: colors.primary, fontWeight: "700" }]}>My Items</Text>
            </Pressable>

            <Pressable style={styles.qaCard} onPress={() => navigation.navigate("HostEarnings")}>
              <View style={[styles.qaIconBg, { backgroundColor: "#FEF3C7" }]}>
                <TrendingUp size={22} color="#D97706" />
              </View>
              <Text style={[styles.qaText, { color: "#D97706", fontWeight: "700" }]}>Earnings</Text>
            </Pressable>
          </View>

          {/* ─── REPORT ISSUE ─── */}
          <Pressable
            style={styles.reportBtn}
            onPress={() => navigation.navigate("ProfileTab", { screen: "AdminSupportThread" })}
          >
            <AlertTriangle size={16} color={colors.destructive} />
            <Text style={styles.reportBtnText}>Report Issue</Text>
            <View style={{ flex: 1 }} />
            <ChevronRight size={16} color={colors.mutedForeground} />
          </Pressable>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
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
  headerLogoWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerLogoImage: { width: 30, height: 30 },
  headerLogoText: { fontSize: 20, fontWeight: "900", color: colors.primary, letterSpacing: -0.5 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  avatarWrap: {
    width: 36, height: 36, borderRadius: radii.full,
    overflow: "hidden", backgroundColor: colors.muted,
  },
  avatarImg: { width: "100%", height: "100%" },

  // Not logged in
  notLoggedIn: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  notLoggedInTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground, textAlign: "center" },
  notLoggedInSub: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
  signInBtn: { marginTop: 8, backgroundColor: colors.primary, borderRadius: radii.xl, paddingHorizontal: 24, paddingVertical: 14 },
  signInBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Earnings Hero
  earningsCard: {
    marginHorizontal: spacing.md, backgroundColor: "#FFFFFF",
    borderRadius: radii.xl, padding: spacing.lg,
    ...shadows.card, shadowOpacity: 0.07,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.08)", marginBottom: spacing.md,
  },
  earningsTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  earningsIconBg: {
    width: 24, height: 24, borderRadius: radii.md,
    backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center",
  },
  earningsTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground },
  earningsAmount: { fontSize: 32, fontWeight: "800", color: colors.foreground, letterSpacing: -1, marginBottom: 4 },
  earningsTrendRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  earningsTrendText: { fontSize: 13, fontWeight: "600", color: colors.success },

  // Stats Row
  statsCardRow: {
    flexDirection: "row", backgroundColor: "#FFFFFF",
    marginHorizontal: spacing.md, borderRadius: radii.xl, paddingVertical: spacing.md,
    ...shadows.card, shadowOpacity: 0.07,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.08)", marginBottom: spacing.lg,
  },
  statCol: { flex: 1, alignItems: "center" },
  statColDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  statColIconRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  statColLabel: { fontSize: 13, color: colors.mutedForeground, fontWeight: "500" },
  statColValue: { fontSize: 14, fontWeight: "700", color: colors.foreground },

  // Sections
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginHorizontal: spacing.md, marginBottom: spacing.sm, marginTop: spacing.sm,
  },
  sectionTitleText: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  sectionBadge: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#F3EDFF",
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.full, gap: 2,
  },
  sectionBadgeText: { fontSize: 12, fontWeight: "800", color: colors.primary },

  // Booking Card
  bookingCard: {
    flexDirection: "row", backgroundColor: "#FFFFFF",
    marginHorizontal: spacing.md, borderRadius: radii.xl, padding: spacing.sm,
    ...shadows.card, shadowOpacity: 0.07,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.08)", marginBottom: spacing.lg,
    gap: 12, alignItems: "center",
  },
  bookingImg: { width: 80, height: 80, borderRadius: radii.lg },
  bookingInfo: { flex: 1, justifyContent: "center", gap: 4 },
  bookingTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground },
  bookingRowText: { fontSize: 12, color: colors.textSecondary, fontWeight: "500" },
  bookingLocRow: { flexDirection: "row", alignItems: "center" },
  bookingBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  bookingPriceBold: { fontSize: 14, fontWeight: "800", color: colors.foreground },
  statusChip: { alignSelf: "flex-start", borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 3 },

  // Empty State
  emptyCard: {
    backgroundColor: "#FFFFFF", marginHorizontal: spacing.md, borderRadius: radii.xl,
    padding: spacing.lg, alignItems: "center", gap: 8, justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(120,80,220,0.08)", marginBottom: spacing.lg,
  },
  emptyText: { fontSize: 13, color: colors.mutedForeground, textAlign: "center" },

  // Items Card
  itemsCard: {
    backgroundColor: "#FFFFFF", marginHorizontal: spacing.md, borderRadius: radii.xl,
    padding: spacing.sm, ...shadows.card, shadowOpacity: 0.07,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.08)", marginBottom: spacing.lg,
  },
  itemAlertRow: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: spacing.sm,
  },
  itemAlertDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemThumb: { width: 44, height: 44, borderRadius: radii.md },
  itemAlertContent: { flex: 1 },
  itemAlertTitle: { fontSize: 13, color: colors.foreground, fontWeight: "600" },
  itemAlertSub: { fontSize: 11, color: colors.mutedForeground },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: "row", justifyContent: "space-between",
    marginHorizontal: spacing.md, marginBottom: spacing.lg, gap: 12,
  },
  qaCard: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: radii.lg, padding: spacing.md,
    alignItems: "center", justifyContent: "center", ...shadows.card, shadowOpacity: 0.07,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.08)", gap: 10,
  },
  qaIconBg: { width: 48, height: 48, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  qaText: { fontSize: 12, fontWeight: "600", color: colors.foreground },

  // Report Issue
  reportBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    marginHorizontal: spacing.md, borderRadius: radii.xl, padding: spacing.md,
    ...shadows.card, shadowOpacity: 0.07, borderWidth: 1, borderColor: "rgba(120,80,220,0.08)", gap: 12,
  },
  reportBtnText: { fontSize: 14, fontWeight: "600", color: colors.foreground },
});
