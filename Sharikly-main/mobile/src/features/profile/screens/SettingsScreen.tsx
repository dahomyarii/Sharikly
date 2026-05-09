import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl, performLogout } from "@/services/api/client";
import { useAuthStore } from "@/store/authStore";
import type { ProfileStackParamList, MainTabParamList } from "@/navigation/types";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  ChevronRight,
  Globe,
  Heart,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  Shield,
  Trash2,
  User,
  UserX,
  Smartphone,
  MessageSquare,
  Wallet,
  Tag,
  CreditCard,
  Landmark,
  Calendar,
  Activity,
  Zap,
  Clock,
  Headphones,
  Flag,
  ArrowLeft
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, "Settings">,
  BottomTabNavigationProp<MainTabParamList>
>;

function SettingsRow({
  icon: Icon,
  label,
  sublabel,
  value,
  onPress,
  danger = false,
  hasSwitch = false,
  switchValue = false,
  onSwitchChange,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (v: boolean) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && !hasSwitch && styles.rowPressed]}
      onPress={onPress}
      disabled={hasSwitch}
    >
      <View style={styles.rowIconWrap}>
        <Icon size={20} color={danger ? colors.destructive : colors.primary} strokeWidth={2} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      {value ? (
        <View style={styles.rowValueWrap}>
          <Text style={styles.rowValue}>{value}</Text>
          <ChevronRight size={16} color={colors.mutedForeground} />
        </View>
      ) : hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#E5E7EB", true: colors.primary }}
          thumbColor="#FFF"
        />
      ) : (
        <ChevronRight size={16} color={danger ? colors.destructive : colors.mutedForeground} />
      )}
    </Pressable>
  );
}

