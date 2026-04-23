import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { getCategories } from "@/services/api/endpoints/listings";
import type { ListingsStackParamList } from "@/navigation/types";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  Calendar,
  Camera,
  ChevronDown,
  MapPin,
  Shield,
  X,
  Zap,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = NativeStackNavigationProp<ListingsStackParamList, "CreateListing">;

const SUGGESTED_TITLES = [
  "Canon R5 Creator Kit",
  "Canon R5 + Lens Kit",
  "R5 Video Setup",
];

export function CreateListingScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
    price_per_day: "180",
    city: "Riyadh",
    deposit: "500",
    depositEnabled: true,
    is_active: true,
  });
  const [photos, setPhotos] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [, setShowSuggestions] = useState(false);

  const catsQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });
  const categories: any[] = catsQ.data
    ? Array.isArray(catsQ.data) ? catsQ.data : (catsQ.data as any)?.results ?? []
    : [];

  const selectedCat = categories.find((c) => String(c.id) === form.category_id);

  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("price_per_day", form.price_per_day);
      formData.append("city", form.city);
      formData.append("category_id", form.category_id);
      formData.append("is_active", form.is_active ? "true" : "false");
      if (form.depositEnabled && form.deposit) {
        formData.append("deposit", form.deposit);
      }
      photos.forEach((photo) => {
        formData.append("images", { uri: photo.uri, name: photo.name, type: photo.type } as any);
      });
      const { data } = await axiosInstance.post(buildApiUrl("/listings/"), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (data: any) => {
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
      Alert.alert("Listing Published! 🎉", "Your item is now live on Ekra.", [
        {
          text: "View Listing",
          onPress: () => {
            navigation.goBack();
            if (data?.id) navigation.navigate("ListingDetail", { id: data.id });
          },
        },
        { text: "Back to Explore", onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      const detail =
        err?.response?.data?.detail ??
        Object.values(err?.response?.data ?? {})[0] ??
        "Failed to create listing. Please try again.";
      Alert.alert("Error", String(Array.isArray(detail) ? detail[0] : detail));
    },
  });

  const pickPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 8 - photos.length,
    });
    if (!result.canceled) {
      const newPhotos = result.assets.map((a) => ({
        uri: a.uri,
        name: a.fileName ?? `photo-${Date.now()}.jpg`,
        type: a.mimeType ?? "image/jpeg",
      }));
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 8));
    }
  };

  const handlePublish = () => {
    if (!form.title.trim()) { Alert.alert("Please enter an item title."); return; }
    if (!form.price_per_day || isNaN(parseFloat(form.price_per_day))) { Alert.alert("Please enter a valid price per day."); return; }
    if (!form.city.trim()) { Alert.alert("Please enter a city."); return; }
    createMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarIcon}>🛍️</Text>
          <Text style={styles.topBarTitle}>Add New Item</Text>
        </View>
        <Pressable onPress={() => Alert.alert("Draft saved!")} style={styles.saveDraftBtn}>
          <Text style={styles.saveDraftText}>Save draft</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Earnings tip */}
          <View style={styles.earningsBanner}>
            <Text style={styles.earningsArrow}>↗</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.earningsTitle}>Earn up to SAR 3,200/month</Text>
              <Text style={styles.earningsSub}>Great items get 3x more bookings on Ekra 💰</Text>
            </View>
          </View>

          {/* Photos */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Photos</Text>
              <Text style={styles.stepLabel}>Step 1 of 8</Text>
            </View>
            <View style={styles.photosRow}>
              {photos.map((photo, i) => (
                <View key={i} style={styles.photoWrap}>
                  <Image source={{ uri: photo.uri }} style={styles.photoThumb} resizeMode="cover" />
                  <Pressable
                    style={styles.removePhotoBtn}
                    onPress={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    hitSlop={4}
                  >
                    <X size={11} color="#fff" />
                  </Pressable>
                </View>
              ))}
              {photos.length < 8 && (
                <Pressable style={styles.uploadBtn} onPress={pickPhotos}>
                  <View style={styles.uploadCircle}>
                    <Camera size={22} color="#fff" />
                  </View>
                  <Text style={styles.uploadText}>Upload</Text>
                  <Text style={styles.uploadSub}>Drag & drop</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.photoHintRow}>
              <Text style={styles.photoHint}>✨ Add at least 3 photos – great photos get more bookings!</Text>
            </View>
          </View>

          {/* Item Title */}
          <View style={styles.sectionCard}>
            <Text style={styles.fieldLabel}>Item Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Canon R5 Creator Kit"
              placeholderTextColor={colors.mutedForeground}
              value={form.title}
              onChangeText={(v) => { setForm((f) => ({ ...f, title: v })); setShowSuggestions(v.length > 0); }}
              maxLength={60}
            />
            {/* Suggestion chips */}
            <View style={styles.suggestionChips}>
              {SUGGESTED_TITLES.map((s) => (
                <Pressable
                  key={s}
                  style={styles.chip}
                  onPress={() => { setForm((f) => ({ ...f, title: s })); setShowSuggestions(false); }}
                >
                  <Text style={styles.chipText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Price + Category */}
          <View style={styles.twoColRow}>
            <View style={[styles.sectionCard, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Price per day</Text>
              <View style={styles.priceInputWrap}>
                <Text style={styles.currencyPrefix}>SAR </Text>
                <TextInput
                  style={styles.priceInput}
                  value={form.price_per_day}
                  onChangeText={(v) => setForm((f) => ({ ...f, price_per_day: v }))}
                  keyboardType="decimal-pad"
                  placeholder="180"
                  placeholderTextColor={colors.mutedForeground}
                />
                <Text style={styles.priceSuffix}> / day</Text>
              </View>
              <View style={styles.suggestedPriceRow}>
                <Text style={styles.suggestedPriceText}>📊 Suggested: SAR 150 - 220</Text>
              </View>
            </View>
            <View style={[styles.sectionCard, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Category</Text>
              <Pressable
                style={styles.categoryPicker}
                onPress={() => Alert.alert("Category", categories.map((c, i) => `${i+1}. ${c.name}`).join("\n") || "Loading categories…")}
              >
                <Text style={styles.categoryIcon}>📷</Text>
                <Text style={styles.categoryValue}>{selectedCat?.name ?? "Cameras"}</Text>
                <ChevronDown size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          {/* Location + Availability */}
          <View style={styles.twoColRow}>
            <View style={[styles.sectionCard, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Location</Text>
              <View style={styles.locationInputRow}>
                <MapPin size={14} color={colors.primary} />
                <TextInput
                  style={styles.locationInput}
                  value={form.city}
                  onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                  placeholder="Riyadh"
                  placeholderTextColor={colors.mutedForeground}
                />
                <Pressable hitSlop={8}>
                  <Text style={{ fontSize: 16 }}>📍</Text>
                </Pressable>
              </View>
              <Text style={styles.fieldHint}>Detected automatically</Text>
            </View>
            <View style={[styles.sectionCard, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Availability</Text>
              <Pressable
                style={styles.availabilityBtn}
                onPress={() => Alert.alert("Availability", "Date selection coming soon.")}
              >
                <Calendar size={14} color={colors.primary} />
                <Text style={styles.availabilityBtnText}>Select dates</Text>
              </Pressable>
              <Text style={styles.fieldHint}>Set when your item is available</Text>
            </View>
          </View>

          {/* Security Deposit */}
          <View style={styles.sectionCard}>
            <View style={styles.depositHeaderRow}>
              <View>
                <Text style={styles.fieldLabel}>Security Deposit <Text style={styles.optionalText}>(recommended)</Text></Text>
                <Text style={styles.fieldHint}>Protect your item from damages.</Text>
              </View>
              <Switch
                value={form.depositEnabled}
                onValueChange={(v) => setForm((f) => ({ ...f, depositEnabled: v }))}
                trackColor={{ false: "#D1D5DB", true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
            {form.depositEnabled && (
              <View style={styles.depositAmountRow}>
                <Shield size={16} color={colors.primary} />
                <Text style={styles.depositLabel}>Deposit amount</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.depositAmount}>SAR {form.deposit}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.sectionCard}>
            <View style={styles.descHeaderRow}>
              <Text style={styles.fieldLabel}>Description</Text>
              <Text style={styles.descHintText}>Highlight what makes your item special ✨</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Professional Canon R5 camera kit in excellent condition. Includes camera body, RF 24-70mm lens, microphone, 2 batteries, charger, and 128GB memory card."
              placeholderTextColor={colors.mutedForeground}
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.charCount}>{form.description.length} / 1000</Text>
          </View>

          {/* Earnings + Quick Mode */}
          <View style={styles.earningsFooterRow}>
            <View style={styles.earningsFooterLeft}>
              <Text style={{ fontSize: 20 }}>💰</Text>
              <View>
                <Text style={styles.earningsFooterTitle}>
                  Earn up to <Text style={styles.earningsFooterHighlight}>SAR 3,200</Text> / month
                </Text>
                <Text style={styles.earningsFooterSub}>Top hosts in your area are earning great!</Text>
              </View>
            </View>
            <Pressable style={styles.howItWorksBtn} onPress={() => Alert.alert("How it works","Connect, rent, earn!")}>
              <Text style={styles.howItWorksBtnText}>How it works</Text>
            </Pressable>
          </View>

          {/* Quick Listing Banner */}
          <View style={styles.quickListingRow}>
            <Zap size={18} color="#F59E0B" fill="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.quickListingTitle}>Quick Listing: List in 30 seconds</Text>
              <Text style={styles.quickListingSub}>Add title, price & photo — others can wait</Text>
            </View>
            <Pressable style={styles.quickModeBtn} onPress={() => Alert.alert("Quick Mode","Simplified form coming soon.")}>
              <Text style={styles.quickModeBtnText}>Quick Mode</Text>
            </Pressable>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Publish Button */}
      <View style={styles.publishBarWrap}>
        <Pressable
          style={[styles.publishBtn, createMutation.isPending && { opacity: 0.6 }]}
          onPress={handlePublish}
          disabled={createMutation.isPending}
        >
          <Text style={styles.publishBtnTitle}>
            {createMutation.isPending ? "Publishing…" : "🚀 Publish Item"}
          </Text>
          <Text style={styles.publishBtnSub}>Your item will be live and visible to thousands of users</Text>
        </Pressable>
      </View>
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
  topBarCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  topBarIcon: { fontSize: 18 },
  topBarTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground },
  iconBtn: {
    width: 38, height: 38, borderRadius: radii.full,
    backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center",
    ...shadows.card, shadowOpacity: 0.08,
  },
  saveDraftBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  saveDraftText: { fontSize: 14, fontWeight: "600", color: colors.primary },

  scroll: { padding: spacing.md, gap: 12 },

  // Earnings banner
  earningsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card, shadowOpacity: 0.06,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.07)",
  },
  earningsArrow: { fontSize: 22, color: "#16A34A", fontWeight: "900" },
  earningsTitle: { fontSize: 15, fontWeight: "800", color: "#1C1628" },
  earningsSub: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },

  // Section card
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card, shadowOpacity: 0.06,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.07)",
  },
  sectionHeaderRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 12,
  },
  sectionLabel: { fontSize: 16, fontWeight: "700", color: "#1C1628" },
  stepLabel: {
    fontSize: 12, fontWeight: "600",
    color: colors.mutedForeground,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radii.full,
  },

  // Photos
  photosRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 10 },
  photoWrap: { width: 90, height: 90, position: "relative" },
  photoThumb: { width: "100%", height: "100%", borderRadius: radii.md },
  removePhotoBtn: {
    position: "absolute", top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
  },
  uploadBtn: {
    width: 90, height: 90,
    borderRadius: radii.md,
    borderWidth: 1.5, borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: "#F5F0FF",
    alignItems: "center", justifyContent: "center",
    gap: 4,
  },
  uploadCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  uploadText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  uploadSub: { fontSize: 10, color: colors.mutedForeground },
  photoHintRow: {
    backgroundColor: "#F0FFF4",
    borderRadius: radii.lg,
    padding: 10,
  },
  photoHint: { fontSize: 12, color: "#16A34A", fontWeight: "500" },

  // Fields
  fieldLabel: { fontSize: 14, fontWeight: "700", color: "#1C1628", marginBottom: 8 },
  optionalText: { fontWeight: "400", color: colors.mutedForeground },
  fieldHint: { fontSize: 11, color: colors.mutedForeground, marginTop: 4 },
  input: {
    backgroundColor: "#FAFAFA",
    borderRadius: radii.lg,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.12)",
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#1C1628",
  },
  textArea: { minHeight: 110, lineHeight: 22, paddingTop: 12 },
  charCount: { fontSize: 11, color: colors.mutedForeground, textAlign: "right", marginTop: 4 },

  // Suggestion chips
  suggestionChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: {
    borderRadius: radii.full,
    borderWidth: 1, borderColor: "rgba(124,58,237,0.3)",
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "#F5F0FF",
  },
  chipText: { fontSize: 13, color: colors.primary, fontWeight: "600" },

  // Two column
  twoColRow: { flexDirection: "row", gap: 10 },

  // Price input
  priceInputWrap: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  currencyPrefix: { fontSize: 15, fontWeight: "700", color: "#1C1628" },
  priceInput: {
    flex: 1, fontSize: 20, fontWeight: "800", color: "#1C1628",
    paddingVertical: 4,
  },
  priceSuffix: { fontSize: 13, color: colors.mutedForeground },
  suggestedPriceRow: {
    backgroundColor: "#F0FFF4",
    borderRadius: radii.md,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  suggestedPriceText: { fontSize: 11, color: "#16A34A", fontWeight: "600" },

  // Category
  categoryPicker: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FAFAFA",
    borderRadius: radii.lg,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.12)",
    paddingHorizontal: 12, paddingVertical: 10,
  },
  categoryIcon: { fontSize: 16 },
  categoryValue: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1C1628" },

  // Location
  locationInputRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FAFAFA",
    borderRadius: radii.lg,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.12)",
    paddingHorizontal: 12, paddingVertical: 10,
  },
  locationInput: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1C1628" },

  // Availability
  availabilityBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10,
  },
  availabilityBtnText: { fontSize: 14, fontWeight: "600", color: colors.primary },

  // Deposit
  depositHeaderRow: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    marginBottom: 10,
  },
  depositAmountRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F5F0FF",
    borderRadius: radii.lg,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  depositLabel: { fontSize: 14, fontWeight: "500", color: "#1C1628" },
  depositAmount: { fontSize: 16, fontWeight: "800", color: colors.primary },

  // Description header
  descHeaderRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 8,
  },
  descHintText: { fontSize: 11, color: colors.mutedForeground },

  // Earnings footer
  earningsFooterRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card, shadowOpacity: 0.06,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.07)",
  },
  earningsFooterLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  earningsFooterTitle: { fontSize: 13, fontWeight: "600", color: "#1C1628" },
  earningsFooterHighlight: { color: colors.primary, fontWeight: "900" },
  earningsFooterSub: { fontSize: 11, color: colors.mutedForeground },
  howItWorksBtn: {
    borderRadius: radii.lg,
    borderWidth: 1.5, borderColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  howItWorksBtnText: { fontSize: 12, fontWeight: "700", color: colors.primary },

  // Quick listing
  quickListingRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card, shadowOpacity: 0.06,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.07)",
  },
  quickListingTitle: { fontSize: 13, fontWeight: "700", color: "#1C1628" },
  quickListingSub: { fontSize: 11, color: colors.mutedForeground },
  quickModeBtn: {
    backgroundColor: "#1C1628",
    borderRadius: radii.lg,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  quickModeBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  // Publish bar
  publishBarWrap: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: spacing.md, paddingBottom: 28,
    backgroundColor: "#F0EDFB",
  },
  publishBtn: {
    backgroundColor: "#5B21B6",
    borderRadius: radii.xl,
    paddingVertical: 18,
    alignItems: "center",
    ...shadows.cardHeavy,
    shadowColor: "#5B21B6", shadowOpacity: 0.35,
  },
  publishBtnTitle: { fontSize: 18, fontWeight: "900", color: "#fff" },
  publishBtnSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 3 },
});
