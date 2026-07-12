import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "@/store/authStore";

/**
 * Returns a `requireAuth(action)` function for gating authenticated actions.
 *
 * - If the user is logged in, `action` runs immediately.
 * - If not, the action is stashed as a pending action and the user is sent to
 *   the login screen. After a successful login, LoginScreen/RegisterScreen run
 *   the pending action, returning the user to what they were trying to do.
 */
export function useRequireAuth() {
  const navigation = useNavigation<any>();
  const hasSession = useAuthStore((s) => s.hasSession);
  const setPendingAction = useAuthStore((s) => s.setPendingAction);

  return (action: () => void) => {
    if (hasSession) {
      action();
      return;
    }
    setPendingAction(action);
    navigation.navigate("Auth", { screen: "Login" });
  };
}
