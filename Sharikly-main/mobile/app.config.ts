import type { ExpoConfig } from "expo/config";

const defineConfig = (): ExpoConfig => ({
  name: "Ekra",
  slug: "ekra-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  // New Architecture is the SDK 54 default (and what Expo Go runs); keeping it enabled
  // avoids the Reanimated/worklets mismatch we hit on device.
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
    infoPlist: {
      NSCameraUsageDescription:
        "Ekra needs access to your camera so you can take photos of the items you list.",
      NSPhotoLibraryUsageDescription:
        "Ekra needs access to your photos so you can add pictures to your listings and chat messages.",
      NSLocationWhenInUseUsageDescription:
        "Ekra uses your location to detect your city and set item pickup locations.",
      NSMicrophoneUsageDescription:
        "Ekra needs access to your microphone so you can record voice messages in chat.",
    },
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
  plugins: [
    "expo-secure-store",
    "expo-dev-client",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Ekra needs access to your photos so you can add pictures to your listings and chat messages.",
        cameraPermission:
          "Ekra needs access to your camera so you can take photos of the items you list.",
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Ekra uses your location to detect your city and set item pickup locations.",
      },
    ],
    [
      "expo-audio",
      {
        microphonePermission:
          "Ekra needs access to your microphone so you can record voice messages in chat.",
      },
    ],
  ],
  extra: {
    eas: { projectId: "5fcf489d-dd9a-4c5e-80d3-60571222aebd" },
  },
});

export default defineConfig;
