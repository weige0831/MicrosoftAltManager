import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ScrollText, RefreshCw } from "lucide-react";
import { API } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await API.logs({ page, page_size: 50 });
      setRows(r.items || []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page]);

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
    <SectionPageLayout>
      <SectionPageLayout.Title>{t("logs.title")}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
      <div className="space-y-4">

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
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
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  {t("logs.noData")}
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-muted-foreground">{r.id}</TableCell>
                <TableCell>
                  <Badge variant={tone(r.action) as any}>{r.action}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{r.target_id || "-"}</TableCell>
                <TableCell>{r.actor}</TableCell>
                <TableCell className="text-muted-foreground">{r.detail || "-"}</TableCell>
                <TableCell className="text-muted-foreground">{formatTime(r.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          {t("common.prev")}
        </Button>
        <span className="text-sm text-muted-foreground">{t("common.page", { n: page })}</span>
        <Button variant="outline" size="sm" disabled={rows.length < 50} onClick={() => setPage(page + 1)}>
          {t("common.next")}
        </Button>
      </div>
      </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  );
}
