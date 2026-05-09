import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, BookOpen, MessageSquare, AlertCircle } from "lucide-react-native";
import { colors, spacing, typography, radii, shadows } from "@/core/theme/tokens";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance, buildApiUrl } from "@/services/api/client";

// --- Base Layout ---
function BaseScreen({ title, children, isLoading = false }: { title: string, children: React.ReactNode, isLoading?: boolean }) {
  const navigation = useNavigation();
  
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isLoading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          children
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Account ---
export const PhoneAndEmailScreen = () => {
  const queryClient = useQueryClient();
  const userQ = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => axiosInstance.get(buildApiUrl("/auth/me/")).then((res) => res.data),
  });

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (userQ.data) {
      setEmail(userQ.data.email || "");
      setPhone(userQ.data.phone_number || "");
    }
  }, [userQ.data]);

  const mutation = useMutation({
    mutationFn: (data: any) => axiosInstance.patch(buildApiUrl("/auth/me/"), data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      Alert.alert("Success", "Information updated.");
    },
    onError: () => Alert.alert("Error", "Could not update information."),
  });

  return (
    <BaseScreen title="Phone & Email" isLoading={userQ.isPending}>
      <Text style={styles.label}>Email Address</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Text style={styles.label}>Phone Number</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <PrimaryButton label="Save Changes" onPress={() => mutation.mutate({ email, phone_number: phone })} style={{ marginTop: 24 }} />
    </BaseScreen>
  );
};

export const LanguageScreen = () => {
  const queryClient = useQueryClient();
  const userQ = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => axiosInstance.get(buildApiUrl("/auth/me/")).then((res) => res.data),
  });

  const [language, setLanguage] = useState("en");

  useEffect(() => {
    if (userQ.data?.language) setLanguage(userQ.data.language);
  }, [userQ.data]);

  const mutation = useMutation({
    mutationFn: (data: any) => axiosInstance.patch(buildApiUrl("/auth/me/"), data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      Alert.alert("Success", "Language updated.");
    },
  });

  return (
    <BaseScreen title="Language" isLoading={userQ.isPending}>
      <Pressable style={[styles.card, language === 'en' && styles.cardSelected]} onPress={() => setLanguage('en')}>
        <Text style={styles.cardText}>English</Text>
      </Pressable>
      <Pressable style={[styles.card, language === 'ar' && styles.cardSelected]} onPress={() => setLanguage('ar')}>
        <Text style={styles.cardText}>Arabic</Text>
      </Pressable>
      <PrimaryButton label="Save" onPress={() => mutation.mutate({ language })} style={{ marginTop: 24 }} />
    </BaseScreen>
  );
};

// --- Payments ---
export const PaymentMethodsScreen = () => {
  const queryClient = useQueryClient();
  const listQ = useQuery({
    queryKey: ["payment_methods"],
    queryFn: () => axiosInstance.get(buildApiUrl("/users/payment-methods/")).then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: () => axiosInstance.post(buildApiUrl("/users/payment-methods/"), { card_last4: "4242", brand: "Visa" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment_methods"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(buildApiUrl(`/users/payment-methods/${id}/`)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment_methods"] }),
  });

  const methods = Array.isArray(listQ.data) ? listQ.data : (listQ.data?.results || []);

  return (
    <BaseScreen title="Payment Methods" isLoading={listQ.isPending}>
      {methods.length === 0 ? (
        <Text style={styles.mutedText}>No payment methods added.</Text>
      ) : (
        methods.map((m: any) => (
          <View key={m.id} style={styles.listItem}>
            <Text style={styles.listTitle}>{m.brand} •••• {m.card_last4}</Text>
            <Pressable onPress={() => deleteMutation.mutate(m.id)}>
              <Text style={{ color: colors.destructive }}>Remove</Text>
            </Pressable>
          </View>
        ))
      )}
      <PrimaryButton label="Add Mock Card (4242)" onPress={() => createMutation.mutate()} style={{ marginTop: 24 }} variant="outline" />
    </BaseScreen>
  );
};

