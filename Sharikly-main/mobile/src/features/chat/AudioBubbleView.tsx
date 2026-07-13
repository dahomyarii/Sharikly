import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Play, Pause } from "lucide-react-native";
import { colors } from "@/core/theme/tokens";

/**
 * Shared presentational audio-message bubble (play/pause + waveform).
 * Platform players (AudioMessage.tsx / AudioMessage.web.tsx) wrap this so no
 * platform-specific audio module leaks across builds.
 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function AudioBubbleView({
  playing,
  mine,
  onToggle,
  timeLabel,
}: {
  playing: boolean;
  mine: boolean;
  onToggle: () => void;
  timeLabel: string;
}) {
  return (
    <Pressable style={styles.wrap} onPress={onToggle}>
      <View style={[styles.btn, mine ? styles.btnMine : styles.btnOther]}>
        {playing ? (
          <Pause size={16} color={mine ? colors.primary : "#FFF"} fill={mine ? colors.primary : "#FFF"} />
        ) : (
          <Play size={16} color={mine ? colors.primary : "#FFF"} fill={mine ? colors.primary : "#FFF"} />
        )}
      </View>
      <View style={styles.bars}>
        {Array.from({ length: 16 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { height: 5 + ((i * 5) % 15), backgroundColor: mine ? "rgba(255,255,255,0.75)" : "rgba(176,71,246,0.55)" },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, mine && { color: "rgba(255,255,255,0.9)" }]}>{timeLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 10, minWidth: 180 },
  btn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  btnMine: { backgroundColor: "#FFF" },
  btnOther: { backgroundColor: colors.primary },
  bars: { flex: 1, flexDirection: "row", alignItems: "center", gap: 2, height: 22 },
  bar: { width: 2.5, borderRadius: 2 },
  label: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
});
