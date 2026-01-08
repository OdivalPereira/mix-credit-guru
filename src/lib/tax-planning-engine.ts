/**
 * Tax Planning Engine
 * Motor de cálculo para análise de regimes tributários
 * 
 * Este módulo realiza cálculos 100% locais (sem API) para:
 * - Simples Nacional (Anexos I-V com Fator R)
 * - Lucro Presumido
 * - Lucro Real
 * - Cenários pós-Reforma Tributária
 */

import taxRules from '@/data/tax-planning-rules.json';
import cnaeDatabase from '@/data/cnae-database.json';

// ============================================================================
// TYPES
// ============================================================================

export interface CompanyData {
  razao_social?: string;
  cnpj?: string;
  cnae_principal: string;
  cnaes_secundarios?: string[];
  faturamento_anual: number;
  folha_pagamento_anual: number;
  numero_funcionarios?: number;
  despesas_operacionais?: number;
  despesas_dedutiveis?: number;
  lucro_liquido?: number;
  uf?: string;
  municipio?: string;
  tipo_atividade?: 'comercio' | 'industria' | 'servicos' | 'misto';
  ano_referencia?: number;
}

export interface SimplesResult {
  elegivel: boolean;
  motivo_inelegibilidade?: string;
  anexo: string;
  anexo_nome: string;
  fator_r: number;
  fator_r_aplicado: boolean;
  aliquota_nominal: number;
  aliquota_efetiva: number;
  imposto_anual: number;
  detalhamento: {
    irpj: number;
    csll: number;
    cofins: number;
    pis: number;
    cpp: number;
    icms_iss: number;
    ipi?: number;
  };
  cpp_separado?: number;
  observacoes: string[];
}

export interface PresumidoResult {
  elegivel: boolean;
  motivo_inelegibilidade?: string;
  base_presuncao_irpj: number;
  base_presuncao_csll: number;
  base_calculo_irpj: number;
  base_calculo_csll: number;
  irpj: number;
  irpj_adicional: number;
  csll: number;
  pis: number;
  cofins: number;
  imposto_anual: number;
  aliquota_efetiva: number;
  observacoes: string[];
}

export interface RealResult {
  elegivel: boolean;
  lucro_tributavel: number;
  irpj: number;
  irpj_adicional: number;
  csll: number;
  pis_cofins_bruto: number;
  creditos_pis_cofins: number;
  pis_cofins_liquido: number;
  imposto_anual: number;
  aliquota_efetiva: number;
  observacoes: string[];
}

export interface ReformaTimelineYear {
  ano: number;
  cbs: number;
  ibs: number;
  ibs_cbs_total: number;
  tributos_atuais: number;
  tributos_atuais_reduzidos: number;
  total: number;
  fase: string;
}

export interface ReformaResult {
  timeline: ReformaTimelineYear[];
  aliquota_plena: number;
  reducao_setorial?: number;
  setor?: string;
  imposto_2033: number;
  variacao_vs_atual: number;
  variacao_percentual: number;
  observacoes: string[];
}

export interface ComparisonResult {
  simples_nacional: SimplesResult;
  lucro_presumido: PresumidoResult;
  lucro_real: RealResult;
  pos_reforma: ReformaResult;
  regime_mais_vantajoso: string;
  economia_anual: number;
  economia_percentual: number;
}

