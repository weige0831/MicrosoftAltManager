import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Boxes, Loader2, UserPlus } from "lucide-react";
import { API } from "@/lib/api";
import { getStatus } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    getStatus()
      .then((s) => {
        const on = !!(s?.register_enabled || s?.password_register_enabled);
        setEnabled(on);
      })
      .catch(() => setEnabled(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t("users.passwordMin", { defaultValue: "密码至少 6 位" }));
      return;
    }
    if (password !== confirm) {
      toast.error(t("register.passwordMismatch", { defaultValue: "两次密码不一致" }));
      return;
    }
    setLoading(true);
    try {
      await API.register({
        username,
        password,
        display_name: displayName || username,
        email: email || undefined,
      });
      toast.success(t("register.success", { defaultValue: "注册成功，请登录" }));
      nav("/login", { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (enabled === false) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-xl font-semibold">{t("register.disabled", { defaultValue: "注册已关闭" })}</h1>
          <p className="text-sm text-muted-foreground">
            {t("register.disabledHint", { defaultValue: "请联系管理员开通注册，或使用已有账号登录。" })}
          </p>
          <Button asChild><Link to="/login">{t("Sign in")}</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(60% 60% at 30% 20%, white 0%, transparent 60%)" }} />
        <div className="relative flex items-center gap-2 text-lg font-semibold">
          <div className="grid size-9 place-items-center rounded-md bg-primary-foreground/15"><Boxes className="size-5" /></div>
          {t("appName")}
        </div>
        <div className="relative space-y-3">
          <h2 className="text-3xl font-bold leading-tight">{t("register.brandTitle", { defaultValue: "创建账号" })}</h2>
          <p className="max-w-sm text-primary-foreground/80">
            {t("register.brandDesc", { defaultValue: "注册后将获得普通用户权限，管理员可在后台调整角色。" })}
          </p>
        </div>
        <div className="relative text-xs text-primary-foreground/60">© {new Date().getFullYear()} MicrosoftAltManager</div>
      </div>
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              <UserPlus className="mr-2 inline size-5 text-primary" />
              {t("Sign up")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("register.description", { defaultValue: "使用用户名与密码创建账号" })}
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u">{t("login.username")}</Label>
              <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus minLength={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d">{t("users.displayName", { defaultValue: "显示名" })}</Label>
              <Input id="d" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e">{t("users.email", { defaultValue: "邮箱（可选）" })}</Label>
              <Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p">{t("login.password")}</Label>
              <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c">{t("register.confirmPassword", { defaultValue: "确认密码" })}</Label>
              <Input id="c" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading || enabled === null}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {t("Sign up")}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("register.hasAccount", { defaultValue: "已有账号？" })}{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">{t("Sign in")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