export const PayoutMethodsScreen = () => {
  const queryClient = useQueryClient();
  const userQ = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => axiosInstance.get(buildApiUrl("/auth/me/")).then((res) => res.data),
  });

  const [bank, setBank] = useState("");

  useEffect(() => {
    if (userQ.data) setBank(userQ.data.payout_bank || "");
  }, [userQ.data]);

  const mutation = useMutation({
    mutationFn: (data: any) => axiosInstance.patch(buildApiUrl("/auth/me/"), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      Alert.alert("Success", "Payout bank updated.");
    },
  });

  return (
    <BaseScreen title="Payout Methods" isLoading={userQ.isPending}>
      <Text style={styles.label}>Bank Account Name / IBAN</Text>
      <TextInput style={styles.input} value={bank} onChangeText={setBank} placeholder="SA..." />
      <PrimaryButton label="Save Changes" onPress={() => mutation.mutate({ payout_bank: bank })} style={{ marginTop: 24 }} />
    </BaseScreen>
  );
};

export const PayoutScheduleScreen = () => {
  const queryClient = useQueryClient();
  const userQ = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => axiosInstance.get(buildApiUrl("/auth/me/")).then((res) => res.data),
  });

  const [schedule, setSchedule] = useState("WEEKLY");

  useEffect(() => {
    if (userQ.data?.payout_schedule) setSchedule(userQ.data.payout_schedule);
  }, [userQ.data]);

  const mutation = useMutation({
    mutationFn: (data: any) => axiosInstance.patch(buildApiUrl("/auth/me/"), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      Alert.alert("Success", "Schedule updated.");
    },
  });

  return (
    <BaseScreen title="Payout Schedule" isLoading={userQ.isPending}>
      <Pressable style={[styles.card, schedule === 'WEEKLY' && styles.cardSelected]} onPress={() => setSchedule('WEEKLY')}>
        <Text style={styles.cardText}>Weekly</Text>
      </Pressable>
      <Pressable style={[styles.card, schedule === 'MONTHLY' && styles.cardSelected]} onPress={() => setSchedule('MONTHLY')}>
        <Text style={styles.cardText}>Monthly</Text>
      </Pressable>
      <PrimaryButton label="Save" onPress={() => mutation.mutate({ payout_schedule: schedule })} style={{ marginTop: 24 }} />
    </BaseScreen>
  );
};

// --- Hosting Preferences ---
function HostPrefScreen({ title, prefKey, isSwitch = false, renderInput }: any) {
  const queryClient = useQueryClient();
  const prefQ = useQuery({
    queryKey: ["host_preferences"],
    queryFn: () => axiosInstance.get(buildApiUrl("/users/host-preferences/")).then(res => res.data),
  });

  const [val, setVal] = useState<any>(null);

  useEffect(() => {
    if (prefQ.data && prefKey in prefQ.data) setVal(prefQ.data[prefKey]);
  }, [prefQ.data, prefKey]);

  const mutation = useMutation({
    mutationFn: (data: any) => axiosInstance.patch(buildApiUrl("/users/host-preferences/"), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host_preferences"] });
      Alert.alert("Success", `${title} updated.`);
    },
  });

  return (
    <BaseScreen title={title} isLoading={prefQ.isPending}>
      {isSwitch ? (
        <View style={styles.switchRow}>
          <Text style={styles.label}>{title} Enabled</Text>
          <Switch value={!!val} onValueChange={(v) => { setVal(v); mutation.mutate({ [prefKey]: v }); }} trackColor={{ true: colors.primary }} />
        </View>
      ) : (
        <View>
          {renderInput(val, setVal)}
          <PrimaryButton label="Save" onPress={() => mutation.mutate({ [prefKey]: val })} style={{ marginTop: 24 }} />
        </View>
      )}
    </BaseScreen>
  );
}

