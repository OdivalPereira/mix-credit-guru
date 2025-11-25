import { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { BookOpen } from "lucide-react";

interface GlossaryTermProps {
  term: string;
  definition: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * @description Componente que transforma texto em link interativo com definição do glossário inline
 */
export function GlossaryTerm({
  term,
  definition,
  children,
  className = "",
}: GlossaryTermProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <button
          className={`inline-flex items-center gap-1 border-b border-dotted border-primary text-primary hover:border-solid hover:bg-primary/5 transition-colors cursor-help ${className}`}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
        >
          {children}
          <BookOpen className="h-3 w-3 opacity-60" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="top">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">{term}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {definition}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// Termos pré-configurados para fácil reutilização
export const glossaryTerms = {
  ibs: {
    term: "IBS",
    definition:
      "Imposto sobre Bens e Serviços. Novo tributo que unificará ICMS (estadual) e ISS (municipal) após a reforma tributária, simplificando a tributação sobre consumo.",
  },
  cbs: {
    term: "CBS",
    definition:
      "Contribuição sobre Bens e Serviços. Tributo federal que substituirá PIS e COFINS na reforma tributária, com alíquota única e base mais ampla.",
  },
  creditoTributario: {
    term: "Crédito Tributário",
    definition:
      "Valor de imposto pago na aquisição de insumos que pode ser compensado com o imposto devido na venda. Evita a bitributação e reduz o custo efetivo da mercadoria.",
  },
  custoEfetivo: {
    term: "Custo Efetivo",
    definition:
      "Custo final da mercadoria após aplicar todos os impostos e descontar os créditos tributários aproveitáveis. É o valor real que a empresa pagará.",
  },
  regimeTributario: {
    term: "Regime Tributário",
    definition:
      "Sistema de tributação escolhido pela empresa: Lucro Real (permite créditos completos), Lucro Presumido (créditos limitados) ou Simples Nacional (sem créditos).",
  },
  ncm: {
    term: "NCM",
    definition:
      "Nomenclatura Comum do Mercosul. Código de 8 dígitos que classifica mercadorias e determina alíquotas de impostos, facilitando identificação tributária.",
  },
  aliquota: {
    term: "Alíquota",
    definition:
      "Percentual aplicado sobre a base de cálculo para determinar o valor do imposto a pagar. Varia conforme produto, estado de destino e legislação vigente.",
  },
  destinacao: {
    term: "Destinação",
    definition:
      "Finalidade da mercadoria adquirida: Revenda, Industrialização ou Uso/Consumo. Impacta diretamente na possibilidade de aproveitamento de créditos tributários.",
  },
  otimizacao: {
    term: "Otimização",
    definition:
      "Processo de encontrar a melhor combinação de fornecedores que minimize custos totais respeitando limites contratuais e restrições operacionais.",
  },
};
