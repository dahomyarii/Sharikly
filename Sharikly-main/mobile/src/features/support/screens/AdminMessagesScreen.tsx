import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, MessageSquare, Send, Shield } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// AdminMessagesScreen is for the user's conversations with administrators
// It re-uses /user-admin-messages/ but is listed as a separate entry in the navigator
// for access via the profile menu "Messages" link

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

export function AdminMessagesScreen(): React.ReactElement {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const flatRef = useRef<FlatList>(null);
  const [text, setText] = useState("");

  const q = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(buildApiUrl("/user-admin-messages/"));
      return data;
    },
    refetchInterval: 6000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await axiosInstance.post(buildApiUrl("/user-admin-messages/"), {
        message: content,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      setText("");
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
    },
  });

  const rawMessages = q.data;
  const messages: any[] = Array.isArray(rawMessages)
    ? rawMessages
    : (rawMessages as any)?.results ?? [];

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  const renderItem = ({ item: msg }: { item: any }) => {
    const isAdmin = msg.is_from_admin === true || msg.sender === "admin" || msg.direction === "from_admin";
    return (
      <View style={[styles.msgRow, !isAdmin && styles.msgRowUser]}>
        {isAdmin && (
          <View style={styles.adminAvatar}>
            <Shield size={13} color={colors.primary} />
          </View>
        )}
        <View style={[styles.bubble, isAdmin ? styles.bubbleAdmin : styles.bubbleUser]}>
          {isAdmin && <Text style={styles.adminLabel}>Ekra Support</Text>}
          <Text style={[styles.bubbleText, !isAdmin && { color: "#fff" }]}>
            {msg.message ?? msg.content ?? ""}
          </Text>
          {msg.created_at && (
            <Text style={[styles.timeLabel, !isAdmin && { color: "rgba(255,255,255,0.65)" }]}>
              {formatTime(msg.created_at)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Shield size={16} color={colors.primary} />
          <Text style={styles.headerTitle}>Admin Messages</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {q.isPending ? (
          <View style={styles.center}>
            <Text style={styles.mutedText}>Loading messages…</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.center}>
            <MessageSquare size={40} color={colors.muted} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>Start a conversation with the Ekra team.</Text>
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(item, i) => String(item.id ?? i)}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
            renderItem={renderItem}
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            placeholder="Type a message…"
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || sendMutation.isPending) && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
          >
            <Send size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },

  msgList: { padding: spacing.md, paddingBottom: 16 },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 10,
  },
  msgRowUser: { flexDirection: "row-reverse" },
  adminAvatar: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAdmin: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
    ...shadows.card,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  adminLabel: { fontSize: 10, fontWeight: "700", color: colors.primary, marginBottom: 3 },
  bubbleText: { fontSize: 15, color: colors.foreground, lineHeight: 21 },
  timeLabel: { fontSize: 10, color: colors.mutedForeground, marginTop: 4, textAlign: "right" },

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    paddingBottom: 16,
    backgroundColor: "rgba(249,248,255,0.97)",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.fab,
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  mutedText: { ...typography.body, color: colors.mutedForeground },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: colors.foreground },
  emptyText: { fontSize: 13, color: colors.mutedForeground, textAlign: "center" },
});
