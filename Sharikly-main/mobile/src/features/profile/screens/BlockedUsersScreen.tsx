import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, UserMinus } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function BlockedUsersScreen(): React.ReactElement {
  const queryClient = useQueryClient();

  const usersQ = useQuery({
    queryKey: ["users", "blocked"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(buildApiUrl("/users/blocked/"));
      return Array.isArray(data) ? data : [];
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (userId: number) => {
      await axiosInstance.delete(buildApiUrl(`/users/${userId}/unblock/`));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "blocked"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.detail || "Failed to unblock user.");
    },
  });

  const handleUnblock = (userId: number) => {
    Alert.alert("Unblock User", "Are you sure you want to unblock this user?", [
      { text: "Cancel", style: "cancel" },
      { text: "Unblock", onPress: () => unblockMutation.mutate(userId) },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const avatarUrl = item.avatar
      ? item.avatar.startsWith("http")
        ? item.avatar
        : `${process.env.EXPO_PUBLIC_API_BASE?.replace("/api", "") || ""}${item.avatar}`
      : null;

    return (
      <View style={styles.userCard}>
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <User size={20} color={colors.mutedForeground} />
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.username || item.email}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.unblockBtn,
            pressed && styles.unblockBtnPressed,
            unblockMutation.isPending && { opacity: 0.5 },
          ]}
          onPress={() => handleUnblock(item.id)}
          disabled={unblockMutation.isPending}
        >
          <Text style={styles.unblockBtnText}>Unblock</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Blocked Users</Text>
      </View>

      {usersQ.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : usersQ.data?.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <UserMinus size={48} color={colors.muted} />
          </View>
          <Text style={styles.emptyTitle}>No blocked users</Text>
          <Text style={styles.emptyText}>
            When you block someone, they will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={usersQ.data}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  screenTitle: { fontSize: 26, fontWeight: "900", color: colors.foreground, letterSpacing: -0.5 },
  list: { padding: spacing.md },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  avatarWrap: { marginRight: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.muted,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.foreground,
  },
  unblockBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  unblockBtnPressed: {
    backgroundColor: colors.accent,
  },
  unblockBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.foreground,
  },

  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(124, 58, 237, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 20,
  },
});
