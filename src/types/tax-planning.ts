/**
 * Tax Planning Domain Types
 * 
 * Tipos para o módulo de Planejamento Tributário v2
 * Baseado em estrutura DRE com separação de despesas que geram crédito.
 */

// ============================================================================
// PERFIL DA EMPRESA (Input Contábil)
// ============================================================================

/**
 * Despesas que GERAM CRÉDITO na Reforma Tributária (IBS/CBS)
 * Não-cumulatividade plena = crédito financeiro integral
 */
export interface DespesasComCredito {
  /** CMV - Custo da Mercadoria Vendida (matéria-prima, produtos para revenda) */
  cmv: number;
  /** Aluguel de imóveis e equipamentos */
  aluguel: number;
  /** Energia elétrica, água, gás, telecomunicações */
  energia_telecom: number;
  /** Serviços tomados de PJ (que emite nota fiscal) */
  servicos_pj: number;
  /** Outros insumos operacionais (embalagens, materiais de escritório) */
  outros_insumos: number;
  /** Transporte e frete (quando PJ) */
  transporte_frete: number;
  /** Manutenção e reparos de máquinas/equipamentos */
  manutencao: number;
  /** Tarifas bancárias (fees), taxas de cartão, de administração (GERAM CRÉDITO) */
  tarifas_bancarias: number;
}

/**
 * Despesas que NÃO GERAM CRÉDITO na Reforma Tributária
 */
export interface DespesasSemCredito {
  /** Folha de pagamento (salários, encargos, benefícios) */
  folha_pagamento: number;
  /** Pró-labore dos sócios */
  pro_labore: number;
  /** Despesas financeiras (Juros, multas, IOF - SEM CRÉDITO) */
  despesas_financeiras: number;
  /** Tributos pagos (não geram crédito sobre tributo) */
  tributos: number;
  /** Uso e consumo pessoal, brindes, alimentação */
  uso_pessoal: number;
  /** Outras despesas não creditáveis */
  outras: number;
}

/**
 * Perfil Tributário Completo da Empresa
 * Estrutura inspirada em DRE simplificada
 */
export interface TaxProfile {
  // === IDENTIFICAÇÃO ===
  razao_social?: string;
  cnpj?: string;
  cnae_principal: string;
  cnaes_secundarios?: string[];
  uf?: string;
  municipio?: string;

  // === RECEITA (DRE Linha 1) ===
  /** Receita Bruta Mensal (média) */
  faturamento_mensal: number;
  /** Receita Bruta Anual (projetada ou realizada) */
  faturamento_anual: number;
  /** Deduções da receita (devoluções, descontos incondicionais) */
  deducoes_receita?: number;

  // === CUSTOS E DESPESAS QUE GERAM CRÉDITO IBS/CBS ===
  despesas_com_credito: DespesasComCredito;

  // === CUSTOS E DESPESAS SEM CRÉDITO ===
  despesas_sem_credito: DespesasSemCredito;

  // === RESULTADO ===
  /** Lucro líquido contábil (para Lucro Real) */
  lucro_liquido?: number;
  /** Adições ao LALUR (multas, brindes, etc) */
  adicoes_lalur?: number;
  /** Exclusões do LALUR (dividendos recebidos, etc) */
  exclusoes_lalur?: number;

  // === CONTEXTO ===
  /** Regime tributário atual */
  regime_atual: 'simples' | 'presumido' | 'real' | 'mei';
  /** Número de funcionários CLT */
  numero_funcionarios?: number;
  /** Percentual de vendas para PJ (importante para reforma) */
  percentual_vendas_pj?: number;
  /** Ano de referência dos dados */
  ano_referencia?: number;

  /** Percentual de compras vindas de fornecedores do Simples Nacional (0-100) */
  percentual_fornecedores_simples?: number;
  /** Percentual das compras totais que efetivamente geram crédito de IBS/CBS (0-100) */
  percentual_compras_creditaveis?: number;

  // === SALDOS CREDORES LEGADOS ===
  /** Saldo acumulado de PIS/COFINS (para compensar com CBS a partir de 2027) */
  saldo_credor_pis_cofins?: number;
  /** Saldo acumulado de ICMS (regra dos 240 meses a partir de 2033) */
  saldo_credor_icms?: number;
}

