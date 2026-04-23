import "@testing-library/react-native";

process.env.EXPO_PUBLIC_API_BASE = "http://127.0.0.1:8000/api";

jest.mock("react-native-mmkv", () => ({
  createMMKV: () => ({
    set: jest.fn(),
    getString: jest.fn((): string | undefined => undefined),
    remove: jest.fn(),
    clearAll: jest.fn(),
  }),
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

const mockAxiosRequest = jest.fn();

jest.mock("@/services/api/client", () => {
  const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api";
  const buildApiUrl = (path: string): string => {
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE}${p}`;
  };
  return {
    buildApiUrl,
    axiosInstance: {
      defaults: { headers: { common: {} as Record<string, string> } },
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
      request: mockAxiosRequest,
      post: jest.fn(),
      get: jest.fn(),
    },
    bootstrapApiClient: jest.fn(async () => {}),
    performLogout: jest.fn(async () => {}),
    applyTokenToAxiosDefaults: jest.fn(async () => {}),
  };
});
