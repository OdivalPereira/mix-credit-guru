import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  value: number;
  label?: string;
  className?: string;
}

export function TrendIndicator({ value, label, className }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium",
      isPositive && "bg-success/10 text-success",
      value < 0 && "bg-destructive/10 text-destructive",
      isNeutral && "bg-muted/10 text-muted-foreground",
      className
    )}>
      <Icon className="w-4 h-4" />
      <span>{Math.abs(value)}%</span>
      {label && <span className="text-xs opacity-70">{label}</span>}
    </div>
  );
}
