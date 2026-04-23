import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, FilePlus, PenLine, Trash2 } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return iso; }
}

export function AdminBlogScreen(): React.ReactElement {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const q = useQuery({
    queryKey: ["blog", "admin"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(buildApiUrl("/blog/"));
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(buildApiUrl(`/blog/${id}/`)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["blog"] }),
    onError: () => Alert.alert("Failed to delete post."),
  });

  const posts: any[] = q.data
    ? Array.isArray(q.data) ? q.data : (q.data as any)?.results ?? []
    : [];

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.postDate}>
            {item.published_at ? formatDate(item.published_at) : "Draft"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable style={styles.actionBtn}>
            <PenLine size={14} color={colors.primary} />
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: "rgba(220,38,38,0.08)" }]}
            onPress={() =>
              Alert.alert("Delete Post", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
              ])
            }
          >
            <Trash2 size={14} color={colors.destructive} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Blog</Text>
        <Pressable style={styles.addBtn} onPress={() => Alert.alert("Create post", "This feature is coming soon.")}>
          <FilePlus size={18} color={colors.primary} />
        </Pressable>
      </View>
      {q.isPending ? (
        <View style={styles.center}>
          <Text style={styles.mutedText}>Loading posts…</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No blog posts</Text>
            </View>
          }
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground },
  list: { padding: spacing.md, paddingBottom: 80 },
  card: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 8,
    ...shadows.card,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  postTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 4 },
  postDate: { fontSize: 12, color: colors.mutedForeground },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  mutedText: { ...typography.body, color: colors.mutedForeground },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: colors.foreground },
});
