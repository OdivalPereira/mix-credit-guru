import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: "primary" | "success" | "warning" | "accent" | "destructive";
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "success" | "warning" | "destructive";
  };
  trend?: {
    value: number;
    label?: string;
  };
  onClick?: () => void;
}

const iconColorClasses = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  accent: "bg-accent/10 text-accent",
  destructive: "bg-destructive/10 text-destructive",
};

const borderColorClasses = {
  primary: "border-l-primary",
  success: "border-l-success",
  warning: "border-l-warning",
  accent: "border-l-accent",
  destructive: "border-l-destructive",
};

/**
 * @description Card de estatística padronizado com borda colorida à esquerda
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "primary",
  badge,
  trend,
  onClick,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "border-l-4 transition-all hover:shadow-md",
        borderColorClasses[iconColor],
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{value}</p>
              {badge && (
                <Badge variant={badge.variant || "secondary"} className="text-xs">
                  {badge.label}
                </Badge>
              )}
            </div>
            {trend && (
              <div className="flex items-center gap-1 text-sm">
                {trend.value > 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : trend.value < 0 ? (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                ) : null}
                <span
                  className={cn(
                    "font-medium",
                    trend.value > 0 && "text-success",
                    trend.value < 0 && "text-destructive",
                    trend.value === 0 && "text-muted-foreground"
                  )}
                >
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}%
                </span>
                {trend.label && (
                  <span className="text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl backdrop-blur-sm",
              iconColorClasses[iconColor]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
