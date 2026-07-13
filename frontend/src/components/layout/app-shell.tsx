import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Menu, Boxes, Sun, Moon, Palette, LogOut } from "lucide-react";
import { Sidebar } from "./sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PageTransition } from "@/components/page-transition";
import { useUI } from "@/stores/ui-store";
import { useAuth } from "@/stores/auth-store";
import { useTheme } from "@/context/theme-provider";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(() => localStorage.getItem("sidebar_open") !== "false");
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const setConfigOpen = useUI((s) => s.setConfigOpen);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem("sidebar_open", String(next));
  };

  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div data-slot="sidebar-wrapper" className="flex h-screen w-full overflow-hidden">
      <Sidebar open={open} />
      <div data-slot="sidebar-inset" className="flex min-h-svh flex-1 flex-col overflow-hidden">
        {/* header */}
        <header
          className="flex shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur"
          style={{ height: "var(--app-header-height)" }}
        >
          <button onClick={toggle} data-slot="sidebar-trigger" title="Toggle sidebar">
            <Menu className="size-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="grid size-6 place-items-center rounded bg-primary/10">
              <Boxes className="size-4 text-primary" />
            </div>
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">{t("appName")}</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-0.5">
            <LanguageSwitcher />
            <button onClick={() => setConfigOpen(true)} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" title={t("Theme Settings")}>
              <Palette className="size-4" />
            </button>
            <button onClick={() => setTheme(isDark ? "light" : "dark")} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" title={t("theme.toggle")}>
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <div className="mx-1 h-4 w-px bg-border" />
            {user && <span className="hidden text-xs text-muted-foreground sm:inline">{user.username}</span>}
            <button onClick={logout} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" title={t("action.logout")}>
              <LogOut className="size-4" />
            </button>
          </div>
        </header>

        {/* main content with page transition animation */}
        <main className="flex-1 overflow-auto" style={{ height: "calc(100svh - var(--app-header-height))" }}>
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
