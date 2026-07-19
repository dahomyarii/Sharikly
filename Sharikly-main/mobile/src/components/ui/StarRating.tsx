import { Star } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

const ACTIVE = "#F59E0B";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  testID?: string;
}

export function StarRating({
  value,
  onChange,
  size = 32,
  testID = "star-rating",
}: StarRatingProps): React.ReactElement {
  const readOnly = !onChange;
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((s) => {
        const icon = (
          <Star size={size} color={ACTIVE} fill={s <= value ? ACTIVE : "transparent"} />
        );
        if (readOnly) {
          return (
            <View key={s} testID={`${testID}-star-${s}`}>
              {icon}
            </View>
          );
        }
        return (
          <Pressable
            key={s}
            testID={`${testID}-star-${s}`}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${s} star${s > 1 ? "s" : ""}`}
            hitSlop={6}
            onPress={() => onChange?.(s)}
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
});
