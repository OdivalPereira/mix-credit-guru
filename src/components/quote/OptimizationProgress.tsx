import { memo } from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface OptimizationProgressProps {
  progress: number;
  message: string | null;
}

const OptimizationProgressComponent = ({ progress, message }: OptimizationProgressProps) => {
  return (
    <div className="mb-4 space-y-3 rounded-md border border-dashed p-4">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div>
          <p className="text-sm font-medium">Otimizando cotação</p>
          <p className="text-xs text-muted-foreground">
            {message ??
              "Estamos analisando as melhores combinações. Isso pode levar alguns segundos."}
          </p>
        </div>
      </div>
      <Progress value={progress} aria-label="Progresso da otimização" />
    </div>
  );
};

export const OptimizationProgress = memo(OptimizationProgressComponent);
