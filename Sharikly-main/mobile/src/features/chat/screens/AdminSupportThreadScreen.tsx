import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import type { InboxStackParamList } from "@/navigation/types";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Shield } from "lucide-react-native";
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

type Nav = NativeStackNavigationProp<InboxStackParamList, "AdminSupportThread">;

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatDateGroup(iso: string) {
  try {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    return d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function AdminSupportThreadScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const flatRef = useRef<FlatList>(null);
  const [text, setText] = useState("");

  const q = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(buildApiUrl("/user-admin-messages/"));
      return data;
    },
    refetchInterval: 5000,
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
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
    },
  });

  const rawMessages = q.data;
  const messages: any[] = Array.isArray(rawMessages)
    ? rawMessages
    : (rawMessages as any)?.results ?? [];

  // Build display items with date separators
  const displayItems: ({ type: "date"; date: string } | { type: "msg"; item: any })[] = [];
  let lastDate = "";
  for (const msg of messages) {
    const dateStr = msg.created_at ? formatDateGroup(msg.created_at) : "";
    if (dateStr && dateStr !== lastDate) {
      displayItems.push({ type: "date", date: dateStr });
      lastDate = dateStr;
    }
    displayItems.push({ type: "msg", item: msg });
  }

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;
    setText("");
    sendMutation.mutate(trimmed);
  };

  const renderItem = ({ item: entry }: { item: (typeof displayItems)[0] }) => {
    if (entry.type === "date") {
      return (
        <View style={styles.dateSep}>
          <Text style={styles.dateSepText}>{entry.date}</Text>
        </View>
      );
    }
    const msg = entry.item;
    // is_from_admin = true means support team message
    const isAdmin = msg.is_from_admin === true || msg.sender === "admin" || msg.direction === "from_admin";
    return (
      <View style={[styles.msgRow, !isAdmin && styles.msgRowUser]}>
        {isAdmin && (
          <View style={styles.adminAvatar}>
            <Shield size={14} color={colors.primary} />
          </View>
        )}
        <View style={[styles.bubble, isAdmin ? styles.bubbleAdmin : styles.bubbleUser]}>
          {isAdmin && <Text style={styles.adminLabel}>Ekra Support</Text>}
          <Text style={[styles.bubbleText, !isAdmin && styles.bubbleTextUser]}>
            {msg.message ?? msg.content ?? msg.text ?? ""}
          </Text>
          {msg.created_at && (
            <Text style={[styles.timeLabel, !isAdmin && styles.timeLabelUser]}>
              {formatTime(msg.created_at)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerInfo}>
          <View style={styles.headerIconWrap}>
            <Shield size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.headerName}>Ekra Support</Text>
            <Text style={styles.headerSub}>We typically reply within a few hours</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {q.isPending ? (
          <View style={styles.center}>
            <Text style={styles.mutedText}>Loading messages…</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.center}>
            <Shield size={40} color={colors.muted} />
            <Text style={styles.emptyTitle}>Start a conversation</Text>
            <Text style={styles.emptyText}>
              Send a message to Ekra Support. We&apos;re here to help!
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={displayItems}
            keyExtractor={(entry, i) =>
              entry.type === "date" ? `date-${i}` : String(entry.item?.id ?? i)
            }
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
            renderItem={renderItem}
          />
        )}

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            placeholder="Type your message to Ekra Support…"
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <Pressable
            style={[
              styles.sendBtn,
              (!text.trim() || sendMutation.isPending) && styles.sendBtnDisabled,
            ]}
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
  flex: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: "rgba(249,248,255,0.97)",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
    ...shadows.card,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerName: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  headerSub: { fontSize: 11, color: colors.mutedForeground, marginTop: 1 },

  msgList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  dateSep: { alignItems: "center", marginVertical: 12 },
  dateSepText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedForeground,
    backgroundColor: colors.muted,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 10,
  },
  msgRowUser: {
    flexDirection: "row-reverse",
  },
  adminAvatar: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
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
  adminLabel: { fontSize: 10, fontWeight: "700", color: colors.primary, marginBottom: 4 },
  bubbleText: { fontSize: 15, color: colors.foreground, lineHeight: 21 },
  bubbleTextUser: { color: "#fff" },
  timeLabel: { fontSize: 10, color: colors.mutedForeground, marginTop: 4, textAlign: "right" },
  timeLabelUser: { color: "rgba(255,255,255,0.65)" },

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
    ...shadows.tabBar,
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
    lineHeight: 20,
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
  sendBtnDisabled: { opacity: 0.45 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  mutedText: { ...typography.body, color: colors.mutedForeground },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.foreground },
  emptyText: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
});
