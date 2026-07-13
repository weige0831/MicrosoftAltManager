import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** Consistent page header: icon + title/description on the left, actions on right.
 * Mirrors new-api's SectionPageLayout Title/Actions slots. */
export function PageHeader({ title, description, actions, icon, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {icon && (
        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
