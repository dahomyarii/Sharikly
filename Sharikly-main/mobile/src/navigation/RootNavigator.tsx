import { colors } from "@/core/theme/tokens";
import { AuthStackNavigator } from "@/navigation/AuthStackNavigator";
import { MainTabNavigator } from "@/navigation/MainTabNavigator";
import { useAuthStore } from "@/store/authStore";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import type { RootStackParamList } from "@/navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Same logic as the web app:
 * ─ Main app (Home, Explore, Listings) always visible — no auth gate
 * ─ Auth screens are presented as a modal on top of Main, reachable from
 *   the Profile tab's guest state (Sign In / Register buttons)
 * ─ After login, the modal closes and the user is back on Main with a session
 */
export function RootNavigator(): React.ReactElement {
  const hydrated = useAuthStore((s) => s.hydrated);

  if (!hydrated) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Always rendered first — guests and logged-in users both see Main */}
      <Stack.Screen name="Main" component={MainTabNavigator} />

      {/* Auth presented as a full-screen modal over Main.
          Accessible from ProfileTab guest screen Sign In / Register buttons.
          Dismissed automatically on login via authStore.setHasSession(true). */}
      <Stack.Screen
        name="Auth"
        component={AuthStackNavigator}
        options={{ presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
