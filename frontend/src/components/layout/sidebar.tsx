import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Users, KeyRound, ScrollText, Settings,
  Boxes, Sun, Moon, LogOut, Palette,
} from "lucide-react";
import { useAuth } from "@/stores/auth-store";
import { useUI } from "@/stores/ui-store";
import { useTheme } from "@/context/theme-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";

export function Sidebar({ open }: { open: boolean }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const setConfigOpen = useUI((s) => s.setConfigOpen);
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const nav = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/accounts", label: t("nav.accounts"), icon: Users },
    { to: "/apikeys", label: t("nav.apiKeys"), icon: KeyRound },
    { to: "/logs", label: t("nav.logs"), icon: ScrollText },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <aside data-slot="sidebar" data-state={open ? "expanded" : "collapsed"}>
      {/* header: brand */}
      <div data-slot="sidebar-header" className="flex items-center gap-2.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Boxes className="size-5" />
        </div>
        {open && <span className="truncate text-sm font-semibold">{t("appName")}</span>}
      </div>

      {/* content: nav */}
      <div data-slot="sidebar-content">
        <div data-slot="sidebar-group">
          <div data-slot="sidebar-group-label">{t("nav.dashboard")}</div>
          <nav data-slot="sidebar-menu">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                data-slot="sidebar-menu-button"
                title={item.label}
                className={({ isActive }) =>
                  cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                    !open && "justify-center px-0",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )
                }
              >
                <item.icon className="size-4 shrink-0" />
                {open && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* footer: actions */}
      <div data-slot="sidebar-footer" className="space-y-1">
        <div className={cn("flex items-center", !open ? "flex-col gap-1" : "gap-1")}>
          <LanguageSwitcher />
          <button
            onClick={() => setConfigOpen(true)}
            title={t("Theme Settings")}
            className="grid size-9 place-items-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Palette className="size-4" />
          </button>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            title={t("theme.toggle")}
            className="grid size-9 place-items-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
        {user && open && (
          <div className="flex items-center justify-between rounded-md px-3 py-1.5 text-xs text-muted-foreground">
            <span className="truncate">{user.username}</span>
            <button onClick={logout} className="opacity-70 hover:opacity-100" title={t("action.logout")}>
              <LogOut className="size-3.5" />
            </button>
          </div>
        )}
        {!open && user && (
          <button onClick={logout} title={t("action.logout")} className="mx-auto grid size-9 place-items-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent">
            <LogOut className="size-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
