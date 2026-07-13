import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { API } from "@/lib/api";
import { Toaster } from "@/components/ui/sonner";
import { AuthenticatedLayout } from "@/components/layout";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import SetupPage from "@/pages/setup";
import DashboardPage from "@/pages/dashboard";
import AccountsPage from "@/pages/accounts";
import ApiKeysPage from "@/pages/apikeys";
import LogsPage from "@/pages/logs";
import SettingsPage from "@/pages/settings";

function Protected() {
  const auth = useAuthStore();
  const loc = useLocation();
  const [checking, setChecking] = useState(!auth.auth?.user);

  useEffect(() => {
    if (auth.auth?.user) return;
    let active = true;
    API.self()
      .then((u) => { if (active && u) auth.auth?.setUser(u); })
      .catch(() => { if (active) auth.auth?.reset(); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!auth.auth?.user) {
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
  );
}
