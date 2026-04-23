/**
 * Mobile theme — exact match to frontend_v2/app/globals.css
 * oklch values converted to sRGB hex for React Native.
 */

export const colors = {
  // Core palette
  background: "#F9F8FF",
  foreground: "#1C1628",
  card: "#FEFCFF",
  cardForeground: "#1C1628",
  primary: "#7C3AED",         // oklch(0.62 0.25 308)
  primaryForeground: "#FFFFFF",
  primaryLight: "#A78BFA",    // lighter purple accent
  secondary: "#F4F0FF",
  secondaryForeground: "#3B2A6E",
  muted: "#EDE9FA",
  mutedForeground: "#6B5E8F",
  accent: "#EAE2FF",
  accentForeground: "#2D1B69",
  border: "rgba(120, 80, 220, 0.12)",
  borderStrong: "rgba(120, 80, 220, 0.22)",
  input: "rgba(120, 80, 220, 0.10)",
  ring: "#A78BFA",
  destructive: "#DC2626",
  destructiveForeground: "#FFFFFF",
  success: "#10B981",
  successForeground: "#FFFFFF",
  warning: "#F59E0B",

  // Surface variants (glassmorphism)
  surface: "#FFFFFF",
  surface2: "#F3EDFF",
  surface3: "#E8DCFF",
  surfaceGlass: "rgba(255,255,255,0.82)",
  surfaceGlassDark: "rgba(255,255,255,0.55)",

  // Rating star color
  star: "#F93B69",
  starEmpty: "rgba(255,255,255,0.5)",
  bookmark: "#7A3E82",
  bookmarkFill: "#7A3E82",

  // Text helpers
  textPrimary: "#1C1628",
  textSecondary: "#6B5E8F",
  textMuted: "#9B8DB8",
  textOnPrimary: "#FFFFFF",

  // Overlay / shadow
  overlay: "rgba(15, 8, 40, 0.45)",
  shadowPrimary: "rgba(124, 58, 237, 0.35)",
} as const;

export const layout = {
  tabBarHeight: 68,
  headerHeight: 56,
  cardElevation: 4,
} as const;

export const gradients = {
  primary: ["#9356F5", "#7C3AED"] as [string, string],
  primaryReverse: ["#7C3AED", "#5B21B6"] as [string, string],
  hero: ["rgba(255,255,255,0.38)", "rgba(255,255,255,0.18)"] as [string, string],
  cardBottom: ["transparent", "rgba(0,0,0,0.38)"] as [string, string],
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  xxl: 32,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  display: { fontSize: 36, fontWeight: "900" as const, letterSpacing: -1 },
  hero: { fontSize: 28, fontWeight: "900" as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: "800" as const, letterSpacing: -0.3 },
  heading: { fontSize: 18, fontWeight: "700" as const, letterSpacing: -0.2 },
  subheading: { fontSize: 15, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: "400" as const, lineHeight: 19 },
  label: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.5 },
  caption: { fontSize: 12, fontWeight: "400" as const, lineHeight: 17 },
  price: { fontSize: 14, fontWeight: "700" as const },
};

export const shadows = {
  card: {
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  cardHeavy: {
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 10,
  },
  fab: {
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.44,
    shadowRadius: 24,
    elevation: 14,
  },
  tabBar: {
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
};

