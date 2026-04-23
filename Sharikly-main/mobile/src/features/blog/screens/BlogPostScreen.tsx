import { colors, radii, spacing, typography } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import type { ProfileStackParamList } from "@/navigation/types";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Calendar, Share2 } from "lucide-react-native";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type R = RouteProp<ProfileStackParamList, "BlogPost">;

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";

function getImageUrl(path: string | undefined) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_BASE.replace("/api", "")}${path}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  } catch { return iso; }
}

export function BlogPostScreen(): React.ReactElement {
  const navigation = useNavigation();
  const { id } = useRoute<R>().params;

  const q = useQuery({
    queryKey: ["blog", "post", id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(buildApiUrl(`/blog/${id}/`));
      return data;
    },
    retry: false,
  });

  const post: any = q.data;
  const imageUrl = getImageUrl(post?.image ?? post?.featured_image);

  const handleShare = async () => {
    if (!post) return;
    await Share.share({
      title: post.title,
      message: `${post.title}\n\nhttps://ekra.app/blog/${post.slug ?? id}`,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {post?.title ?? "Blog Post"}
        </Text>
        <Pressable onPress={handleShare} style={styles.backBtn} hitSlop={8}>
          <Share2 size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {q.isPending ? (
        <View style={styles.center}>
          <Text style={styles.mutedText}>Loading post…</Text>
        </View>
      ) : q.isError || !post ? (
        <View style={styles.center}>
          <BookOpen size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>Post not found</Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          {imageUrl && (
            <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
          )}

          <View style={styles.postContainer}>
            {post.category && (
              <View style={styles.categoryChip}>
                <Text style={styles.categoryText}>{post.category}</Text>
              </View>
            )}

            <Text style={styles.title}>{post.title}</Text>

            <View style={styles.metaRow}>
              {post.author_name && (
                <Text style={styles.author}>{post.author_name}</Text>
              )}
              {post.published_at && (
                <View style={styles.dateRow}>
                  <Calendar size={12} color={colors.mutedForeground} />
                  <Text style={styles.date}>{formatDate(post.published_at)}</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Content */}
            {(post.content ?? post.body) ? (
              <Text style={styles.body}>{post.content ?? post.body}</Text>
            ) : post.excerpt ? (
              <Text style={styles.body}>{post.excerpt}</Text>
            ) : (
              <Text style={styles.mutedText}>No content available.</Text>
            )}
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
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
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.foreground, marginHorizontal: 8 },

  heroImage: { width: "100%", height: 240, backgroundColor: colors.muted },

  postContainer: { padding: spacing.md },
  categoryChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
    marginTop: 8,
  },
  categoryText: { fontSize: 11, fontWeight: "700", color: colors.primary },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.foreground,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 12,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 },
  author: { fontSize: 13, fontWeight: "600", color: colors.primary },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  date: { fontSize: 12, color: colors.mutedForeground },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 20 },
  body: { fontSize: 16, color: colors.textSecondary, lineHeight: 26 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  mutedText: { ...typography.body, color: colors.mutedForeground },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.foreground },
  retryText: { fontSize: 14, color: colors.primary, fontWeight: "600" },
});
