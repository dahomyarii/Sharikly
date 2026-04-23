import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HostStackParamList } from "@/navigation/types";
import React, { useEffect } from "react";
import { View } from "react-native";
import { colors } from "@/core/theme/tokens";

type Nav = NativeStackNavigationProp<HostStackParamList, "Earnings">;

export function EarningsScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  useEffect(() => {
    navigation.replace("HostOverview");
  }, [navigation]);
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}
