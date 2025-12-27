import { AlertTriangle } from "lucide-react";

interface DemoBannerProps {
  compact?: boolean;
}

export function DemoBanner({ compact = false }: DemoBannerProps) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-medium dark:bg-amber-900/50 dark:text-amber-200" data-testid="demo-banner-compact">
        <AlertTriangle className="h-3 w-3" />
        DEMO DATA
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200" data-testid="demo-banner">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="text-sm font-medium">
        DEMO DATA - NOT REAL
      </span>
      <span className="text-sm text-amber-600 dark:text-amber-400">
        This record was created for testing/demonstration purposes only.
      </span>
    </div>
  );
}

export function DemoPageBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 bg-amber-400 text-amber-900 text-sm font-medium shadow-md" data-testid="demo-page-banner">
      <AlertTriangle className="h-4 w-4" />
      <span>DEMO MODE ACTIVE - All data shown is for testing/demonstration purposes only</span>
    </div>
  );
}

export function DemoRecordBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" data-testid="demo-record-badge">
      DEMO
    </span>
  );
}
