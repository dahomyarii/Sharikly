import { ErrorBoundary } from "@/core/errors/ErrorBoundary";
import { NetInfoSubscription } from "@/core/offline/NetInfoSubscription";
import { AuthHydration } from "@/core/providers/AuthHydration";
import { QueryProvider } from "@/core/providers/QueryProvider";
import { ToastBridge } from "@/core/providers/ToastBridge";
import { linking } from "@/navigation/linking";
import { RootNavigator } from "@/navigation/RootNavigator";
import { NavigationContainer } from "@react-navigation/native";
import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

type AppProvidersProps = {
  children?: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps): React.ReactElement {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryProvider>
            <AuthHydration />
            <NetInfoSubscription />
            <ToastBridge />
            <NavigationContainer linking={linking}>
              <RootNavigator />
              {children}
            </NavigationContainer>
            <StatusBar style="auto" />
          </QueryProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
