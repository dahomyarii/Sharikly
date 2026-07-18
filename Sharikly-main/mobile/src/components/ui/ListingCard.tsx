import { colors, spacing } from "@/core/theme/tokens";

import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Star } from "lucide-react-native";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AnimatedPressable } from "@/components/ui/AnimatedPressable";

interface ListingCardProps {
  listing: any;
  onPress: () => void;
  index?: number;
}

export const ListingCard = React.memo(({ listing, onPress, index = 0 }: ListingCardProps) => {
  const imageUrl = listing.images?.[0]?.image || "https://via.placeholder.com/300";
  const title = listing.title || "Untitled Listing";
  const price = listing.price_per_day || "0";
  const currency = listing.currency || "SAR";


  // Real rating only — unreviewed listings show a "New" pill, not fake 5 stars.
  const avgRating = Number(listing.average_rating) || 0;
  const hasRating = avgRating > 0;

  const avatarUrl = listing.owner?.avatar ? (listing.owner.avatar.startsWith("http") ? listing.owner.avatar : `${process.env.EXPO_PUBLIC_API_BASE?.replace("/api", "") || ""}${listing.owner.avatar}`) : null;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify().damping(14).mass(0.8)}>
      <AnimatedPressable
        onPress={onPress}
        style={styles.card}
      >
        <View style={styles.imageContainer}>
          <Animated.Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
          // @ts-ignore
          sharedTransitionTag={`listing-${listing.id}`}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.4)"]}
          style={styles.gradient}
        />
        
        {/* Rating Badge (Bottom Left) — real stars, or "New" when unreviewed */}
        {hasRating ? (
          <View style={styles.ratingBadge}>
            <Star size={12} color="#F93B69" fill="#F93B69" />
            <Text style={styles.ratingText}>{avgRating.toFixed(1)}</Text>
          </View>
        ) : (
          <View style={styles.newPill}>
            <Text style={styles.newPillText}>New</Text>
          </View>
        )}

        {/* Avatar (Bottom Right) */}
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Image source={require("../../../assets/logo.png")} style={styles.avatarFallbackImg} resizeMode="contain" />
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.price}>
          {currency} {price} <Text style={styles.period}>/ day</Text>
        </Text>
      </View>
    </AnimatedPressable>
    </Animated.View>
  );
});

ListingCard.displayName = "ListingCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "transparent",
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1.6,
    backgroundColor: colors.muted,
    // Asymmetric corners to match the website's listing cards:
    // top-left + bottom-right rounded, top-right + bottom-left sharp.
    borderTopLeftRadius: 28,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  ratingBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ratingText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  newPill: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(176,71,246,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  newPillText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  wishlistBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarFallbackImg: {
    width: "65%",
    height: "65%",
  },
  content: {
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222",
    marginBottom: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7A3E82",
  },
  period: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: "400",
  },
});
