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
  Check,
  ChevronDown,
  LocateFixed,
  MapPin,
  Shield,
  ShoppingBag,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type Nav = NativeStackNavigationProp<ListingsStackParamList, "CreateListing">;

export function CreateListingScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
    price_per_day: "",
    city: "",
    deposit: "",
    latitude: "",
    longitude: "",
    is_active: true,
  });
  const [photos, setPhotos] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [published, setPublished] = useState<any | null>(null);

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
      if (form.deposit && !isNaN(parseFloat(form.deposit))) {
        formData.append("deposit", form.deposit);
      }
      if (form.latitude && form.longitude) {
        formData.append("latitude", form.latitude);
        formData.append("longitude", form.longitude);
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
      setPublished(data ?? {});
    },
    onError: (err: any) => {
      const detail =
        err?.response?.data?.detail ??
        Object.values(err?.response?.data ?? {})[0] ??
        "Failed to create listing. Please try again.";
      setErrorMsg(String(Array.isArray(detail) ? detail[0] : detail));
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

  const detectLocation = async () => {
    setDetecting(true);
    try {
      if (Platform.OS === "web") {
        const geo = (globalThis as any)?.navigator?.geolocation;
        if (!geo) {
          setDetecting(false);
          setErrorMsg("Location isn't available in this browser. Please type your city.");
          return;
        }
        geo.getCurrentPosition(
          (pos: any) => {
            setForm((f) => ({ ...f, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }));
            setDetecting(false);
          },
          () => {
            setDetecting(false);
            setErrorMsg("Couldn't detect your location. Please allow location access or type your city.");
          },
          { enableHighAccuracy: false, timeout: 8000 },
        );
      } else {
        const Location = await import("expo-location");
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setDetecting(false);
          setErrorMsg("Location permission was denied. Please type your city.");
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = pos.coords;
        // Reverse-geocode to a city using the device's OS geocoder (iOS/Android).
        let city: string | undefined;
        try {
          const places = await Location.reverseGeocodeAsync({ latitude, longitude });
          const place = places?.[0];
          city = place?.city || place?.subregion || place?.region || undefined;
        } catch {
          /* keep whatever the user typed */
        }
        setForm((f) => ({
          ...f,
          latitude: String(latitude),
          longitude: String(longitude),
          city: city || f.city,
        }));
        setDetecting(false);
      }
    } catch {
      setDetecting(false);
      setErrorMsg("Couldn't detect your location. Please type your city.");
    }
  };

  const handlePublish = () => {
    if (photos.length === 0) { setErrorMsg("Please add at least one photo — a listing can't be published without one."); return; }
    if (!form.title.trim()) { setErrorMsg("Please enter an item title."); return; }
    if (!form.price_per_day || isNaN(parseFloat(form.price_per_day))) { setErrorMsg("Please enter a valid price per day."); return; }
    if (!form.category_id) { setErrorMsg("Please choose a category."); return; }
    if (!form.city.trim()) { setErrorMsg("Please enter a city."); return; }
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
          <ShoppingBag size={20} color={colors.primary} />
          <Text style={styles.topBarTitle}>Add New Item</Text>
        </View>
        {/* Spacer to keep the title centered */}
        <View style={styles.iconBtnGhost} />
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

          {/* Details — all fields in one section */}
          <View style={styles.sectionCard}>
            {/* Item Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Item Title</Text>
              <TextInput
                style={styles.input}
                placeholder="What are you renting out?"
                placeholderTextColor={colors.mutedForeground}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                maxLength={60}
              />
            </View>

            {/* Price per day */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Price per day</Text>
              <View style={styles.priceInputWrap}>
                <Text style={styles.currencyPrefix}>SAR </Text>
                <TextInput
                  style={styles.priceInput}
                  value={form.price_per_day}
                  onChangeText={(v) => setForm((f) => ({ ...f, price_per_day: v.replace(/[^0-9.]/g, "") }))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                />
                <Text style={styles.priceSuffix}>/ day</Text>
              </View>
            </View>

            {/* Category */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category</Text>
              <Pressable style={styles.categoryPicker} onPress={() => setCatModalVisible(true)}>
                <Text style={styles.categoryValue} numberOfLines={1}>
                  {selectedCat?.name ?? "Select a category"}
                </Text>
                <ChevronDown size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {/* Location */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Location</Text>
              <Text style={styles.fieldHintTop}>Tap the target to use your current location, or type your city</Text>
              <View style={styles.locationRow}>
                <View style={styles.locationInputRow}>
                  <MapPin size={14} color={colors.primary} />
                  <TextInput
                    style={styles.locationInput}
                    value={form.city}
                    onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                    placeholder="Enter your city"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <Pressable style={styles.locateBtn} onPress={detectLocation} disabled={detecting}>
                  {detecting ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <LocateFixed size={18} color={colors.primary} />
                  )}
                </Pressable>
              </View>
              {!!form.latitude && <Text style={styles.detectedText}>Current location detected ✓</Text>}
            </View>

            {/* Availability */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Availability</Text>
              <Text style={styles.fieldHintTop}>Set when your item is available</Text>
              <Pressable
                style={styles.availabilityBtn}
                onPress={() => Alert.alert("Availability", "You can set availability after publishing, from the listing.")}
              >
                <Calendar size={16} color={colors.primary} />
                <Text style={styles.availabilityBtnText}>Select dates</Text>
              </Pressable>
            </View>

            {/* Security Deposit */}
            <View style={styles.fieldGroup}>
              <View style={styles.depositLabelRow}>
                <Text style={styles.fieldLabel}>Security Deposit</Text>
                <View style={styles.optionalPill}>
                  <Text style={styles.optionalPillText}>Optional</Text>
                </View>
              </View>
              <Text style={styles.fieldHintTop}>Refundable amount to protect your item</Text>
              <View style={styles.depositInputRow}>
                <Shield size={16} color={colors.primary} />
                <Text style={styles.currencyPrefix}>SAR </Text>
                <TextInput
                  style={styles.depositInput}
                  value={form.deposit}
                  onChangeText={(v) => setForm((f) => ({ ...f, deposit: v.replace(/[^0-9.]/g, "") }))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.fieldGroupLast}>
              <Text style={styles.fieldLabel}>Description</Text>
              <Text style={styles.fieldHintTop}>Highlight what makes your item special ✨</Text>
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
          </View>

          <View style={{ height: 130 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky footer: Publish */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
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

      {/* Category picker */}
      <Modal visible={catModalVisible} transparent animationType="fade" onRequestClose={() => setCatModalVisible(false)}>
        <View style={styles.catBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setCatModalVisible(false)} />
          <View style={styles.catSheet}>
            <Text style={styles.catSheetTitle}>Select a category</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {categories.length === 0 && <Text style={styles.catEmpty}>Loading categories…</Text>}
              {categories.map((c) => {
                const active = String(c.id) === form.category_id;
                return (
                  <Pressable
                    key={c.id}
                    style={styles.catRow}
                    onPress={() => { setForm((f) => ({ ...f, category_id: String(c.id) })); setCatModalVisible(false); }}
                  >
                    <Text style={[styles.catRowText, active && { color: colors.primary, fontWeight: "800" }]}>{c.name}</Text>
                    {active && <Check size={18} color={colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Publish success */}
      <Modal visible={!!published} transparent animationType="fade" onRequestClose={() => { setPublished(null); navigation.goBack(); }}>
        <View style={styles.centerBackdrop}>
          <View style={styles.centerCard}>
            <Text style={styles.centerTitle}>Listing Published! 🎉</Text>
            <Text style={styles.centerBody}>Your item is now live on Ekra and visible to renters.</Text>
            <View style={styles.centerActions}>
              <Pressable
                style={[styles.centerBtn, styles.centerBtnGhost]}
                onPress={() => { setPublished(null); navigation.goBack(); }}
              >
                <Text style={styles.centerBtnGhostText}>Done</Text>
              </Pressable>
              <Pressable
                style={[styles.centerBtn, styles.centerBtnPrimary]}
                onPress={() => {
                  const id = published?.id;
                  setPublished(null);
                  navigation.goBack();
                  if (id) navigation.navigate("ListingDetail", { id });
                }}
              >
                <Text style={styles.centerBtnPrimaryText}>View Listing</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error */}
      <Modal visible={!!errorMsg} transparent animationType="fade" onRequestClose={() => setErrorMsg(null)}>
        <View style={styles.centerBackdrop}>
          <View style={styles.centerCard}>
            <Text style={styles.centerTitle}>Couldn't publish</Text>
            <Text style={styles.centerBody}>{errorMsg}</Text>
            <View style={styles.centerActions}>
              <Pressable style={[styles.centerBtn, styles.centerBtnPrimary]} onPress={() => setErrorMsg(null)}>
                <Text style={styles.centerBtnPrimaryText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  iconBtnGhost: { width: 38, height: 38 },
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
  fieldLabel: { fontSize: 14, fontWeight: "700", color: "#1C1628", marginBottom: 6 },
  fieldHintTop: { fontSize: 12, color: colors.mutedForeground, marginTop: -2, marginBottom: 8, lineHeight: 16 },
  detectedText: { fontSize: 12, color: "#16A34A", fontWeight: "600", marginTop: 6 },
  fieldGroup: { marginBottom: 20 },
  fieldGroupLast: { marginBottom: 0 },
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
    borderWidth: 1, borderColor: "rgba(176,71,246,0.3)",
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
  locationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationInputRow: {
    flex: 1,
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FAFAFA",
    borderRadius: radii.lg,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.12)",
    paddingHorizontal: 12, paddingVertical: 10,
  },
  locationInput: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1C1628" },
  locateBtn: {
    width: 42, height: 42, borderRadius: radii.lg,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.2)",
    backgroundColor: "#F5F0FF",
    alignItems: "center", justifyContent: "center",
  },

  // Availability
  availabilityBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#FAFAFA",
    borderRadius: radii.lg,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.12)",
    paddingVertical: 12,
  },
  availabilityBtnText: { fontSize: 14, fontWeight: "600", color: colors.primary },

  // Deposit
  depositLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  optionalPill: {
    backgroundColor: "#F3F4F6",
    borderRadius: radii.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  optionalPillText: { fontSize: 11, fontWeight: "700", color: colors.mutedForeground },
  depositInputRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FAFAFA",
    borderRadius: radii.lg,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.12)",
    paddingHorizontal: 14, paddingVertical: 12,
  },
  depositInput: { flex: 1, fontSize: 16, fontWeight: "700", color: "#1C1628", padding: 0 },

  // Description header
  descHeaderRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 8,
  },
  descHintText: { fontSize: 11, color: colors.mutedForeground },

  // Sticky footer
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.md, paddingTop: 10,
    backgroundColor: "#F0EDFB",
    borderTopWidth: 1, borderTopColor: "rgba(120,80,220,0.08)",
    gap: 10,
  },
  quickListingRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: 12,
    ...shadows.card, shadowOpacity: 0.06,
    borderWidth: 1, borderColor: "rgba(120,80,220,0.07)",
  },
  quickListingTitle: { fontSize: 13, fontWeight: "700", color: "#1C1628" },
  quickListingSub: { fontSize: 11, color: colors.mutedForeground },
  quickModeBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.lg,
    borderWidth: 1.5, borderColor: "rgba(120,80,220,0.25)",
    paddingHorizontal: 14, paddingVertical: 8,
  },
  quickModeBtnText: { fontSize: 12, fontWeight: "800", color: "#1C1628" },

  publishBtn: {
    backgroundColor: "#7A5AFF",
    borderRadius: radii.xl,
    paddingVertical: 16,
    alignItems: "center",
    ...shadows.cardHeavy,
    shadowColor: "#7A5AFF", shadowOpacity: 0.35,
  },
  publishBtnTitle: { fontSize: 18, fontWeight: "900", color: "#fff" },
  publishBtnSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 3 },

  // Category picker modal
  catBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 8, 40, 0.45)",
    justifyContent: "flex-end",
  },
  catSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: 32,
    position: "relative",
    zIndex: 1,
  },
  catSheetTitle: { fontSize: 18, fontWeight: "800", color: "#1C1628", marginBottom: 12 },
  catEmpty: { fontSize: 14, color: colors.mutedForeground, paddingVertical: 12 },
  catRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)",
  },
  catRowText: { fontSize: 15, fontWeight: "600", color: "#1C1628" },

  // Success / error modal
  centerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 8, 40, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  centerCard: {
    width: "100%", maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.cardHeavy,
  },
  centerTitle: { fontSize: 18, fontWeight: "800", color: "#1C1628", marginBottom: 8 },
  centerBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md },
  centerActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  centerBtn: { minWidth: 96, height: 44, borderRadius: radii.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  centerBtnGhost: { backgroundColor: "#F3F4F6" },
  centerBtnGhostText: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  centerBtnPrimary: { backgroundColor: colors.primary },
  centerBtnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
