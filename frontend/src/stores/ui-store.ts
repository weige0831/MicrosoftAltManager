import { create } from "zustand";
interface UIState { configOpen: boolean; setConfigOpen: (o: boolean) => void; }
export const useUI = create<UIState>((set) => ({ configOpen: false, setConfigOpen: (o) => set({ configOpen: o }) }));
