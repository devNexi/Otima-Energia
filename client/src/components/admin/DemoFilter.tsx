import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Filter } from "lucide-react";

export type DemoFilterMode = 'all' | 'demo_only' | 'hide_demo';

interface DemoFilterProps {
  value: DemoFilterMode;
  onChange: (value: DemoFilterMode) => void;
  compact?: boolean;
}

export function DemoFilter({ value, onChange, compact = false }: DemoFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DemoFilterMode)}>
      <SelectTrigger className={compact ? "w-[140px]" : "w-[180px]"} data-testid="select-demo-filter">
        <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
        <SelectValue placeholder="Filter demo..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" data-testid="filter-all">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Show All
          </div>
        </SelectItem>
        <SelectItem value="demo_only" data-testid="filter-demo-only">
          <div className="flex items-center gap-2">
            <span className="text-amber-600">●</span>
            Demo Only
          </div>
        </SelectItem>
        <SelectItem value="hide_demo" data-testid="filter-hide-demo">
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4" />
            Hide Demo
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export function filterByDemoMode<T extends { isDemo?: boolean | null }>(
  items: T[],
  mode: DemoFilterMode
): T[] {
  switch (mode) {
    case 'demo_only':
      return items.filter(item => item.isDemo === true);
    case 'hide_demo':
      return items.filter(item => item.isDemo !== true);
    case 'all':
    default:
      return items;
  }
}
