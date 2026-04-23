import { create } from "zustand";

type AuthState = {
  hydrated: boolean;
  hasSession: boolean;
  setHydrated: (v: boolean) => void;
  setHasSession: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  hasSession: false,
  setHydrated: (v) => set({ hydrated: v }),
  setHasSession: (v) => set({ hasSession: v }),
}));
