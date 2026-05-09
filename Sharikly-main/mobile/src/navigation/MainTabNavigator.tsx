import { BookingsStackNavigator } from "@/navigation/BookingsStackNavigator";
import { HomeStackNavigator } from "@/navigation/HomeStackNavigator";
import { HostStackNavigator } from "@/navigation/HostStackNavigator";
import { InboxStackNavigator } from "@/navigation/InboxStackNavigator";
import { ListingsStackNavigator } from "@/navigation/ListingsStackNavigator";
import { ProfileStackNavigator } from "@/navigation/ProfileStackNavigator";
import type { MainTabParamList } from "@/navigation/types";
import { colors, radii, shadows } from "@/core/theme/tokens";
import { hapticSelection } from "@/utils/haptics";
import { BlurView } from "expo-blur";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import {
  Calendar,
  Compass,
  Home as HomeIcon,
  Package,
  Rocket,
  User as UserIcon,
  MessageCircle,
} from "lucide-react-native";

const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom Tab Bar matching a premium, modern mobile app design
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  
  function renderTabItem(route: any, index: number) {
    const descriptor = descriptors[route.key];
    const isFocused = state.index === index;
    const options = descriptor.options;
    const label = options.tabBarLabel ?? options.title ?? route.name;
    const Icon = options.tabBarIcon ?? HomeIcon;
    const badge = options.tabBarBadge;

    const onPress = () => {
      hapticSelection();
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <AnimatedPressable
        key={route.key}
        onPress={onPress}
        style={styles.tabItem}
        accessibilityRole="button"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={label}
        disableHaptics // hapticSelection is called in onPress
      >
        <View style={styles.iconContainer}>
          <Icon
            size={24}
            color={isFocused ? colors.primary : colors.mutedForeground}
            strokeWidth={isFocused ? 2.5 : 2}
          />
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
          {label}
        </Text>
      </AnimatedPressable>
    );
  }

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <BlurView tint="light" intensity={90} style={styles.tabBarContainer}>
        <View style={styles.tabBarContent}>
          {state.routes.map((route: any, i: number) => renderTabItem(route, i))}
        </View>
      </BlurView>
    </View>
  );
}

export function MainTabNavigator(): React.ReactElement {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: "Home",
          tabBarIcon: HomeIcon,
        } as any}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ListingsStackNavigator}
        options={{
          title: "Explore",
          tabBarIcon: Rocket,
        } as any}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsStackNavigator}
        options={{
          title: "Bookings",
          tabBarIcon: Calendar,
        } as any}
      />
      <Tab.Screen
        name="InboxTab"
        component={InboxStackNavigator}
        options={{
          title: "Inbox",
          tabBarIcon: MessageCircle,
        } as any}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profile",
          tabBarIcon: UserIcon,
        } as any}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "transparent",
  },
  tabBarContainer: {
    borderRadius: radii.xxl,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.6)", // semi-transparent to allow blur
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    ...shadows.cardHeavy,
    shadowOpacity: 0.15,
    elevation: 12,
  },
  tabBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: 12,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: "100%",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 32,
    width: 48,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.mutedForeground,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: 4,
    backgroundColor: colors.destructive || "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
});
