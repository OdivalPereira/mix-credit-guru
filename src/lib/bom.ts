import type { Supplier, MixResultadoItem } from "@/types/domain";
import { computeRates } from "./rates";
import { computeCredit } from "./credit";
import { computeEffectiveCost } from "./calcs";

export interface RecipeItem {
  id: string;
  suppliers: Supplier[];
}

interface RecipeContext {
  destino: string;
  regime: string;
  scenario: string;
  data: string | Date;
  uf: string;
  municipio?: string;
}

/**
 * Para cada item de receita, seleciona o fornecedor com menor custo efetivo
 * considerando aliquotas, creditos e frete.
 */
export function computeRecipeMix(
  items: RecipeItem[],
  ctx: RecipeContext
): MixResultadoItem[] {
  return items.map((item) => {
    let best: MixResultadoItem | null = null;

    for (const supplier of item.suppliers) {
      const rates = computeRates(ctx.scenario, ctx.data, {
        uf: ctx.uf,
        municipio: ctx.municipio,
        itemId: supplier.id,
        flagsItem: supplier.flagsItem,
      });
      const credit = computeCredit(
        ctx.destino,
        ctx.regime,
        supplier.preco,
        rates.ibs,
        rates.cbs,
        {
          scenario: ctx.scenario,
          isRefeicaoPronta: supplier.isRefeicaoPronta,
        }
      );

      const custoEfetivo = computeEffectiveCost(
        supplier.preco,
        supplier.frete,
        rates,
        credit.credito
      );

      const result: MixResultadoItem = {
        ...supplier,
        ibs: rates.ibs,
        cbs: rates.cbs,
        is: rates.is,
        creditavel: credit.creditavel,
        credito: credit.credito,
        custoEfetivo,
        ranking: 1,
      };

      if (!best || result.custoEfetivo < best.custoEfetivo) {
        best = result;
      }
    }

    // `best` nunca deve ser null porque cada item da receita possui ao menos um fornecedor.
    return best as MixResultadoItem;
  });
}

