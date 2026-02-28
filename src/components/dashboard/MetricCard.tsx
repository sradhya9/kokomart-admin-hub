import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
  };
  icon: LucideIcon;
  iconColor?: string;
}

export function MetricCard({ title, value, change, icon: Icon, iconColor }: MetricCardProps) {
  return (
    <div className="metric-card animate-fade-in group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground tracking-tight">{value}</p>
          {change && (
            <p
              className={cn(
                "mt-2 flex items-center gap-1 text-xs font-semibold",
                change.type === "increase" && "price-up",
                change.type === "decrease" && "price-down",
                change.type === "neutral" && "text-muted-foreground"
              )}
            >
              <span className="text-base leading-none">
                {change.type === "increase" && "↑"}
                {change.type === "decrease" && "↓"}
                {change.type === "neutral" && "—"}
              </span>
              {change.value}% from yesterday
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110",
            iconColor || "bg-primary/10"
          )}
        >
          <Icon className={cn("h-6 w-6", iconColor ? "text-current" : "text-primary")} />
        </div>
      </div>
    </div>
  );
}
