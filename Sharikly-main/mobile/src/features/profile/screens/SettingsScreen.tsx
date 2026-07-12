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
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, "Settings">,
  BottomTabNavigationProp<MainTabParamList>
>;

function ToggleSwitch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange?: (v: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onValueChange?.(!value)}
      style={[styles.toggleTrack, value ? styles.toggleTrackOn : styles.toggleTrackOff]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={6}
    >
      <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
    </Pressable>
  );
}

function SectionCard({
  title,
  purple = false,
  children,
}: {
  title: string;
  purple?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={[styles.sectionCard, purple && styles.sectionCardPurple]}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

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
        <ToggleSwitch value={switchValue} onValueChange={onSwitchChange} />
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
  // Confirmation modal state (Alert.alert doesn't render on react-native-web,
  // so we use in-app modals that work across web + native).
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const finishLogout = async () => {
    await performLogout();
    queryClient.clear();
    setHasSession(false);
    // Leave the (un-gated) Settings screen so the guest state is shown.
    (navigation as any).popToTop?.();
  };

  const confirmSignOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await finishLogout();
    } finally {
      setLoggingOut(false);
      setLogoutVisible(false);
    }
  };

  const confirmDelete = async () => {
    if (deleting) return;
    if (!deletePassword) {
      setDeleteError("Please enter your password to confirm.");
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      await axiosInstance.delete(buildApiUrl("/auth/delete-account/"), {
        data: { password: deletePassword },
      });
      setDeleteVisible(false);
      setDeletePassword("");
      await finishLogout();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ??
        "Could not delete your account. Please try again.";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeletePassword("");
    setDeleteError("");
    setDeleteVisible(true);
  };

  const handleSignOut = () => {
    setLogoutVisible(true);
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
        <SectionCard title="ACCOUNT">
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
        </SectionCard>

        {/* NOTIFICATIONS */}
        <SectionCard title="NOTIFICATIONS">
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
        </SectionCard>

        {/* PAYMENTS */}
        <SectionCard title="PAYMENTS">
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
        </SectionCard>

        {/* HOSTING */}
        <SectionCard title="HOSTING" purple>
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
        </SectionCard>

        {/* SUPPORT */}
        <SectionCard title="SUPPORT">
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
        </SectionCard>

        {/* ACCOUNT DANGER */}
        <SectionCard title="ACCOUNT">
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
        </SectionCard>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Log out confirmation */}
      <Modal visible={logoutVisible} transparent animationType="fade" onRequestClose={() => setLogoutVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log out</Text>
            <Text style={styles.modalBody}>Are you sure you want to log out?</Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => setLogoutVisible(false)} disabled={loggingOut}>
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={confirmSignOut} disabled={loggingOut}>
                {loggingOut ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.modalBtnPrimaryText}>Log out</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete account confirmation (requires password) */}
      <Modal visible={deleteVisible} transparent animationType="fade" onRequestClose={() => setDeleteVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete account</Text>
            <Text style={styles.modalBody}>
              This permanently deletes your personal data and disables your account. Some records required for legal and accounting reasons (such as past bookings) may be kept in anonymized form. This can't be undone. Enter your password to confirm.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Your password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoCapitalize="none"
              value={deletePassword}
              onChangeText={(t) => { setDeletePassword(t); if (deleteError) setDeleteError(""); }}
            />
            {deleteError ? <Text style={styles.modalError}>{deleteError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => setDeleteVisible(false)} disabled={deleting}>
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnDanger]} onPress={confirmDelete} disabled={deleting}>
                {deleting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.modalBtnPrimaryText}>Delete</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: spacing.md,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  sectionCardPurple: {
    backgroundColor: colors.secondary,
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

  toggleTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackOn: {
    backgroundColor: colors.primary,
    alignItems: 'flex-end',
  },
  toggleTrackOff: {
    backgroundColor: '#E5E7EB',
    alignItems: 'flex-start',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    ...shadows.card,
    shadowOpacity: 0.15,
  },
  toggleThumbOn: {},

  // Confirmation modals
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
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.foreground,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  modalError: {
    fontSize: 13,
    color: colors.destructive,
    marginBottom: 8,
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
  modalBtnPrimary: {
    backgroundColor: colors.primary,
  },
  modalBtnDanger: {
    backgroundColor: colors.destructive,
  },
  modalBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
