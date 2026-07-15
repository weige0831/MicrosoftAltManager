import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Upload,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  Plus,
  Copy,
  X,
  Users,
} from "lucide-react";
import type { AccountListItem, AccountDetail } from "@/lib/api";
import { API } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDeleteDialog } from "@/components/console/confirm-delete-dialog";
import { SectionPageLayout } from "@/components/layout/components/section-page-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTime } from "@/lib/utils";

interface RT {
  app_name: string;
  refresh_token: string;
}

export default function AccountsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState<AccountListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>(() => {
    const s = params.get("status");
    return s === "0" || s === "1" ? s : "all";
  });
  const [q, setQ] = useState("");
  const [qQuery, setQQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [extractOpen, setExtractOpen] = useState(false);
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // sync status from URL
  useEffect(() => {
    const s = params.get("status");
    if (s === "0" || s === "1") setStatus(s);
    else if (!params.has("status")) {
      // keep local if user changed without URL
    }
  }, [params]);

  // open dialogs from ?action=
  useEffect(() => {
    const action = params.get("action");
    if (action === "upload") setUploadOpen(true);
    if (action === "extract") setExtractOpen(true);
    if (action) {
      const next = new URLSearchParams(params);
      next.delete("action");
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQQuery(q.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p: Record<string, unknown> = { page, page_size: 20 };
      if (status !== "all") p.status = Number(status);
      if (qQuery) p.remark = qQuery;
      const r = await API.accounts(p);
      setList(r.items || []);
      setTotal(r.total);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, status, qQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("Copied"));
  };

  const setStatusFilter = (v: string) => {
    setStatus(v);
    setPage(1);
    const next = new URLSearchParams(params);
    if (v === "all") next.delete("status");
    else next.set("status", v);
    setParams(next, { replace: true });
  };

  return (
    <SectionPageLayout fixedContent>
      <SectionPageLayout.Title>{t("accounts.title")}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
          {t("action.refresh")}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setExtractOpen(true)}>
          <Download className="size-4" />
          {t("accounts.extractAccount")}
        </Button>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Plus className="size-4" />
          {t("accounts.uploadAccount")}
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className="flex h-full min-h-0 flex-col gap-3">
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Select
              value={status}
              onValueChange={(v) => {
                if (v == null) return;
                setStatusFilter(String(v));
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue>
                  {status === "all"
                    ? t("accounts.allStatus")
                    : status === "0"
                      ? t("accounts.statusAvailable")
                      : t("accounts.statusUsed")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("accounts.allStatus")}</SelectItem>
                <SelectItem value="0">{t("accounts.statusAvailable")}</SelectItem>
                <SelectItem value="1">{t("accounts.statusUsed")}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={t("accounts.searchRemark")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-48"
            />
            <span className="text-xs text-muted-foreground">
              {t("accounts.total", { n: total })}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card shadow-xs">
            {list.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t("accounts.noData")}
                description={t("accounts.emptyDesc", {
                  defaultValue: "上传微软账号后即可在此管理与提取",
                })}
                action={
                  <Button size="sm" onClick={() => setUploadOpen(true)}>
                    <Plus className="size-4" />
                    {t("accounts.uploadAccount")}
                  </Button>
                }
                className="min-h-[280px] border-0"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>{t("accounts.colUsername")}</TableHead>
                    <TableHead>{t("accounts.colRemark")}</TableHead>
                    <TableHead>{t("accounts.colStatus")}</TableHead>
                    <TableHead>{t("accounts.colUploadedAt")}</TableHead>
                    <TableHead>{t("accounts.colUsedAt")}</TableHead>
                    <TableHead className="w-24">{t("accounts.colActions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-muted-foreground">{a.id}</TableCell>
                      <TableCell className="font-medium">{a.username}</TableCell>
                      <TableCell>{a.remark || "-"}</TableCell>
                      <TableCell>
                        {a.status === 0 ? (
                          <Badge variant="success">{t("accounts.statusAvailable")}</Badge>
                        ) : (
                          <Badge variant="warning">{t("accounts.statusUsed")}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatTime(a.uploaded_at)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatTime(a.used_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("accounts.viewPlaintext")}
                            onClick={async () => {
                              try {
                                setDetail(await API.accountDetail(a.id));
                              } catch (e) {
                                toast.error((e as Error).message);
                              }
                            }}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("action.delete")}
                            onClick={() => setDeleteId(a.id)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {total > 20 && (
            <div className="flex shrink-0 items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                {t("common.prev")}
              </Button>
              <span className="text-sm text-muted-foreground">{t("common.page", { n: page })}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={list.length < 20}
                onClick={() => setPage(page + 1)}
              >
                {t("common.next")}
              </Button>
            </div>
          )}

          <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onDone={load} />
          <ExtractDialog open={extractOpen} onOpenChange={setExtractOpen} onDone={load} copy={copy} />

          <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("accounts.detailTitle")}</DialogTitle>
                <DialogDescription>{t("accounts.detailDesc")}</DialogDescription>
              </DialogHeader>
              {detail && (
                <div className="space-y-3 text-sm">
                  <Field label={t("accounts.colUsername")} value={detail.username} onCopy={copy} />
                  <Field label={t("accounts.fieldPassword")} value={detail.password || "-"} onCopy={copy} mono />
                  <Field label="Cookie" value={detail.cookie || "-"} onCopy={copy} mono multiline />
                  {detail.refresh_tokens?.map((r, i) => (
                    <Field
                      key={i}
                      label={`RefreshToken (${r.app_name})`}
                      value={r.refresh_token}
                      onCopy={copy}
                      mono
                      multiline
                    />
                  ))}
                  <div className="flex justify-between rounded-md border p-2 text-xs text-muted-foreground">
                    <span>{t("accounts.colUploadedAt")}: {formatTime(detail.uploaded_at)}</span>
                    <span>{t("accounts.colUsedAt")}: {formatTime(detail.used_at)}</span>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <ConfirmDeleteDialog
            open={deleteId != null}
            onOpenChange={(o) => !o && setDeleteId(null)}
            title={t("accounts.deleteConfirm")}
            loading={deleting}
            onConfirm={async () => {
              if (deleteId == null) return;
              setDeleting(true);
              try {
                await API.deleteAccount(deleteId);
                toast.success(t("accounts.deleted"));
                setDeleteId(null);
                load();
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setDeleting(false);
              }
            }}
          />
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  );
}

function Field({
  label,
  value,
  onCopy,
  mono,
  multiline,
}: {
  label: string;
  value: string;
  onCopy: (v: string) => void;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-36 shrink-0 pt-1.5 text-muted-foreground">{label}</div>
      <div
        className={`flex-1 rounded-md border bg-muted/40 p-2 ${mono ? "font-mono text-xs" : ""} ${
          multiline ? "max-h-32 overflow-auto break-all" : "truncate"
        }`}
      >
        {value}
      </div>
      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => onCopy(value)}>
        <Copy className="size-4" />
      </Button>
    </div>
  );
}

function UploadDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cookie, setCookie] = useState("");
  const [remark, setRemark] = useState("");
  const [rts, setRts] = useState<RT[]>([]);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setUsername("");
    setPassword("");
    setCookie("");
    setRemark("");
    setRts([]);
  };

  const submit = async () => {
    if (!username || !password || !cookie) {
      toast.error(t("accounts.uploadRequired", { defaultValue: "用户名/密码/Cookie 必填" }));
      return;
    }
    setLoading(true);
    try {
      await API.upload({
        username,
        password,
        cookie,
        remark,
        refresh_tokens: rts.filter((r) => r.app_name && r.refresh_token),
      });
      toast.success(t("accounts.uploadSuccess", { defaultValue: "上传成功" }));
      reset();
      onOpenChange(false);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("accounts.uploadTitle", { defaultValue: "上传微软账号" })}</DialogTitle>
          <DialogDescription>
            {t("accounts.uploadDesc", { defaultValue: "带 * 为必填，敏感字段将加密存储" })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("accounts.colUsername")} *</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("accounts.fieldPassword")} *</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Cookie *</Label>
            <Textarea
              value={cookie}
              onChange={(e) => setCookie(e.target.value)}
              className="max-h-32 font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("accounts.colRemark")}</Label>
            <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{t("accounts.refreshTokenOptional", { defaultValue: "RefreshToken (可选)" })}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRts([...rts, { app_name: "", refresh_token: "" }])}
              >
                <Plus className="size-4" /> {t("accounts.addApp", { defaultValue: "添加应用" })}
              </Button>
            </div>
            {rts.map((r, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder={t("accounts.appName", { defaultValue: "应用名称" })}
                  value={r.app_name}
                  className="w-40"
                  onChange={(e) => {
                    const n = [...rts];
                    n[i].app_name = e.target.value;
                    setRts(n);
                  }}
                />
                <Input
                  placeholder="refresh_token"
                  className="font-mono text-xs"
                  value={r.refresh_token}
                  onChange={(e) => {
                    const n = [...rts];
                    n[i].refresh_token = e.target.value;
                    setRts(n);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRts(rts.filter((_, j) => j !== i))}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("action.cancel")}
          </Button>
          <Button onClick={submit} disabled={loading}>
            <Upload className="size-4" />
            {loading ? t("action.loading") : t("accounts.uploadAccount")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExtractDialog({
  open,
  onOpenChange,
  onDone,
  copy,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
  copy: (v: string) => void;
}) {
  const { t } = useTranslation();
  const [count, setCount] = useState(1);
  const [remark, setRemark] = useState("");
  const [appName, setAppName] = useState("");
  const [uploadedAfter, setUploadedAfter] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any[] | null>(null);

  const submit = async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { count };
      if (remark) body.remark = remark;
      if (appName) body.app_name = appName;
      if (uploadedAfter) body.uploaded_after = new Date(uploadedAfter).toISOString();
      const r = await API.extract(body);
      setResult(r?.items || []);
      if (r && r.count > 0) {
        onDone();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className={result ? "max-w-3xl" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle>
            {result
              ? t("accounts.extractSuccess", {
                  defaultValue: "提取成功（{{n}} 个）",
                  n: result.length,
                })
              : t("accounts.extractAccount")}
          </DialogTitle>
          <DialogDescription>
            {result
              ? t("accounts.extractSuccessDesc", {
                  defaultValue: "账号已标记为已使用，无法二次提取；将在 TTL 后自动删除",
                })
              : t("accounts.extractDesc", {
                  defaultValue: "按上传时间从旧到新提取，提取后账号标记为已使用",
                })}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("accounts.extractCount", { defaultValue: "数量" })}</Label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("accounts.uploadedAfter", { defaultValue: "上传时间晚于" })}</Label>
                <Input
                  type="datetime-local"
                  value={uploadedAfter}
                  onChange={(e) => setUploadedAfter(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("accounts.searchRemark")}</Label>
              <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("accounts.appNameFilter", { defaultValue: "应用名筛选 (RefreshToken)" })}</Label>
              <Input value={appName} onChange={(e) => setAppName(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-3 overflow-auto">
            {result.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                {t("accounts.noMatch", { defaultValue: "没有符合条件的可用账号" })}
              </p>
            ) : (
              result.map((a, i) => (
                <div key={i} className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="info">#{a.id}</Badge>
                    <span className="font-medium">{a.username}</span>
                    {a.remark && <span className="text-muted-foreground">({a.remark})</span>}
                  </div>
                  <ExtractField label={t("accounts.fieldPassword")} value={a.password} onCopy={copy} />
                  <ExtractField label="Cookie" value={a.cookie} onCopy={copy} multiline />
                  {a.refresh_tokens?.map((r: any, j: number) => (
                    <ExtractField
                      key={j}
                      label={`RT (${r.app_name})`}
                      value={r.refresh_token}
                      onCopy={copy}
                      multiline
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={close}>{t("action.done", { defaultValue: "完成" })}</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("action.cancel")}
              </Button>
              <Button onClick={submit} disabled={loading}>
                <Download className="size-4" />
                {loading ? t("action.loading") : t("accounts.extractAccount")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExtractField({
  label,
  value,
  onCopy,
  multiline,
}: {
  label: string;
  value: string;
  onCopy: (v: string) => void;
  multiline?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="mb-1 flex items-start gap-2">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <code className={`flex-1 rounded bg-muted/50 px-1.5 py-0.5 text-xs ${multiline ? "max-h-24 overflow-auto break-all" : "truncate"}`}>
        {value}
      </code>
      <button onClick={() => onCopy(value)} className="text-muted-foreground hover:text-foreground">
        <Copy className="size-3.5" />
      </button>
    </div>
  );
}
