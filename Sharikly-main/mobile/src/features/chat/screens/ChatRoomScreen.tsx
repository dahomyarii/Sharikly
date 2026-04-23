import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { getChatMessages, sendMessage } from "@/services/api/endpoints/chat";
import type { InboxStackParamList } from "@/navigation/types";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react-native";
import React, { useRef, useState, useCallback } from "react";
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

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";

type Nav = NativeStackNavigationProp<InboxStackParamList, "ChatRoom">;
type R = RouteProp<InboxStackParamList, "ChatRoom">;

function getAvatarUrl(path: string | undefined) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_BASE.replace("/api", "")}${path}`;
}

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
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en", { month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export function ChatRoomScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { roomId } = useRoute<R>().params;
  const queryClient = useQueryClient();
  const flatRef = useRef<FlatList>(null);
  const [text, setText] = useState("");

  const roomQ = useQuery({
    queryKey: ["chat", "room", roomId],
    queryFn: async () => {
      const { getChatRoom } = await import("@/services/api/endpoints/chat");
      return getChatRoom(roomId);
    },
  });

  const msgQ = useQuery({
    queryKey: ["chat", "messages", roomId],
    queryFn: () => getChatMessages(roomId),
    refetchInterval: 4000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessage(roomId, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chat", "messages", roomId] });
      void queryClient.invalidateQueries({ queryKey: ["chat", "rooms"] });
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;
    setText("");
    sendMutation.mutate(trimmed);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
  }, [text, sendMutation]);

  const room: any = roomQ.data;
  const other = room?.other_participant ?? room?.participants?.[0];
  const otherName = other?.username ?? other?.first_name ?? "User";
  const listingTitle = room?.listing?.title;

  const rawMessages = msgQ.data;
  const messages: any[] = Array.isArray(rawMessages)
    ? rawMessages
    : (rawMessages as any)?.results ?? [];

  // Build display list with date separators
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

  const me: any = room?.current_user_id ?? null;

  const renderItem = ({ item: entry }: { item: (typeof displayItems)[0] }) => {
    if (entry.type === "date") {
      return (
        <View style={styles.dateSep}>
          <Text style={styles.dateSepText}>{entry.date}</Text>
        </View>
      );
    }
    const msg = entry.item;
    const isMine = msg.sender?.id === me || msg.is_mine === true || msg.sender_id === me;
    const senderAvatar = getAvatarUrl(msg.sender?.avatar);
    const senderInitial = (msg.sender?.username ?? msg.sender?.first_name ?? "?")
      .charAt(0)
      .toUpperCase();

    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        {!isMine && (
          <View style={styles.avatarSmall}>
            {senderAvatar ? null : (
              <Text style={styles.avatarSmallLetter}>{senderInitial}</Text>
            )}
          </View>
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
            {msg.content}
          </Text>
          {msg.created_at && (
            <Text style={[styles.timeLabel, isMine && styles.timeLabelMine]}>
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
          <Text style={styles.headerName} numberOfLines={1}>
            {otherName}
          </Text>
          {listingTitle && (
            <Text style={styles.headerListing} numberOfLines={1}>
              📦 {listingTitle}
            </Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {msgQ.isPending ? (
          <View style={styles.center}>
            <Text style={styles.mutedText}>Loading messages…</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No messages yet. Say hello! 👋</Text>
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
            onContentSizeChange={() =>
              flatRef.current?.scrollToEnd({ animated: false })
            }
            renderItem={renderItem}
          />
        )}

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            placeholder="Type a message…"
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
            style={({ pressed }) => [
              styles.sendBtn,
              (!text.trim() || sendMutation.isPending) && styles.sendBtnDisabled,
              pressed && styles.sendBtnPressed,
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
    paddingVertical: 12,
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
  headerInfo: { flex: 1 },
  headerName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  headerListing: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },

  msgList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },

  dateSep: {
    alignItems: "center",
    marginVertical: 12,
  },
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
    marginBottom: 8,
  },
  msgRowMine: {
    flexDirection: "row-reverse",
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  avatarSmallLetter: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mutedForeground,
  },

  bubble: {
    maxWidth: "75%",
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOther: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
    ...shadows.card,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    color: colors.foreground,
    lineHeight: 21,
  },
  bubbleTextMine: {
    color: "#fff",
  },
  timeLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
    marginTop: 4,
    textAlign: "right",
  },
  timeLabelMine: {
    color: "rgba(255,255,255,0.65)",
  },

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
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendBtnPressed: {
    transform: [{ scale: 0.92 }],
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  mutedText: { ...typography.body, color: colors.mutedForeground },
  emptyText: {
    fontSize: 15,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 22,
  },
});
