import { useEffect, useState, useCallback } from "react";
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
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SectionPageLayout } from "@/components/layout/section-page-layout";
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
  const [list, setList] = useState<AccountListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [extractOpen, setExtractOpen] = useState(false);
  const [detail, setDetail] = useState<AccountDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: 20 };
      if (status !== "all") params.status = Number(status);
      if (q) params.remark = q;
      const r = await API.accounts(params);
      setList(r.items || []);
      setTotal(r.total);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, status, q]);

  useEffect(() => {
    load();
  }, [load]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制");
  };

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        <h2 className="truncate text-base font-bold tracking-tight sm:text-lg">{t("accounts.title")}</h2>
      </SectionPageLayout.Title>
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
      <div className="space-y-4">

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue />
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
          onKeyDown={(e) => e.key === "Enter" && setPage(1)}
        />
        <span className="text-xs text-muted-foreground">{t("accounts.total", { n: total })}</span>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
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
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  {t("accounts.noData")}
                </TableCell>
              </TableRow>
            )}
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
                      title="查看明文"
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
                      title="删除"
                      onClick={async () => {
                        if (!confirm("确定删除该账号？")) return;
                        try {
                          await API.deleteAccount(a.id);
                          toast.success("已删除");
                          load();
                        } catch (e) {
                          toast.error((e as Error).message);
                        }
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">第 {page} 页</span>
          <Button
            variant="outline"
            size="sm"
            disabled={list.length < 20}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onDone={load} />
      <ExtractDialog open={extractOpen} onOpenChange={setExtractOpen} onDone={load} copy={copy} />

      {/* detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>账号明文详情</DialogTitle>
            <DialogDescription>敏感信息，请妥善保管</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <Field label="用户名" value={detail.username} onCopy={copy} />
              <Field label="密码" value={detail.password || "-"} onCopy={copy} mono />
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
                <span>上传: {formatTime(detail.uploaded_at)}</span>
                <span>提取: {formatTime(detail.used_at)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
      toast.error("用户名/密码/Cookie 必填");
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
      toast.success("上传成功");
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
          <DialogTitle>上传微软账号</DialogTitle>
          <DialogDescription>带 * 为必填，敏感字段将加密存储</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>用户名 *</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>密码 *</Label>
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
            <Label>备注</Label>
            <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>RefreshToken (可选)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRts([...rts, { app_name: "", refresh_token: "" }])}
              >
                <Plus className="size-4" /> 添加应用
              </Button>
            </div>
            {rts.map((r, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="应用名称"
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
            取消
          </Button>
          <Button onClick={submit} disabled={loading}>
            <Upload className="size-4" />
            {loading ? "上传中..." : "上传"}
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
          <DialogTitle>{result ? `提取成功（${result.length} 个）` : "提取账号"}</DialogTitle>
          <DialogDescription>
            {result
              ? "账号已标记为已使用，无法二次提取；将在 TTL 后自动删除"
              : "按上传时间从旧到新提取，提取后账号标记为已使用"}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>数量</Label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>上传时间晚于</Label>
                <Input
                  type="datetime-local"
                  value={uploadedAfter}
                  onChange={(e) => setUploadedAfter(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>备注筛选 (模糊)</Label>
              <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>应用名筛选 (RefreshToken app_name)</Label>
              <Input value={appName} onChange={(e) => setAppName(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-3 overflow-auto">
            {result.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">没有符合条件的可用账号</p>
            ) : (
              result.map((a, i) => (
                <div key={i} className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="info">#{a.id}</Badge>
                    <span className="font-medium">{a.username}</span>
                    {a.remark && <span className="text-muted-foreground">({a.remark})</span>}
                  </div>
                  <ExtractField label="密码" value={a.password} onCopy={copy} />
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
            <Button onClick={close}>完成</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={submit} disabled={loading}>
                <Download className="size-4" />
                {loading ? "提取中..." : "提取"}
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