export const SmartPricingScreen = () => <HostPrefScreen title="Smart Pricing" prefKey="smart_pricing" isSwitch />;
export const InstantBookingScreen = () => <HostPrefScreen title="Instant Booking" prefKey="instant_booking" isSwitch />;
export const DepositSettingsScreen = () => (
  <HostPrefScreen 
    title="Deposit Settings" 
    prefKey="default_deposit" 
    renderInput={(val: any, setVal: any) => (
      <View>
        <Text style={styles.label}>Default Deposit Amount (SAR)</Text>
        <TextInput style={styles.input} value={String(val || '')} onChangeText={setVal} keyboardType="numeric" />
      </View>
    )} 
  />
);
export const AvailabilityDefaultsScreen = () => (
  <HostPrefScreen 
    title="Availability Defaults" 
    prefKey="availability_defaults" 
    renderInput={(val: any, setVal: any) => (
      <View>
        <Text style={styles.label}>Default Policy</Text>
        <TextInput style={styles.input} value={val || ''} onChangeText={setVal} placeholder="ALWAYS_AVAILABLE" />
      </View>
    )} 
  />
);

// --- Support ---
export const HelpCenterScreen = () => (
  <BaseScreen title="Help Center">
    <View style={styles.center}>
      <BookOpen size={48} color={colors.primary} />
      <Text style={styles.title}>How can we help?</Text>
      <Text style={styles.subtitle}>Check our documentation or contact support for further assistance.</Text>
    </View>
  </BaseScreen>
);

export const ContactSupportScreen = () => {
  const [msg, setMsg] = useState("");
  const navigation = useNavigation();
  const mutation = useMutation({
    mutationFn: (data: any) => axiosInstance.post(buildApiUrl("/contact-messages/"), data),
    onSuccess: () => {
      Alert.alert("Success", "Message sent to support.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    },
  });

  return (
    <BaseScreen title="Contact Support">
      <View style={styles.center}>
        <MessageSquare size={40} color={colors.primary} style={{ marginBottom: 16 }}/>
      </View>
      <Text style={styles.label}>Your Message</Text>
      <TextInput style={[styles.input, { height: 120, textAlignVertical: 'top' }]} value={msg} onChangeText={setMsg} multiline placeholder="How can we help you today?" />
      <PrimaryButton label="Send Message" onPress={() => mutation.mutate({ name: "User", email: "user@example.com", message: msg })} style={{ marginTop: 24 }} />
    </BaseScreen>
  );
};

export const ReportIssueScreen = () => {
  const [msg, setMsg] = useState("");
  const navigation = useNavigation();
  const userQ = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => axiosInstance.get(buildApiUrl("/auth/me/")).then((res) => res.data),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => axiosInstance.post(buildApiUrl("/reports/"), data),
    onSuccess: () => {
      Alert.alert("Success", "Issue reported.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    },
  });

  return (
    <BaseScreen title="Report an Issue">
      <View style={styles.center}>
        <AlertCircle size={40} color={colors.destructive} style={{ marginBottom: 16 }}/>
      </View>
      <Text style={styles.label}>Issue Details</Text>
      <TextInput style={[styles.input, { height: 120, textAlignVertical: 'top' }]} value={msg} onChangeText={setMsg} multiline placeholder="Describe the issue you encountered..." />
      <PrimaryButton 
        label="Submit Report" 
        onPress={() => mutation.mutate({ reported_user: userQ.data?.id, reason: "OTHER", details: msg })} 
        style={{ marginTop: 24, backgroundColor: colors.destructive }} 
      />
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: {},
  headerTitle: { ...typography.h3, fontSize: 18, color: colors.foreground },
  content: { padding: spacing.lg },
  label: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.foreground,
  },
  card: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  cardText: { fontSize: 16, fontWeight: '500', color: colors.foreground },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: radii.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  listTitle: { fontSize: 16, fontWeight: '500' },
  mutedText: { color: colors.mutedForeground, textAlign: 'center', marginTop: 24 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    borderRadius: radii.md,
    marginTop: 12,
  },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  title: { ...typography.h2, marginBottom: 12, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center', color: colors.mutedForeground, lineHeight: 24 },
  loadingText: { textAlign: 'center', marginTop: 24, color: colors.mutedForeground },
});