export function SettingsScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const setHasSession = useAuthStore((s) => s.setHasSession);
  
  const queryClient = useQueryClient();

  const userQ = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => axiosInstance.get(buildApiUrl("/auth/me/")).then((res) => res.data),
  });

  const paymentMethodsQ = useQuery({
    queryKey: ["payment_methods"],
    queryFn: () => axiosInstance.get(buildApiUrl("/users/payment-methods/")).then((res) => res.data),
  });

  const hostPrefsQ = useQuery({
    queryKey: ["host_preferences"],
    queryFn: () => axiosInstance.get(buildApiUrl("/users/host-preferences/")).then((res) => res.data),
  });
  
  const userData = userQ.data;
  const paymentMethods = Array.isArray(paymentMethodsQ.data) ? paymentMethodsQ.data : (paymentMethodsQ.data?.results || []);
  const defaultPayment = paymentMethods.find((m: any) => m.is_default) || paymentMethods[0];
  const hostPrefs = hostPrefsQ.data || {};
  
  const prefsQ = useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: () => axiosInstance.get(buildApiUrl("/notifications/preferences/")).then((res) => res.data),
  });

  const prefsMutation = useMutation({
    mutationFn: (data: any) => axiosInstance.patch(buildApiUrl("/notifications/preferences/"), data).then((res) => res.data),
    onSuccess: (data) => queryClient.setQueryData(["notifications", "preferences"], data),
  });

  const prefs = prefsQ.data || {};

  const handleToggle = (key: string, value: boolean) => {
    prefsMutation.mutate({ [key]: value });
  };
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: async () => {
            try {
              await axiosInstance.delete(buildApiUrl("/auth/delete-account/"));
              await performLogout();
              setHasSession(false);
            } catch {
              Alert.alert("Failed to delete account. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await performLogout();
          setHasSession(false);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.screenTitle}>Settings</Text>
        <View style={{ width: 24 }} /> {/* Spacer */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ACCOUNT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon={User}
              label="Profile"
              onPress={() => navigation.navigate("EditProfile")}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Smartphone}
              label="Phone & Email"
              onPress={() => navigation.navigate("PhoneAndEmail")}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Lock}
              label="Password"
              onPress={() => navigation.navigate("ChangePassword")}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Globe}
              label="Language"
              value={userData?.language === 'ar' ? 'Arabic' : 'English'}
              onPress={() => navigation.navigate("Language")}
            />
          </View>
        </View>

        {/* NOTIFICATIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon={Bell}
              label="Booking updates"
              sublabel="Get notified about your bookings"
              hasSwitch
              switchValue={prefs.inapp_booking_updates ?? true}
              onSwitchChange={(v) => handleToggle("inapp_booking_updates", v)}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={MessageSquare}
              label="Messages"
              sublabel="New messages and replies"
              hasSwitch
              switchValue={prefs.inapp_messages ?? true}
              onSwitchChange={(v) => handleToggle("inapp_messages", v)}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Wallet}
              label="Earnings"
              sublabel="Important updates about your earnings"
              hasSwitch
              switchValue={prefs.earnings_updates ?? true}
              onSwitchChange={(v) => handleToggle("earnings_updates", v)}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Tag}
              label="Promotions"
              sublabel="Offers and discounts"
              hasSwitch
              switchValue={prefs.promotions_updates ?? false}
              onSwitchChange={(v) => handleToggle("promotions_updates", v)}
            />
          </View>
        </View>

        {/* PAYMENTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENTS</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon={CreditCard}
              label="Payment methods"
              value={defaultPayment ? `${defaultPayment.brand} •••• ${defaultPayment.card_last4}` : "Add a card"}
              onPress={() => navigation.navigate("PaymentMethods")}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Landmark}
              label="Payout methods"
              value={userData?.payout_bank ? `IBAN: •••• ${userData.payout_bank.slice(-4)}` : "Not set"}
              onPress={() => navigation.navigate("PayoutMethods")}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Calendar}
              label="Payout schedule"
              value={userData?.payout_schedule === 'MONTHLY' ? 'Monthly' : 'Weekly'}
              onPress={() => navigation.navigate("PayoutSchedule")}
            />
          </View>
        </View>

        {/* HOSTING */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HOSTING</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon={Activity}
              label="Smart Pricing"
              value={hostPrefs.smart_pricing ? 'On' : 'Off'}
              onPress={() => navigation.navigate("SmartPricing")}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Zap}
              label="Instant Booking"
              value={hostPrefs.instant_booking ? 'On' : 'Off'}
              onPress={() => navigation.navigate("InstantBooking")}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Shield}
              label="Deposit settings"
              value={hostPrefs.default_deposit != null ? `SAR ${Number(hostPrefs.default_deposit).toLocaleString('en-SA')}` : 'SAR 500'}
              onPress={() => navigation.navigate("DepositSettings")}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Clock}
              label="Availability defaults"
              onPress={() => navigation.navigate("AvailabilityDefaults")}
            />
          </View>
        </View>

        {/* SUPPORT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon={HelpCircle}
              label="Help center"
              onPress={() => navigation.navigate("HelpCenter")}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Headphones}
              label="Contact support"
              onPress={() => navigation.navigate("ContactSupport")}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Flag}
              label="Report an issue"
              onPress={() => navigation.navigate("ReportIssue")}
            />
          </View>
        </View>

        {/* ACCOUNT DANGER */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon={LogOut}
              label="Log out"
              onPress={handleSignOut}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={Trash2}
              label="Delete account"
              onPress={handleDeleteAccount}
              danger
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: '#FFF',
  },
  backBtn: {},
  screenTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground },
  scrollContent: { padding: spacing.md },

  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: radii.xl,
  },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.03)', marginLeft: 52 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    gap: 12,
  },
  rowPressed: { backgroundColor: 'rgba(0,0,0,0.02)' },
  rowIconWrap: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1, justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  rowLabelDanger: { color: colors.destructive },
  rowSublabel: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  rowValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 14, color: colors.mutedForeground, fontWeight: '500' },
});
