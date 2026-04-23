import { create } from "zustand";

type UiState = {
  lastToast: { message: string; type: "warning" | "error" | "info" } | null;
  setLastToast: (t: UiState["lastToast"]) => void;
};

export const useUiStore = create<UiState>((set) => ({
  lastToast: null,
  setLastToast: (t) => set({ lastToast: t }),
}));
