import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { HelpCircle } from "lucide-react";

interface FieldTooltipProps {
  title: string;
  description: string;
  example?: string;
}

/**
 * @description Tooltip contextual para explicar campos técnicos
 */
export function FieldTooltip({ title, description, example }: FieldTooltipProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label={`Ajuda sobre ${title}`}
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
          {example && (
            <div className="mt-2 rounded-md bg-muted p-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Exemplo:</span> {example}
              </p>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
