import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Menu, Boxes, LogOut } from "lucide-react";
import { Sidebar } from "./sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PageTransition } from "@/components/page-transition";
import { ThemeSwitch } from "@/components/theme-switch";
import { SkipToMain } from "@/components/skip-to-main";
import { useUI } from "@/stores/ui-store";
import { useAuth } from "@/stores/auth-store";
import { useThemeCustomization } from "@/context/theme-customization-provider";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(() => {
    const c = document.cookie.match(/sidebar_state=([^;]+)/);
    return c ? c[1] !== "false" : true;
  });
  const { logout, user } = useAuth();
  const setConfigOpen = useUI((s) => s.setConfigOpen);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    document.cookie = `sidebar_state=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
  };

  return (
    <div data-slot="sidebar-wrapper" className="flex flex-col h-screen w-full overflow-hidden">
      <SkipToMain />
      {/* Full-width header ABOVE sidebar (new-api pattern) */}
      <header
        className="flex shrink-0 items-center gap-2 border-b bg-background/80 px-2 backdrop-blur sm:px-3"
        style={{ height: "var(--app-header-height)" }}
      >
        <button onClick={toggle} data-slot="sidebar-trigger" className="size-8" title="Toggle sidebar">
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
          <ThemeSwitch />
          <DropdownMenu>
            <DropdownMenuTrigger className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <div className="grid size-7 place-items-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                {user?.username?.[0]?.toUpperCase() || "?"}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                {user?.username} ({user?.role})
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setConfigOpen(true)}>{t("Theme Settings")}</DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>{t("action.logout")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Sidebar + Content row */}
      <div className="flex min-h-0 w-full flex-1">
        <Sidebar open={open} />
        <div data-slot="sidebar-inset" className="@container/content flex min-h-0 flex-1 flex-col overflow-hidden">
          <main id="main-content" className="flex-1 overflow-auto">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
    </div>
  );
}
