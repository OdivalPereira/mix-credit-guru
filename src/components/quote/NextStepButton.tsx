import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface NextStepButtonProps {
  currentPage: "cotacao" | "impacto" | "cenarios";
}

const nextStepMap = {
  cotacao: {
    title: "Próximo Passo: Analise o Impacto",
    description: "Veja como a reforma tributária afeta seus custos",
    route: "/impacto-reforma",
    buttonLabel: "Ver Impacto da Reforma",
  },
  impacto: {
    title: "Próximo Passo: Compare Cenários",
    description: "Compare custos em diferentes marcos da reforma",
    route: "/cenarios",
    buttonLabel: "Comparar Cenários",
  },
  cenarios: {
    title: "Próximo Passo: Visualize Relatórios",
    description: "Acesse relatórios consolidados e gráficos avançados",
    route: "/relatorios",
    buttonLabel: "Ver Relatórios",
  },
};

const NextStepButtonComponent = ({ currentPage }: NextStepButtonProps) => {
  const navigate = useNavigate();
  const nextStep = nextStepMap[currentPage];

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg">{nextStep.title}</CardTitle>
        <CardDescription>{nextStep.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => navigate(nextStep.route)}
          className="w-full md:w-auto gap-2"
        >
          {nextStep.buttonLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export const NextStepButton = memo(NextStepButtonComponent);
