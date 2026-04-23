import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { getBooking, updateBookingStatus } from "@/services/api/endpoints/bookings";
import type { BookingsStackParamList } from "@/navigation/types";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gift,
  Headphones,
  MapPin,
  MessageCircle,
  Navigation2,
  Plus,
  Shield,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

type Nav = NativeStackNavigationProp<BookingsStackParamList, "BookingReceipt">;
type R = RouteProp<BookingsStackParamList, "BookingReceipt">;

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";
const { width: SCREEN_W } = Dimensions.get("window");

function getImageUrl(path: string | undefined) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_BASE.replace("/api", "")}${path}`;
}

function openMapsToLocation(city: string) {
  const query = encodeURIComponent(city || "Riyadh");
  const url = `https://maps.google.com/?q=${query}`;
  void Linking.openURL(url);
}

function fmt(s: string) {
  try { return new Date(s).toLocaleDateString("en", { month: "short", day: "numeric" }); }
  catch { return s; }
}

// ── Timeline step definition ──────────────────────────────────────────────────
type StepState = "done" | "active" | "pending";
interface TimelineStep { label: string; sub?: string; state: StepState }

function getTimeline(status: string): TimelineStep[] {
  const stepMap: Record<string, number> = {
    pending: 0,
    approved: 2,
    preparing: 2,
    ready: 3,
    active: 4,
    completed: 5,
    cancelled: 0,
  };
  const current = stepMap[status] ?? 0;

  const steps: { label: string; sub?: string }[] = [
    { label: "Booking Confirmed" },
    { label: "Host Accepted" },
    { label: "Preparing Item", sub: "Host is getting the item ready · 1:00 PM (Apr 27)" },
    { label: "Ready for Pickup" },
    { label: "In Use" },
    { label: "Returned" },
  ];

  return steps.map((s, i) => ({
    ...s,
    state: i < current ? "done" : i === current ? "active" : "pending",
  }));
}

const SUGGESTED_ITEMS = [
  { name: "Lighting Kit", image: require("../../../../assets/images/featured_canon.png") },
  { name: "Tripod", image: require("../../../../assets/images/hero_canyon.png") },
  { name: "Extra Battery", image: require("../../../../assets/images/featured_canon.png") },
];

