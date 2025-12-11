import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: "Mínimo 6 caracteres", test: (p) => p.length >= 6 },
  { label: "Letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { label: "Letra minúscula", test: (p) => /[a-z]/.test(p) },
  { label: "Número", test: (p) => /\d/.test(p) },
  { label: "Caractere especial", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

function getStrengthLevel(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: "", color: "" };

  const passedRequirements = requirements.filter((req) => req.test(password)).length;
  const percentage = (passedRequirements / requirements.length) * 100;

  if (percentage <= 20) return { level: 1, label: "Muito fraca", color: "bg-destructive" };
  if (percentage <= 40) return { level: 2, label: "Fraca", color: "bg-warning" };
  if (percentage <= 60) return { level: 3, label: "Razoável", color: "bg-warning" };
  if (percentage <= 80) return { level: 4, label: "Boa", color: "bg-success/70" };
  return { level: 5, label: "Forte", color: "bg-success" };
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => getStrengthLevel(password), [password]);
  const passedRequirements = useMemo(
    () => requirements.map((req) => ({ ...req, passed: req.test(password) })),
    [password]
  );

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Força da senha</span>
          <span className={cn(
            "text-xs font-medium",
            strength.level <= 2 ? "text-destructive" : 
            strength.level <= 3 ? "text-warning" : "text-success"
          )}>
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                level <= strength.level ? strength.color : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="grid grid-cols-2 gap-1">
        {passedRequirements.map((req) => (
          <div key={req.label} className="flex items-center gap-1.5">
            {req.passed ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={cn(
              "text-xs",
              req.passed ? "text-success" : "text-muted-foreground"
            )}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
