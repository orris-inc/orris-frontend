import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Section heading component for page content areas.
 * Displays a title with optional description and action buttons.
 */
export function SectionHeading({
  title,
  description,
  actions,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("@container flex items-start justify-between", className)}>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
