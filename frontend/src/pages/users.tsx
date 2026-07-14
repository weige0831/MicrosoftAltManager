import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { API, type ManagedUser } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SectionPageLayout } from "@/components/layout/components/section-page-layout";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ROLE } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";
import { formatTime } from "@/lib/utils";

function roleLabel(role: number, t: (k: string) => string) {
  if (role >= ROLE.SUPER_ADMIN) return t("Super Admin");
  if (role >= ROLE.ADMIN) return t("Admin");
  return t("User");
}

export default function UsersPage() {
  const { t } = useTranslation();
  const me = useAuthStore((s) => s.auth.user);
  const [rows, setRows] = useState<ManagedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await API.users({ page, page_size: 20, keyword: keyword || undefined });
      setRows(r.items || []);
      setTotal(r.total);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => { load(); }, [load]);

  return (
    <SectionPageLayout fixedContent>
      <SectionPageLayout.Title>{t("nav.users", { defaultValue: "用户管理" })}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
        </Button>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          {t("users.new", { defaultValue: "新建用户" })}
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className="flex h-full min-h-0 flex-col gap-3">
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Input
              className="w-56"
              placeholder={t("users.search", { defaultValue: "搜索用户名/邮箱" })}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setPage(1)}
            />
            <span className="text-xs text-muted-foreground">{t("accounts.total", { n: total })}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>{t("login.username")}</TableHead>
                  <TableHead>{t("users.displayName", { defaultValue: "显示名" })}</TableHead>
                  <TableHead>{t("users.role", { defaultValue: "角色" })}</TableHead>
                  <TableHead>{t("users.status", { defaultValue: "状态" })}</TableHead>
                  <TableHead>{t("users.createdAt", { defaultValue: "创建时间" })}</TableHead>
                  <TableHead className="w-24">{t("accounts.colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      {t("users.noData", { defaultValue: "暂无用户" })}
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-muted-foreground">{u.id}</TableCell>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.display_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={u.role >= ROLE.ADMIN ? "info" : "secondary"}>
                        {roleLabel(u.role, t)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={u.status === 1}
                        disabled={me?.id === u.id}
                        onCheckedChange={async (v) => {
                          try {
                            await API.updateUser(u.id, { status: v ? 1 : 0 });
                            toast.success(t("settings.saved"));
                            load();
                          } catch (e) {
                            toast.error((e as Error).message);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatTime(u.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={me?.id === u.id}
                        onClick={async () => {
                          if (!confirm(t("users.deleteConfirm", { defaultValue: "确定删除该用户？" }))) return;
                          try {
                            await API.deleteUser(u.id);
                            toast.success(t("accounts.deleted"));
                            load();
                          } catch (e) {
                            toast.error((e as Error).message);
                          }
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {total > 20 && (
            <div className="flex shrink-0 items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                {t("common.prev")}
              </Button>
              <span className="text-sm text-muted-foreground">{t("common.page", { n: page })}</span>
              <Button variant="outline" size="sm" disabled={rows.length < 20} onClick={() => setPage(page + 1)}>
                {t("common.next")}
              </Button>
            </div>
          )}
        </div>
        <CreateUserDialog open={open} onOpenChange={setOpen} onDone={load} isSuper={!!me && me.role >= ROLE.SUPER_ADMIN} />
      </SectionPageLayout.Content>
    </SectionPageLayout>
  );
}

function CreateUserDialog({
  open, onOpenChange, onDone, isSuper,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
  isSuper: boolean;
}) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState(String(ROLE.USER));
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username || !password) {
      toast.error(t("login.username"));
      return;
    }
    setLoading(true);
    try {
      await API.createUser({
        username,
        password,
        display_name: displayName || username,
        role: Number(role),
      });
      toast.success(t("users.created", { defaultValue: "用户已创建" }));
      setUsername(""); setPassword(""); setDisplayName(""); setRole(String(ROLE.USER));
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.new", { defaultValue: "新建用户" })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("login.username")}</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("login.password")}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("users.displayName", { defaultValue: "显示名" })}</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("users.role", { defaultValue: "角色" })}</Label>
            <Select value={role} onValueChange={(v) => setRole(String(v))}>
              <SelectTrigger>
                <SelectValue>
                  {Number(role) >= ROLE.ADMIN ? t("Admin") : t("User")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(ROLE.USER)}>{t("User")}</SelectItem>
                {isSuper && <SelectItem value={String(ROLE.ADMIN)}>{t("Admin")}</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("action.cancel")}</Button>
          <Button onClick={submit} disabled={loading}>{loading ? t("action.loading") : t("action.create")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
