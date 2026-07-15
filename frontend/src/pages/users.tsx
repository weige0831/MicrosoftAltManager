import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, RefreshCw, Shield, Trash2, UserCog } from "lucide-react";
import { API, type ManagedUser } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDeleteDialog } from "@/components/console/confirm-delete-dialog";
import { SectionPageLayout } from "@/components/layout/components/section-page-layout";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ROLE, getRoleLabel, isRoot } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";
import { formatTime } from "@/lib/utils";

export default function UsersPage() {
  const { t } = useTranslation();
  const me = useAuthStore((s) => s.auth.user);
  const [rows, setRows] = useState<ManagedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [keywordQuery, setKeywordQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setKeywordQuery(keyword.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await API.users({ page, page_size: 20, keyword: keywordQuery || undefined });
      setRows(r.items || []);
      setTotal(r.total);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, keywordQuery]);

  useEffect(() => { load(); }, [load]);

  const isSuper = !!me && isRoot(me.role);

  return (
    <SectionPageLayout fixedContent>
      <SectionPageLayout.Title>{t("nav.users", { defaultValue: "用户管理" })}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
        </Button>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
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
            />
            <span className="text-xs text-muted-foreground">{t("accounts.total", { n: total })}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card shadow-xs">
            {rows.length === 0 ? (
              <EmptyState
                icon={UserCog}
                title={t("users.noData", { defaultValue: "暂无用户" })}
                description={t("users.emptyDesc", { defaultValue: "创建用户后可分配角色并管理状态" })}
                action={
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="size-4" />
                    {t("users.new", { defaultValue: "新建用户" })}
                  </Button>
                }
                className="min-h-[280px] border-0"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>{t("login.username")}</TableHead>
                    <TableHead>{t("users.displayName", { defaultValue: "显示名" })}</TableHead>
                    <TableHead>{t("users.role", { defaultValue: "角色" })}</TableHead>
                    <TableHead>{t("users.status", { defaultValue: "状态" })}</TableHead>
                    <TableHead>{t("users.createdAt", { defaultValue: "创建时间" })}</TableHead>
                    <TableHead className="w-28">{t("accounts.colActions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((u) => {
                    const root = isRoot(u.role);
                    const self = me?.id === u.id;
                    const canEdit = isSuper || (!root && (me?.role ?? 0) > u.role) || self;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="text-muted-foreground">{u.id}</TableCell>
                        <TableCell className="font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            {root && <Shield className="size-3.5 text-primary" />}
                            {u.username}
                          </span>
                        </TableCell>
                        <TableCell>{u.display_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={root ? "info" : u.role >= ROLE.ADMIN ? "secondary" : "outline"}>
                            {getRoleLabel(u.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={u.status === 1}
                            disabled={self || root}
                            title={root ? t("users.rootProtected", { defaultValue: "根用户不可禁用" }) : undefined}
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
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!canEdit}
                              title={t("action.edit", { defaultValue: "编辑" })}
                              onClick={() => setEditUser(u)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={self || root}
                              title={root ? t("users.rootProtected", { defaultValue: "根用户不可删除" }) : t("action.delete")}
                              onClick={() => setDeleteUser(u)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
              <Button variant="outline" size="sm" disabled={rows.length < 20} onClick={() => setPage(page + 1)}>
                {t("common.next")}
              </Button>
            </div>
          )}
        </div>
        <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} onDone={load} isSuper={isSuper} />
        <EditUserDialog
          user={editUser}
          onOpenChange={(o) => !o && setEditUser(null)}
          onDone={load}
          isSuper={isSuper}
          isSelf={!!editUser && me?.id === editUser.id}
        />
        <ConfirmDeleteDialog
          open={!!deleteUser}
          onOpenChange={(o) => !o && setDeleteUser(null)}
          title={t("users.deleteConfirm", { defaultValue: "确定删除该用户？" })}
          description={
            deleteUser
              ? t("users.deleteDesc", {
                  defaultValue: "将删除用户 {{name}}，此操作不可撤销。",
                  name: deleteUser.username,
                })
              : undefined
          }
          loading={deleting}
          onConfirm={async () => {
            if (!deleteUser) return;
            setDeleting(true);
            try {
              await API.deleteUser(deleteUser.id);
              toast.success(t("accounts.deleted"));
              setDeleteUser(null);
              load();
            } catch (e) {
              toast.error((e as Error).message);
            } finally {
              setDeleting(false);
            }
          }}
        />
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
    if (password.length < 6) {
      toast.error(t("users.passwordMin", { defaultValue: "密码至少 6 位" }));
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
          <DialogDescription>{t("Set the user's role (cannot be Root)")}</DialogDescription>
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
                  {Number(role) >= ROLE.ADMIN ? t("Admin") : t("Common User", { defaultValue: t("User") })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(ROLE.USER)}>{t("Common User", { defaultValue: t("User") })}</SelectItem>
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

function EditUserDialog({
  user, onOpenChange, onDone, isSuper, isSelf,
}: {
  user: ManagedUser | null;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
  isSuper: boolean;
  isSelf: boolean;
}) {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(String(ROLE.USER));
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || user.username);
      setEmail(user.email || "");
      setRole(String(user.role >= ROLE.ADMIN && user.role < ROLE.SUPER_ADMIN ? ROLE.ADMIN : ROLE.USER));
      setPassword("");
    }
  }, [user]);

  if (!user) return null;
  const root = isRoot(user.role);
  // when editing self who is root, keep role display as root but don't allow change
  const canChangeRole = isSuper && !root && !isSelf;

  const submit = async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        display_name: displayName,
        email,
      };
      if (canChangeRole) {
        body.role = Number(role);
      }
      if (password) {
        if (password.length < 6) {
          toast.error(t("users.passwordMin", { defaultValue: "密码至少 6 位" }));
          setLoading(false);
          return;
        }
        body.password = password;
      }
      await API.updateUser(user.id, body);
      toast.success(t("settings.saved"));
      onOpenChange(false);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.edit", { defaultValue: "编辑用户" })} · {user.username}</DialogTitle>
          <DialogDescription>
            {root
              ? t("users.editRootHint", { defaultValue: "根用户仅可修改显示名与邮箱" })
              : t("users.editHint", { defaultValue: "修改资料、角色或重置密码" })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("login.username")}</Label>
            <Input value={user.username} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>{t("users.displayName", { defaultValue: "显示名" })}</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("users.email", { defaultValue: "邮箱" })}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("users.role", { defaultValue: "角色" })}</Label>
            {root ? (
              <Input value={getRoleLabel(user.role)} disabled />
            ) : (
              <Select
                value={role}
                onValueChange={(v) => setRole(String(v))}
                disabled={!canChangeRole}
              >
                <SelectTrigger>
                  <SelectValue>
                    {Number(role) >= ROLE.ADMIN ? t("Admin") : t("Common User", { defaultValue: t("User") })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(ROLE.USER)}>{t("Common User", { defaultValue: t("User") })}</SelectItem>
                  {isSuper && <SelectItem value={String(ROLE.ADMIN)}>{t("Admin")}</SelectItem>}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t("users.resetPassword", { defaultValue: "重置密码（可选）" })}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("users.resetPasswordHint", { defaultValue: "留空则不修改" })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("action.cancel")}</Button>
          <Button onClick={submit} disabled={loading}>{loading ? t("action.loading") : t("action.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
