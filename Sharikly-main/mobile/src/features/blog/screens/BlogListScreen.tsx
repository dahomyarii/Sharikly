import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import type { ProfileStackParamList } from "@/navigation/types";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react-native";
import React from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Nav = NativeStackNavigationProp<ProfileStackParamList, "BlogList">;

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";

function getImageUrl(path: string | undefined) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_BASE.replace("/api", "")}${path}`;
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return iso; }
}

export function BlogListScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  const q = useQuery({
    queryKey: ["blog", "list"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(buildApiUrl("/blog/"));
      return data;
    },
    retry: false,
  });

  const posts: any[] = q.data
    ? Array.isArray(q.data) ? q.data : (q.data as any)?.results ?? []
    : [];

  const renderItem = ({ item }: { item: any }) => {
    const imageUrl = getImageUrl(item.image ?? item.featured_image);
    return (
      <Pressable
        style={styles.card}
      onPress={() => navigation.navigate("BlogPost", { id: item.id })}
      >
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
        )}
        <View style={styles.cardBody}>
          {item.category && (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          {item.excerpt && (
            <Text style={styles.cardExcerpt} numberOfLines={2}>{item.excerpt}</Text>
          )}
          <View style={styles.cardMeta}>
            <Calendar size={12} color={colors.mutedForeground} />
            <Text style={styles.cardDate}>{item.published_at ? formatDate(item.published_at) : ""}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Blog</Text>
        <View style={{ width: 40 }} />
      </View>

      {q.isPending ? (
        <View style={styles.center}>
          <Text style={styles.mutedText}>Loading posts…</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.center}>
          <BookOpen size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No blog posts yet</Text>
          <Text style={styles.emptyText}>Check back soon for tips, stories, and updates from Ekra.</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id ?? item.slug)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: colors.foreground },
  list: { padding: spacing.md, paddingBottom: 80 },
  card: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 12,
    ...shadows.card,
  },
  cardImage: { width: "100%", height: 180 },
  cardBody: { padding: spacing.md },
  categoryChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  categoryText: { fontSize: 11, fontWeight: "700", color: colors.primary },
  cardTitle: { fontSize: 17, fontWeight: "800", color: colors.foreground, marginBottom: 6, lineHeight: 24 },
  cardExcerpt: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 10 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardDate: { fontSize: 12, color: colors.mutedForeground },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  mutedText: { ...typography.body, color: colors.mutedForeground },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.foreground },
  emptyText: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
});
