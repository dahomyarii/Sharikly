/**
 * GuestAuthGate — wraps protected screens.
 * If the user is not logged in, shows a premium sign-in prompt
 * instead of the screen content, matching the web's behavior
 * where protected pages redirect to /login.
 */
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, radii, shadows } from "@/core/theme/tokens";
import { useAuthStore } from "@/store/authStore";
import { useNavigation } from "@react-navigation/native";
import { LogIn, UserPlus } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface GuestAuthGateProps {
  children: React.ReactNode;
  /** Title shown on the gate, e.g. "Your Bookings" */
  title?: string;
  /** Subtitle shown below the title */
  subtitle?: string;
  /** Icon to show above the title */
  icon?: React.ReactNode;
}

export function GuestAuthGate({
  children,
  title = "Sign in required",
  subtitle = "Create a free account or sign in to access this feature.",
  icon,
}: GuestAuthGateProps): React.ReactElement {
  const hasSession = useAuthStore((s) => s.hasSession);
  const navigation = useNavigation<any>();

  if (hasSession) {
    return <>{children}</>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <PrimaryButton
          label="Sign In"
          onPress={() => navigation.navigate("Auth", { screen: "Login" })}
          fullWidth
          size="lg"
          icon={<LogIn size={18} color="#fff" />}
        />

        <Pressable
          style={styles.registerBtn}
          onPress={() => navigation.navigate("Auth", { screen: "Register" })}
        >
          <UserPlus size={15} color={colors.primary} />
          <Text style={styles.registerText}>Create a free account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    ...shadows.card,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.foreground,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 8,
  },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 4,
    paddingVertical: 6,
  },
  registerText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    textDecorationLine: "underline",
  },
});
