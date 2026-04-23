import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import type { HostStackParamList, MainTabParamList } from "@/navigation/types";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle,
  DollarSign,
  Package,
  Search,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HostStackParamList, "StartRenting">,
  BottomTabNavigationProp<MainTabParamList>
>;

const WHY_EARN = [
  {
    icon: Wallet,
    title: "Earn Passive Income",
    text: "Your idle items can generate SAR 500–5,000/month depending on demand.",
    bg: "#EDE9FE",
    iconColor: colors.primary,
  },
  {
    icon: Shield,
    title: "Secure & Protected",
    text: "Every booking is tracked and verified. You stay in control of who rents your items.",
    bg: "#D1FAE5",
    iconColor: "#059669",
  },
  {
    icon: TrendingUp,
    title: "Growing Community",
    text: "Thousands of renters browse Ekra daily. List today and start earning this week.",
    bg: "#FEF3C7",
    iconColor: "#D97706",
  },
];

const HOW_STEPS = [
  { icon: Camera, step: "1", title: "Add your item", text: "Take photos and add a description. It takes less than 5 minutes." },
  { icon: Search, step: "2", title: "Renters find you", text: "Renters in your area discover your listing and send booking requests." },
  { icon: Calendar, step: "3", title: "Accept bookings", text: "Review requests and accept the ones you like. You're always in control." },
  { icon: Wallet, step: "4", title: "Get paid", text: "Earnings are deposited directly to you after each completed rental." },
];

export function StartRentingScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <LinearGradient
          colors={["#9356F5", "#6D28D9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Sparkles size={32} color="rgba(255,255,255,0.6)" />
          <Text style={styles.heroTitle}>Start Earning on Ekra</Text>
          <Text style={styles.heroSub}>
            Turn your cameras, tools, and gear into passive income by renting them out to people near you.
          </Text>
          <Pressable
            style={styles.heroCta}
            onPress={() => navigation.navigate("ExploreTab", { screen: "CreateListing" } as any)}
          >
            <Text style={styles.heroCtaText}>List Your First Item</Text>
            <ArrowRight size={16} color={colors.primary} />
          </Pressable>
        </LinearGradient>

        {/* Why earn */}
        <Text style={styles.sectionTitle}>Why host on Ekra?</Text>
        <View style={styles.whyGrid}>
          {WHY_EARN.map((item, i) => {
            const Icon = item.icon;
            return (
              <View key={i} style={styles.whyCard}>
                <View style={[styles.whyIcon, { backgroundColor: item.bg }]}>
                  <Icon size={20} color={item.iconColor} />
                </View>
                <Text style={styles.whyTitle}>{item.title}</Text>
                <Text style={styles.whyText}>{item.text}</Text>
              </View>
            );
          })}
        </View>

        {/* How it works */}
        <Text style={styles.sectionTitle}>How it works</Text>
        <View style={styles.stepsCard}>
          {HOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <View key={i} style={[styles.stepRow, i < HOW_STEPS.length - 1 && styles.stepDivider]}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{step.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
                <View style={styles.stepIconWrap}>
                  <Icon size={18} color={colors.primary} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Star size={18} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>Avg. rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <CheckCircle size={18} color={colors.success} />
            <Text style={styles.statValue}>95%</Text>
            <Text style={styles.statLabel}>Acceptance rate</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <DollarSign size={18} color={colors.primary} />
            <Text style={styles.statValue}>SAR 1.2k</Text>
            <Text style={styles.statLabel}>Avg. monthly</Text>
          </View>
        </View>

        {/* Final CTA */}
        <Pressable
          style={styles.finalCta}
          onPress={() => navigation.navigate("ExploreTab", { screen: "CreateListing" } as any)}
        >
          <LinearGradient
            colors={["#9356F5", "#6D28D9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.finalCtaGradient}
          >
            <Package size={18} color="#fff" />
            <Text style={styles.finalCtaText}>List an Item Now</Text>
            <ArrowRight size={16} color="#fff" />
          </LinearGradient>
        </Pressable>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3EDFF" },
  scrollContent: { gap: 0 },

  hero: {
    padding: spacing.xl,
    paddingTop: 48,
    paddingBottom: 40,
    alignItems: "center",
    gap: 10,
  },
  heroTitle: { fontSize: 28, fontWeight: "900", color: "#fff", textAlign: "center", letterSpacing: -0.5 },
  heroSub: { fontSize: 15, color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 22, maxWidth: 280 },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: radii.xl,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 8,
    ...shadows.fab,
  },
  heroCtaText: { fontSize: 15, fontWeight: "700", color: colors.primary },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.foreground,
    paddingHorizontal: spacing.md,
    marginTop: 24,
    marginBottom: 12,
  },

  whyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: spacing.md,
  },
  whyCard: {
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xl,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  whyIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  whyTitle: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  whyText: { fontSize: 12, color: colors.mutedForeground, lineHeight: 17 },

  stepsCard: {
    marginHorizontal: spacing.md,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: spacing.md,
  },
  stepDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumText: { fontSize: 12, fontWeight: "800", color: colors.primary },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 3 },
  stepText: { fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
  stepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  statsCard: {
    flexDirection: "row",
    marginHorizontal: spacing.md,
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4, padding: 16 },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.foreground },
  statLabel: { fontSize: 10, color: colors.mutedForeground },
  statDivider: { width: 1, backgroundColor: colors.border, alignSelf: "stretch" },

  finalCta: {
    marginHorizontal: spacing.md,
    marginTop: 24,
    borderRadius: radii.xl,
    overflow: "hidden",
    ...shadows.fab,
  },
  finalCtaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  finalCtaText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
