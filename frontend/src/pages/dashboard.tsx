import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2, Clock, Upload, AlertTriangle, TimerReset,
} from "lucide-react";
import type { Stats } from "@/lib/api";
import { API } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionPageLayout } from "@/components/layout/components/section-page-layout";
import { cn, relativeSeconds } from "@/lib/utils";

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    API.stats().then(setStats).catch(() => {});
  }, []);

  const cards = [
    { label: t("dashboard.available"), value: stats?.available ?? 0, icon: CheckCircle2, tone: "success" as const },
    { label: t("dashboard.used"), value: stats?.used ?? 0, icon: Clock, tone: "warning" as const },
    { label: t("dashboard.todayUpload"), value: stats?.today_upload ?? 0, icon: Upload, tone: "info" as const },
    { label: t("dashboard.expiringSoon"), value: stats?.expiring_soon ?? 0, icon: AlertTriangle, tone: "destructive" as const },
  ];

  const toneMap: Record<string, { bg: string; text: string; bar: string }> = {
    success: { bg: "bg-success/10", text: "text-success", bar: "from-success/80 via-success/40 to-success/5" },
    warning: { bg: "bg-warning/10", text: "text-warning", bar: "from-warning/80 via-warning/40 to-warning/5" },
    info: { bg: "bg-info/10", text: "text-info", bar: "from-info/80 via-info/40 to-info/5" },
    destructive: { bg: "bg-destructive/10", text: "text-destructive", bar: "from-destructive/80 via-destructive/40 to-destructive/5" },
  };

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t("dashboard.title")}</SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className="space-y-6">
          {/* Overview summary card */}
          <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
            <div className="flex flex-col gap-2.5 p-3 sm:gap-3 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold sm:text-base">{t("dashboard.title")}</h3>
                  <p className="text-xs text-muted-foreground sm:text-sm">{t("dashboard.desc")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {cards.map((c) => {
                  const tone = toneMap[c.tone];
                  return (
                    <div key={c.label} className="group relative flex flex-col justify-between gap-2 overflow-hidden rounded-lg border bg-background/60 p-2.5 transition-all hover:shadow-sm sm:rounded-xl sm:p-3.5">
                      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", tone.bar)} />
                      <div className="flex items-start justify-between gap-1">
                        <div className={cn("grid size-8 shrink-0 place-items-center rounded-lg sm:size-9", tone.bg)}>
                          <c.icon className={cn("size-4 sm:size-5", tone.text)} />
                        </div>
                      </div>
                      <div className="font-mono text-xl font-semibold tabular-nums sm:text-2xl">{c.value}</div>
                      <div className="line-clamp-2 text-[11px] text-muted-foreground sm:text-xs">{c.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* cleanup policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TimerReset className="size-4 text-muted-foreground" />
                {t("dashboard.cleanupPolicy")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <span className="text-muted-foreground">{t("dashboard.ttlAfterExtract")}</span>
                <span className="font-mono font-medium tabular-nums">{stats ? relativeSeconds(stats.ttl_after_extract) : "-"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <span className="text-muted-foreground">{t("dashboard.maxAgeUnused")}</span>
                <span className="font-mono font-medium tabular-nums">{stats ? relativeSeconds(stats.max_age_unused) : "-"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  );
}
