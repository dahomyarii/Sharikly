import { colors, radii } from "@/core/theme/tokens";
import React from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

interface SearchBarProps extends Omit<TextInputProps, "style"> {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function SearchBar({ icon, rightElement, ...props }: SearchBarProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconLeft}>{icon}</View>}
      <TextInput
        style={[styles.input, icon ? styles.inputWithIcon : undefined]}
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        {...props}
      />
      {rightElement && <View style={styles.iconRight}>{rightElement}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.14)",
    height: 50,
    paddingHorizontal: 16,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconLeft: {
    marginRight: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconRight: {
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    height: "100%",
    padding: 0,
  },
  inputWithIcon: {
    // leave space for left icon
  },
});
