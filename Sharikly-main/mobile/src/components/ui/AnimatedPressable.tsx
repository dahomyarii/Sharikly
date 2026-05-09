import React from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { hapticImpact } from "@/utils/haptics";
import * as Haptics from "expo-haptics";

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

export interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  disableHaptics?: boolean;
}

export function AnimatedPressable({
  children,
  style,
  scaleTo = 0.95,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  disableHaptics = false,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = (e: any) => {
    scale.value = withSpring(scaleTo, { damping: 12, stiffness: 400, mass: 1 });
    opacity.value = withTiming(0.85, { duration: 120 });
    if (!disableHaptics) {
      hapticImpact(hapticStyle);
    }
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 12, stiffness: 400, mass: 1 });
    opacity.value = withTiming(1, { duration: 120 });
    if (onPressOut) onPressOut(e);
  };

  return (
    <AnimatedPressableComponent
      style={[style, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      {...rest}
    >
      {children}
    </AnimatedPressableComponent>
  );
}
