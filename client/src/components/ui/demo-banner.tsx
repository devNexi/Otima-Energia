import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoBannerProps {
  className?: string;
  entityType?: string;
}

export function DemoBanner({ className, entityType = "record" }: DemoBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200",
        className
      )}
      data-testid="demo-banner"
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>
        <strong>Demo Mode:</strong> This {entityType} is demo data for testing purposes. Changes may be reset.
      </span>
    </div>
  );
}

interface DemoBadgeProps {
  className?: string;
}

export function DemoBadge({ className }: DemoBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
        className
      )}
      data-testid="demo-badge"
    >
      <AlertTriangle className="h-3 w-3" />
      DEMO
    </span>
  );
}
