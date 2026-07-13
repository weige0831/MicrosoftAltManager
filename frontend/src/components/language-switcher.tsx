import { useTranslation } from "react-i18next";
import { Languages, Check } from "lucide-react";
import { INTERFACE_LANGUAGE_OPTIONS } from "@/i18n/languages";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage || i18n.language || "zhCN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        title="Language"
      >
        <Languages className="size-4" />
        <span className="sr-only">Change language</span>
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
