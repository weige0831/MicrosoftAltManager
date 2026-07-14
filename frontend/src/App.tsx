import { useEffect, useState, type ReactNode } from "react";
import {
  BrowserRouter, Routes, Route, Navigate, useLocation, Outlet,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { API, type AuthSelf } from "@/lib/api";
import { ROLE, isAdmin } from "@/lib/roles";
import { Toaster } from "@/components/ui/sonner";
import { NavigationProgress } from "@/components/navigation-progress";
import { AuthenticatedLayout } from "@/components/layout/components/authenticated-layout";
import { DirectionProvider } from "@/context/direction-provider";
import { useSystemConfig } from "@/hooks/use-system-config";
import { normalizeInterfaceLanguage, toIntlLocale } from "@/i18n/languages";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import SetupPage from "@/pages/setup";
import DashboardPage from "@/pages/dashboard";
import AccountsPage from "@/pages/accounts";
import ApiKeysPage from "@/pages/apikeys";
import LogsPage from "@/pages/logs";
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import UsersPage from "@/pages/users";
import NotFoundPage from "@/pages/not-found";

function toAuthUser(u: AuthSelf | null): AuthUser | null {
  if (!u) return null;
  const role =
    typeof u.role === "number"
      ? u.role
      : String((u as any).role || "").toLowerCase() === "admin"
        ? ROLE.SUPER_ADMIN
        : ROLE.USER;
  return {
    id: u.id,
    username: u.username,
    role,
    display_name: u.display_name || u.username,
    email: u.email,
    status: u.status,
  };
}

/** Bootstrap system config + title/favicon for all routes (public + auth). */
function SystemBootstrap() {
  const { i18n, t } = useTranslation();
  const { systemName } = useSystemConfig({ autoLoad: true });
  const location = useLocation();
  const lang = normalizeInterfaceLanguage(
    i18n.resolvedLanguage || i18n.language || "zhCN",
  );

  useEffect(() => {
    // Prefer BCP-47 for html lang attribute
    document.documentElement.lang = toIntlLocale(lang) || lang;
    try {
      localStorage.setItem("lang", lang);
    } catch {
      /* empty */
    }
  }, [lang]);

  useEffect(() => {
    // Re-resolve title when language changes (appName is localized)
    document.title = systemName || t("appName");
  }, [systemName, t, lang]);

  // Scroll to top on route change (public pages / long content)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  return null;
}

function Protected() {
  const { auth } = useAuthStore();
  const loc = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    if (auth?.user) {
      const n = toAuthUser(auth.user as any);
      if (n && (n.role !== auth.user.role || n.display_name !== auth.user.display_name)) {
        auth.setUser(n);
      }
    }
    API.self()
      .then((u) => {
        if (active) auth?.setUser(toAuthUser(u));
      })
      .catch(() => {
        if (active && !auth?.user) auth?.reset();
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!auth?.user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  }
  return <AuthenticatedLayout />;
}

function AdminOnly({ children }: { children?: ReactNode }) {
  const user = useAuthStore((s) => s.auth.user);
  if (!isAdmin(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}

export default function App() {
  return (
    <DirectionProvider>
      <BrowserRouter>
        <SystemBootstrap />
        <NavigationProgress />
        <Toaster closeButton duration={5000} position="top-center" richColors />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<Protected />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/apikeys" element={<ApiKeysPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route element={<AdminOnly />}>
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </DirectionProvider>
  );
}
