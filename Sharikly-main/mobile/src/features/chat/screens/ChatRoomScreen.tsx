import { colors, radii, shadows, spacing, typography } from "@/core/theme/tokens";
import { getChatMessages, sendMessage } from "@/services/api/endpoints/chat";
import type { InboxStackParamList } from "@/navigation/types";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, Send, MoreHorizontal, Phone, Paperclip, 
  MapPin, Camera, Lock, CheckCheck, Mic, Plus
} from "lucide-react-native";
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
  Image,
  Alert,
  Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { layout } from "@/core/theme/tokens";

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
    return d.toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" });
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
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  React.useEffect(() => {
    const s1 = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const s2 = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { s1.remove(); s2.remove(); };
  }, []);

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
  const otherName = other?.username ?? other?.first_name ?? "Faisal Al Mutairi";
  const otherAvatar = getAvatarUrl(other?.avatar);
  const listingTitle = room?.listing?.title;

  const rawMessages = msgQ.data;
  const messages: any[] = Array.isArray(rawMessages)
    ? rawMessages
    : (rawMessages as any)?.results ?? [];

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

    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
            {msg.content}
          </Text>
          <View style={styles.timeContainer}>
            <Text style={[styles.timeLabel, isMine && styles.timeLabelMine]}>
              {formatTime(msg.created_at || new Date().toISOString())}
            </Text>
            {isMine && <CheckCheck size={12} color="#FFF" style={{ marginLeft: 4 }} />}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={24} color={colors.primary} />
        </Pressable>
        <View style={styles.headerUser}>
          <View style={styles.headerAvatarWrap}>
            {otherAvatar ? (
              <Image source={{ uri: otherAvatar }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarLetter}>
                  {otherName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.onlineIndicator} />
          </View>
          <View>
            <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
            <View style={styles.onlineStatusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.viewBookingBtn} onPress={() => Alert.alert("Booking Details", "This would navigate to the active booking details.")}>
            <Text style={styles.viewBookingText}>View booking</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert("Options", "More options modal would appear here.")}>
            <MoreHorizontal size={24} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
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
          ListHeaderComponent={
            <View style={styles.bookingCard}>
              <View style={styles.bookingCardImgPlaceholder}>
                <Camera size={24} color="#555" />
              </View>
              <View style={styles.bookingCardInfo}>
                <Text style={styles.bookingCardTitle}>{listingTitle || "Sony A7IV Camera"}</Text>
                <Text style={styles.bookingCardDates}>May 20 - May 22, 2024</Text>
                <Text style={styles.bookingCardPrice}>Total: SAR 450</Text>
              </View>
              <View style={styles.bookingBadge}>
                <Text style={styles.bookingBadgeText}>Ongoing booking</Text>
              </View>
            </View>
          }
          renderItem={renderItem}
        />

        {/* Quick Replies */}
        <View style={styles.quickReplies}>
          {["On my way", "Got it", "See you soon"].map((reply, idx) => (
            <Pressable key={idx} style={styles.quickReplyBtn} onPress={() => setText(reply)}>
              <Text style={styles.quickReplyText}>{reply}</Text>
            </Pressable>
          ))}
        </View>

        {/* Composer */}
        <View style={[styles.composerWrapper, { paddingBottom: isKeyboardVisible ? 24 : Math.max(insets.bottom, 24) + layout.tabBarHeight + 10 }]}>
          <View style={styles.composerRow}>
            <Pressable style={styles.attachBtnPlus}>
              <Plus size={20} color="#FFF" />
            </Pressable>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.composerInput}
                placeholder="Type a message..."
                placeholderTextColor={colors.mutedForeground}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={2000}
                returnKeyType="send"
              />
              <Pressable style={styles.micBtn} onPress={handleSend}>
                {text.trim() ? <Send size={20} color={colors.primary} /> : <Mic size={20} color={colors.mutedForeground} />}
              </Pressable>
            </View>
          </View>
          
          <View style={styles.actionIconsRow}>
            <Pressable style={styles.actionIconItem} onPress={() => Alert.alert("Attach File", "File picker would open here.")}>
              <View style={styles.actionIconWrap}><Paperclip size={20} color={colors.foreground} /></View>
              <Text style={styles.actionIconLabel}>Attachment</Text>
            </Pressable>
            <Pressable style={styles.actionIconItem} onPress={() => Alert.alert("Send Location", "Location sharing map would open here.")}>
              <View style={styles.actionIconWrap}><MapPin size={20} color={colors.foreground} /></View>
              <Text style={styles.actionIconLabel}>Location</Text>
            </Pressable>
            <Pressable style={styles.actionIconItem} onPress={() => Alert.alert("Call User", `Initiating call to ${otherName}...`)}>
              <View style={styles.actionIconWrap}><Phone size={20} color={colors.foreground} /></View>
              <Text style={styles.actionIconLabel}>Call</Text>
            </Pressable>
            <Pressable style={styles.actionIconItem} onPress={() => Alert.alert("Send Photo", "Camera or gallery picker would open here.")}>
              <View style={styles.actionIconWrap}><Camera size={20} color={colors.foreground} /></View>
              <Text style={styles.actionIconLabel}>Send Photo</Text>
            </Pressable>
          </View>

          <View style={styles.secureBanner}>
            <Lock size={14} color={colors.primary} />
            <Text style={styles.secureText}>Secure chat. Payments are protected.</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  flex: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    marginRight: 12,
  },
  headerUser: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.muted },
  headerAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  headerAvatarLetter: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  onlineIndicator: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFF'
  },
  headerName: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  onlineStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  onlineText: { fontSize: 12, color: colors.mutedForeground },
  
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  viewBookingBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radii.full, borderWidth: 1, borderColor: colors.primary,
  },
  viewBookingText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  msgList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },

  bookingCard: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: radii.lg,
    padding: 12,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    ...shadows.card,
    shadowOpacity: 0.02,
  },
  bookingCardImgPlaceholder: {
    width: 60, height: 60, borderRadius: 8, backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  bookingCardInfo: { flex: 1 },
  bookingCardTitle: { fontSize: 15, fontWeight: '700', color: colors.foreground, marginBottom: 4 },
  bookingCardDates: { fontSize: 13, color: colors.mutedForeground, marginBottom: 2 },
  bookingCardPrice: { fontSize: 13, color: colors.foreground, fontWeight: '500' },
  bookingBadge: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  bookingBadgeText: { fontSize: 11, fontWeight: '600', color: '#059669' },

  dateSep: {
    alignItems: "center",
    marginVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dateSepText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.mutedForeground,
    paddingHorizontal: 12,
  },

  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  msgRowMine: {
    flexDirection: "row-reverse",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleOther: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderBottomLeftRadius: 4,
    ...shadows.card,
    shadowOpacity: 0.03,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    color: colors.foreground,
    lineHeight: 22,
  },
  bubbleTextMine: {
    color: "#fff",
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeLabel: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  timeLabelMine: {
    color: "rgba(255,255,255,0.7)",
  },

  quickReplies: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: 12,
    gap: 8,
  },
  quickReplyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...shadows.card,
    shadowOpacity: 0.02,
  },
  quickReplyText: { fontSize: 14, fontWeight: '600', color: colors.foreground },

  composerWrapper: {
    backgroundColor: "#FFF",
    paddingHorizontal: spacing.md,
    paddingTop: 8,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  attachBtnPlus: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingRight: 12,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  micBtn: { padding: 4 },

  actionIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  actionIconItem: { alignItems: 'center', gap: 8 },
  actionIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center', justifyContent: 'center',
    ...shadows.card, shadowOpacity: 0.02,
  },
  actionIconLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },

  secureBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  secureText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