// ============================================================================
// RESULTADOS DO CÁLCULO
// ============================================================================

/**
 * Detalhamento dos impostos por categoria
 */
export interface DetalheImpostos {
  /** Impostos sobre consumo (PIS/COFINS ou IBS/CBS) */
  consumo: number;
  /** IRPJ (15% + 10% adicional) */
  irpj: number;
  /** CSLL (9%) */
  csll: number;
  /** ISS (2-5%) ou ICMS (variável) - extintos pós-reforma */
  iss_icms: number;
  /** CPP - Contribuição Patronal (20% ou incluso Simples) */
  cpp?: number;
}

/**
 * Resultado do cálculo para um cenário específico
 */
export interface TaxScenarioResult {
  /** Nome do cenário/regime */
  nome: string;
  /** Código identificador */
  codigo: 'simples' | 'presumido' | 'real' | 'reforma_2027' | 'reforma_2033';
  /** Elegível para este regime? */
  elegivel: boolean;
  /** Motivo de inelegibilidade */
  motivo_inelegibilidade?: string;

  // === VALORES ===
  /** Imposto bruto (antes de créditos) */
  imposto_bruto_anual: number;
  /** Créditos aproveitados (só Lucro Real e Reforma) */
  creditos_aproveitados: number;
  /** Imposto líquido a pagar (após créditos) */
  imposto_liquido_anual: number;
  /** Carga tributária efetiva (% sobre faturamento) */
  carga_efetiva_percentual: number;

  // === BREAKDOWN ===
  detalhes: DetalheImpostos;

  // === ANÁLISE QUALITATIVA (preenchida pela IA) ===
  pros: string[];
  contras: string[];
  observacoes: string[];
}

/**
 * Comparação completa entre todos os cenários
 */
export interface TaxComparisonResult {
  perfil: TaxProfile;
  cenarios: {
    simples?: TaxScenarioResult;
    presumido: TaxScenarioResult;
    real: TaxScenarioResult;
    reforma_transicao: TaxScenarioResult; // 2027 (início real)
    reforma_plena: TaxScenarioResult; // 2033
  };

  // === RECOMENDAÇÃO ===
  melhor_atual: 'simples' | 'presumido' | 'real';
  melhor_pos_reforma: 'simples' | 'presumido' | 'real' | 'reforma';
  economia_atual: number;
  economia_com_reforma: number;

  // === INSIGHTS ===
  insights: TaxInsight[];
}

/**
 * Insight gerado pela análise
 */
export interface TaxInsight {
  tipo: 'positivo' | 'negativo' | 'neutro' | 'alerta';
  titulo: string;
  descricao: string;
  impacto_financeiro?: number;
  acao_sugerida?: string;
}

// ============================================================================
// DADOS PARA VISUALIZAÇÃO
// ============================================================================

/**
 * Dados para gráfico de barras empilhadas (débito vs crédito)
 */
export interface ChartDataComparison {
  regime: string;
  imposto_bruto: number;
  creditos: number;
  imposto_liquido: number;
  cor_debito: string;
  cor_credito: string;
}

/**
 * Dados para gráfico de créditos por categoria
 */
export interface ChartDataCreditos {
  categoria: string;
  valor_despesa: number;
  credito_gerado: number;
  percentual: number;
}

/**
 * Dados para timeline da reforma
 */
export interface ChartDataTimeline {
  ano: number;
  tributos_antigos: number;
  ibs_cbs: number;
  creditos: number;
  total_liquido: number;
  fase: string;
}

/**
 * Resultado da extração de dados via IA
 */
export interface AiExtractionResult {
  razao_social?: string;
  cnpj?: string;
  cnae_principal?: string;
  uf?: string;
  municipio?: string;
  faturamento_mensal?: number;
  faturamento_anual?: number;
  lucro_liquido?: number;
  despesas_com_credito?: Partial<DespesasComCredito>;
  despesas_sem_credito?: Partial<DespesasSemCredito>;
  regime_atual?: 'simples' | 'presumido' | 'real' | 'mei';
}
