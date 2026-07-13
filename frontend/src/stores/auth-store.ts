import { create } from "zustand";
import { persist } from "zustand/middleware";
import { API } from "@/lib/api";

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthState {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      logout: async () => {
        try {
          await API.logout();
        } catch {
          /* ignore */
        }
        set({ user: null });
        window.location.href = "/login";
      },
      refresh: async () => {
        try {
          const u = await API.self();
          set({ user: u });
        } catch {
          set({ user: null });
        }
      },
    }),
    {
      name: "msm-auth",
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
