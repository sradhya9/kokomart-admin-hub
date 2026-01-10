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
    <div className="metric-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {change && (
            <p
              className={cn(
                "mt-2 flex items-center gap-1 text-sm font-medium",
                change.type === "increase" && "text-success",
                change.type === "decrease" && "text-destructive",
                change.type === "neutral" && "text-muted-foreground"
              )}
            >
              {change.type === "increase" && "↑"}
              {change.type === "decrease" && "↓"}
              {change.value}% from yesterday
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            iconColor || "bg-primary/10"
          )}
        >
          <Icon className={cn("h-6 w-6", iconColor ? "text-current" : "text-primary")} />
        </div>
      </div>
    </div>
  );
}
