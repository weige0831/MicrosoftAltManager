import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Boxes, Fingerprint, Github, KeyRound, Loader2, LogIn } from "lucide-react";
import { API, getStatus, type AuthSelf } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { ROLE } from "@/lib/roles";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function toAuthUser(u: AuthSelf): AuthUser {
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

export default function LoginPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { t } = useTranslation();
  const setUser = useAuthStore((s: any) => s.auth?.setUser);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordLogin, setPasswordLogin] = useState(true);
  const [registerEnabled, setRegisterEnabled] = useState(false);

  useEffect(() => {
    getStatus()
      .then((s) => {
        setPasswordLogin(s?.password_login_enabled !== false);
        setRegisterEnabled(!!(s?.register_enabled || s?.password_register_enabled));
      })
      .catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordLogin) {
      toast.error(t("login.passwordDisabled", { defaultValue: "密码登录已关闭" }));
      return;
    }
    setLoading(true);
    try {
      const u = await API.login(username, password);
      setUser(toAuthUser(u));
      toast.success(t("login.success"));
      nav(params.get("redirect") || "/dashboard", { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const stub = (name: string) => {
    toast.message(t("login.methodSoon", { defaultValue: "{{name}} 登录尚未配置", name }));
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(60% 60% at 30% 20%, white 0%, transparent 60%), radial-gradient(50% 50% at 80% 80%, white 0%, transparent 60%)" }} />
        <div className="relative flex items-center gap-2 text-lg font-semibold">
          <div className="grid size-9 place-items-center rounded-md bg-primary-foreground/15"><Boxes className="size-5" /></div>
          {t("appName")}
        </div>
        <div className="relative space-y-3">
          <h2 className="whitespace-pre-line text-3xl font-bold leading-tight">{t("login.brandTitle")}</h2>
          <p className="max-w-sm text-primary-foreground/80">{t("login.brandDesc")}</p>
        </div>
        <div className="relative text-xs text-primary-foreground/60">© {new Date().getFullYear()} weige0831 · MicrosoftAltManager</div>
      </div>
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 space-y-2">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><Boxes className="size-5" /></div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              <LogIn className="mr-2 inline size-5 text-primary" />{t("Sign in")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("login.description")}</p>
          </div>

          {passwordLogin ? (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="u">{t("login.username")}</Label>
                <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p">{t("login.password")}</Label>
                <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {t("login.submit")}
              </Button>
            </form>
          ) : (
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              {t("login.passwordDisabled", { defaultValue: "密码登录已关闭，请使用其他方式" })}
            </div>
          )}

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{t("login.orContinue", { defaultValue: "或使用其他方式" })}</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid gap-2">
            <Button type="button" variant="outline" className="w-full justify-start" onClick={() => stub(t("Sign in with Passkey"))}>
              <Fingerprint className="size-4" />
              {t("Sign in with Passkey")}
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start" onClick={() => stub("GitHub")}>
              <Github className="size-4" />
              {t("Continue with GitHub", { defaultValue: "使用 GitHub 继续" })}
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start" onClick={() => stub("OIDC")}>
              <KeyRound className="size-4" />
              {t("Continue with OIDC", { defaultValue: "使用 OIDC 继续" })}
            </Button>
          </div>

          {registerEnabled && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("login.noAccount", { defaultValue: "还没有账号？" })}{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">{t("Sign up")}</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
