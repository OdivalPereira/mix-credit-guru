export type ScenarioImpact = 'positive' | 'negative' | 'neutral';

export interface Scenario {
  title: string;
  changes: string;
  impact: ScenarioImpact;
}

export interface Supplier {
  id: number;
  nome: string;
  tipo: string;
  regime: string;
  preco: number;
  ibs: number;
  cbs: number;
  is: number;
  frete: number;
  creditavel: boolean;
  credito: number;
  custoEfetivo: number;
  ranking: number;
}

export type CreditStatus = 'yes' | 'no' | 'limited';

export interface CreditDetail {
  credito: string;
  status: CreditStatus;
}

export interface CreditMatrixRow {
  destino: string;
  regimeNormal: CreditDetail;
  simples: CreditDetail;
  presumido: CreditDetail;
}

export interface TaxTerm {
  term: string;
  definition: string;
}

export interface QuoteFormParams {
  data: string;
  uf: string;
  destino: string;
  regime: string;
  produto: string;
}