export interface CnaeInfo {
  descricao: string;
  anexo_simples: string | null;
  anexo_fator_r: string | null;
  fator_r_minimo: number | null;
  presuncao_irpj: number;
  presuncao_csll: number;
  tipo_atividade: string;
  setor: string;
  permite_simples: boolean;
  permite_mei: boolean;
  reducao_reforma?: number;
  observacoes: string[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Busca informações de um CNAE na base de dados local
 */
export function getCnaeInfo(cnae: string): CnaeInfo | null {
  const cnaeData = (cnaeDatabase as any).cnaes[cnae];
  
  if (!cnaeData) {
    return null;
  }

  return {
    descricao: cnaeData.descricao,
    anexo_simples: cnaeData.simples?.anexo_padrao || null,
    anexo_fator_r: cnaeData.simples?.anexo_fator_r || null,
    fator_r_minimo: cnaeData.simples?.fator_r_minimo || null,
    presuncao_irpj: cnaeData.lucro_presumido?.presuncao_irpj || 0.32,
    presuncao_csll: cnaeData.lucro_presumido?.presuncao_csll || 0.32,
    tipo_atividade: cnaeData.tipo_atividade || 'servicos',
    setor: cnaeData.setor || 'outros',
    permite_simples: cnaeData.simples?.permitido !== false,
    permite_mei: cnaeData.mei?.permitido === true,
    reducao_reforma: cnaeData.reforma_tributaria?.reducao_aliquota,
    observacoes: cnaeData.observacoes || []
  };
}

/**
 * Calcula o Fator R (folha / receita bruta últimos 12 meses)
 */
export function calcularFatorR(folha: number, receita: number): number {
  if (receita <= 0) return 0;
  return folha / receita;
}

/**
 * Determina o anexo do Simples Nacional considerando Fator R
 */
export function determinarAnexo(
  anexoPadrao: string,
  anexoFatorR: string | null,
  fatorR: number,
  fatorRMinimo: number | null
): { anexo: string; fatorRAplicado: boolean } {
  // Se não tem regra de Fator R ou anexo destino, usa o padrão
  if (!anexoFatorR || fatorRMinimo === null) {
    return { anexo: anexoPadrao, fatorRAplicado: false };
  }

  // Se Fator R >= limite, migra para anexo mais vantajoso
  if (fatorR >= fatorRMinimo) {
    return { anexo: anexoFatorR, fatorRAplicado: true };
  }

  return { anexo: anexoPadrao, fatorRAplicado: false };
}

/**
 * Calcula alíquota efetiva do Simples Nacional
 * Fórmula: [(RBT12 × Aliq) - PD] / RBT12
 */
export function calcularAliquotaEfetivaSN(
  receitaBruta12Meses: number,
  anexo: string
): { aliquotaNominal: number; aliquotaEfetiva: number; faixa: number } {
  const anexoData = (taxRules as any).simples_nacional.anexos[anexo];
  
  if (!anexoData) {
    throw new Error(`Anexo ${anexo} não encontrado`);
  }

  const faixas = anexoData.faixas;
  let faixaEncontrada = faixas[faixas.length - 1]; // Default: última faixa
  let faixaIndex = faixas.length;

  for (let i = 0; i < faixas.length; i++) {
    if (receitaBruta12Meses <= faixas[i].limite) {
      faixaEncontrada = faixas[i];
      faixaIndex = i + 1;
      break;
    }
  }

  const aliquotaNominal = faixaEncontrada.aliquota;
  const deducao = faixaEncontrada.deducao;
  
  // Alíquota Efetiva = [(RBT12 × Aliq) - PD] / RBT12
  const aliquotaEfetiva = ((receitaBruta12Meses * aliquotaNominal) - deducao) / receitaBruta12Meses;

  return {
    aliquotaNominal,
    aliquotaEfetiva: Math.max(0, aliquotaEfetiva),
    faixa: faixaIndex
  };
}

// ============================================================================
// MAIN CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calcula Simples Nacional
 */
export function calculateSimplesNacional(data: CompanyData): SimplesResult {
  const cnaeInfo = getCnaeInfo(data.cnae_principal);
  const observacoes: string[] = [];

  // Verificar elegibilidade
  const limiteSN = (taxRules as any).simples_nacional.limite_faturamento_anual;
  
  if (data.faturamento_anual > limiteSN) {
    return {
      elegivel: false,
      motivo_inelegibilidade: `Faturamento (${formatCurrency(data.faturamento_anual)}) excede limite do Simples Nacional (${formatCurrency(limiteSN)})`,
      anexo: '',
      anexo_nome: '',
      fator_r: 0,
      fator_r_aplicado: false,
      aliquota_nominal: 0,
      aliquota_efetiva: 0,
      imposto_anual: 0,
      detalhamento: { irpj: 0, csll: 0, cofins: 0, pis: 0, cpp: 0, icms_iss: 0 },
      observacoes: []
    };
  }

  if (cnaeInfo && !cnaeInfo.permite_simples) {
    return {
      elegivel: false,
      motivo_inelegibilidade: `CNAE ${data.cnae_principal} não é permitido no Simples Nacional`,
      anexo: '',
      anexo_nome: '',
      fator_r: 0,
      fator_r_aplicado: false,
      aliquota_nominal: 0,
      aliquota_efetiva: 0,
      imposto_anual: 0,
      detalhamento: { irpj: 0, csll: 0, cofins: 0, pis: 0, cpp: 0, icms_iss: 0 },
      observacoes: []
    };
  }

  // Determinar anexo
  const anexoPadrao = cnaeInfo?.anexo_simples || 'III';
  const anexoFatorR = cnaeInfo?.anexo_fator_r || null;
  const fatorRMinimo = cnaeInfo?.fator_r_minimo || null;
  
  const fatorR = calcularFatorR(data.folha_pagamento_anual, data.faturamento_anual);
  const { anexo, fatorRAplicado } = determinarAnexo(anexoPadrao, anexoFatorR, fatorR, fatorRMinimo);

  if (fatorRAplicado) {
    observacoes.push(`Fator R (${(fatorR * 100).toFixed(1)}%) >= ${((fatorRMinimo || 0) * 100).toFixed(0)}%: tributação pelo Anexo ${anexo}`);
  }

  // Calcular alíquota efetiva
  const { aliquotaNominal, aliquotaEfetiva } = calcularAliquotaEfetivaSN(
    data.faturamento_anual,
    anexo
  );

  // Calcular imposto
  const impostoAnual = data.faturamento_anual * aliquotaEfetiva;

  // Distribuição dos tributos
  const anexoData = (taxRules as any).simples_nacional.anexos[anexo];
  const distrib = anexoData.distribuicao_tributos;

  const baseDistrib = impostoAnual;
  const detalhamento = {
    irpj: baseDistrib * (distrib.irpj || 0),
    csll: baseDistrib * (distrib.csll || 0),
    cofins: baseDistrib * (distrib.cofins || 0),
    pis: baseDistrib * (distrib.pis || 0),
    cpp: baseDistrib * (distrib.cpp || 0),
    icms_iss: baseDistrib * ((distrib.icms || 0) + (distrib.iss || 0)),
    ipi: baseDistrib * (distrib.ipi || 0)
  };

  // Verificar CPP separado (Anexo IV)
  let cppSeparado: number | undefined;
  if (anexoData.cpp_separado) {
    cppSeparado = data.folha_pagamento_anual * anexoData.cpp_aliquota;
    observacoes.push(`Anexo IV: CPP (${(anexoData.cpp_aliquota * 100).toFixed(0)}%) sobre folha = ${formatCurrency(cppSeparado)} deve ser recolhido via GPS`);
  }

  return {
    elegivel: true,
    anexo,
    anexo_nome: anexoData.nome,
    fator_r: fatorR,
    fator_r_aplicado: fatorRAplicado,
    aliquota_nominal: aliquotaNominal,
    aliquota_efetiva: aliquotaEfetiva,
    imposto_anual: impostoAnual + (cppSeparado || 0),
    detalhamento,
    cpp_separado: cppSeparado,
    observacoes
  };
}

/**
 * Calcula Lucro Presumido
 */
export function calculateLucroPresumido(data: CompanyData): PresumidoResult {
  const cnaeInfo = getCnaeInfo(data.cnae_principal);
  const observacoes: string[] = [];
  
  // Verificar elegibilidade
  const limiteLP = (taxRules as any).lucro_presumido.limite_faturamento_anual;
  
  if (data.faturamento_anual > limiteLP) {
    return {
      elegivel: false,
      motivo_inelegibilidade: `Faturamento excede limite do Lucro Presumido (${formatCurrency(limiteLP)})`,
      base_presuncao_irpj: 0,
      base_presuncao_csll: 0,
      base_calculo_irpj: 0,
      base_calculo_csll: 0,
      irpj: 0,
      irpj_adicional: 0,
      csll: 0,
      pis: 0,
      cofins: 0,
      imposto_anual: 0,
      aliquota_efetiva: 0,
      observacoes: []
    };
  }

  // Determinar presunção baseado no tipo de atividade
  const tipoAtividade = cnaeInfo?.tipo_atividade || data.tipo_atividade || 'servicos';
  const presuncaoConfig = (taxRules as any).lucro_presumido.presuncao;
  
  let presuncaoIRPJ: number;
  let presuncaoCSLL: number;

  if (cnaeInfo) {
    presuncaoIRPJ = cnaeInfo.presuncao_irpj;
    presuncaoCSLL = cnaeInfo.presuncao_csll;
  } else {
    const config = presuncaoConfig[tipoAtividade] || presuncaoConfig.servicos;
    presuncaoIRPJ = config.irpj;
    presuncaoCSLL = config.csll;
  }

  // Calcular bases
  const baseCalculoIRPJ = data.faturamento_anual * presuncaoIRPJ;
  const baseCalculoCSLL = data.faturamento_anual * presuncaoCSLL;

  // Calcular IRPJ
  const aliqIRPJ = (taxRules as any).lucro_presumido.aliquotas.irpj;
  const irpjNormal = baseCalculoIRPJ * aliqIRPJ.normal;
  
  // IRPJ Adicional (10% sobre lucro que exceder R$ 20k/mês = R$ 240k/ano)
  const baseAdicional = aliqIRPJ.base_adicional_anual;
  const irpjAdicional = baseCalculoIRPJ > baseAdicional 
    ? (baseCalculoIRPJ - baseAdicional) * aliqIRPJ.adicional 
    : 0;

  const irpjTotal = irpjNormal + irpjAdicional;

  // Calcular CSLL
  const csll = baseCalculoCSLL * (taxRules as any).lucro_presumido.aliquotas.csll;

  // Calcular PIS/COFINS (cumulativo no LP)
  const pis = data.faturamento_anual * (taxRules as any).lucro_presumido.aliquotas.pis.aliquota;
  const cofins = data.faturamento_anual * (taxRules as any).lucro_presumido.aliquotas.cofins.aliquota;

  const impostoAnual = irpjTotal + csll + pis + cofins;
  const aliquotaEfetiva = impostoAnual / data.faturamento_anual;

  if (presuncaoIRPJ < 0.32) {
    observacoes.push(`Presunção reduzida (${(presuncaoIRPJ * 100).toFixed(0)}%) aplicada para ${tipoAtividade}`);
  }

  if (irpjAdicional > 0) {
    observacoes.push(`IRPJ adicional de 10% sobre ${formatCurrency(baseCalculoIRPJ - baseAdicional)}`);
  }

  return {
    elegivel: true,
    base_presuncao_irpj: presuncaoIRPJ,
    base_presuncao_csll: presuncaoCSLL,
    base_calculo_irpj: baseCalculoIRPJ,
    base_calculo_csll: baseCalculoCSLL,
    irpj: irpjNormal,
    irpj_adicional: irpjAdicional,
    csll,
    pis,
    cofins,
    imposto_anual: impostoAnual,
    aliquota_efetiva: aliquotaEfetiva,
    observacoes
  };
}

/**
 * Calcula Lucro Real
 */
export function calculateLucroReal(data: CompanyData): RealResult {
  const observacoes: string[] = [];
  
  // Estimar lucro tributável se não fornecido
  const despesasDedutiveis = data.despesas_dedutiveis || 
    (data.despesas_operacionais || data.faturamento_anual * 0.6);
  
  const lucroTributavel = data.lucro_liquido || 
    (data.faturamento_anual - despesasDedutiveis);

  // IRPJ
  const aliqIRPJ = (taxRules as any).lucro_real.aliquotas.irpj;
  const irpjNormal = Math.max(0, lucroTributavel) * aliqIRPJ.normal;
  
  const baseAdicional = aliqIRPJ.base_adicional_anual;
  const irpjAdicional = lucroTributavel > baseAdicional 
    ? (lucroTributavel - baseAdicional) * aliqIRPJ.adicional 
    : 0;

  // CSLL
  const csll = Math.max(0, lucroTributavel) * (taxRules as any).lucro_real.aliquotas.csll;

  // PIS/COFINS (não-cumulativo com créditos)
  const aliqPisCofins = (taxRules as any).lucro_real.aliquotas;
  const pisBruto = data.faturamento_anual * aliqPisCofins.pis.aliquota;
  const cofinsBruto = data.faturamento_anual * aliqPisCofins.cofins.aliquota;
  const pisCofinsbruto = pisBruto + cofinsBruto;

  // Estimar créditos (baseado em despesas típicas)
  // Créditos típicos: 30-50% das despesas operacionais são creditáveis
  const despesasCreditaveis = despesasDedutiveis * 0.35;
  const creditosPisCofins = despesasCreditaveis * (aliqPisCofins.pis.aliquota + aliqPisCofins.cofins.aliquota);
  
  const pisCofinsLiquido = Math.max(0, pisCofinsbruto - creditosPisCofins);

  const impostoAnual = irpjNormal + irpjAdicional + csll + pisCofinsLiquido;
  const aliquotaEfetiva = impostoAnual / data.faturamento_anual;

  observacoes.push(`Lucro tributável estimado: ${formatCurrency(lucroTributavel)}`);
  observacoes.push(`Créditos PIS/COFINS estimados: ${formatCurrency(creditosPisCofins)}`);

  if (lucroTributavel < 0) {
    observacoes.push('Prejuízo fiscal pode ser compensado em até 30% do lucro dos períodos seguintes');
  }

  return {
    elegivel: true,
    lucro_tributavel: lucroTributavel,
    irpj: irpjNormal,
    irpj_adicional: irpjAdicional,
    csll,
    pis_cofins_bruto: pisCofinsbruto,
    creditos_pis_cofins: creditosPisCofins,
    pis_cofins_liquido: pisCofinsLiquido,
    imposto_anual: impostoAnual,
    aliquota_efetiva: aliquotaEfetiva,
    observacoes
  };
}

/**
 * Calcula projeção pós-Reforma Tributária
 */
export function calculatePosReforma(
  data: CompanyData, 
  impostoAtualAnual: number
): ReformaResult {
  const cnaeInfo = getCnaeInfo(data.cnae_principal);
  const observacoes: string[] = [];
  
  // Verificar se setor tem redução
  const reducaoSetorial = cnaeInfo?.reducao_reforma || 0;
  const setor = cnaeInfo?.setor;

  if (reducaoSetorial > 0) {
    observacoes.push(`Setor ${setor} tem redução de ${(reducaoSetorial * 100).toFixed(0)}% na alíquota IBS/CBS`);
  }

  const transicao = (taxRules as any).reforma_tributaria.transicao;
  const aliquotaPlena = (taxRules as any).reforma_tributaria.aliquotas_plenas_2033;
  
  const aliquotaTotalPlena = (aliquotaPlena.cbs_federal + aliquotaPlena.ibs_estadual_municipal) * (1 - reducaoSetorial);

  const timeline: ReformaTimelineYear[] = [];
  
  for (const [ano, config] of Object.entries(transicao)) {
    const anoNum = parseInt(ano);
    const cfg = config as any;
    
    // IBS/CBS proporcional ao faturamento
    const ibsCbs = data.faturamento_anual * (cfg.cbs + cfg.ibs) * (1 - reducaoSetorial);
    
    // Tributos atuais reduzidos progressivamente
    const tributosAtuais = impostoAtualAnual;
    const tributosAtuaisReduzidos = tributosAtuais * (1 - cfg.reducao_tributos_atuais);
    
    timeline.push({
      ano: anoNum,
      cbs: cfg.cbs,
      ibs: cfg.ibs,
      ibs_cbs_total: ibsCbs,
      tributos_atuais: tributosAtuais,
      tributos_atuais_reduzidos: tributosAtuaisReduzidos,
      total: ibsCbs + tributosAtuaisReduzidos,
      fase: cfg.fase
    });
  }

  // Imposto em 2033 (regime pleno)
  const imposto2033 = data.faturamento_anual * aliquotaTotalPlena;
  
  const variacaoVsAtual = imposto2033 - impostoAtualAnual;
  const variacaoPercentual = impostoAtualAnual > 0 
    ? (variacaoVsAtual / impostoAtualAnual) * 100 
    : 0;

  if (variacaoVsAtual > 0) {
    observacoes.push(`Aumento de ${formatCurrency(variacaoVsAtual)} (+${variacaoPercentual.toFixed(1)}%) até 2033`);
  } else {
    observacoes.push(`Redução de ${formatCurrency(Math.abs(variacaoVsAtual))} (${variacaoPercentual.toFixed(1)}%) até 2033`);
  }

  return {
    timeline,
    aliquota_plena: aliquotaTotalPlena,
    reducao_setorial: reducaoSetorial,
    setor,
    imposto_2033: imposto2033,
    variacao_vs_atual: variacaoVsAtual,
    variacao_percentual: variacaoPercentual,
    observacoes
  };
}

/**
 * Compara todos os regimes e retorna análise completa
 */
export function compareRegimes(data: CompanyData): ComparisonResult {
  const simples = calculateSimplesNacional(data);
  const presumido = calculateLucroPresumido(data);
  const real = calculateLucroReal(data);

  // Determinar menor imposto entre os regimes atuais elegíveis
  const regimesElegiveis: { nome: string; imposto: number }[] = [];
  
  if (simples.elegivel) {
    regimesElegiveis.push({ nome: 'simples_nacional', imposto: simples.imposto_anual });
  }
  if (presumido.elegivel) {
    regimesElegiveis.push({ nome: 'lucro_presumido', imposto: presumido.imposto_anual });
  }
  regimesElegiveis.push({ nome: 'lucro_real', imposto: real.imposto_anual });

  // Ordenar por menor imposto
  regimesElegiveis.sort((a, b) => a.imposto - b.imposto);
  
  const regimeMaisVantajoso = regimesElegiveis[0].nome;
  const menorImposto = regimesElegiveis[0].imposto;
  
  // Calcular economia vs segundo melhor
  const segundoMelhor = regimesElegiveis.length > 1 ? regimesElegiveis[1].imposto : menorImposto;
  const economiaAnual = segundoMelhor - menorImposto;
  const economiaPercentual = segundoMelhor > 0 ? (economiaAnual / segundoMelhor) * 100 : 0;

  // Calcular reforma com base no regime atual
  const impostoAtual = presumido.elegivel ? presumido.imposto_anual : real.imposto_anual;
  const reforma = calculatePosReforma(data, impostoAtual);

  return {
    simples_nacional: simples,
    lucro_presumido: presumido,
    lucro_real: real,
    pos_reforma: reforma,
    regime_mais_vantajoso: regimeMaisVantajoso,
    economia_anual: economiaAnual,
    economia_percentual: economiaPercentual
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata nome do regime para exibição
 */
export function formatRegimeName(regime: string): string {
  const names: Record<string, string> = {
    'simples_nacional': 'Simples Nacional',
    'lucro_presumido': 'Lucro Presumido',
    'lucro_real': 'Lucro Real'
  };
  return names[regime] || regime;
}

/**
 * Retorna cor para o regime (para gráficos)
 */
export function getRegimeColor(regime: string): string {
  const colors: Record<string, string> = {
    'simples_nacional': '#22c55e', // green
    'lucro_presumido': '#3b82f6', // blue
    'lucro_real': '#a855f7', // purple
    'pos_reforma': '#f97316' // orange
  };
  return colors[regime] || '#6b7280';
}
