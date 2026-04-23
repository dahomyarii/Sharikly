import { ForgotPasswordScreen } from "@/features/auth/screens/ForgotPasswordScreen";
import { LoginScreen } from "@/features/auth/screens/LoginScreen";
import { RegisterScreen } from "@/features/auth/screens/RegisterScreen";
import { ResendVerificationScreen } from "@/features/auth/screens/ResendVerificationScreen";
import { ResetPasswordScreen } from "@/features/auth/screens/ResetPasswordScreen";
import { VerifyEmailScreen } from "@/features/auth/screens/VerifyEmailScreen";
import type { AuthStackParamList } from "@/navigation/types";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="ResendVerification" component={ResendVerificationScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </Stack.Navigator>
  );
}
