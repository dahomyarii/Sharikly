import type { ExpoConfig } from "expo/config";

const defineConfig = (): ExpoConfig => ({
  name: "Ekra",
  slug: "ekra-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  scheme: "ekra",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "app.ekra.mobile",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "app.ekra.mobile",
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: ["expo-secure-store", "expo-dev-client"],
  extra: {
    eas: { projectId: "5fcf489d-dd9a-4c5e-80d3-60571222aebd" },
  },
});

export default defineConfig;
