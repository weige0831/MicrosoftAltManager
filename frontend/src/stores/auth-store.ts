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
  theme: "light" | "dark";
  setUser: (u: User | null) => void;
  setTheme: (t: "light" | "dark") => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      theme: (localStorage.getItem("theme") as "light" | "dark") || "light",
      setUser: (u) => set({ user: u }),
      setTheme: (t) => {
        set({ theme: t });
        localStorage.setItem("theme", t);
        document.documentElement.classList.toggle("dark", t === "dark");
      },
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
      partialize: (s) => ({ user: s.user, theme: s.theme }),
    },
  ),
);

// apply theme on load
const initialTheme = useAuth.getState().theme;
document.documentElement.classList.toggle("dark", initialTheme === "dark");
