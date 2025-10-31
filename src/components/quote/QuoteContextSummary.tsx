import { memo, useMemo } from "react";
import { CalendarDays, Globe2, MapPin, PackageSearch, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getMunicipiosByUF } from "@/data/locations";
import { DESTINO_LABELS, REGIME_LABELS } from "@/data/lookups";
import type { Contexto } from "@/store/useCotacaoStore";

interface QuoteContextSummaryProps {
  contexto: Contexto;
}

const getLabel = <T extends string>(value: T | undefined, map: Partial<Record<T, string>>) => {
  if (!value) {
    return undefined;
  }
  return map[value] ?? value;
};

const opportunities = [
  {
    key: "data",
    label: "Data de referencia",
    icon: CalendarDays,
    getValue: (ctx: Contexto) => ctx.data || "Nao definida",
  },
  {
    key: "uf",
    label: "UF",
    icon: Globe2,
    getValue: (ctx: Contexto) => ctx.uf?.toUpperCase() || "Nao selecionada",
  },
  {
    key: "municipio",
    label: "Municipio",
    icon: MapPin,
    getValue: (ctx: Contexto) => ctx.municipio || "Nao informado",
  },
  {
    key: "destino",
    label: "Destino",
    icon: PackageSearch,
    getValue: (ctx: Contexto) =>
      getLabel(ctx.destino, DESTINO_LABELS) ?? "Defina a finalidade",
  },
  {
    key: "regime",
    label: "Regime tributario",
    icon: ShieldCheck,
    getValue: (ctx: Contexto) =>
      getLabel(ctx.regime, REGIME_LABELS) ?? "Selecione o regime",
  },
];

const QuoteContextSummaryComponent = ({ contexto }: QuoteContextSummaryProps) => {
  const municipioNome = useMemo(() => {
    if (!contexto.uf || !contexto.municipio) {
      return undefined;
    }
    const lista = getMunicipiosByUF(contexto.uf.toUpperCase());
    return lista.find((item) => item.codigo === contexto.municipio)?.nome;
  }, [contexto.uf, contexto.municipio]);
  const items = useMemo(() => opportunities.map((item) => {
    if (item.key === "municipio") {
      return {
        ...item,
        value: municipioNome ?? "Nao informado",
      };
    }
    return {
      ...item,
      value: item.getValue(contexto),
    };
  }), [contexto, municipioNome]);

  return (
    <Card className="border-dashed bg-muted/30">
      <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-5">
        {items.map(({ key, label, value, icon: Icon }) => (
          <div key={key} className="space-y-2 rounded-md border border-border/60 bg-background/50 p-3 shadow-sm">
            <p className="text-xs font-medium uppercase text-muted-foreground tracking-wide">
              {label}
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Icon className="h-4 w-4 text-primary" aria-hidden />
              <span>{value}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
        <span>Contexto aplicado:</span>
        <Badge variant="secondary">{contexto.uf?.toUpperCase() || "UF"}</Badge>
        <Badge variant="outline">{getLabel(contexto.destino, DESTINO_LABELS) ?? "Destino"}</Badge>
        <Badge variant="outline">{getLabel(contexto.regime, REGIME_LABELS) ?? "Regime"}</Badge>
        {municipioNome ? <Badge variant="outline">{municipioNome}</Badge> : null}
      </div>
    </Card>
  );
};

export const QuoteContextSummary = memo(QuoteContextSummaryComponent);
