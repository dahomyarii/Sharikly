import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import type { ListingsStackParamList } from "@/navigation/types";
import { getListing } from "@/services/api/endpoints/listings";
import { requestBooking } from "@/services/api/endpoints/bookings";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  MapPin,
  Shield,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { useAuthStore } from "@/store/authStore";

type Nav = NativeStackNavigationProp<ListingsStackParamList, "RequestBooking">;
type R = RouteProp<ListingsStackParamList, "RequestBooking">;

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";
const DEPOSIT_SAR = 500;

function getImageUrl(path: string | undefined) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_BASE.replace("/api", "")}${path}`;
}

function parseDateStr(s: string): Date | null {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function diffDays(start: string, end: string): number {
  const s = parseDateStr(start);
  const e = parseDateStr(end);
  if (!s || !e) return 0;
  return Math.max(0, Math.ceil((e.getTime() - s.getTime()) / 86400000));
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}


function formatDatesLabel(start: string, end: string, days: number): string {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const sLabel = s.toLocaleDateString("en", { month: "short", day: "numeric" });
    const eLabel = e.toLocaleDateString("en", { month: "short", day: "numeric" });
    return `${sLabel} · ${eLabel} (${days} ${days === 1 ? "day" : "days"})`;
  } catch {
    return `${start} → ${end}`;
  }
}

export function RequestBookingScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { id } = useRoute<R>().params;
  const { hasSession } = useAuthStore();

  const [startDate] = useState(today());
  const [endDate] = useState(
    (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split("T")[0]; })()
  );
  const [termsAgreed, setTermsAgreed] = useState(false);

  const q = useQuery({
    queryKey: ["listing", id],
    queryFn: () => getListing(id),
  });

  const userQ = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => axiosInstance.get(buildApiUrl("/auth/me/")).then((res: any) => res.data),
    enabled: hasSession,
  });

  const mutation = useMutation({
    mutationFn: () =>
      requestBooking(id, {
        start_date: startDate,
        end_date: endDate,
      }),
    onSuccess: (_booking: any) => {
      Alert.alert("Booking Requested! 🎉", "Your booking request has been sent to the host.", [
        {
          text: "View Booking",
          onPress: () => navigation.navigate("BookingsRenter" as any),
        },
        { text: "OK", style: "cancel" },
      ]);
    },
    onError: (err: any) => {
      const detail =
        err?.response?.data?.detail ??
        err?.response?.data?.non_field_errors?.[0] ??
        "Failed to request booking. Please try again.";
      Alert.alert("Error", String(detail));
    },
  });

  const listing: any = q.data;
  const user: any = userQ.data;
  const currency = listing?.currency ?? "SAR";
  const pricePerDay = parseFloat(listing?.price_per_day ?? "180");
  const days = diffDays(startDate, endDate);
  const subtotal = pricePerDay * days;
  const total = subtotal + DEPOSIT_SAR;

  const imageUrl = listing?.images?.[0]
    ? getImageUrl(listing.images[0].image)
    : null;

  const avatarUrl = user?.avatar
    ? (user.avatar.startsWith("http") ? user.avatar : `${API_BASE.replace("/api", "")}${user.avatar}`)
    : null;

  const city = listing?.city ?? "Aqiq, Riyadh";
  const datesLabel = formatDatesLabel(startDate, endDate, days);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarIcon}>📋</Text>
          <Text style={styles.topTitle}>Review & Confirm</Text>
        </View>
        <View style={styles.avatarMini}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarImg, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>
                {user?.first_name?.charAt(0)?.toUpperCase() ?? "👤"}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Countdown Banner (commented out — payment not yet active) ── */}
        {/* <View style={styles.countdownBanner}>
          <Clock size={16} color="#92400E" />
          <Text style={styles.countdownText}>Complete your booking in 2 minutes</Text>
        </View> */}

        {/* ── Listing Summary ── */}
        <View style={styles.card}>
          <View style={styles.listingRow}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.listingThumb} resizeMode="cover" />
            ) : (
              <Image
                source={require("../../../../assets/images/featured_canon.png")}
                style={styles.listingThumb}
                resizeMode="cover"
              />
            )}
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle} numberOfLines={2}>
                {listing?.title ?? "Canon R5 Creator Kit"}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>📅</Text>
                <Text style={styles.metaText}>{datesLabel}</Text>
              </View>
              <View style={styles.metaRow}>
                <MapPin size={12} color={colors.primary} />
                <Text style={styles.metaText}>{city}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Price Breakdown ── */}
        <View style={styles.card}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>{currency} {subtotal > 0 ? subtotal.toFixed(0) : "360"}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Deposit</Text>
            <Text style={styles.priceValue}>{currency} {DEPOSIT_SAR}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceTotalLabel}>Total</Text>
            <Text style={styles.priceTotalValue}>{currency} {total > DEPOSIT_SAR ? total.toFixed(0) : "860"}</Text>
          </View>
          <Text style={styles.serviceFeesNote}>Service fees included</Text>
        </View>

        {/* ── Payment Method (commented out — payment integration coming soon) ── */}
        {/* <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentRow}>
            <View style={styles.visaChip}>
              <Text style={styles.visaText}>VISA</Text>
            </View>
            <Text style={styles.cardNumber}>***** 4242</Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => Alert.alert("Add Card", "Card management coming soon.")}>
              <Text style={styles.addCardText}>Add new card</Text>
            </Pressable>
          </View>
        </View> */}

        {/* ── Pickup Info ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pickup Info</Text>
          <View style={styles.pickupRow}>
            <MapPin size={14} color={colors.primary} />
            <Text style={styles.pickupText}>{city}</Text>
          </View>
          <View style={styles.pickupRow}>
            <Clock size={14} color={colors.mutedForeground} />
            <Text style={styles.pickupText}>Pickup time: <Text style={{ fontWeight: "700", color: "#1C1628" }}>1:00 PM</Text></Text>
          </View>
          <View style={[styles.pickupRow, { marginBottom: 14 }]}>
            <Clock size={14} color={colors.mutedForeground} />
            <Text style={styles.pickupText}>
              Drop-off time: <Text style={{ fontWeight: "700", color: "#1C1628" }}>1:00 PM</Text>{" "}
              <Text style={styles.dropOffDate}>(Apr 27)</Text>
            </Text>
          </View>

          {/* Trust bullets */}
          {[
            "Secure 256-bit SSL encryption",
            "Free cancellations within 24 hours",
            "Refundable security deposit",
          ].map((text) => (
            <View key={text} style={styles.trustRow}>
              <CheckCircle size={14} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.trustText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* ── Terms checkbox ── */}
        <Pressable
          style={styles.termsRow}
          onPress={() => setTermsAgreed((v) => !v)}
        >
          <View style={[styles.checkbox, termsAgreed && styles.checkboxChecked]}>
            {termsAgreed && <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            I agree to the{" "}
            <Text style={styles.termsLink}>Terms of Service</Text>,{" "}
            <Text style={styles.termsLink}>Rental Agreement</Text>,{"\n"}and{" "}
            <Text style={styles.termsLink}>Refund Policy</Text>.
          </Text>
        </Pressable>

        {/* ── Confirm Booking Button ── */}
        <Pressable
          style={({ pressed }) => [
            styles.payBtn,
            (!termsAgreed || mutation.isPending) && styles.payBtnDisabled,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => {
            if (!termsAgreed) {
              Alert.alert("Please agree to the terms before proceeding.");
              return;
            }
            mutation.mutate();
          }}
          disabled={mutation.isPending}
        >
          <Shield size={16} color="#fff" />
          <Text style={styles.payBtnText}>
            {mutation.isPending ? "Sending Request…" : "Confirm Booking Request"}
          </Text>
        </Pressable>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0EDFB" },

  // Header
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: "#F0EDFB",
  },
  topBarCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  topBarIcon: { fontSize: 18 },
  topTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
    shadowOpacity: 0.08,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md },

  // Countdown banner
  countdownBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: radii.lg,
    padding: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  countdownText: { fontSize: 14, fontWeight: "600", color: "#92400E" },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
    shadowOpacity: 0.06,
    borderWidth: 1,
    borderColor: "rgba(120,80,220,0.07)",
  },

  // Listing
  listingRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  listingThumb: {
    width: 76,
    height: 76,
    borderRadius: radii.md,
    backgroundColor: colors.muted,
  },
  listingInfo: { flex: 1, gap: 5 },
  listingTitle: { fontSize: 16, fontWeight: "800", color: "#1C1628", lineHeight: 21 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaIcon: { fontSize: 12 },
  metaText: { fontSize: 13, color: "#6B5E8F", fontWeight: "500" },

  // Price
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceLabel: { fontSize: 14, color: "#6B5E8F" },
  priceValue: { fontSize: 14, fontWeight: "600", color: "#1C1628" },
  priceDivider: { height: 1, backgroundColor: "rgba(120,80,220,0.1)", marginVertical: 8 },
  priceTotalLabel: { fontSize: 16, fontWeight: "700", color: "#1C1628" },
  priceTotalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: -0.3,
  },
  serviceFeesNote: {
    fontSize: 12,
    color: "#9B8DB8",
    textAlign: "right",
    marginTop: 4,
  },

  // Payment method
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1628",
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  visaChip: {
    backgroundColor: "#1A1F71",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  visaText: { color: "#fff", fontWeight: "900", fontSize: 13, letterSpacing: 1 },
  cardNumber: { fontSize: 15, fontWeight: "600", color: "#1C1628" },
  addCardText: { fontSize: 13, color: colors.mutedForeground, fontWeight: "600" },

  // Pickup
  pickupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  pickupText: { fontSize: 14, color: "#6B5E8F", fontWeight: "500" },
  dropOffDate: { color: "#9B8DB8" },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 5,
  },
  trustText: { fontSize: 13, color: "#1C1628", fontWeight: "500" },

  // Terms checkbox
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: { fontSize: 13, color: "#6B5E8F", lineHeight: 19, flex: 1 },
  termsLink: { color: colors.primary, fontWeight: "600" },

  // Pay button
  payBtn: {
    backgroundColor: "#5B21B6",
    borderRadius: radii.xl,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    ...shadows.card,
    shadowColor: "#5B21B6",
    shadowOpacity: 0.35,
  },
  payBtnDisabled: {
    opacity: 0.55,
  },
  payBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
