import { useEffect, useState } from "react";
import {
  BrowserRouter, Routes, Route, Navigate, useLocation, Outlet,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { API } from "@/lib/api";
import { ROLE } from "@/lib/roles";
import { Toaster } from "@/components/ui/sonner";
import { AuthenticatedLayout } from "@/components/layout/components/authenticated-layout";
import { DirectionProvider } from "@/context/direction-provider";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import SetupPage from "@/pages/setup";
import DashboardPage from "@/pages/dashboard";
import AccountsPage from "@/pages/accounts";
import ApiKeysPage from "@/pages/apikeys";
import LogsPage from "@/pages/logs";
import SettingsPage from "@/pages/settings";

function normalizeUser(u: { id: number; username: string; role?: string | number } | null): AuthUser | null {
  if (!u) return null;
  const role =
    typeof u.role === "number"
      ? u.role
      : String(u.role || "").toLowerCase() === "admin"
        ? ROLE.SUPER_ADMIN
        : ROLE.USER;
  return {
    id: u.id,
    username: u.username,
    role,
    display_name: u.username,
  };
}

function Protected() {
  const { auth } = useAuthStore();
  const loc = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    // Normalize any legacy localStorage shape (role as string)
    if (auth?.user) {
      const n = normalizeUser(auth.user as any);
      if (n && n.role !== auth.user.role) auth.setUser(n);
    }
    API.self()
      .then((u) => {
        if (active) auth?.setUser(normalizeUser(u));
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
    return <Navigate to={`/login?redirect=${encodeURIComponent(loc.pathname)}`} replace />;
  }
  return (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  );
}

export default function App() {
  const { i18n, t } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage || i18n.language || "zhCN";
    document.title = t("appName");
  }, [i18n.language, i18n.resolvedLanguage, t]);

  return (
    <DirectionProvider>
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Protected />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/apikeys" element={<ApiKeysPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DirectionProvider>
  );
}
