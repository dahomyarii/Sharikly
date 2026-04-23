import type { ReactElement } from "react";

import { LoginScreen } from "@/features/auth/screens/LoginScreen";
import type { AuthStackParamList } from "@/navigation/types";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react-native";

const Stack = createNativeStackNavigator<AuthStackParamList>();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function LoginHarness(): ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

describe("LoginScreen", () => {
  it("renders email and password fields", () => {
    render(<LoginHarness />);
    expect(screen.getByTestId("login-email")).toBeTruthy();
    expect(screen.getByTestId("login-password")).toBeTruthy();
  });
});
