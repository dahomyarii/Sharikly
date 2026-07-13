import { GuestAuthGate } from "@/components/ui/GuestAuthGate";
import { colors, spacing } from "@/core/theme/tokens";
import type { BookingsStackParamList } from "@/navigation/types";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { Calendar } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookingsList } from "../components/BookingsList";
import { SegmentedControl } from "../components/SegmentedControl";

type Segment = "renting" | "host";
type BookingsRoute = RouteProp<BookingsStackParamList, "Bookings">;

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: "renting", label: "Renting" },
  { key: "host", label: "My Items" },
];

/**
 * Unified Bookings tab. A segmented control switches between items you're
 * renting from others ("Renting") and requests for your own items ("My Items");
 * each side is a full status-tabbed list (Pending / Active / Upcoming / Completed).
 */
export function BookingsScreen(): React.ReactElement {
  const route = useRoute<BookingsRoute>();
  const paramSegment = route.params?.segment;
  const [segment, setSegment] = useState<Segment>(paramSegment === "host" ? "host" : "renting");

  useEffect(() => {
    if (paramSegment === "host" || paramSegment === "renting") setSegment(paramSegment);
  }, [paramSegment]);

  return (
    <GuestAuthGate
      title="Your Bookings"
      subtitle="Sign in to view and manage your rentals."
      icon={<Calendar size={32} color={colors.primary} />}
    >
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Bookings</Text>
        </View>

        <View style={styles.controlWrap}>
          <SegmentedControl value={segment} options={SEGMENTS} onChange={setSegment} />
        </View>

        <BookingsList key={segment} role={segment === "host" ? "host" : "renter"} />
      </SafeAreaView>
    </GuestAuthGate>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, marginBottom: spacing.md },
  title: { fontSize: 28, fontWeight: "900", color: colors.foreground, letterSpacing: -0.5 },
  controlWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
});
