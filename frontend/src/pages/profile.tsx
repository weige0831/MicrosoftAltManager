import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyRound, Languages, Loader2, Save, UserRound } from "lucide-react";
import { API, type AuthSelf } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { getRoleLabel, ROLE } from "@/lib/roles";
import { getUserAvatarFallback, getUserAvatarStyle } from "@/lib/avatar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SectionPageLayout } from "@/components/layout/components/section-page-layout";
import { Skeleton } from "@/components/ui/skeleton";
import i18n from "@/i18n/config";

function toAuthUser(u: AuthSelf): AuthUser {
  return {
    id: u.id,
    username: u.username,
    role: typeof u.role === "number" ? u.role : ROLE.USER,
    display_name: u.display_name || u.username,
    email: u.email,
    status: u.status,
  };
}

export default function ProfilePage() {
  const { t, i18n: i18nHook } = useTranslation();
  const setUser = useAuthStore((s) => s.auth.setUser);
  const storeUser = useAuthStore((s) => s.auth.user);
  const [profile, setProfile] = useState<AuthSelf | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [lang, setLang] = useState(i18nHook.resolvedLanguage || i18nHook.language || "zhCN");

  const refresh = async () => {
    setLoading(true);
    try {
      const u = await API.self();
      if (u) {
        setProfile(u);
        setDisplayName(u.display_name || u.username);
        setEmail(u.email || "");
        setUser(toAuthUser(u));
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const avatarName = profile?.username || storeUser?.username || "?";
  const avatarFallback = getUserAvatarFallback(avatarName);
  const avatarStyle = useMemo(() => getUserAvatarStyle(avatarName), [avatarName]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const u = await API.updateSelf({
        display_name: displayName,
        email,
      });
      setProfile(u);
      setUser(toAuthUser(u));
      toast.success(t("settings.saved"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const changeLang = async (v: string) => {
    setLang(v);
    await i18n.changeLanguage(v);
    try {
      localStorage.setItem("lang", v);
    } catch { /* empty */ }
    toast.success(t("settings.saved"));
  };

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t("Profile")}</SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-6">
          {/* header card */}
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              {loading ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="size-16 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              ) : profile ? (
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                  <Avatar className="size-16 rounded-2xl">
                    <AvatarFallback className="rounded-2xl text-lg font-semibold text-white" style={avatarStyle}>
                      {avatarFallback}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      <h2 className="truncate text-xl font-semibold tracking-tight">
                        {profile.display_name || profile.username}
                      </h2>
                      <Badge variant={profile.role >= ROLE.SUPER_ADMIN ? "info" : "secondary"}>
                        {getRoleLabel(profile.role)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground sm:justify-start">
                      <span>@{profile.username}</span>
                      {profile.email && <span>{profile.email}</span>}
                      <span>ID {profile.id}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.42fr)]">
            <div className="space-y-4">
              {/* account */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserRound className="size-4 text-muted-foreground" />
                    {t("Account", { defaultValue: "账号信息" })}
                  </CardTitle>
                  <CardDescription>
                    {t("profile.accountDesc", { defaultValue: "更新显示名称与邮箱" })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>{t("login.username")}</Label>
                      <Input value={profile?.username || ""} disabled />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("users.displayName", { defaultValue: "显示名" })}</Label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>{t("users.email", { defaultValue: "邮箱" })}</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={saveProfile} disabled={saving || loading}>
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      {t("action.save")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* security */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="size-4 text-muted-foreground" />
                    {t("Security", { defaultValue: "安全" })}
                  </CardTitle>
                  <CardDescription>
                    {t("profile.securityDesc", { defaultValue: "管理密码与安全选项" })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <div className="text-sm font-medium">{t("Change password", { defaultValue: "修改密码" })}</div>
                      <p className="text-xs text-muted-foreground">
                        {t("profile.passwordHint", { defaultValue: "建议定期更换密码" })}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setPwdOpen(true)}>
                      {t("Change", { defaultValue: "修改" })}
                    </Button>
                  </div>
                  <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    {t("profile.2faSoon", {
                      defaultValue: "两步验证 / Passkey 绑定将在后续版本开放。",
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 xl:sticky xl:top-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="size-4 text-muted-foreground" />
                    {t("Language", { defaultValue: "语言" })}
                  </CardTitle>
                  <CardDescription>
                    {t("profile.langDesc", { defaultValue: "界面显示语言" })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={lang} onValueChange={(v) => changeLang(String(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {lang === "en" ? "English" : lang === "zhTW" ? "繁體中文" : "简体中文"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zhCN">简体中文</SelectItem>
                      <SelectItem value="zhTW">繁體中文</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <ChangePasswordDialog open={pwdOpen} onOpenChange={setPwdOpen} />
      </SectionPageLayout.Content>
    </SectionPageLayout>
  );
}

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [original, setOriginal] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = async () => {
    if (!original) {
      toast.error(t("Please enter your current password", { defaultValue: "请输入当前密码" }));
      return;
    }
    if (next.length < 6) {
      toast.error(t("users.passwordMin", { defaultValue: "密码至少 6 位" }));
      return;
    }
    if (next !== confirm) {
      toast.error(t("Passwords do not match", { defaultValue: "两次密码不一致" }));
      return;
    }
    if (original === next) {
      toast.error(t("New password must be different from current password", { defaultValue: "新密码不能与当前密码相同" }));
      return;
    }
    setLoading(true);
    try {
      await API.updateSelf({
        original_password: original,
        password: next,
      });
      toast.success(t("Password changed successfully", { defaultValue: "密码已修改" }));
      setOriginal(""); setNext(""); setConfirm("");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Change password", { defaultValue: "修改密码" })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("Current password", { defaultValue: "当前密码" })}</Label>
            <Input type="password" value={original} onChange={(e) => setOriginal(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("New password", { defaultValue: "新密码" })}</Label>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("Confirm password", { defaultValue: "确认密码" })}</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("action.cancel")}</Button>
          <Button onClick={submit} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {t("action.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
