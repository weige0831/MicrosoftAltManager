import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2, KeyRound, Megaphone, Save, Settings2, TimerReset,
} from "lucide-react";
import { API } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SectionPageLayout } from "@/components/layout/components/section-page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, relativeSeconds } from "@/lib/utils";

type SectionId = "branding" | "notice" | "auth" | "cleanup";

type Category = {
  id: string;
  title: string;
  items: { id: SectionId; title: string; icon: typeof Building2 }[];
};

export default function SettingsPage() {
  const { t } = useTranslation();
  const [section, setSection] = useState<SectionId>("branding");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [ttlExtract, setTtlExtract] = useState("86400");
  const [maxUnused, setMaxUnused] = useState("2592000");
  const [brand, setBrand] = useState("");
  const [logo, setLogo] = useState("");
  const [footer, setFooter] = useState("");
  const [notice, setNotice] = useState("");
  const [registerEnabled, setRegisterEnabled] = useState(false);
  const [passwordLogin, setPasswordLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  const categories: Category[] = useMemo(
    () => [
      {
        id: "site",
        title: t("Site & Branding", { defaultValue: "站点与品牌" }),
        items: [
          { id: "branding", title: t("System Information", { defaultValue: "系统信息" }), icon: Building2 },
          { id: "notice", title: t("System Notice", { defaultValue: "系统公告" }), icon: Megaphone },
        ],
      },
      {
        id: "auth",
        title: t("Authentication", { defaultValue: "认证" }),
        items: [
          { id: "auth", title: t("Basic Authentication", { defaultValue: "基础认证" }), icon: KeyRound },
        ],
      },
      {
        id: "ops",
        title: t("Operations", { defaultValue: "运维" }),
        items: [
          { id: "cleanup", title: t("settings.cleanupPolicy"), icon: TimerReset },
        ],
      },
    ],
    [t],
  );

  const load = useCallback(() => {
    API.settings()
      .then((s) => {
        setSettings(s);
        setTtlExtract(s.ttl_after_extract || "86400");
        setMaxUnused(s.max_age_unused || "2592000");
        setBrand(s.brand_name || s.system_name || "");
        setLogo(s.logo || "");
        setFooter(s.footer_html || "");
        setNotice(s.notice || "");
        setRegisterEnabled(s.register_enabled === "true" || s.register_enabled === "1");
        setPasswordLogin(s.password_login_enabled !== "false" && s.password_login_enabled !== "0");
        setDirty(false);
      })
      .catch((e) => toast.error((e as Error).message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const markDirty = () => setDirty(true);

  const save = async () => {
    setLoading(true);
    try {
      const next = await API.updateSettings({
        ttl_after_extract: ttlExtract,
        max_age_unused: maxUnused,
        brand_name: brand,
        system_name: brand,
        logo,
        footer_html: footer,
        notice,
        register_enabled: registerEnabled ? "true" : "false",
        password_register_enabled: registerEnabled ? "true" : "false",
        password_login_enabled: passwordLogin ? "true" : "false",
      });
      setSettings(next);
      setDirty(false);
      toast.success(t("settings.saved"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sectionTitle =
    categories.flatMap((c) => c.items).find((i) => i.id === section)?.title || t("settings.title");

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        <span className="inline-flex items-center gap-2">
          <Settings2 className="size-5 text-muted-foreground" />
          {t("settings.title")}
          {dirty && (
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">
              {t("Unsaved changes", { defaultValue: "未保存" })}
            </span>
          )}
        </span>
      </SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button onClick={save} disabled={loading || !dirty} size="sm">
          <Save className="size-4" />
          {loading ? t("action.loading") : t("action.save")}
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className="flex h-full min-h-0 flex-col gap-4 lg:flex-row lg:gap-6">
          {/* left category nav — new-api style */}
          <aside className="w-full shrink-0 lg:w-56">
            <nav className="space-y-4 rounded-xl border bg-card p-3 shadow-xs">
              {categories.map((cat) => (
                <div key={cat.id}>
                  <div className="mb-1.5 px-2 text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase">
                    {cat.title}
                  </div>
                  <div className="space-y-0.5">
                    {cat.items.map((item) => {
                      const active = section === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSection(item.id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                            active
                              ? "bg-primary/10 font-medium text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground",
                          )}
                        >
                          <item.icon className="size-4 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* section content */}
          <div className="min-w-0 flex-1 space-y-4 overflow-auto pb-4">
            <div>
              <h3 className="text-base font-semibold tracking-tight">{sectionTitle}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {section === "branding" && t("settings.brandDesc", { defaultValue: "配置站点名称、Logo 与页脚信息" })}
                {section === "notice" && t("settings.noticeDesc", { defaultValue: "配置系统公告，显示在通知中心" })}
                {section === "auth" && t("settings.authDesc", { defaultValue: "控制登录与注册策略" })}
                {section === "cleanup" && t("settings.cleanupDesc", { defaultValue: "账号自动清理与保留策略" })}
              </p>
            </div>

            {section === "branding" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.brand")}</CardTitle>
                  <CardDescription>{t("settings.siteName")}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t("settings.siteName")}</Label>
                    <Input
                      value={brand}
                      onChange={(e) => { setBrand(e.target.value); markDirty(); }}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t("settings.logoUrl", { defaultValue: "Logo URL" })}</Label>
                    <Input
                      value={logo}
                      onChange={(e) => { setLogo(e.target.value); markDirty(); }}
                      placeholder="/favicon.svg"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t("settings.footerHtml", { defaultValue: "页脚 HTML" })}</Label>
                    <Textarea
                      value={footer}
                      onChange={(e) => { setFooter(e.target.value); markDirty(); }}
                      rows={3}
                    />
                  </div>
                  <div className="rounded-md border p-3 text-xs text-muted-foreground sm:col-span-2">
                    <div className="mb-1 font-medium text-foreground">{t("settings.adminInfo")}</div>
                    {settings.admin_username || "admin"} · Root
                  </div>
                </CardContent>
              </Card>
            )}

            {section === "notice" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("System Notice", { defaultValue: "系统公告" })}</CardTitle>
                  <CardDescription>
                    {t("settings.noticeHint", { defaultValue: "支持纯文本或简单 HTML，展示在顶栏通知铃铛中" })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    <Label>{t("settings.notice", { defaultValue: "通知内容" })}</Label>
                    <Textarea
                      value={notice}
                      onChange={(e) => { setNotice(e.target.value); markDirty(); }}
                      rows={8}
                      placeholder={t("settings.noticePlaceholder", { defaultValue: "欢迎使用微软账号管理器…" })}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {section === "auth" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("Basic Authentication", { defaultValue: "基础认证" })}</CardTitle>
                  <CardDescription>
                    {t("settings.authDesc", { defaultValue: "控制登录与注册策略" })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex items-center justify-between gap-4 border-b py-3 last:border-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{t("Password Login", { defaultValue: "密码登录" })}</div>
                      <p className="text-xs text-muted-foreground">
                        {t("Allow users to log in with password", { defaultValue: "允许用户使用用户名密码登录" })}
                      </p>
                    </div>
                    <Switch
                      checked={passwordLogin}
                      onCheckedChange={(v) => { setPasswordLogin(v); markDirty(); }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{t("Registration Enabled", { defaultValue: "允许注册" })}</div>
                      <p className="text-xs text-muted-foreground">
                        {t("Allow new users to register", { defaultValue: "允许新用户注册（默认普通用户）" })}
                      </p>
                    </div>
                    <Switch
                      checked={registerEnabled}
                      onCheckedChange={(v) => { setRegisterEnabled(v); markDirty(); }}
                    />
                  </div>
                  <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    {t("settings.oauthSoon", {
                      defaultValue: "OAuth / Passkey / 2FA 等登录方式将在后续版本接入，当前可在登录页看到占位入口。",
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {section === "cleanup" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.cleanupPolicy")}</CardTitle>
                  <CardDescription>
                    {t("settings.cleanupDesc", { defaultValue: "账号自动清理与保留策略" })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t("settings.ttlAfterExtract")}</Label>
                    <Input
                      type="number"
                      value={ttlExtract}
                      onChange={(e) => { setTtlExtract(e.target.value); markDirty(); }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("settings.ttlAfterExtractHint")} · {relativeSeconds(Number(ttlExtract) || 0)}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("settings.maxAgeUnused")}</Label>
                    <Input
                      type="number"
                      value={maxUnused}
                      onChange={(e) => { setMaxUnused(e.target.value); markDirty(); }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("settings.maxAgeUnusedHint")} · {relativeSeconds(Number(maxUnused) || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  );
}
