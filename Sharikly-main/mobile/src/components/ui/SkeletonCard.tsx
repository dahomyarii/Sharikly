import { colors, radii } from "@/core/theme/tokens";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  interpolateColor,
} from "react-native-reanimated";

interface SkeletonCardProps {
  count?: number;
}

function SkeletonBlock({ style }: { style: any }) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [colors.muted, "#E5E7EB"]
    );
    return { backgroundColor };
  });

  return <Animated.View style={[style, animatedStyle]} />;
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonBlock style={styles.image} />
      <View style={styles.body}>
        <SkeletonBlock style={styles.titleLine} />
        <SkeletonBlock style={styles.priceLine} />
      </View>
    </View>
  );
}

export function SkeletonGrid({ count = 4 }: SkeletonCardProps) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.gridItem}>
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}

export function SkeletonList({ count = 4 }: SkeletonCardProps) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.listItem}>
          <SkeletonBlock style={styles.listImage} />
          <View style={styles.listBody}>
            <SkeletonBlock style={styles.listTitleLine} />
            <SkeletonBlock style={styles.listSubtitleLine} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radii.lg,
    backgroundColor: colors.muted,
  },
  body: {
    paddingTop: 8,
    gap: 6,
  },
  titleLine: {
    height: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.muted,
    width: "85%",
  },
  priceLine: {
    height: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.muted,
    width: "55%",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridItem: {
    width: "48%",
  },
  list: {
    gap: 16,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  listImage: {
    width: 60,
    height: 60,
    borderRadius: radii.md,
    backgroundColor: colors.muted,
  },
  listBody: {
    flex: 1,
    gap: 8,
  },
  listTitleLine: {
    height: 14,
    borderRadius: radii.sm,
    backgroundColor: colors.muted,
    width: "70%",
  },
  listSubtitleLine: {
    height: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.muted,
    width: "40%",
  },
});
