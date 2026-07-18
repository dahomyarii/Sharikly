import { create } from "zustand";

type AuthState = {
  hydrated: boolean;
  hasSession: boolean;
  /**
   * Action to run after a successful login — used to return the user to the
   * screen/action they were trying to reach before being sent to the login screen.
   */
  pendingAction: (() => void) | null;
  setHydrated: (v: boolean) => void;
  setHasSession: (v: boolean) => void;
  setPendingAction: (fn: (() => void) | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  hasSession: false,
  pendingAction: null,
  setHydrated: (v) => set({ hydrated: v }),
  setHasSession: (v) => set({ hasSession: v }),
  setPendingAction: (fn) => set({ pendingAction: fn }),
}));
