import { useState } from "react";
import { BookOpen, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
}

const glossaryTerms: GlossaryTerm[] = [
  {
    term: "ICMS",
    definition:
      "Imposto sobre Circulação de Mercadorias e Serviços. Tributo estadual que incide sobre a movimentação de mercadorias e alguns serviços. Com a reforma tributária, será substituído pelo IBS.",
    category: "Impostos",
  },
  {
    term: "IBS",
    definition:
      "Imposto sobre Bens e Serviços. Novo tributo que unificará ICMS (estadual) e ISS (municipal) após a reforma tributária, simplificando a tributação sobre consumo.",
    category: "Reforma Tributária",
  },
  {
    term: "CBS",
    definition:
      "Contribuição sobre Bens e Serviços. Tributo federal que substituirá PIS e COFINS na reforma tributária, com alíquota única e base mais ampla.",
    category: "Reforma Tributária",
  },
  {
    term: "Crédito Tributário",
    definition:
      "Valor de imposto pago na aquisição de insumos que pode ser compensado com o imposto devido na venda. Evita a bitributação e reduz o custo efetivo da mercadoria.",
    category: "Tributação",
  },
  {
    term: "Custo Efetivo",
    definition:
      "Custo final da mercadoria após aplicar todos os impostos e descontar os créditos tributários aproveitáveis. É o valor real que a empresa pagará.",
    category: "Custos",
  },
  {
    term: "PIS/COFINS",
    definition:
      "Contribuições sociais federais que incidem sobre a receita das empresas. PIS financia seguro-desemprego e abono salarial; COFINS financia seguridade social.",
    category: "Impostos",
  },
  {
    term: "Regime Tributário",
    definition:
      "Sistema de tributação escolhido pela empresa: Lucro Real (permite créditos completos), Lucro Presumido (créditos limitados) ou Simples Nacional (sem créditos).",
    category: "Tributação",
  },
  {
    term: "Lucro Real",
    definition:
      "Regime tributário baseado no lucro efetivamente apurado. Permite aproveitamento integral de créditos de PIS, COFINS e ICMS sobre insumos.",
    category: "Tributação",
  },
  {
    term: "Lucro Presumido",
    definition:
      "Regime tributário com base de cálculo presumida. Créditos de PIS/COFINS são limitados e não há aproveitamento completo dos tributos pagos na aquisição.",
    category: "Tributação",
  },
  {
    term: "NCM",
    definition:
      "Nomenclatura Comum do Mercosul. Código de 8 dígitos que classifica mercadorias e determina alíquotas de impostos, facilitando identificação tributária.",
    category: "Classificação",
  },
  {
    term: "Alíquota",
    definition:
      "Percentual aplicado sobre a base de cálculo para determinar o valor do imposto a pagar. Varia conforme produto, estado de destino e legislação vigente.",
    category: "Tributação",
  },
  {
    term: "Destinação",
    definition:
      "Finalidade da mercadoria adquirida: Revenda, Industrialização ou Uso/Consumo. Impacta diretamente na possibilidade de aproveitamento de créditos tributários.",
    category: "Operações",
  },
  {
    term: "Creditável",
    definition:
      "Característica de uma operação que permite o aproveitamento de créditos tributários. Depende da destinação do produto e do regime tributário do comprador.",
    category: "Tributação",
  },
  {
    term: "Split Payment",
    definition:
      "Mecanismo da reforma tributária onde o imposto é retido na fonte de pagamento, reduzindo sonegação e aumentando transparência nas transações.",
    category: "Reforma Tributária",
  },
  {
    term: "Não-Cumulatividade",
    definition:
      "Princípio que permite compensar impostos pagos em etapas anteriores da cadeia produtiva, evitando tributação em cascata e reduzindo custo final.",
    category: "Tributação",
  },
  {
    term: "Período de Transição",
    definition:
      "Fase gradual de implementação da reforma tributária (2026-2032), com convivência dos sistemas antigo e novo até substituição completa dos tributos.",
    category: "Reforma Tributária",
  },
  {
    term: "Otimização",
    definition:
      "Processo de encontrar a melhor combinação de fornecedores que minimize custos totais respeitando limites contratuais e restrições operacionais.",
    category: "Operações",
  },
  {
    term: "Violação Contratual",
    definition:
      "Situação onde a quantidade ou valor comprado ultrapassa limites estabelecidos em contrato com fornecedor, gerando alertas no sistema.",
    category: "Contratos",
  },
];

/**
 * @description Renderiza um componente de glossário com termos e definições pesquisáveis,
 * categorizados e exibidos em um painel lateral.
 * @returns O componente de glossário.
 */
export function Glossary() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTerms = glossaryTerms.filter(
    (item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const categories = Array.from(
    new Set(glossaryTerms.map((item) => item.category)),
  );

  const termsByCategory = categories.reduce(
    (acc, category) => {
      acc[category] = filteredTerms.filter((item) => item.category === category);
      return acc;
    },
    {} as Record<string, GlossaryTerm[]>,
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-background hover:bg-accent"
          aria-label="Abrir glossário"
        >
          <BookOpen className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl bg-background">
        <SheetHeader>
          <SheetTitle>Glossário Tributário</SheetTitle>
          <SheetDescription>
            Entenda os termos relacionados à reforma tributária e cotações
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar termo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9 bg-background"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ScrollArea className="h-[calc(100vh-240px)]">
            <Accordion type="multiple" className="w-full">
              {categories.map((category) => {
                const terms = termsByCategory[category];
                if (terms.length === 0) return null;

                return (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-sm font-semibold">
                      {category}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({terms.length})
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {terms.map((item) => (
                          <div
                            key={item.term}
                            className="rounded-lg border bg-card/50 p-4"
                          >
                            <h4 className="font-semibold text-foreground">
                              {item.term}
                            </h4>
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                              {item.definition}
                            </p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {filteredTerms.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  Nenhum termo encontrado para "{searchTerm}"
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
