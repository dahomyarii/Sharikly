import { colors, radii, spacing, typography } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { getListing, getCategories } from "@/services/api/endpoints/listings";
import type { ListingsStackParamList } from "@/navigation/types";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Save,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
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

type Nav = NativeStackNavigationProp<ListingsStackParamList, "EditListing">;
type R = RouteProp<ListingsStackParamList, "EditListing">;

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";

function getImageUrl(path: string | undefined) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_BASE.replace("/api", "")}${path}`;
}

export function EditListingScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { id } = useRoute<R>().params;
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
    price_per_day: "",
    city: "",
    is_active: true,
  });
  const [newPhotos, setNewPhotos] = useState<{ uri: string; name: string; type: string }[]>([]);

  const q = useQuery({
    queryKey: ["listing", id],
    queryFn: () => getListing(id),
  });

  const catsQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const listing: any = q.data;
  const categories: any[] = catsQ.data
    ? Array.isArray(catsQ.data)
      ? catsQ.data
      : (catsQ.data as any)?.results ?? []
    : [];

  useEffect(() => {
    if (listing) {
      setForm({
        title: listing.title ?? "",
        description: listing.description ?? "",
        category_id: listing.category ? String(listing.category.id ?? listing.category) : "",
        price_per_day: String(listing.price_per_day ?? ""),
        city: listing.city ?? "",
        is_active: listing.is_active !== false,
      });
    }
  }, [listing]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title,
        description: form.description,
        price_per_day: form.price_per_day,
        city: form.city,
        category_id: Number(form.category_id),
        is_active: form.is_active,
      };
      await axiosInstance.patch(buildApiUrl(`/listings/${id}/`), payload);

      // Upload new photos if any
      if (newPhotos.length > 0) {
        const formData = new FormData();
        newPhotos.forEach((photo) => {
          formData.append("images", {
            uri: photo.uri,
            name: photo.name,
            type: photo.type,
          } as any);
        });
        await axiosInstance.post(buildApiUrl(`/listings/${id}/images/`), formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["listing", id] });
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
      Alert.alert("Listing updated! ✅");
      navigation.goBack();
    },
    onError: (err: any) => {
      const detail =
        err?.response?.data?.detail ??
        Object.values(err?.response?.data ?? {})[0] ??
        "Failed to update listing.";
      Alert.alert("Error", String(Array.isArray(detail) ? detail[0] : detail));
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) =>
      axiosInstance.delete(buildApiUrl(`/listings/images/${imageId}/`)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["listing", id] }),
    onError: () => Alert.alert("Failed to remove image."),
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
      selectionLimit: 8,
    });
    if (!result.canceled) {
      const photos = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName ?? `photo-${Date.now()}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      }));
      setNewPhotos((prev) => [...prev, ...photos].slice(0, 8));
    }
  };

  if (q.isPending) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
            <ArrowLeft size={22} color={colors.foreground} />
          </Pressable>
          <Text style={styles.topTitle}>Edit Listing</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.mutedText}>Loading listing…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const existingImages: any[] = listing?.images ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
          <ArrowLeft size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.topTitle}>Edit Listing</Text>
        <Pressable
          style={styles.saveBtn}
          onPress={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
        >
          <Save size={16} color="#fff" />
          <Text style={styles.saveBtnText}>{updateMutation.isPending ? "Saving…" : "Save"}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text style={styles.fieldLabel}>Title *</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
            placeholder="Item title"
            placeholderTextColor={colors.mutedForeground}
            maxLength={100}
          />

          {/* Description */}
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            placeholder="Describe your item…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={1000}
          />

          {/* Category */}
          <Text style={styles.fieldLabel}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChips}
          >
            {categories.map((cat: any) => (
              <Pressable
                key={cat.id}
                style={[styles.chip, form.category_id === String(cat.id) && styles.chipActive]}
                onPress={() => setForm((f) => ({ ...f, category_id: String(cat.id) }))}
              >
                <Text style={[styles.chipText, form.category_id === String(cat.id) && styles.chipTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Price */}
          <Text style={styles.fieldLabel}>Price per day (SAR) *</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>SAR</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={form.price_per_day}
              onChangeText={(v) => setForm((f) => ({ ...f, price_per_day: v }))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          {/* City */}
          <Text style={styles.fieldLabel}>City *</Text>
          <View style={styles.inputWithIcon}>
            <MapPin size={15} color={colors.primary} />
            <TextInput
              style={[styles.input, { flex: 1, borderWidth: 0, paddingVertical: 0 }]}
              value={form.city}
              onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
              placeholder="e.g., Riyadh"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          {/* Active toggle */}
          <View style={styles.activeRow}>
            <View>
              <Text style={styles.fieldLabel}>Active</Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                Make this listing visible to renters
              </Text>
            </View>
            <Switch
              value={form.is_active}
              onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              trackColor={{ true: colors.primary, false: colors.muted }}
            />
          </View>

          {/* Existing images */}
          <Text style={styles.fieldLabel}>Current Photos</Text>
          <View style={styles.photoGrid}>
            {existingImages.map((img: any) => {
              const url = getImageUrl(img.image);
              return (
                <View key={img.id} style={styles.photoWrap}>
                  {url && (
                    <Image source={{ uri: url }} style={styles.photoThumb} resizeMode="cover" />
                  )}
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() =>
                      Alert.alert("Remove photo?", "", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Remove",
                          style: "destructive",
                          onPress: () => deleteImageMutation.mutate(img.id),
                        },
                      ])
                    }
                    hitSlop={4}
                  >
                    <X size={11} color="#fff" />
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* Add more photos */}
          <Text style={styles.fieldLabel}>Add More Photos</Text>
          <View style={styles.photoGrid}>
            {newPhotos.map((photo, i) => (
              <View key={i} style={styles.photoWrap}>
                <Image source={{ uri: photo.uri }} style={styles.photoThumb} resizeMode="cover" />
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => setNewPhotos((prev) => prev.filter((_, j) => j !== i))}
                  hitSlop={4}
                >
                  <X size={11} color="#fff" />
                </Pressable>
              </View>
            ))}
            <Pressable style={styles.addPhotoBtn} onPress={pickPhotos}>
              <Camera size={22} color={colors.primary} />
              <Text style={styles.addPhotoText}>Add Photos</Text>
            </Pressable>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: "rgba(249,248,255,0.97)",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  mutedText: { ...typography.body, color: colors.mutedForeground },
  scrollContent: { padding: spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: colors.foreground, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textArea: { minHeight: 90, lineHeight: 22, paddingTop: 12 },
  categoryChips: { gap: 8, paddingBottom: 4 },
  chip: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.primary },
  chipTextActive: { color: "#fff" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  currency: { fontSize: 15, fontWeight: "700", color: colors.mutedForeground },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoWrap: { position: "relative", width: 86, height: 86 },
  photoThumb: { width: "100%", height: "100%", borderRadius: radii.md },
  removeBtn: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.destructive,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoBtn: {
    width: 86,
    height: 86,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.accent,
  },
  addPhotoText: { fontSize: 10, color: colors.primary, fontWeight: "700" },
});
