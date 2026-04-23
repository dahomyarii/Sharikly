import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { axiosInstance, buildApiUrl } from "@/services/api/client";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Send, MessageSquare } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function ContactScreen(): React.ReactElement {
  const navigation = useNavigation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(buildApiUrl("/contact-messages/"), {
        subject,
        message,
      });
    },
    onSuccess: () => {
      Alert.alert(
        "Message Sent! ✅",
        "Thank you for reaching out. We'll get back to you within 24 hours.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    },
    onError: () => Alert.alert("Failed to send message. Please try again."),
  });

  const handleSend = () => {
    if (!subject.trim()) { Alert.alert("Please enter a subject."); return; }
    if (!message.trim()) { Alert.alert("Please enter a message."); return; }
    sendMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.iconWrap}>
            <MessageSquare size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Get in Touch</Text>
          <Text style={styles.subtitle}>
            We&apos;re here to help. Send us a message and we&apos;ll reply as soon as possible.
          </Text>

          <Text style={styles.label}>Subject *</Text>
          <TextInput
            style={styles.input}
            placeholder="What's this about?"
            placeholderTextColor={colors.mutedForeground}
            value={subject}
            onChangeText={setSubject}
            maxLength={100}
          />

          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your question or issue in detail…"
            placeholderTextColor={colors.mutedForeground}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={2000}
          />

          <Pressable style={styles.sendBtn} onPress={handleSend}>
            <Send size={16} color="#fff" />
            <Text style={styles.sendBtnText}>
              {sendMutation.isPending ? "Sending…" : "Send Message"}
            </Text>
          </Pressable>
        </ScrollView>
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
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground },
  content: { padding: spacing.md },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 20,
  },
  title: { fontSize: 22, fontWeight: "900", color: colors.foreground, textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "700", color: colors.foreground, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textArea: { minHeight: 140, lineHeight: 22, paddingTop: 12 },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    paddingVertical: 16,
    marginTop: 24,
    ...shadows.fab,
  },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
