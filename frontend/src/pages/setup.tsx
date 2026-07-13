import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Boxes, Loader2, ShieldCheck } from "lucide-react";
import { API } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetupPage() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) {
      toast.error(t("setup.usernameTooShort"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("setup.passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      toast.error(t("setup.mismatch"));
      return;
    }
    setLoading(true);
    try {
      await API.setup(username.trim(), password);
      toast.success(t("setup.success"));
      nav("/login", { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="size-6" />
          </div>
          <CardTitle>{t("setup.title")}</CardTitle>
          <CardDescription>{t("setup.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="su">{t("setup.username")}</Label>
              <Input
                id="su"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp">{t("setup.password")}</Label>
              <Input
                id="sp"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spc">{t("setup.confirm")}</Label>
              <Input
                id="spc"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              {t("setup.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
