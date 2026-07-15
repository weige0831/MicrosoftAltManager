import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ScrollText, RefreshCw } from "lucide-react";
import { API } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { SectionPageLayout } from "@/components/layout/components/section-page-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTime } from "@/lib/utils";

interface LogRow {
  id: number;
  action: string;
  target_id: string;
  actor: string;
  detail: string;
  created_at: string;
}

export default function LogsPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [actionQuery, setActionQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActionQuery(action.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [action]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await API.logs({
        page,
        page_size: 50,
        action: actionQuery || undefined,
      });
      setRows(r.items || []);
      setTotal(r.total ?? (r.items?.length || 0));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, actionQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const tone = (a: string) => {
    if (a.includes("extract")) return "info";
    if (a.includes("delete") || a.includes("cleaner")) return "destructive";
    if (a.includes("upload")) return "success";
    return "secondary";
  };

  return (
    <SectionPageLayout fixedContent>
      <SectionPageLayout.Title>{t("logs.title")}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className="flex h-full min-h-0 flex-col gap-3">
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Input
              className="w-56"
              placeholder={t("logs.filterAction", { defaultValue: "按动作筛选" })}
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">
              {t("accounts.total", { n: total })}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card shadow-xs">
            {rows.length === 0 ? (
              <EmptyState
                icon={ScrollText}
                title={t("logs.noData")}
                description={t("logs.emptyDesc", {
                  defaultValue: "上传、提取、用户变更等操作会出现在这里",
                })}
                className="min-h-[280px] border-0"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead className="w-44">{t("logs.colAction")}</TableHead>
                    <TableHead>{t("logs.colTarget")}</TableHead>
                    <TableHead>{t("logs.colActor")}</TableHead>
                    <TableHead>{t("logs.colDetail")}</TableHead>
                    <TableHead className="w-44">{t("logs.colTime")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground">{r.id}</TableCell>
                      <TableCell>
                        <Badge variant={tone(r.action) as any}>{r.action}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.target_id || "-"}</TableCell>
                      <TableCell>{r.actor}</TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground">
                        {r.detail || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatTime(r.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {total > 50 && (
            <div className="flex shrink-0 items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                {t("common.prev")}
              </Button>
              <span className="text-sm text-muted-foreground">{t("common.page", { n: page })}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={rows.length < 50}
                onClick={() => setPage(page + 1)}
              >
                {t("common.next")}
              </Button>
            </div>
          )}
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  );
}
