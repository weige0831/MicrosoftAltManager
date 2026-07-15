import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  KeyRound,
  ScrollText,
  TimerReset,
  Upload,
} from "lucide-react";
import type { Stats } from "@/lib/api";
import { API } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionPageLayout } from "@/components/layout/components/section-page-layout";
import { isAdmin } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";
import { cn, formatTime, relativeSeconds } from "@/lib/utils";

type LogRow = {
  id: number;
  action: string;
  target_id: string;
  actor: string;
  detail: string;
  created_at: string;
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const role = useAuthStore((s) => s.auth.user?.role);
  const admin = isAdmin(role);
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      API.stats().catch(() => null),
      admin
        ? API.logs({ page: 1, page_size: 5 }).catch(() => ({ items: [] as LogRow[] }))
        : Promise.resolve({ items: [] as LogRow[] }),
    ]).then(([s, l]) => {
      if (!active) return;
      if (s) setStats(s);
      setLogs((l as { items?: LogRow[] })?.items || []);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [admin]);

  const cards = [
    {
      key: "available",
      label: t("dashboard.available"),
      value: stats?.available ?? 0,
      icon: CheckCircle2,
      tone: "success" as const,
      href: "/accounts?status=0",
    },
    {
      key: "used",
      label: t("dashboard.used"),
      value: stats?.used ?? 0,
      icon: Clock,
      tone: "warning" as const,
      href: "/accounts?status=1",
    },
    {
      key: "today",
      label: t("dashboard.todayUpload"),
      value: stats?.today_upload ?? 0,
      icon: Upload,
      tone: "info" as const,
      href: "/accounts",
    },
    {
      key: "expiring",
      label: t("dashboard.expiringSoon"),
      value: stats?.expiring_soon ?? 0,
      icon: AlertTriangle,
      tone: "destructive" as const,
      href: "/accounts?status=1",
    },
  ];

  const toneMap: Record<string, { bg: string; text: string; bar: string }> = {
    success: { bg: "bg-success/10", text: "text-success", bar: "from-success/80 via-success/40 to-success/5" },
    warning: { bg: "bg-warning/10", text: "text-warning", bar: "from-warning/80 via-warning/40 to-warning/5" },
    info: { bg: "bg-info/10", text: "text-info", bar: "from-info/80 via-info/40 to-info/5" },
    destructive: { bg: "bg-destructive/10", text: "text-destructive", bar: "from-destructive/80 via-destructive/40 to-destructive/5" },
  };

  const logTone = (a: string) => {
    if (a.includes("extract")) return "info";
    if (a.includes("delete") || a.includes("cleaner")) return "destructive";
    if (a.includes("upload")) return "success";
    return "secondary";
  };

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        <div>
          <div>{t("dashboard.title")}</div>
          <p className="mt-0.5 text-xs font-normal text-muted-foreground sm:text-sm">
            {t("dashboard.subtitle", { defaultValue: "账号池状态与快捷操作" })}
          </p>
        </div>
      </SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {cards.map((c) => {
              const tone = toneMap[c.tone];
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => nav(c.href)}
                  className="group relative flex flex-col justify-between gap-2 overflow-hidden rounded-xl border bg-card p-3 text-left shadow-xs transition-all hover:border-primary/30 hover:shadow-sm sm:p-4"
                >
                  <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", tone.bar)} />
                  <div className={cn("grid size-8 shrink-0 place-items-center rounded-lg sm:size-9", tone.bg)}>
                    <c.icon className={cn("size-4 sm:size-5", tone.text)} />
                  </div>
                  <div className="font-mono text-xl font-semibold tabular-nums sm:text-2xl">
                    {loading && !stats ? "—" : c.value}
                  </div>
                  <div className="line-clamp-2 text-[11px] text-muted-foreground sm:text-xs">{c.label}</div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => nav("/accounts?action=upload")}>
              <Upload className="size-4" />
              {t("accounts.uploadAccount")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => nav("/accounts?action=extract")}>
              <Download className="size-4" />
              {t("accounts.extractAccount")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => nav("/apikeys")}>
              <KeyRound className="size-4" />
              {t("nav.apiKeys")}
            </Button>
            {admin && (
              <Button size="sm" variant="outline" onClick={() => nav("/settings?section=cleanup")}>
                <TimerReset className="size-4" />
                {t("dashboard.cleanupPolicy")}
              </Button>
            )}
          </div>

          <div className={cn("grid gap-4", admin ? "lg:grid-cols-2" : "")}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TimerReset className="size-4 text-muted-foreground" />
                  {t("dashboard.cleanupPolicy")}
                </CardTitle>
                {admin && (
                  <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" onClick={() => nav("/settings?section=cleanup")}>
                    {t("action.configure", { defaultValue: "去设置" })}
                    <ArrowRight className="size-3.5" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                  <span className="text-muted-foreground">{t("dashboard.ttlAfterExtract")}</span>
                  <span className="font-mono font-medium tabular-nums">
                    {stats ? relativeSeconds(stats.ttl_after_extract) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                  <span className="text-muted-foreground">{t("dashboard.maxAgeUnused")}</span>
                  <span className="font-mono font-medium tabular-nums">
                    {stats ? relativeSeconds(stats.max_age_unused) : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {admin && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ScrollText className="size-4 text-muted-foreground" />
                    {t("dashboard.recentLogs", { defaultValue: "最近操作" })}
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" onClick={() => nav("/logs")}>
                    {t("action.viewAll", { defaultValue: "全部" })}
                    <ArrowRight className="size-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {logs.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {t("logs.noData")}
                    </p>
                  ) : (
                    logs.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-start justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant={logTone(r.action) as any}>{r.action}</Badge>
                            <span className="truncate text-muted-foreground">{r.actor}</span>
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {r.detail || r.target_id || "—"}
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatTime(r.created_at)}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  );
}
