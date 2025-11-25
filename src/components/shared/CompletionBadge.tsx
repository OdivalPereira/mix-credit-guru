import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CompletionBadgeProps {
  completed: number;
  total: number;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact";
}

/**
 * @description Badge visual que mostra o progresso de completude de uma seção
 */
export function CompletionBadge({
  completed,
  total,
  showPercentage = true,
  size = "md",
  variant = "default",
}: CompletionBadgeProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = completed === total && total > 0;
  const hasItems = total > 0;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1.5">
        {isComplete ? (
          <CheckCircle2
            className={cn(iconSizes[size], "text-green-600")}
            aria-label="Completo"
          />
        ) : hasItems ? (
          <Circle
            className={cn(iconSizes[size], "text-yellow-600")}
            aria-label="Incompleto"
          />
        ) : (
          <AlertCircle
            className={cn(iconSizes[size], "text-muted-foreground")}
            aria-label="Vazio"
          />
        )}
        <span className="text-sm text-muted-foreground">
          {completed}/{total}
        </span>
      </div>
    );
  }

  return (
    <Badge
      variant={isComplete ? "default" : hasItems ? "secondary" : "outline"}
      className={cn(
        "gap-1.5 font-medium",
        sizeClasses[size],
        isComplete && "bg-green-100 text-green-700 hover:bg-green-100",
        !isComplete && hasItems && "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
      )}
    >
      {isComplete ? (
        <CheckCircle2 className={iconSizes[size]} />
      ) : hasItems ? (
        <Circle className={iconSizes[size]} />
      ) : (
        <AlertCircle className={iconSizes[size]} />
      )}
      <span>
        {completed}/{total}
        {showPercentage && ` (${percentage}%)`}
      </span>
    </Badge>
  );
}
