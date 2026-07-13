import { create } from "zustand";

interface UIState {
  configOpen: boolean;
  setConfigOpen: (open: boolean) => void;
}

export const useUI = create<UIState>((set) => ({
  configOpen: false,
  setConfigOpen: (open) => set({ configOpen: open }),
}));
