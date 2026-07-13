import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { API } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionPageLayout } from "@/components/layout/section-page-layout";
import { relativeSeconds } from "@/lib/utils";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [ttlExtract, setTtlExtract] = useState("86400");
  const [maxUnused, setMaxUnused] = useState("2592000");
  const [brand, setBrand] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.settings()
      .then((s) => {
        setSettings(s);
        setTtlExtract(s.ttl_after_extract || "86400");
        setMaxUnused(s.max_age_unused || "2592000");
        setBrand(s.brand_name || "");
      })
      .catch((e) => toast.error((e as Error).message));
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      await API.updateSettings({ ttl_after_extract: ttlExtract, max_age_unused: maxUnused, brand_name: brand });
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
                {t("settings.ttlAfterExtractHint")} 路 {relativeSeconds(Number(ttlExtract) || 0)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>{t("settings.maxAgeUnused")}</Label>
              <Input type="number" value={maxUnused} onChange={(e) => setMaxUnused(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                {t("settings.maxAgeUnusedHint")} 路 {relativeSeconds(Number(maxUnused) || 0)}
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
            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              <div className="mb-1 font-medium text-foreground">{t("settings.adminInfo")}</div>
              {settings.admin_username || "admin"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={loading}>
          <Save className="size-4" />
          {loading ? t("action.loading") : t("action.save")}
        </Button>
      </div>
      </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  );
}
