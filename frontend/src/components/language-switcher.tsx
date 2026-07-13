import { useTranslation } from "react-i18next";
import { Languages, Check } from "lucide-react";
import { INTERFACE_LANGUAGE_OPTIONS } from "@/i18n/languages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage || i18n.language || "zhCN";
  const currentLabel =
    INTERFACE_LANGUAGE_OPTIONS.find((o) => o.code === current)?.label || "简体中文";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          className,
        )}
        title="Language"
      >
        <Languages className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {INTERFACE_LANGUAGE_OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.code}
            onClick={() => i18n.changeLanguage(o.code)}
            className="justify-between"
          >
            <span>{o.label}</span>
            {o.code === current && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
