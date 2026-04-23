import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, radii, shadows, spacing, typography, layout } from "@/core/theme/tokens";
import type { ListingsStackParamList } from "@/navigation/types";
import { getListing, getListings } from "@/services/api/endpoints/listings";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { hapticImpact } from "@/utils/haptics";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  Heart,
  Info,
  Share2,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react-native";
import Animated from "react-native-reanimated";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";

type Nav = NativeStackNavigationProp<ListingsStackParamList, "ListingDetail">;
type R = RouteProp<ListingsStackParamList, "ListingDetail">;

function getFullUrl(url: string | undefined) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE.replace("/api", "")}${url}`;
}

function buildMapboxStaticUrl(args: {
  lat: number;
  lng: number;
  zoom?: number;
  width?: number;
  height?: number;
}) {
  if (!MAPBOX_TOKEN) return null;
  const {
    lat,
    lng,
    zoom = 11,
    width = 900,
    height = 520,
  } = args;

  // marker: purple pin, like web styling
  const marker = `pin-s+7c3aed(${lng},${lat})`;
  const center = `${lng},${lat},${zoom},0`;
  const size = `${Math.round(width)}x${Math.round(height)}@2x`;

  // Note: static maps API doesn't natively draw radius circles without overlays.
  // We keep the card identical visually (marker-centered) and use the same token wiring.
  const style = "mapbox/streets-v12";
  const url =
    `https://api.mapbox.com/styles/v1/${style}/static/` +
    `${marker}/${center}/${size}?access_token=${MAPBOX_TOKEN}&logo=false&attribution=false`;
  return url;
}


const FALLBACK_SIMILAR = [
  { id: -1, title: "Lighting Kit", image: require("../../../../assets/images/featured_canon.png") },
  { id: -2, title: "DJI Ronin Gimbal", image: require("../../../../assets/images/hero_canyon.png") },
  { id: -3, title: "DJI Mini 4 Combo", image: require("../../../../assets/images/featured_canon.png") },
];