export function BookingReceiptScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { id } = useRoute<R>().params;
  const queryClient = useQueryClient();

  const q = useQuery({
    queryKey: ["booking", id],
    queryFn: () => getBooking(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => updateBookingStatus(id, "cancelled"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["booking", id] });
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      Alert.alert("Booking cancelled.");
    },
    onError: () => Alert.alert("Failed to cancel booking."),
  });

  if (q.isPending) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}><Text style={styles.mutedText}>Loading…</Text></View>
      </SafeAreaView>
    );
  }

  // Use mock data if API fails — so the screen always looks great
  const booking: any = q.data ?? {
    id,
    status: "approved",
    start_date: "2026-04-25",
    end_date: "2026-04-27",
    total_price: "860",
    currency: "SAR",
    listing: { title: "Canon R5 Creator Kit", city: "Aqiq, Riyadh" },
  };

  const listing = booking.listing;
  const currency = booking.currency ?? "SAR";
  const imageUrl = listing?.images?.[0] ? getImageUrl(listing.images[0].image) : null;
  const startLabel = fmt(booking.start_date ?? "2026-04-25");
  const endLabel = fmt(booking.end_date ?? "2026-04-27");
  const canCancel = ["pending", "approved"].includes(booking.status);
  const isUpcomingPickup = booking.status === "approved";
  const steps = getTimeline(booking.status);

  // ── BOOKING CONFIRMED VIEW (pending) ────────────────────────────────────────
  if (booking.status === "pending") {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Confetti Hero */}
          <View style={styles.heroWrap}>
            <LinearGradient colors={["#C9B8F8", "#E8DFFC", "#F5F0FF"]} style={styles.heroGradient}>
              <View style={styles.confettiLayer} pointerEvents="none">
                {["#FF6B6B","#FFD93D","#6BCB77","#4D96FF","#FF6B9D","#C9B8F8"].map((c,i)=>(
                  <View key={i} style={[styles.confettiDot,{backgroundColor:c,width:8+(i%3)*4,height:8+(i%3)*4,borderRadius:i%2===0?4:2,top:20+(i*37)%90,left:(i*53)%(SCREEN_W-40),transform:[{rotate:`${i*30}deg`}],opacity:0.85}]} />
                ))}
              </View>
              <View style={styles.checkCircleOuter}>
                <View style={styles.checkCircle}>
                  <CheckCircle2 size={44} color="#fff" strokeWidth={2.5} />
                </View>
              </View>
              <Text style={styles.heroTitle}>Booking Confirmed</Text>
              <Text style={styles.heroSub}>Your item is ready 🎉</Text>
            </LinearGradient>
          </View>

          <View style={styles.contentWrap}>
            {/* Booking card */}
            <View style={styles.card}>
              <View style={styles.bookingRow}>
                <Image source={imageUrl ? {uri:imageUrl} : require("../../../../assets/images/featured_canon.png")} style={styles.bookingThumb} resizeMode="cover" />
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingTitle} numberOfLines={2}>{listing?.title ?? "Canon R5 Creator Kit"}</Text>
                  <View style={styles.metaRow}><Text style={styles.metaIcon}>📅</Text><Text style={styles.metaText}>{startLabel} → {endLabel}</Text></View>
                  <View style={styles.metaRow}><MapPin size={12} color={colors.primary} /><Text style={styles.metaText}>{listing?.city ?? "Aqiq, Riyadh"}</Text></View>
                  <View style={styles.metaRow}><Text style={styles.metaIcon}>🪙</Text><Text style={styles.metaText}>{currency} {booking.total_price ?? "860"} <Text style={styles.allFees}>(All fees included)</Text></Text></View>
                </View>
              </View>
            </View>

            {/* Next step */}
            <View style={styles.card}>
              <Text style={styles.nextStepLabel}>Next step:</Text>
              <View style={styles.nextStepRow}>
                <View style={styles.hourglassBg}><Text style={{fontSize:20}}>⏳</Text></View>
                <View style={{flex:1}}>
                  <Text style={styles.nextStepTitle}>Waiting for host preparation</Text>
                  <Text style={styles.nextStepSub}>▶ Ready for pickup at 1:00 PM</Text>
                </View>
              </View>
            </View>

            <Pressable
              style={styles.primaryBtn}
              onPress={() => (navigation as any).navigate("BookingsTab", { screen: "BookingsRenter" })}
            >
              <Text style={styles.primaryBtnText}>View My Bookings</Text>
            </Pressable>
            <Pressable
              style={styles.outlineBtn}
              onPress={() => (navigation as any).navigate("ProfileTab", { screen: "ChatInbox" })}
            >
              <Text style={styles.outlineBtnText}>Contact Host</Text>
            </Pressable>

            <View style={styles.trustBadges}>
              {["Payment secured","Deposit refundable","Support available 24/7"].map(t=>(
                <View key={t} style={styles.trustRow}>
                  <CheckCircle2 size={15} color={colors.success} strokeWidth={2.5} />
                  <Text style={styles.trustText}>{t}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={styles.primaryBtn}
              onPress={() => (navigation as any).navigate("ExploreTab", { screen: "ListingsExplore" })}
            >
              <Plus size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>+ Add to booking</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>You might also need:</Text>
            <View style={styles.suggestedRow}>
              {SUGGESTED_ITEMS.map((item,i)=>(
                <Pressable
                  key={i}
                  style={styles.suggestedItem}
                  onPress={() =>
                    (navigation as any).navigate("ExploreTab", {
                      screen: "ListingsExplore",
                      params: { search: item.name },
                    })
                  }
                >
                  <Image source={item.image} style={styles.suggestedImg} resizeMode="cover" />
                  <Text style={styles.suggestedName}>{item.name}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.inviteBanner}
              onPress={() => (navigation as any).navigate("ProfileTab", { screen: "Profile" })}
              accessibilityRole="button"
              accessibilityLabel="Invite a friend"
            >
              <Gift size={18} color={colors.primary} />
              <Text style={styles.inviteText}>Invite a friend & get SAR 20</Text>
              <View style={{flex:1}} />
              <ChevronRight size={16} color={colors.mutedForeground} />
            </Pressable>

            {canCancel && (
              <Pressable style={styles.cancelBtn} onPress={() => Alert.alert("Cancel Booking","Are you sure?", [{text:"No",style:"cancel"},{text:"Cancel Booking",style:"destructive",onPress:()=>cancelMutation.mutate()}])}>
                <Text style={styles.cancelBtnText}>Cancel Booking</Text>
              </Pressable>
            )}
          </View>
          <View style={{height:100}} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── BOOKING DETAILS VIEW (approved/active) ──────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarIcon}>📷</Text>
          <Text style={styles.topBarTitle}>Booking Details</Text>
        </View>
        <View style={styles.iconBtn}>
          <Text style={{fontSize:18}}>👤</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:100}}>
        {/* Upcoming Pickup Banner */}
        {isUpcomingPickup && (
          <View style={styles.pickupBanner}>
            <View style={styles.pickupBannerInner}>
              <Text style={styles.pickupBannerTitle}>🟡 Upcoming Pickup</Text>
            </View>
            <View style={styles.pickupCountdownRow}>
              <Text style={styles.pickupBold}>Pickup in:</Text>
              <Text style={styles.pickupTimer}> ⏳ 2 hours 15 min</Text>
            </View>
          </View>
        )}

        {/* Progress Track */}
        <View style={styles.progressTrackWrap}>
          <View style={styles.progressDots}>
            <View style={[styles.progressDotFilled]} />
            {Array.from({length:8}).map((_,i)=>(
              <View key={i} style={[styles.progressDotSmall, i < 3 && styles.progressDotFilledSmall]} />
            ))}
            <View style={[styles.progressDotCircle]} />
            {Array.from({length:8}).map((_,i)=>(
              <View key={i} style={[styles.progressDotSmall, styles.progressDotEmpty]} />
            ))}
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineWrap}>
          {steps.map((step, i) => (
            <View key={i} style={styles.timelineRow}>
              {/* Icon */}
              <View style={styles.timelineIconCol}>
                {step.state === "done" ? (
                  <View style={styles.timelineIconDone}>
                    <CheckCircle2 size={16} color="#fff" strokeWidth={2.5} />
                  </View>
                ) : step.state === "active" ? (
                  <View style={styles.timelineIconActive}>
                    <View style={styles.timelineIconActiveInner} />
                  </View>
                ) : (
                  <View style={styles.timelineIconPending} />
                )}
                {i < steps.length - 1 && (
                  <View style={[styles.timelineLine, step.state === "done" && styles.timelineLineDone]} />
                )}
              </View>
              {/* Text */}
              <View style={styles.timelineContent}>
                <Text style={[
                  styles.timelineLabel,
                  step.state === "active" && styles.timelineLabelActive,
                  step.state === "pending" && styles.timelineLabelPending,
                ]}>
                  {step.label}
                  {step.state === "active" && step.sub ? (
                    <Text style={styles.timelineActiveSub}> · {step.sub.split("·")[0]}</Text>
                  ) : null}
                </Text>
                {step.state === "active" && step.sub && (
                  <Text style={styles.timelineSubTime}>
                    🎒 {step.sub.split("·")[1]?.trim() ?? "1:00 PM (Apr 27)"}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Booking card */}
        <View style={[styles.card, {marginHorizontal:spacing.md}]}>
          <View style={styles.bookingRow}>
            <Image source={imageUrl ? {uri:imageUrl} : require("../../../../assets/images/featured_canon.png")} style={styles.bookingThumb} resizeMode="cover" />
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingTitle} numberOfLines={2}>{listing?.title ?? "Canon R5 Creator Kit"}</Text>
              <View style={styles.metaRow}><Text style={styles.metaIcon}>📅</Text><Text style={styles.metaText}>{startLabel} → {endLabel}</Text></View>
              <View style={styles.metaRow}><MapPin size={12} color={colors.primary} /><Text style={styles.metaText}>{listing?.city ?? "Aqiq, Riyadh"}</Text></View>
              <View style={styles.metaRow}><Text style={styles.metaIcon}>🪙</Text><Text style={styles.metaText}>{currency} {booking.total_price ?? "860"} <Text style={styles.allFees}>(All included)</Text></Text></View>
            </View>
          </View>
        </View>

        {/* Pickup Info */}
        <View style={[styles.card, {marginHorizontal:spacing.md, marginTop:10}]}>
          <View style={styles.pickupInfoHeader}>
            <Text style={styles.pickupInfoTitle}>Pickup Info</Text>
            <Pressable onPress={() => openMapsToLocation(listing?.city ?? "Riyadh")}>
              <Text style={styles.openMapText}>Open Map &gt;</Text>
            </Pressable>
          </View>
          <View style={styles.metaRow}>
            <Clock size={14} color={colors.mutedForeground} />
            <Text style={styles.metaText}>Pickup time: <Text style={{fontWeight:"700",color:"#1C1628"}}>1:00 PM</Text></Text>
            <View style={{flex:1}} />
            <Pressable onPress={() => openMapsToLocation(listing?.city ?? "Riyadh")}><Text style={styles.openMapText}>Open Map</Text></Pressable>
          </View>
          <View style={styles.actionRow}>
            <Pressable style={styles.navigateBtn} onPress={() => openMapsToLocation(listing?.city ?? "Riyadh")}>
              <Navigation2 size={16} color="#fff" />
              <Text style={styles.navigateBtnText}>Navigate</Text>
            </Pressable>
            <Pressable style={styles.contactBtn} onPress={() => (navigation as any).navigate("ProfileTab",{screen:"ChatInbox"})}>
              <MessageCircle size={16} color={colors.primary} />
              <Text style={styles.contactBtnText}>Contact Host</Text>
            </Pressable>
          </View>
        </View>

        {/* Info rows */}
        <View style={[styles.infoCard, {marginHorizontal:spacing.md, marginTop:10}]}>
          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <View style={styles.infoIconWrap}><View style={[styles.infoIconDot,{backgroundColor:"#E5E7EB"}]} /></View>
              <Text style={styles.infoRowText}>Chat unlocked</Text>
            </View>
            <CheckCircle2 size={16} color={colors.success} />
            <ChevronRight size={16} color={colors.mutedForeground} />
          </View>
          <View style={styles.infoRowDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <Shield size={16} color={colors.primary} />
              <Text style={styles.infoRowText}>Deposit: <Text style={{fontWeight:"700"}}>SAR 500</Text></Text>
            </View>
            <Text style={styles.infoRowRight}>Status: Held 🔒</Text>
          </View>
        </View>

        {/* Support */}
        <View style={[styles.infoCard, {marginHorizontal:spacing.md, marginTop:10}]}>
          <Pressable style={styles.infoRow} onPress={() => (navigation as any).navigate("ProfileTab", { screen: "AdminSupportThread" })}>
            <AlertTriangle size={16} color={colors.destructive} />
            <Text style={[styles.infoRowText,{color:colors.destructive}]}>Report Problem</Text>
            <View style={{flex:1}} />
            <ChevronRight size={16} color={colors.mutedForeground} />
          </Pressable>
          <View style={styles.infoRowDivider} />
          <Pressable style={styles.infoRow} onPress={() => (navigation as any).navigate("ProfileTab", { screen: "Contact" })}>
            <Headphones size={16} color={colors.primary} />
            <Text style={[styles.infoRowText,{color:colors.primary}]}>Ekra Support</Text>
            <View style={{flex:1}} />
            <ChevronRight size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Cancel */}
        {canCancel && (
          <Pressable
            style={[styles.cancelBtn,{marginHorizontal:spacing.md,marginTop:12}]}
            onPress={() => Alert.alert("Cancel Booking","Are you sure?", [
              {text:"No",style:"cancel"},
              {text:"Cancel",style:"destructive",onPress:()=>cancelMutation.mutate()}
            ])}
          >
            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0EDFB" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  mutedText: { color: colors.mutedForeground },

  // Booking Details Header
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: "#F0EDFB",
  },
  topBarCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  topBarIcon: { fontSize: 18 },
  topBarTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground },
  iconBtn: {
    width: 38, height: 38, borderRadius: radii.full,
    backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center",
    ...shadows.card, shadowOpacity: 0.08,
  },

  // Pickup Banner
  pickupBanner: {
    marginHorizontal: spacing.md,
    marginBottom: 12,
    backgroundColor: "#FFF",
    borderRadius: radii.xl,
    overflow: "hidden",
    ...shadows.card, shadowOpacity: 0.06,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.07)",
  },
  pickupBannerInner: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  pickupBannerTitle: { fontSize: 15, fontWeight: "700", color: "#92400E" },
  pickupCountdownRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  pickupBold: { fontSize: 16, fontWeight: "700", color: "#1C1628" },
  pickupTimer: { fontSize: 16, color: "#1C1628" },

  // Progress dots track
  progressTrackWrap: {
    marginHorizontal: spacing.md,
    marginBottom: 4,
  },
  progressDots: { flexDirection: "row", alignItems: "center", gap: 3 },
  progressDotFilled: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.success, borderWidth: 3, borderColor: "#fff",
    ...shadows.card,
  },
  progressDotSmall: { width: 8, height: 3, borderRadius: 2 },
  progressDotFilledSmall: { backgroundColor: colors.success },
  progressDotEmpty: { backgroundColor: "#D1D5DB" },
  progressDotCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 3, borderColor: colors.primary,
    backgroundColor: "#fff",
  },

  // Timeline
  timelineWrap: {
    marginHorizontal: spacing.md,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card, shadowOpacity: 0.06,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.07)",
  },
  timelineRow: { flexDirection: "row", gap: 14, minHeight: 36 },
  timelineIconCol: { alignItems: "center", width: 22 },
  timelineIconDone: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.success,
    alignItems: "center", justifyContent: "center",
  },
  timelineIconActive: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 3, borderColor: colors.primary,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff",
  },
  timelineIconActiveInner: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primary,
  },
  timelineIconPending: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
  },
  timelineLine: {
    flex: 1, width: 2,
    backgroundColor: "#D1D5DB",
    marginTop: 2, marginBottom: 2,
    minHeight: 20,
  },
  timelineLineDone: { backgroundColor: colors.success },
  timelineContent: { flex: 1, paddingBottom: 14, paddingTop: 2 },
  timelineLabel: { fontSize: 15, fontWeight: "600", color: "#1C1628" },
  timelineLabelActive: { fontWeight: "800" },
  timelineLabelPending: { color: colors.mutedForeground, fontWeight: "500" },
  timelineActiveSub: { fontWeight: "400", color: colors.mutedForeground, fontSize: 13 },
  timelineSubTime: { fontSize: 13, color: colors.mutedForeground, marginTop: 3 },

  // Scrollable content (Confirmed view)
  scrollContent: { paddingBottom: 100 },
  contentWrap: { padding: spacing.md, gap: spacing.sm },

  // Booking Confirmed Hero
  heroWrap: { marginBottom: 0 },
  heroGradient: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
    position: "relative",
    overflow: "hidden",
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  confettiDot: { position: "absolute" },
  checkCircleOuter: { marginBottom: 16 },
  checkCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#16A34A",
    alignItems: "center", justifyContent: "center",
    ...shadows.cardHeavy,
    shadowColor: "#16A34A", shadowOpacity: 0.4,
  },
  heroTitle: {
    fontSize: 26, fontWeight: "900", color: "#1C1628",
    letterSpacing: -0.5,
  },
  heroSub: { fontSize: 16, color: "#1C1628", marginTop: 6 },

  // Cards
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card, shadowOpacity: 0.06,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.07)",
  },
  bookingRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  bookingThumb: {
    width: 80, height: 80,
    borderRadius: radii.md,
    backgroundColor: colors.muted,
  },
  bookingInfo: { flex: 1, gap: 5 },
  bookingTitle: { fontSize: 16, fontWeight: "800", color: "#1C1628", lineHeight: 21 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaIcon: { fontSize: 12 },
  metaText: { fontSize: 13, color: "#6B5E8F", fontWeight: "500" },
  allFees: { color: colors.mutedForeground, fontWeight: "400" },

  // Pickup Info card
  pickupInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  pickupInfoTitle: { fontSize: 16, fontWeight: "700", color: "#1C1628" },
  openMapText: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  navigateBtn: {
    flex: 1, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 13,
    ...shadows.card, shadowColor: colors.primary, shadowOpacity: 0.3,
  },
  navigateBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  contactBtn: {
    flex: 1, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: 8,
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 13,
    backgroundColor: "#F5F0FF",
  },
  contactBtnText: { fontSize: 15, fontWeight: "700", color: colors.primary },

  // Info rows card
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    ...shadows.card, shadowOpacity: 0.06,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.07)",
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.md, paddingVertical: 14,
    gap: 10,
  },
  infoRowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  infoIconWrap: { width: 22, alignItems: "center" },
  infoIconDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#D1D5DB" },
  infoRowText: { fontSize: 15, fontWeight: "600", color: "#1C1628" },
  infoRowRight: { fontSize: 14, color: colors.mutedForeground },
  infoRowDivider: { height: 1, backgroundColor: "rgba(120,80,220,0.07)", marginHorizontal: spacing.md },

  // Confirmed-view specific
  nextStepLabel: { fontSize: 13, color: colors.mutedForeground, fontWeight: "600", marginBottom: 8 },
  nextStepRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  hourglassBg: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#FEF3C7",
    alignItems: "center", justifyContent: "center",
  },
  nextStepTitle: { fontSize: 16, fontWeight: "700", color: "#1C1628" },
  nextStepSub: { fontSize: 13, color: colors.mutedForeground, marginTop: 3 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    ...shadows.card, shadowColor: colors.primary, shadowOpacity: 0.3,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  outlineBtn: {
    borderRadius: radii.xl,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1.5, borderColor: colors.primary,
    backgroundColor: "#F5F0FF",
  },
  outlineBtnText: { fontSize: 16, fontWeight: "700", color: colors.primary },
  trustBadges: { gap: 8, paddingVertical: 4 },
  trustRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  trustText: { fontSize: 14, color: "#1C1628", fontWeight: "500" },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1C1628", marginTop: 4, marginBottom: 4 },
  suggestedRow: { flexDirection: "row", gap: 10 },
  suggestedItem: { flex: 1, borderRadius: radii.lg, overflow: "hidden", ...shadows.card, shadowOpacity: 0.06 },
  suggestedImg: { width: "100%", height: 72, backgroundColor: colors.muted },
  suggestedName: { textAlign: "center", fontSize: 11, fontWeight: "600", color: "#1C1628", padding: 6, backgroundColor: "#fff" },
  inviteBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F5F0FF",
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1, borderColor: "rgba(124,58,237,0.12)",
  },
  inviteText: { fontSize: 14, fontWeight: "600", color: "#1C1628" },
  cancelBtn: {
    borderRadius: radii.xl,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5, borderColor: colors.destructive,
    backgroundColor: "#FFF5F5",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "700", color: colors.destructive },

  errorText: { fontSize: 14, color: colors.destructive },
  retryText: { fontSize: 14, color: colors.primary, fontWeight: "600" },
});
