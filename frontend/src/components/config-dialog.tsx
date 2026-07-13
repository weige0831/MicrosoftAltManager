import { useTranslation } from "react-i18next";
import { Palette, RotateCcw, Check } from "lucide-react";
import { THEME_PRESETS, type ThemeFont, type ThemePreset, type ThemeRadius, type ThemeScale } from "@/lib/theme-customization";
import { useThemeCustomization } from "@/context/theme-customization-provider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUI } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function ConfigDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const { customization, setPreset, setFont, setRadius, setScale, resetCustomization } = useThemeCustomization();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle><Palette className="mr-2 inline size-5 text-primary" />{t("Theme Settings")}</DialogTitle>
          <DialogDescription>{t("Adjust the appearance and layout to suit your preferences.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-2">
          <div><div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("Theme Presets")}</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEME_PRESETS.map((p) => {
                const active = customization.preset === p.value;
                return (
                  <button key={p.value} onClick={() => setPreset(p.value as ThemePreset)}
                    className={cn("group relative flex items-center gap-2 rounded-lg border p-2 text-left transition-all hover:bg-accent", active ? "border-primary ring-1 ring-primary" : "border-border")}>
                    <span className="flex shrink-0 overflow-hidden rounded-md ring-1 ring-border">
                      <span className="size-5" style={{ background: p.swatches[0] }} />
                      <span className="size-5" style={{ background: p.swatches[1] }} />
                    </span>
                    <span className="truncate text-xs font-medium">{p.name}</span>
                    {active && <Check className="absolute right-1.5 top-1.5 size-3 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
          <div><div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("Font")}</div>
            <SegmentRow options={[{ value: "default", label: "Default" }, { value: "sans", label: "Sans" }, { value: "serif", label: "Serif" }]} value={customization.font} onChange={(v) => setFont(v as ThemeFont)} /></div>
          <div><div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("Radius")}</div>
            <SegmentRow options={[{ value: "default", label: "Default" }, { value: "none", label: "None" }, { value: "sm", label: "SM" }, { value: "md", label: "MD" }, { value: "lg", label: "LG" }, { value: "xl", label: "XL" }]} value={customization.radius} onChange={(v) => setRadius(v as ThemeRadius)} /></div>
          <div><div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("Density")}</div>
            <SegmentRow options={[{ value: "default", label: "Default" }, { value: "sm", label: "Compact" }, { value: "lg", label: "Comfortable" }, { value: "xl", label: "Large" }]} value={customization.scale} onChange={(v) => setScale(v as ThemeScale)} /></div>
        </div>
        <div className="flex justify-end pt-2"><Button variant="outline" size="sm" onClick={resetCustomization}><RotateCcw className="size-4" />{t("Reset")}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function SegmentRow<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: string; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", value === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ConfigDialogHost() {
  const open = useUI((s) => s.configOpen);
  const setOpen = useUI((s) => s.setConfigOpen);
  return <ConfigDialog open={open} onOpenChange={setOpen} />;
}
