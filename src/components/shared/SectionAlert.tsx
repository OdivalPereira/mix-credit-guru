import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

interface SectionAlertProps {
  type: "info" | "success" | "warning" | "error";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * @description Componente de alerta contextual para feedback visual em seções
 */
export function SectionAlert({
  type,
  title,
  description,
  action,
}: SectionAlertProps) {
  const config = {
    info: {
      icon: Info,
      className: "border-blue-200 bg-blue-50",
      iconClassName: "text-blue-600",
      titleClassName: "text-blue-900",
      descriptionClassName: "text-blue-800",
    },
    success: {
      icon: CheckCircle2,
      className: "border-green-200 bg-green-50",
      iconClassName: "text-green-600",
      titleClassName: "text-green-900",
      descriptionClassName: "text-green-800",
    },
    warning: {
      icon: AlertTriangle,
      className: "border-yellow-200 bg-yellow-50",
      iconClassName: "text-yellow-600",
      titleClassName: "text-yellow-900",
      descriptionClassName: "text-yellow-800",
    },
    error: {
      icon: XCircle,
      className: "border-red-200 bg-red-50",
      iconClassName: "text-red-600",
      titleClassName: "text-red-900",
      descriptionClassName: "text-red-800",
    },
  };

  const { icon: Icon, className, iconClassName, titleClassName, descriptionClassName } = config[type];

  return (
    <Alert className={className}>
      <Icon className={`h-4 w-4 ${iconClassName}`} />
      <AlertTitle className={titleClassName}>{title}</AlertTitle>
      <AlertDescription className={descriptionClassName}>
        {description}
        {action && (
          <Button
            variant="link"
            size="sm"
            className="mt-2 h-auto p-0"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
