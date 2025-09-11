export type ScenarioImpact = 'positive' | 'negative' | 'neutral';

export interface Scenario {
  title: string;
  changes: string;
  impact: ScenarioImpact;
}

export interface FlagsItem {
  ncm?: string;
  reducao?: boolean;
  cesta?: boolean;
}

export interface Supplier {
  id: string;
  nome: string;
  tipo: string;
  regime: string;
  preco: number;
  ibs: number;
  cbs: number;
  is: number;
  frete: number;
  cadeia?: string[];
  flagsItem?: FlagsItem;
  isRefeicaoPronta?: boolean;
}

export interface AliquotasConfig {
  ibs: number;
  cbs: number;
  is: number;
}

export type OverridesUF = Record<string, Partial<AliquotasConfig>>;

export interface Receita {
  codigo: string;
  descricao: string;
}

export interface NcmRule {
  ncm: string;
  descricao: string;
  receita: Receita;
  aliquotas: AliquotasConfig;
  overridesUF?: OverridesUF;
}

export interface MixResultadoItem extends Supplier {
  creditavel: boolean;
  credito: number;
  custoEfetivo: number;
  ranking: number;
}

export interface MixResultado {
  itens: MixResultadoItem[];
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

export type Unit = 'un' | 'kg' | 'g' | 'l' | 'ml' | 'ton';

export interface UnitConv {
  de: Unit;
  para: Unit;
  fator: number;
}

export interface YieldConfig {
  entrada: Unit;
  saida: Unit;
  rendimento: number;
}

export interface PriceBreak {
  quantidade: number;
  preco: number;
}

export interface FreightBreak {
  quantidade: number;
  frete: number;
}

export interface ContractFornecedor {
  fornecedorId: string;
  produtoId: string;
  unidade: Unit;
  precoBase: number;
  priceBreaks?: PriceBreak[];
  freightBreaks?: FreightBreak[];
  yield?: YieldConfig;
  conversoes?: UnitConv[];
}

export interface SupplierConstraints {
  fornecedorId: string;
  minimo?: number;
  maximo?: number;
}

export interface OptimizePrefs {
  objetivo?: 'custo' | 'credito';
  maxFornecedores?: number;
  constraints?: SupplierConstraints[];
}

export interface CompareRequest {
  contratos: ContractFornecedor[];
  prefs?: OptimizePrefs;
}
