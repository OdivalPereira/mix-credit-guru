import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
}

export function KPICard({ title, value, change, changeType = "neutral", icon: Icon, gradient, iconColor }: KPICardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden border-border/50 backdrop-blur-sm",
      "hover:shadow-elegant transition-all duration-300 hover:scale-[1.02]",
      gradient
    )}>
      {/* Glow effect */}
      <div className="absolute inset-0 opacity-20 blur-3xl" style={{ background: iconColor }} />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-3 rounded-xl",
            "shadow-lg backdrop-blur-sm"
          )} style={{ backgroundColor: `${iconColor}20`, color: iconColor }}>
            <Icon className="w-6 h-6" />
          </div>
          
          {change && (
            <div className={cn(
              "px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm",
              changeType === "positive" && "bg-success/20 text-success border border-success/30",
              changeType === "negative" && "bg-destructive/20 text-destructive border border-destructive/30",
              changeType === "neutral" && "bg-muted/20 text-muted-foreground border border-border"
            )}>
              {change}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
        </div>
      </div>
    </Card>
  );
}
