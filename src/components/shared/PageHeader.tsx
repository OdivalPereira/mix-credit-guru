import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  icon: LucideIcon;
  iconColor?: "primary" | "success" | "warning" | "accent" | "destructive";
  title: string;
  description?: React.ReactNode;
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "success" | "warning" | "destructive";
  };
  actions?: React.ReactNode;
}

const iconColorClasses = {
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
};

/**
 * @description Componente de cabeçalho padronizado para páginas
 */
export function PageHeader({
  icon: Icon,
  iconColor = "primary",
  title,
  description,
  badge,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl border backdrop-blur-sm transition-all",
            iconColorClasses[iconColor]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {badge && (
              <Badge variant={badge.variant || "default"}>
                {badge.label}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 self-start sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}