export function ListingDetailScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { id } = useRoute<R>().params;
  const [activeImg, setActiveImg] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleDayPress = (day: number) => {
    hapticImpact();
    const selectedDate = new Date(year, month, day);
    selectedDate.setHours(0, 0, 0, 0);
    if (!startDate || (startDate && endDate)) {
      setStartDate(selectedDate);
      setEndDate(null);
    } else if (selectedDate < startDate) {
      setStartDate(selectedDate);
    } else {
      setEndDate(selectedDate);
    }
  };

  const isSelected = (day: number) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    if (startDate && d.getTime() === startDate.getTime()) return true;
    if (endDate && d.getTime() === endDate.getTime()) return true;
    if (startDate && endDate && d > startDate && d < endDate) return true;
    return false;
  };

  const isStart = (day: number) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    return startDate && d.getTime() === startDate.getTime();
  };

  const isEnd = (day: number) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    return endDate && d.getTime() === endDate.getTime();
  };

  const nextMonth = () => {
    hapticImpact();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    hapticImpact();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const q = useQuery({
    queryKey: ["listing", id],
    queryFn: () => getListing(id),
  });

  const similarQ = useQuery({
    queryKey: ["listings", "similar", id],
    queryFn: () => getListings({ page_size: 6 }),
    enabled: !!q.data,
  });

  // Price Breakdown Calculations
  const pricePerDay = parseFloat((q.data as any)?.price_per_day ?? "0");
  let days = 0;
  let subtotal = 0;
  let serviceFee = 0;
  let total = 0;

  if (startDate && endDate) {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    subtotal = pricePerDay * days;
    serviceFee = Math.round(subtotal * 0.1 * 100) / 100;
    total = Math.round((subtotal + serviceFee) * 100) / 100;
  }

  const similarRaw = similarQ.data
    ? Array.isArray(similarQ.data)
      ? similarQ.data
      : (similarQ.data as any)?.results ?? []
    : [];
  const similarListings = (similarRaw as any[])
    .filter((l) => l?.id !== id)
    .slice(0, 6);

  if (q.isPending) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading Ekra...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (q.isError || !q.data) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>Could not load listing.</Text>
          <Pressable onPress={() => void q.refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const data: any = q.data;
  const images: string[] = (data.images ?? [])
    .map((img: any) => getFullUrl(img.image))
    .filter(Boolean);
  if (images.length === 0) images.push("");

  const ownerName = data.owner?.first_name ?? data.owner?.username ?? "User";
  const ownerAvatar = getFullUrl(data.owner?.avatar);
  const currency = data.currency ?? "SAR";
  const avgRating = data.average_rating ?? 4.9;
  const reviewCount = data.reviews?.length ?? 0;
  const city = data.city ?? "Riyadh";
  const listingTitle: string = data.title ?? "Listing";

  async function onShare() {
    try {
      await Share.share({
        message: `${listingTitle} on Ekra — ${currency} ${data.price_per_day ?? ""} / day`,
      });
    } catch {
      // no-op
    }
  }

  async function onOpenMap() {
    const lat = typeof (data as any)?.latitude === "number" ? (data as any).latitude : null;
    const lng = typeof (data as any)?.longitude === "number" ? (data as any).longitude : null;
    const query = encodeURIComponent(`${city}`);
    const url = lat != null && lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert("Map unavailable", "Could not open maps right now.");
    }
  }

  return (
    <View style={styles.safeOuter}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO IMAGE ── */}
        <View style={styles.heroWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              setActiveImg(idx);
            }}
          >
            {images.map((url, i) => (
              url ? (
                <Animated.Image 
                  key={i} 
                  source={{ uri: url }} 
                  style={styles.heroImage} 
                  resizeMode="cover" 
                  // @ts-ignore
                  sharedTransitionTag={i === 0 ? `listing-${id}` : undefined}
                />
              ) : (
                <Animated.Image
                  key={i}
                  source={require("../../../../assets/images/featured_canon.png")}
                  style={styles.heroImage}
                  resizeMode="cover"
                  // @ts-ignore
                  sharedTransitionTag={i === 0 ? `listing-${id}` : undefined}
                />
              )
            ))}
          </ScrollView>

          {/* Page dots */}
          {images.length > 1 && (
            <View style={styles.pageDots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeImg && styles.dotActive]} />
              ))}
            </View>
          )}

          {/* Status badge */}
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>⭐ Top Rated</Text>
          </View>

          {/* Floating header buttons */}
          <SafeAreaView style={styles.floatingHeader} edges={["top"]}>
            <Pressable onPress={() => navigation.goBack()} style={styles.floatBtn} hitSlop={8}>
              <ArrowLeft size={20} color="#1C1628" />
            </Pressable>
            <View style={styles.floatBtnGroup}>
              <Pressable
                style={styles.floatBtn}
                hitSlop={8}
                onPress={() => {
                  hapticImpact();
                  setIsFavorited((v) => !v);
                }}
                accessibilityRole="button"
                accessibilityLabel={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  size={20}
                  color={isFavorited ? colors.destructive : "#1C1628"}
                  fill={isFavorited ? colors.destructive : "transparent"}
                />
              </Pressable>
              <Pressable
                style={styles.floatBtn}
                hitSlop={8}
                onPress={() => void onShare()}
                accessibilityRole="button"
                accessibilityLabel="Share listing"
              >
                <Share2 size={20} color="#1C1628" />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        {/* ── CONTENT CARD ── */}
        <View style={styles.contentCard}>

          {/* Title */}
          <Text style={styles.title}>{data.title ?? "Listing Title"}</Text>

          {/* Rating row */}
          <View style={styles.ratingRow}>
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingNum}>{avgRating}</Text>
            <Text style={styles.ratingMeta}> · {reviewCount} reviews · {city}</Text>
          </View>

          {/* Host row */}
          <View style={styles.hostRow}>
            {ownerAvatar ? (
              <Image source={{ uri: ownerAvatar }} style={styles.hostAvatar} />
            ) : (
              <View style={[styles.hostAvatar, styles.hostAvatarFallback]}>
                <Text style={styles.hostAvatarLetter}>
                  {ownerName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.hostText}>Hosted by <Text style={styles.hostNameBold}>{ownerName}</Text></Text>
            <View style={styles.verifiedChip}>
              <CheckCircle size={13} color="#10B981" strokeWidth={2.5} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>


          {/* Trust badges */}
          <View style={styles.trustGrid}>
            <View style={styles.trustTile}>
              <CheckCircle size={13} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.trustText}>Secure payment</Text>
            </View>
            <View style={styles.trustTile}>
              <CheckCircle size={13} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.trustText}>Insurance</Text>
            </View>
            <View style={styles.trustTile}>
              <ShieldCheck size={13} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.trustText}>Verified host</Text>
            </View>
            <View style={styles.trustTile}>
              <CheckCircle size={13} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.trustText}>Free cancellation</Text>
            </View>
          </View>

          {/* Deposit info chip */}
          <View style={styles.depositChip}>
            <Info size={14} color={colors.primary} />
            <Text style={styles.depositText}>Refundable deposit: {currency} {data.deposit ?? "500"}</Text>
          </View>

          {/* ── DESCRIPTION ── */}
          <Text style={styles.sectionLabel}>Overview</Text>
          <View style={styles.descContainer}>
            <View style={styles.instantRow}>
              <Zap size={14} color={colors.primary} fill={colors.primary} />
              <Text style={styles.instantText}>Instant Booking Available</Text>
            </View>
            <Text style={styles.descriptionText}>{data.description ?? "No description provided."}</Text>
          </View>

          {/* ── AVAILABILITY CARD ── */}
          <View style={styles.availabilityCard}>
            {/* Price */}
            <View style={styles.availabilityPriceBox}>
              <Text style={styles.availabilityPriceAmount}>{currency} {data.price_per_day ?? "0"}</Text>
              <Text style={styles.availabilityPriceUnit}>per day</Text>
            </View>

            {/* Calendar */}
            <Text style={styles.availabilityTitle}>Select Dates</Text>
            <View style={styles.calendarBox}>
              <View style={styles.calendarHeader}>
                <Pressable onPress={prevMonth} hitSlop={10}>
                  <Text style={styles.calendarChevron}>‹</Text>
                </Pressable>
                <Text style={styles.calendarMonthLabel}>{monthNames[month]} {year}</Text>
                <Pressable onPress={nextMonth} hitSlop={10}>
                  <Text style={styles.calendarChevron}>›</Text>
                </Pressable>
              </View>
              <View style={styles.calendarWeekRow}>
                {["S","M","T","W","T","F","S"].map((d, i) => (
                  <Text key={i} style={styles.calendarDayLabel}>{d}</Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {Array.from({ length: firstDay }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.calendarCell} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const selected = isSelected(day);
                  const start = isStart(day);
                  const end = isEnd(day);
                  const isBetween = selected && !start && !end;

                  return (
                    <Pressable
                      key={`day-${day}`}
                      style={[
                        styles.calendarCell,
                        selected && styles.calendarCellSelected,
                        start && styles.calendarCellStart,
                        end && styles.calendarCellEnd,
                        isBetween && styles.calendarCellBetween,
                      ]}
                      onPress={() => handleDayPress(day)}
                    >
                      <Text
                        style={[
                          styles.calendarCellText,
                          selected && styles.calendarCellTextSelected,
                          isBetween && styles.calendarCellTextBetween,
                        ]}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Date selection summary */}
            {startDate && (
              <View style={styles.dateSummaryBox}>
                {endDate ? (
                  <Text style={styles.dateSummaryText}>
                    {startDate.toLocaleDateString()} — {endDate.toLocaleDateString()}
                  </Text>
                ) : (
                  <Text style={styles.dateSummaryText}>
                    {startDate.toLocaleDateString()} — <Text style={styles.dateSummaryPlaceholder}>select end date</Text>
                  </Text>
                )}
              </View>
            )}

            {/* Price Breakdown */}
            {startDate && endDate && (
              <View style={styles.priceBreakdownBox}>
                <View style={styles.priceBreakdownRow}>
                  <Text style={styles.priceBreakdownText}>
                    {currency} {pricePerDay.toFixed(2)} × {days} day{days !== 1 ? "s" : ""}
                  </Text>
                  <Text style={styles.priceBreakdownText}>{currency} {subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.priceBreakdownRow}>
                  <Text style={styles.priceBreakdownText}>Service fee</Text>
                  <Text style={styles.priceBreakdownText}>{currency} {serviceFee.toFixed(2)}</Text>
                </View>
                <View style={[styles.priceBreakdownRow, styles.priceBreakdownTotalRow]}>
                  <Text style={styles.priceBreakdownTotalLabel}>Total</Text>
                  <Text style={styles.priceBreakdownTotalValue}>{currency} {total.toFixed(2)}</Text>
                </View>
              </View>
            )}

            {/* Action Button */}
            <View style={styles.availabilityActionBox}>
              <PrimaryButton
                label="Send Request"
                onPress={() => navigation.navigate("RequestBooking", { id })}
              />
            </View>
          </View>

          {/* ── LOCATION (web-style card) ── */}
          {(() => {
            const lat =
              typeof (data as any)?.latitude === "number"
                ? (data as any).latitude
                : null;
            const lng =
              typeof (data as any)?.longitude === "number"
                ? (data as any).longitude
                : null;
            const radiusM =
              typeof (data as any)?.pickup_radius_m === "number"
                ? (data as any).pickup_radius_m
                : null;
            const mapUrl =
              lat != null && lng != null
                ? buildMapboxStaticUrl({ lat, lng, zoom: 11 })
                : null;

            return (
              <View style={styles.locationCard}>
                <View style={styles.locationHeaderRow}>
                  <View style={styles.locationTitleWrap}>
                    <Text style={styles.locationTitle}>Pickup Location</Text>
                    <Text style={styles.locationSubtitle}>
                      {city ? `Pickup near ${city}` : "Pickup location shown on the map"}
                    </Text>
                  </View>
                  {radiusM ? (
                    <View style={styles.radiusBadge}>
                      <Text style={styles.radiusBadgeText}>
                        ~{(radiusM / 1609.34).toFixed(1)} mi radius
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Pressable
                  style={styles.mapFrame}
                  onPress={() => void onOpenMap()}
                  accessibilityRole="button"
                  accessibilityLabel="Open pickup location on map"
                >
                  <Image
                    source={
                      mapUrl
                        ? { uri: mapUrl }
                        : require("../../../../assets/images/hero_canyon.png")
                    }
                    style={styles.mapImage}
                    resizeMode="cover"
                  />
                </Pressable>
              </View>
            );
          })()}

          {/* ── SIMILAR LISTINGS ── */}
          <View style={styles.similarHeader}>
            <Text style={styles.sectionLabel}>Similar Listings</Text>
            <Pressable onPress={() => (navigation as any).navigate("ListingsExplore")}>
              <Text style={styles.viewAllLink}>View All</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.similarScroll}
          >
            {(similarListings.length > 0 ? similarListings : FALLBACK_SIMILAR).map((item: any, i: number) => {
              const thumbUrl = item.images?.[0]?.image
                ? getFullUrl(item.images[0].image)
                : null;
              return (
                <Pressable
                  key={item.id ?? i}
                  style={styles.similarCard}
                  onPress={() => {
                    if (typeof item.id === "number" && item.id > 0) {
                      navigation.push("ListingDetail", { id: item.id });
                    }
                  }}
                >
                  <Image
                    source={thumbUrl ? { uri: thumbUrl } : item.image ?? require("../../../../assets/images/featured_canon.png")}
                    style={styles.similarImg}
                    resizeMode="cover"
                  />
                  <Text style={styles.similarName} numberOfLines={1}>
                    {item.title ?? item.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ height: layout.tabBarHeight + 40 }} />
        </View>
      </ScrollView>

      {/* ── STICKY bottom bar ── */}
      <View style={styles.stickyBar}>
        <View>
          <Text style={styles.stickyPrice}>
            {currency} {data?.price_per_day ?? "0"}
            <Text style={styles.stickyPriceUnit}> / day</Text>
          </Text>
        </View>
        <PrimaryButton
          label="Secure Booking"
          onPress={() => navigation.navigate("RequestBooking", { id })}
          size="md"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeOuter: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { ...typography.body, color: colors.mutedForeground, fontWeight: "600" },
  errorText: { ...typography.body, color: colors.destructive },
  retryBtn: { marginTop: 16, backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 20, borderRadius: radii.full },
  retryText: { ...typography.body, color: colors.primary, fontWeight: "700" },

  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // Hero
  heroWrap: {
    width: SCREEN_W,
    height: SCREEN_W * 0.8,
    position: "relative",
    backgroundColor: colors.accent,
  },
  heroImage: {
    width: SCREEN_W,
    height: SCREEN_W * 0.8,
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  floatBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  floatBtnGroup: {
    flexDirection: "row",
    gap: 10,
  },
  stockBadge: {
    position: "absolute",
    bottom: 30,
    left: 16,
    backgroundColor: "#7C3AED",
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...shadows.card,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  pageDots: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 18,
  },

  // Content
  contentCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    marginTop: -24,
    padding: spacing.lg,
    paddingTop: spacing.lg,
    ...shadows.cardHeavy,
    shadowOpacity: 0.05,
    minHeight: 600,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.foreground,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  ratingNum: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
    marginLeft: 4,
  },
  ratingMeta: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.lg,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth:1,
    borderColor: "rgba(124, 58, 237, 0.08)",
  },
  hostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.muted,
  },
  hostAvatarFallback: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  hostAvatarLetter: { color: "#fff", fontSize: 16, fontWeight: "800" },
  hostText: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  hostNameBold: { fontWeight: "800", color: colors.foreground },
  verifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedText: { fontSize: 11, fontWeight: "800", color: "#10B981" },


  // Trust (2x2 grid)
  trustGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md,
    gap: 12,
  },
  trustTile: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
  },
  trustText: {
    fontSize: 13,
    color: colors.foreground,
    fontWeight: "600",
  },

  // Deposit
  depositChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(124, 58, 237, 0.06)",
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: spacing.xl,
  },
  depositText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "700",
  },

  // Section label
  sectionLabel: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.foreground,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },

  // Description
  descContainer: {
    marginBottom: spacing.xl,
    paddingHorizontal: 4,
  },
  instantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  instantText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    fontWeight: "400",
  },

  // Availability Card
  availabilityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 34,
    padding: 24,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    shadowOpacity: 0.06,
  },
  availabilityPriceBox: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  availabilityPriceAmount: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  availabilityPriceUnit: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: "500",
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 12,
  },
  calendarBox: {
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calendarChevron: { 
    fontSize: 24, 
    color: colors.primary, 
    fontWeight: "600",
    paddingHorizontal: 8,
  },
  calendarMonthLabel: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: colors.foreground 
  },
  calendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  calendarDayLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "700",
    width: 36,
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  calendarCell: {
    width: `${100 / 7}%`,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  calendarCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  calendarCellStart: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  calendarCellEnd: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  calendarCellBetween: {
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderRadius: 0,
  },
  calendarCellText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  calendarCellTextSelected: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  calendarCellTextBetween: {
    color: colors.primary,
    fontWeight: "700",
  },
  dateSummaryBox: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  dateSummaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  dateSummaryPlaceholder: {
    color: colors.textMuted,
  },
  priceBreakdownBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
    marginBottom: 20,
    gap: 12,
  },
  priceBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceBreakdownText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  priceBreakdownTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  priceBreakdownTotalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
  },
  priceBreakdownTotalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
  },
  availabilityActionBox: {
    paddingTop: 8,
  },

  // Location (web-style card)
  locationCard: {
    marginTop: 24,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: 16,
  },
  locationHeaderRow: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  locationTitleWrap: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
  },
  locationSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
  },
  radiusBadge: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.75)",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  radiusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  mapFrame: {
    minHeight: 210,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    backgroundColor: "rgba(255,255,255,0.55)",
    overflow: "hidden",
  },
  mapImage: { width: "100%", height: 210 },

  // Similar listings
  similarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  viewAllLink: { fontSize: 14, fontWeight: "700", color: colors.primary },
  similarScroll: { gap: 12, paddingRight: spacing.md },
  similarCard: {
    width: 120,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    ...shadows.card,
    shadowOpacity: 0.05,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.08)",
  },
  similarImg: { width: "100%", height: 84, backgroundColor: colors.muted },
  similarName: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
    padding: 8,
  },

  // Sticky bar
  stickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 34,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderTopWidth: 1,
    borderTopColor: "rgba(124, 58, 237, 0.1)",
    ...shadows.tabBar,
  },
  stickyPrice: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.foreground,
  },
  stickyPriceUnit: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
});
