import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/stores/auth-store";
import { useUI } from "@/stores/ui-store";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { ConfigDialog } from "@/components/config-dialog";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import SetupPage from "@/pages/setup";
import DashboardPage from "@/pages/dashboard";
import AccountsPage from "@/pages/accounts";
import ApiKeysPage from "@/pages/apikeys";
import LogsPage from "@/pages/logs";
import SettingsPage from "@/pages/settings";

function ConfigDialogHost() {
  const open = useUI((s) => s.configOpen);
  const setOpen = useUI((s) => s.setConfigOpen);
  return <ConfigDialog open={open} onOpenChange={setOpen} />;
}

function Protected({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  const refresh = useAuth((s) => s.refresh);
  const loc = useLocation();
  const [checking, setChecking] = useState(!user);

  useEffect(() => {
    if (user) return;
    let active = true;
    refresh().finally(() => {
      if (active) setChecking(false);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(loc.pathname)}`} replace />;
  }
  return <AppShell>{children}</AppShell>;
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
      <ConfigDialogHost />
      <Routes>
        {/* public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* protected */}
        <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
        <Route path="/accounts" element={<Protected><AccountsPage /></Protected>} />
        <Route path="/apikeys" element={<Protected><ApiKeysPage /></Protected>} />
        <Route path="/logs" element={<Protected><LogsPage /></Protected>} />
        <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
