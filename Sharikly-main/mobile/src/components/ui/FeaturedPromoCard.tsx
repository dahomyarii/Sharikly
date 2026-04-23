import { colors, radii, spacing } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "./PrimaryButton";

interface FeaturedPromoCardProps {
  onPress?: () => void;
  onBookNow?: () => void;
}

export function FeaturedPromoCard({ onPress, onBookNow }: FeaturedPromoCardProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <ImageBackground
        source={require("../../../assets/images/featured_canon.png")}
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        <LinearGradient
          colors={["rgba(245, 230, 211, 0.97)", "rgba(245, 230, 211, 0.65)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientOverlay}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Canon R5 Creator Kit</Text>
            
            <View style={styles.metaRow}>
              <Text style={styles.rating}>4.9</Text>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.metaText}> · 120 rentals · Riyadh</Text>
            </View>
            
            <Text style={styles.priceRow}>
              <Text style={styles.price}>SAR 180</Text>
              <Text style={styles.priceUnit}> / day</Text>
            </Text>
            
            <View style={styles.btnWrap}>
              <PrimaryButton label="Book Now" onPress={onBookNow ?? onPress} size="sm" />
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radii.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    backgroundColor: "#F5E6D3",
  },
  backgroundImage: {
    width: "100%",
    height: 180,
  },
  imageStyle: {
    resizeMode: "cover",
  },
  gradientOverlay: {
    flex: 1,
    padding: spacing.md,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    width: "60%",
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.foreground,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  rating: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.foreground,
  },
  star: {
    fontSize: 11,
    marginLeft: 2,
  },
  metaText: {
    fontSize: 13,
    color: "#4A4A4A",
    fontWeight: "500",
  },
  priceRow: {
    marginBottom: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.foreground,
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  btnWrap: {
    alignSelf: "flex-start",
    width: 100,
  },
});
