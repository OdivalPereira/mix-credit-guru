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

export type SupplierTipo = "industria" | "distribuidor" | "produtor" | "atacado" | "varejo";

export type SupplierRegime = "normal" | "simples" | "presumido";

export interface SupplierContato {
  nome?: string;
  email?: string;
  telefone?: string;
}

export interface ProdutoComponente {
  id: string;
  produtoId: string;
  quantidade: number;
  unidade?: Unit;
  observacao?: string;
}

export interface Produto {
  id: string;
  descricao: string;
  ncm: string;
  unidadePadrao: Unit;
  categoria?: string;
  cest?: string;
  codigoInterno?: string;
  ativo: boolean;
  flags: {
    refeicao: boolean;
    cesta: boolean;
    reducao: boolean;
    is: boolean;
  };
  componentes?: ProdutoComponente[];
}

export interface Supplier {
  id: string;
  nome: string;
  cnpj?: string;
  tipo: SupplierTipo;
  regime: SupplierRegime;
  uf: string;
  municipio?: string;
  contato?: SupplierContato;
  ativo: boolean;
  produtoId?: string;
  produtoDescricao?: string;
  unidadeNegociada?: Unit;
  pedidoMinimo?: number;
  prazoEntregaDias?: number;
  prazoPagamentoDias?: number;
  preco: number;
  ibs: number;
  cbs: number;
  is: number;
  frete: number;
  cadeia?: string[];
  flagsItem?: FlagsItem;
  isRefeicaoPronta?: boolean;
  explanation?: string;
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

export interface VigenciaRegra {
  inicio?: string;
  fim?: string;
}

export type DestinoTipo = "A" | "B" | "C" | "D" | "E";

export interface NcmRule {
  ncm: string;
  descricao: string;
  receita: Receita;
  aliquotas: AliquotasConfig;
  overridesUF?: OverridesUF;
  vigencia?: VigenciaRegra;
  prioridade?: number;
}

export interface MixResultadoItem extends Supplier {
  creditavel: boolean;
  credito: number;
  custoEfetivo: number;
  ranking: number;
  custoNormalizado?: number;
  degrauAplicado?: string;
  restricoes?: string[];
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
  produtoId?: string;
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
  id: string;
  supplierId?: string;
  produtoId: string;
  unidade: Unit;
  precoBase: number;
  priceBreaks?: PriceBreak[];
  freightBreaks?: FreightBreak[];
  yield?: YieldConfig;
  conversoes?: UnitConv[];
  /**
   * @deprecated Mantido apenas para migrar dados antigos que armazenavam o ID do contrato em `fornecedorId`.
   */
  fornecedorId?: string;
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

export interface TaxRule {
  id: string;
  ncm: string;
  uf: string;
  date_start: string;
  date_end: string | null;
  aliquota_ibs: number;
  aliquota_cbs: number;
  aliquota_is: number;
  explanation_md: string | null;
  legal_reference?: string | null;
  last_verified_at?: string | null;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}
