import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Save } from "lucide-react";
import { API } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionPageLayout } from "@/components/layout/components/section-page-layout";
import { relativeSeconds } from "@/lib/utils";

export default function SettingsPage() {
  const { t } = useTranslation();
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

  useEffect(() => {
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
      })
      .catch((e) => toast.error((e as Error).message));
  }, []);

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
      toast.success(t("settings.saved"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t("settings.title")}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button onClick={save} disabled={loading} size="sm">
          <Save className="size-4" />
          {loading ? t("action.loading") : t("action.save")}
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.cleanupPolicy")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("settings.ttlAfterExtract")}</Label>
                  <Input type="number" value={ttlExtract} onChange={(e) => setTtlExtract(e.target.value)} />
                  <p className="text-xs text-muted-foreground">
                    {t("settings.ttlAfterExtractHint")} · {relativeSeconds(Number(ttlExtract) || 0)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("settings.maxAgeUnused")}</Label>
                  <Input type="number" value={maxUnused} onChange={(e) => setMaxUnused(e.target.value)} />
                  <p className="text-xs text-muted-foreground">
                    {t("settings.maxAgeUnusedHint")} · {relativeSeconds(Number(maxUnused) || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("settings.brand")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("settings.siteName")}</Label>
                  <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("settings.logoUrl", { defaultValue: "Logo URL" })}</Label>
                  <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="/favicon.svg" />
                </div>
                <div className="rounded-md border p-3 text-xs text-muted-foreground">
                  <div className="mb-1 font-medium text-foreground">{t("settings.adminInfo")}</div>
                  {settings.admin_username || "admin"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("settings.noticeTitle", { defaultValue: "系统公告" })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("settings.notice", { defaultValue: "通知内容" })}</Label>
                  <Textarea value={notice} onChange={(e) => setNotice(e.target.value)} rows={4} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("settings.footerHtml", { defaultValue: "页脚 HTML" })}</Label>
                  <Textarea value={footer} onChange={(e) => setFooter(e.target.value)} rows={3} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("settings.authOptions", { defaultValue: "用户与登录" })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium">{t("settings.passwordLogin", { defaultValue: "允许密码登录" })}</div>
                    <p className="text-xs text-muted-foreground">{t("settings.passwordLoginHint", { defaultValue: "关闭后无法使用用户名密码登录" })}</p>
                  </div>
                  <Switch checked={passwordLogin} onCheckedChange={setPasswordLogin} />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium">{t("settings.registerEnabled", { defaultValue: "允许用户注册" })}</div>
                    <p className="text-xs text-muted-foreground">{t("settings.registerEnabledHint", { defaultValue: "开启后普通用户可自助注册（默认普通角色）" })}</p>
                  </div>
                  <Switch checked={registerEnabled} onCheckedChange={setRegisterEnabled} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  );
}
