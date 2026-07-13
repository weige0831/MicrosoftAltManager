import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyRound, Plus, Copy, Trash2, RefreshCw } from "lucide-react";
import type { ApiKey } from "@/lib/api";
import { API } from "@/lib/api";
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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatTime } from "@/lib/utils";

export default function ApiKeysPage() {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  const load = async () => {
    try { setKeys(await API.apiKeys()); } catch (e) { toast.error((e as Error).message); }
  };
  useEffect(() => { load(); }, []);

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t("apikeys.title")}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="size-4" /></Button>
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" />{t("apikeys.newKey")}</Button>
        </>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
      <div className="space-y-4">

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("apikeys.colName")}</TableHead>
              <TableHead>{t("apikeys.colPrefix")}</TableHead>
              <TableHead>{t("apikeys.colPerms")}</TableHead>
              <TableHead>{t("apikeys.colEnabled")}</TableHead>
              <TableHead>{t("apikeys.colUsage")}</TableHead>
              <TableHead>{t("apikeys.colLastUsed")}</TableHead>
              <TableHead className="w-16">{t("accounts.colActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">{t("apikeys.noData")}</TableCell></TableRow>
            )}
            {keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{k.key_prefix}...</TableCell>
                <TableCell><Badge variant={k.permissions.includes("upload") ? "info" : "secondary"}>{k.permissions}</Badge></TableCell>
                <TableCell>
                  <Switch checked={k.enabled} onCheckedChange={async (v) => {
                    try { await API.updateApiKey(k.id, { enabled: v }); toast.success(v ? t("apikeys.enabled") : t("apikeys.disabled")); load(); }
                    catch (e) { toast.error((e as Error).message); }
                  }} />
                </TableCell>
                <TableCell className="text-muted-foreground">{k.used_count} / {k.quota === 0 ? "∞" : k.quota}</TableCell>
                <TableCell className="text-muted-foreground">{formatTime(k.last_used_at)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={async () => {
                    if (!confirm(t("apikeys.deleteConfirm"))) return;
                    try { await API.deleteApiKey(k.id); toast.success(t("accounts.deleted")); load(); }
                    catch (e) { toast.error((e as Error).message); }
                  }}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateKeyDialog open={open} onOpenChange={setOpen} onCreated={(kp) => { setCreated(kp); load(); }} />

      <Dialog open={!!created} onOpenChange={(o) => !o && setCreated(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("apikeys.createdOnce")}</DialogTitle>
            <DialogDescription>{t("apikeys.createdOnceDesc")}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3">
            <code className="flex-1 break-all font-mono text-sm">{created}</code>
            <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(created!); toast.success(t("action.copy")); }}>
              <Copy className="size-4" />
            </Button>
          </div>
          <DialogFooter><Button onClick={() => setCreated(null)}>{t("apikeys.saved")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  );
}

function CreateKeyDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (key: string) => void; }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [perms, setPerms] = useState("extract");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name) { toast.error(t("apikeys.fieldName")); return; }
    setLoading(true);
    try {
      const r = await API.createApiKey({ name, permissions: perms });
      toast.success(t("apikeys.created"));
      setName(""); setPerms("extract"); onOpenChange(false); onCreated(r.key);
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("apikeys.createTitle")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("apikeys.fieldName")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("apikeys.fieldPerms")}</Label>
            <Select value={perms} onValueChange={setPerms}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="extract">{t("apikeys.permExtract")}</SelectItem>
                <SelectItem value="upload">{t("apikeys.permUpload")}</SelectItem>
                <SelectItem value="upload,extract">{t("apikeys.permBoth")}</SelectItem>
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
