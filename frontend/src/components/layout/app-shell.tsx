import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Users, KeyRound, ScrollText, Settings as SettingsIcon,
  Boxes, LogOut,
} from "lucide-react";
import {
  SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent,
  SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarRail, SidebarTrigger,
} from "@/components/ui/sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitch } from "@/components/theme-switch";
import { PageTransition } from "@/components/page-transition";
import { SkipToMain } from "@/components/skip-to-main";
import { useAuthStore } from "@/stores/auth-store";
import { useUI } from "@/stores/ui-store";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { auth } = useAuthStore();
  const setConfigOpen = useUI((s) => s.setConfigOpen);

  const nav = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/accounts", label: t("nav.accounts"), icon: Users },
    { to: "/apikeys", label: t("nav.apiKeys"), icon: KeyRound },
    { to: "/logs", label: t("nav.logs"), icon: ScrollText },
    { to: "/settings", label: t("nav.settings"), icon: SettingsIcon },
  ];

  const logout = () => { useAuthStore.getState().auth?.reset(); window.location.href = "/login"; };

  return (
    <SidebarProvider defaultOpen={true}>
      <SkipToMain />
      {/* Full-width header above sidebar */}
      <header className="flex h-[var(--app-header-height,3rem)] shrink-0 items-center gap-2 border-b bg-background/80 px-2 backdrop-blur sm:px-3">
        <SidebarTrigger variant="ghost" className="size-8" />
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
                {auth?.user?.username?.[0]?.toUpperCase() || "?"}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">{auth?.user?.username}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setConfigOpen(true)}>{t("Theme Settings")}</DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>{t("action.logout")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex min-h-0 w-full flex-1">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <NavLink to="/dashboard">
                    <div className="grid aspect-square size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <Boxes className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{t("appName")}</span>
                      <span className="truncate text-xs text-muted-foreground">v1.0.0</span>
                    </div>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t("General")}</SidebarGroupLabel>
              <SidebarMenu>
                {nav.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton tooltip={item.label} asChild>
                      <NavLink to={item.to}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button onClick={logout}>
                    <LogOut className="size-4" />
                    <span>{t("action.logout")}</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <PageTransition>
            <main id="main-content" className="flex-1">
              {children}
            </main>
          </PageTransition>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

// Minimal SidebarGroup to avoid importing from new-api layout
function SidebarGroup({ children }: { children: ReactNode }) {
  return <div className="px-2 py-2">{children}</div>;
}
function SidebarGroupLabel({ children }: { children: ReactNode }) {
  return <div className="px-4 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">{children}</div>;
}
