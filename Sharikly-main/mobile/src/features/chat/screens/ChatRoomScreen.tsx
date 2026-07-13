import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import {
  getChatMessages,
  sendMessage,
  sendImageMessage,
  sendFileMessage,
  sendAudioMessage,
  sendLocationMessage,
} from "@/services/api/endpoints/chat";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { showToast } from "@/core/events/appEvents";
import { useAuthStore } from "@/store/authStore";
import type { InboxStackParamList } from "@/navigation/types";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute, useIsFocused } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import { useVoiceRecorder } from "@/features/chat/useVoiceRecorder";
import { AudioMessage } from "@/features/chat/AudioMessage";
import {
  ArrowLeft, Send, Paperclip,
  MapPin, Camera, Lock, CheckCheck, Plus, FileText, X, Mic, Check
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
  Linking,
  Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { layout } from "@/core/theme/tokens";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";

function staticMapUrl(lat: number, lng: number): string | null {
  if (!MAPBOX_TOKEN) return null;
  const marker = `pin-s+b047f6(${lng},${lat})`;
  return (
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
    `${marker}/${lng},${lat},13,0/320x180@2x?access_token=${MAPBOX_TOKEN}&logo=false&attribution=false`
  );
}

function openInMaps(lat: number, lng: number) {
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`).catch(() => {});
}

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
  const isFocused = useIsFocused();
  const hasSession = useAuthStore((s) => s.hasSession);
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
    enabled: hasSession,
  });

  const userQ = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => axiosInstance.get(buildApiUrl("/auth/me/")).then((res: any) => res.data),
    enabled: hasSession,
  });
  const myId = (userQ.data as any)?.id ?? null;

  const msgQ = useQuery({
    queryKey: ["chat", "messages", roomId],
    queryFn: () => getChatMessages(roomId),
    enabled: hasSession,
    // Only poll while the screen is focused and the user is signed in — otherwise it
    // keeps hitting the network in the background / for guests.
    refetchInterval: isFocused && hasSession ? 4000 : false,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessage(roomId, content),
    onSuccess: () => {
      // Clear the input only after the message is actually sent, so a failed send keeps
      // the user's text instead of silently discarding it.
      setText("");
      void queryClient.invalidateQueries({ queryKey: ["chat", "messages", roomId] });
      void queryClient.invalidateQueries({ queryKey: ["chat", "rooms"] });
    },
    onError: () => showToast("Couldn't send your message. Please try again.", "error"),
  });

  // Staged attachment (draft) — set by the pickers, committed on Send.
  const [draft, setDraft] = useState<any>(null);
  const [attaching, setAttaching] = useState(false);
  const [sending, setSending] = useState(false);
  const voice = useVoiceRecorder();

  const handleStartRecording = useCallback(async () => {
    if (attaching || sending || draft) return;
    const ok = await voice.start();
    if (!ok) {
      showToast("Please allow microphone access to record a voice message.", "warning");
    }
  }, [attaching, sending, draft, voice]);

  const handleStopRecording = useCallback(async () => {
    const secs = voice.seconds;
    const asset = await voice.stop();
    if (asset) setDraft({ kind: "audio", asset, seconds: secs, name: "Voice message" });
  }, [voice]);

  const handleCancelRecording = useCallback(async () => {
    await voice.cancel();
  }, [voice]);

  const refreshAfterSend = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["chat", "messages", roomId] });
    void queryClient.invalidateQueries({ queryKey: ["chat", "rooms"] });
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 300);
  }, [queryClient, roomId]);

  // Pick a photo — stage it as a draft (does NOT send).
  const handleSendPhoto = useCallback(async () => {
    if (attaching || sending) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast("Please allow photo access to attach an image.", "warning");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setDraft({
      kind: "image",
      previewUri: a.uri,
      name: a.fileName ?? "photo.jpg",
      asset: { uri: a.uri, fileName: a.fileName ?? undefined, mimeType: a.mimeType ?? "image/jpeg" },
    });
  }, [attaching, sending]);

  // Pick a file — stage it as a draft (does NOT send).
  const handleAttachFile = useCallback(async () => {
    if (attaching || sending) return;
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setDraft({
      kind: "file",
      name: a.name,
      asset: { uri: a.uri, name: a.name, mimeType: a.mimeType ?? "application/octet-stream" },
    });
  }, [attaching, sending]);

  // Get current coordinates — web uses the browser Geolocation API (expo-location's
  // web layer is unreliable in desktop browsers); native uses expo-location.
  const getCurrentCoords = useCallback((): Promise<{ latitude: number; longitude: number }> => {
    if (Platform.OS === "web") {
      return new Promise((resolve, reject) => {
        const geo = (globalThis as any)?.navigator?.geolocation;
        if (!geo) return reject(new Error("Geolocation not supported"));
        geo.getCurrentPosition(
          (pos: any) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          (err: any) => reject(err),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      });
    }
    return (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) throw new Error("permission denied");
      const pos = await Location.getCurrentPositionAsync({});
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    })();
  }, []);

  // Get location — stage it as a draft (does NOT send).
  const handleShareLocation = useCallback(async () => {
    if (attaching || sending) return;
    setAttaching(true);
    try {
      const { latitude, longitude } = await getCurrentCoords();
      setDraft({ kind: "location", latitude, longitude });
    } catch (e: any) {
      const denied = e?.code === 1 || /denied|permission/i.test(String(e?.message));
      showToast(
        denied
          ? "Please allow location access to share your location."
          : "Couldn't get your location. Please try again.",
        denied ? "warning" : "error"
      );
    } finally {
      setAttaching(false);
    }
  }, [attaching, sending, getCurrentCoords]);

  const clearDraft = useCallback(() => setDraft(null), []);

  // Send: commits the staged draft (with the typed text as a caption) or a plain text message.
  const handleSend = useCallback(async () => {
    if (sending) return;
    const caption = text.trim();
    if (draft) {
      setSending(true);
      try {
        if (draft.kind === "image") await sendImageMessage(roomId, draft.asset, caption || undefined);
        else if (draft.kind === "file") await sendFileMessage(roomId, draft.asset, caption || undefined);
        else if (draft.kind === "audio") await sendAudioMessage(roomId, draft.asset, caption || undefined, draft.seconds);
        else if (draft.kind === "location") await sendLocationMessage(roomId, draft.latitude, draft.longitude, caption || undefined);
        setDraft(null);
        setText("");
        refreshAfterSend();
      } catch {
        showToast("Couldn't send your message. Please try again.", "error");
      } finally {
        setSending(false);
      }
      return;
    }
    if (!caption) return;
    // Do NOT clear text here — sendMutation.onSuccess clears it, so a failed send
    // preserves the typed message.
    sendMutation.mutate(caption);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
  }, [sending, text, draft, roomId, refreshAfterSend, sendMutation]);

  const room: any = roomQ.data;
  const other =
    room?.participants?.find((p: any) => p.id !== myId) ?? room?.participants?.[0];
  const otherName = other?.first_name || other?.username || "User";
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

  const renderItem = ({ item: entry }: { item: (typeof displayItems)[0] }) => {
    if (entry.type === "date") {
      return (
        <View style={styles.dateSep}>
          <Text style={styles.dateSepText}>{entry.date}</Text>
        </View>
      );
    }
    const msg = entry.item;
    const isMine = myId != null && msg.sender?.id === myId;
    const hasImage = !!msg.image_url;
    const hasFile = !!msg.file_url;
    const hasAudio = !!msg.audio_url;
    const hasLocation = msg.latitude != null && msg.longitude != null;
    const mapUrl = hasLocation ? staticMapUrl(msg.latitude, msg.longitude) : null;

    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          {hasAudio && <AudioMessage uri={msg.audio_url} mine={isMine} durationSec={msg.audio_duration} />}

          {hasImage && (
            <Pressable onPress={() => Linking.openURL(msg.image_url).catch(() => {})}>
              <Image source={{ uri: msg.image_url }} style={styles.msgImage} resizeMode="cover" />
            </Pressable>
          )}

          {hasFile && (
            <Pressable
              style={styles.fileAttachment}
              onPress={() => Linking.openURL(msg.file_url).catch(() => {})}
            >
              <View style={[styles.fileIconWrap, isMine && styles.fileIconWrapMine]}>
                <FileText size={20} color={isMine ? "#FFF" : colors.primary} />
              </View>
              <Text style={[styles.fileName, isMine && styles.bubbleTextMine]} numberOfLines={1}>
                {msg.file_name || "Attachment"}
              </Text>
            </Pressable>
          )}

          {hasLocation && (
            <Pressable
              style={styles.locationWrap}
              onPress={() => openInMaps(msg.latitude, msg.longitude)}
            >
              {mapUrl ? (
                <Image source={{ uri: mapUrl }} style={styles.mapThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.mapThumb, styles.mapFallback]}>
                  <MapPin size={24} color={colors.primary} />
                </View>
              )}
              <View style={styles.locationLabelRow}>
                <MapPin size={13} color={isMine ? "#FFF" : colors.primary} />
                <Text style={[styles.locationLabel, isMine && styles.bubbleTextMine]}>
                  Shared location · Open in Maps
                </Text>
              </View>
            </Pressable>
          )}

          {!!msg.text && (
            <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine, (hasImage || hasFile || hasAudio || hasLocation) && { marginTop: 6 }]}>
              {msg.text}
            </Text>
          )}

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
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
            {listingTitle ? (
              <Text style={styles.onlineText} numberOfLines={1}>{listingTitle}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.viewBookingBtn} onPress={() => (navigation as any).navigate("BookingsTab", { screen: "Bookings" })}>
            <Text style={styles.viewBookingText}>View booking</Text>
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
            listingTitle ? (
              <Pressable
                style={styles.bookingCard}
                onPress={() => (navigation as any).navigate("BookingsTab", { screen: "Bookings" })}
              >
                <View style={styles.bookingCardImgPlaceholder}>
                  <Camera size={24} color="#555" />
                </View>
                <View style={styles.bookingCardInfo}>
                  <Text style={styles.bookingCardTitle} numberOfLines={1}>{listingTitle}</Text>
                  <Text style={styles.bookingCardDates}>Tap to view booking details</Text>
                </View>
              </Pressable>
            ) : null
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
          {/* Recording bar (while recording a voice message) */}
          {voice.isRecording ? (
            <View style={styles.draftBar}>
              <View style={styles.recDot} />
              <Text style={styles.draftLabel}>
                Recording… {Math.floor(voice.seconds / 60)}:{String(voice.seconds % 60).padStart(2, "0")}
              </Text>
              <Pressable onPress={handleCancelRecording} hitSlop={8} style={styles.draftRemove}>
                <X size={16} color={colors.mutedForeground} />
              </Pressable>
              <Pressable onPress={handleStopRecording} hitSlop={8} style={styles.recStopBtn} testID="voice-stop">
                <Check size={16} color="#FFF" />
              </Pressable>
            </View>
          ) : draft ? (
            /* Staged attachment preview (not sent until Send is tapped) */
            <View style={styles.draftBar}>
              {draft.kind === "image" ? (
                <Image source={{ uri: draft.previewUri }} style={styles.draftThumb} resizeMode="cover" />
              ) : draft.kind === "file" ? (
                <View style={styles.draftIcon}><FileText size={18} color={colors.primary} /></View>
              ) : draft.kind === "audio" ? (
                <View style={styles.draftIcon}><Mic size={18} color={colors.primary} /></View>
              ) : (
                <View style={styles.draftIcon}><MapPin size={18} color={colors.primary} /></View>
              )}
              <Text style={styles.draftLabel} numberOfLines={1}>
                {draft.kind === "image"
                  ? (draft.name || "Photo")
                  : draft.kind === "file"
                    ? draft.name
                    : draft.kind === "audio"
                      ? `Voice message · ${Math.floor((draft.seconds || 0) / 60)}:${String((draft.seconds || 0) % 60).padStart(2, "0")}`
                      : "Current location"}
              </Text>
              <Pressable onPress={clearDraft} hitSlop={8} style={styles.draftRemove}>
                <X size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.composerRow}>
            <Pressable style={styles.attachBtnPlus}>
              <Plus size={20} color="#FFF" />
            </Pressable>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.composerInput}
                placeholder={draft ? "Add a caption…" : "Type a message..."}
                placeholderTextColor={colors.mutedForeground}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={2000}
                returnKeyType="send"
              />
              <Pressable
                style={styles.micBtn}
                onPress={handleSend}
                disabled={!(text.trim() || draft)}
                testID="composer-send"
                accessibilityRole="button"
              >
                <Send size={20} color={(text.trim() || draft) ? colors.primary : "#C4C4CC"} />
              </Pressable>
            </View>
          </View>
          
          <View style={styles.actionIconsRow}>
            <Pressable style={styles.actionIconItem} onPress={handleAttachFile} disabled={attaching}>
              <View style={styles.actionIconWrap}><Paperclip size={20} color={colors.foreground} /></View>
              <Text style={styles.actionIconLabel}>Attachment</Text>
            </Pressable>
            <Pressable style={styles.actionIconItem} onPress={handleSendPhoto} disabled={attaching}>
              <View style={styles.actionIconWrap}><Camera size={20} color={colors.foreground} /></View>
              <Text style={styles.actionIconLabel}>Send Photo</Text>
            </Pressable>
            <Pressable style={styles.actionIconItem} onPress={handleShareLocation} disabled={attaching}>
              <View style={styles.actionIconWrap}><MapPin size={20} color={colors.foreground} /></View>
              <Text style={styles.actionIconLabel}>Location</Text>
            </Pressable>
            <Pressable style={styles.actionIconItem} onPress={handleStartRecording} disabled={attaching || !!draft || voice.isRecording}>
              <View style={styles.actionIconWrap}><Mic size={20} color={colors.foreground} /></View>
              <Text style={styles.actionIconLabel}>Voice</Text>
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
  msgImage: {
    width: 200,
    height: 200,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  fileAttachment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: 240,
  },
  fileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(176,71,246,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  fileIconWrapMine: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  locationWrap: {
    width: 220,
  },
  mapThumb: {
    width: 220,
    height: 120,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  mapFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  locationLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
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
  draftBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F5F3FF",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(176,71,246,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  draftThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  draftIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  draftLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.foreground,
  },
  draftRemove: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  recDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.destructive,
  },
  recStopBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
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
