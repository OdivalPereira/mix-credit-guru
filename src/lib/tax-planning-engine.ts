/**
 * Tax Planning Engine v2
 * 
 * Motor de cálculo para análise de regimes tributários
 * com suporte a NÃO-CUMULATIVIDADE PLENA da Reforma Tributária.
 * 
 * Conceito-chave:
 * - Modelo Atual (Presumido/Simples): Imposto sobre faturamento bruto
 * - Modelo Reforma (IBS/CBS): Imposto sobre VALOR ADICIONADO
 *   Débito - Crédito = Imposto a Pagar
 */

import type {
  TaxProfile,
  TaxScenarioResult,
  TaxComparisonResult,
  TaxInsight,
  DetalheImpostos,
  ChartDataComparison,
  ChartDataCreditos,
  ChartDataTimeline
} from '@/types/tax-planning';
import taxRulesRaw from '@/data/tax-planning-rules.json';
import cnaeDatabaseRaw from '@/data/cnae-database.json';
import type { CnaeDatabase, CnaeInfo } from '@/types/cnae';
import type { TaxRules } from '@/types/tax-rules';

const cnaeDatabase = cnaeDatabaseRaw as unknown as CnaeDatabase;
const taxRules = taxRulesRaw as unknown as TaxRules;

// ============================================================================
// CONSTANTES DA REFORMA TRIBUTÁRIA
// ============================================================================

/** Alíquota padrão IBS/CBS (CBS 8.5% + IBS 17% = 25.5%) */
export const ALIQUOTA_IBS_CBS_PADRAO = 0.255;

/** Alíquota CBS federal */
const ALIQUOTA_CBS = 0.085;

/** Alíquota IBS estadual/municipal */
const ALIQUOTA_IBS = 0.17;

/** Timeline de transição da reforma */
const TRANSICAO_REFORMA = {
  2026: { cbs: 0.009, ibs: 0.00, reducao: 0.00 },
  2027: { cbs: 0.009, ibs: 0.01, reducao: 0.10 },
  2028: { cbs: 0.018, ibs: 0.02, reducao: 0.20 },
  2029: { cbs: 0.027, ibs: 0.04, reducao: 0.30 },
  2030: { cbs: 0.036, ibs: 0.06, reducao: 0.40 },
  2031: { cbs: 0.054, ibs: 0.10, reducao: 0.60 },
  2032: { cbs: 0.072, ibs: 0.14, reducao: 0.80 },
  2033: { cbs: 0.085, ibs: 0.17, reducao: 1.00 }
};

/** Redução por setor (reforma) */
const REDUCAO_SETORIAL: Record<string, number> = {
  saude: 0.60,
  educacao: 0.60,
  transporte_publico: 0.60,
  agropecuaria: 0.60,
  cultura: 0.60
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calcula o total de despesas que geram crédito (anualizado)
 */
function calcularTotalDespesasComCredito(perfil: TaxProfile): number {
  const d = perfil.despesas_com_credito;
  return (
    (d.cmv || 0) +
    (d.aluguel || 0) +
    (d.energia_telecom || 0) +
    (d.servicos_pj || 0) +
    (d.outros_insumos || 0) +
    (d.transporte_frete || 0) +
    (d.manutencao || 0) +
    (d.tarifas_bancarias || 0)
  ) * 12; // Anualizar se valores mensais
}

/**
 * Calcula o total de despesas sem crédito (anualizado)
 */
function calcularTotalDespesasSemCredito(perfil: TaxProfile): number {
  const d = perfil.despesas_sem_credito;
  return (
    (d.folha_pagamento || 0) +
    (d.pro_labore || 0) +
    (d.despesas_financeiras || 0) +
    (d.tributos || 0) +
    (d.uso_pessoal || 0) +
    (d.outras || 0)
  ) * 12;
}

/**
 * Busca informações do CNAE
 */
function getCnaeInfo(cnae: string): CnaeInfo | null {
  const cnaes = cnaeDatabase.cnaes;
  return cnaes[cnae] || null;
}

/**
 * Determina se é atividade de serviços (presunção 32%) ou comércio/indústria (presunção 8%)
 */
function isServicoAltoPresuncao(cnae: string): boolean {
  const info = getCnaeInfo(cnae);
  if (info) {
    return info.lucro_presumido?.presuncao_irpj === 0.32;
  }
  // Default: se CNAE começa com 6 ou 7, provavelmente é serviço
  return cnae.startsWith('6') || cnae.startsWith('7') || cnae.startsWith('8');
}

/**
 * Obtém redução setorial para a reforma
 */
export function getReducaoSetorial(cnae: string): number {
  const info = getCnaeInfo(cnae);
  if (info?.reforma_tributaria?.reducao_aliquota) {
    return info.reforma_tributaria.reducao_aliquota;
  }

  // Verificar por setor
  const setor = info?.setor || '';
  return REDUCAO_SETORIAL[setor] || 0;
}

// ============================================================================
// CÁLCULO: SIMPLES NACIONAL
// ============================================================================

export function calcularSimplesNacional(perfil: TaxProfile): TaxScenarioResult {
  const limiteSN = 4800000;
  const sublimiteSN = 3600000; // Sublimite para ICMS/ISS na maioria dos estados
  const faturamentoAnual = perfil.faturamento_anual || perfil.faturamento_mensal * 12;

  // Verificar elegibilidade
  if (faturamentoAnual > limiteSN) {
    return {
      nome: 'Simples Nacional',
      codigo: 'simples',
      elegivel: false,
      motivo_inelegibilidade: `Faturamento (R$ ${faturamentoAnual.toLocaleString('pt-BR')}) excede limite de R$ 4.8 milhões`,
      imposto_bruto_anual: 0,
      creditos_aproveitados: 0,
      imposto_liquido_anual: 0,
      carga_efetiva_percentual: 0,
      detalhes: { consumo: 0, irpj: 0, csll: 0, iss_icms: 0 },
      pros: [],
      contras: [],
      observacoes: []
    };
  }

  const cnaeInfo = getCnaeInfo(perfil.cnae_principal);
  const isServico = isServicoAltoPresuncao(perfil.cnae_principal);

  // Determinar anexo e calcular Fator R
  const folhaAnual = (perfil.despesas_sem_credito.folha_pagamento + perfil.despesas_sem_credito.pro_labore) * 12;
  const fatorR = faturamentoAnual > 0 ? folhaAnual / faturamentoAnual : 0;

  const anexo = cnaeInfo?.simples?.anexo_padrao || 'III';
  let anexoAplicado = anexo;

  if (anexo === 'V' && fatorR >= 0.28 && cnaeInfo?.simples?.anexo_fator_r) {
    anexoAplicado = cnaeInfo.simples.anexo_fator_r;
  }

  // Calcular alíquota efetiva (Federal)
  const anexoData = taxRules.simples_nacional.anexos[anexoAplicado];
  let aliquotaNominal = 0;
  let deducao = 0;
  for (const faixa of anexoData?.faixas || []) {
    if (faturamentoAnual <= faixa.limite) {
      aliquotaNominal = faixa.aliquota;
      deducao = faixa.deducao;
      break;
    }
    aliquotaNominal = faixa.aliquota;
    deducao = faixa.deducao;
  }

  const aliquotaEfetiva = faturamentoAnual > 0 ? ((faturamentoAnual * aliquotaNominal) - deducao) / faturamentoAnual : 0;

  // Lógica de Sublimite (Híbrido)
  const isHibrido = faturamentoAnual > sublimiteSN;
  let impostoSimples = faturamentoAnual * aliquotaEfetiva;
  let impostoExtra = 0;
  let creditosExtra = 0;
  let icmsDebitoHibrido = 0;

  if (isHibrido) {
    // Se ultrapassa sublimite, remove ICMS/ISS da alíquota do Simples e calcula por fora
    // Aproximadamente 33% da alíquota do Simples é ICMS/ISS
    const percIcmsIssNoSimples = 0.33;
    impostoSimples = impostoSimples * (1 - percIcmsIssNoSimples);

    // Cálculo por fora (Não-Cumulativo para ICMS, por exemplo)
    if (!isServico) {
      icmsDebitoHibrido = faturamentoAnual * 0.18;
      const icmsCredito = (perfil.despesas_com_credito.cmv * 12) * 0.12;
      impostoExtra = Math.max(0, icmsDebitoHibrido - icmsCredito);
      creditosExtra = icmsCredito;
    } else {
      impostoExtra = faturamentoAnual * 0.05; // ISS cheio
    }
  }

  const impostoTotal = impostoSimples + impostoExtra;
  // Imposto bruto = Simples federal + débito estadual/municipal (antes de créditos)
  const impostoBruto = impostoSimples + (isHibrido && !isServico ? icmsDebitoHibrido : impostoExtra);

  return {
    nome: isHibrido ? 'Simples Nacional (Híbrido)' : 'Simples Nacional',
    codigo: 'simples',
    elegivel: true,
    imposto_bruto_anual: impostoBruto,
    creditos_aproveitados: creditosExtra,
    imposto_liquido_anual: impostoTotal,
    carga_efetiva_percentual: (impostoTotal / faturamentoAnual) * 100,
    detalhes: {
      consumo: impostoSimples * 0.4 + impostoExtra,
      irpj: impostoSimples * 0.15,
      csll: impostoSimples * 0.10,
      iss_icms: isHibrido ? impostoExtra : impostoSimples * 0.33
    },
    pros: [
      isHibrido ? 'Permite manter tributação federal reduzida' : 'Guia única (DAS) e menor burocracia',
      isHibrido ? `Aproveitamento de R$ ${creditosExtra.toLocaleString('pt-BR')} em créditos de ICMS (Regime Híbrido)` : '',
    ].filter(Boolean),
    contras: [
      isHibrido ? 'Complexidade: ICMS/ISS calculados e pagos em guias separadas' : 'Sem aproveitamento de créditos de PIS/COFINS',
      fatorR < 0.28 && anexo === 'V' ? 'Fator R baixo mantém no Anexo V' : ''
    ].filter(Boolean),
    observacoes: [
      isHibrido ? `Ultrapassou sublimite de R$ 3.6M (ICMS/ISS por fora)` : `Faturamento dentro do sublimite`,
      `Alíquota Efetiva SN: ${(aliquotaEfetiva * 100).toFixed(2)}%`,
      isHibrido && !isServico ? `ICMS Débito: R$ ${icmsDebitoHibrido.toLocaleString('pt-BR')} | Crédito: R$ ${creditosExtra.toLocaleString('pt-BR')}` : ''
    ].filter(Boolean)
  };
}

// ============================================================================
// CÁLCULO: LUCRO PRESUMIDO
// ============================================================================

export function calcularLucroPresumido(perfil: TaxProfile): TaxScenarioResult {
  const limiteLP = 78000000;
  const faturamentoAnual = perfil.faturamento_anual || perfil.faturamento_mensal * 12;

  if (faturamentoAnual > limiteLP) {
    return {
      nome: 'Lucro Presumido',
      codigo: 'presumido',
      elegivel: false,
      motivo_inelegibilidade: `Faturamento excede limite de R$ 78 milhões`,
      imposto_bruto_anual: 0,
      creditos_aproveitados: 0,
      imposto_liquido_anual: 0,
      carga_efetiva_percentual: 0,
      detalhes: { consumo: 0, irpj: 0, csll: 0, iss_icms: 0 },
      pros: [],
      contras: [],
      observacoes: []
    };
  }

  // Determinar percentuais de presunção
  const isServico = isServicoAltoPresuncao(perfil.cnae_principal);
  const presuncaoIRPJ = isServico ? 0.32 : 0.08;
  const presuncaoCSLL = isServico ? 0.32 : 0.12;

  // Base de cálculo
  const baseIRPJ = faturamentoAnual * presuncaoIRPJ;
  const baseCSLL = faturamentoAnual * presuncaoCSLL;

  // IRPJ: 15% + 10% adicional sobre excedente de R$ 240k/ano
  const irpjNormal = baseIRPJ * 0.15;
  const irpjAdicional = baseIRPJ > 240000 ? (baseIRPJ - 240000) * 0.10 : 0;
  const irpjTotal = irpjNormal + irpjAdicional;

  // CSLL: 9%
  const csll = baseCSLL * 0.09;

  // PIS/COFINS Cumulativo: 0.65% + 3% = 3.65%
  const pisCofins = faturamentoAnual * 0.0365;

  // ISS (serviços): média 5%
  const iss = isServico ? faturamentoAnual * 0.05 : 0;

  // ICMS: Diferente de PIS/COFINS, no Lucro Presumido o ICMS é geralmente NÃO-CUMULATIVO
  // Débito estimado (média 18%) e crédito sobre entradas (CMV)
  const icmsDebito = !isServico ? faturamentoAnual * 0.18 : 0;
  const icmsCredito = !isServico ? (perfil.despesas_com_credito.cmv * 12) * 0.12 : 0; // Crédito médio sobre compras
  const icmsLiquido = Math.max(0, icmsDebito - icmsCredito);

  // Total
  const impostoBruto = irpjTotal + csll + pisCofins + iss + icmsDebito;
  const impostoLiquido = irpjTotal + csll + pisCofins + iss + icmsLiquido;

  return {
    nome: 'Lucro Presumido',
    codigo: 'presumido',
    elegivel: true,
    imposto_bruto_anual: impostoBruto,
    creditos_aproveitados: icmsCredito, // Agora mostra créditos de ICMS
    imposto_liquido_anual: impostoLiquido,
    carga_efetiva_percentual: (impostoLiquido / faturamentoAnual) * 100,
    detalhes: {
      consumo: pisCofins + icmsLiquido,
      irpj: irpjTotal,
      csll: csll,
      iss_icms: iss + icmsLiquido
    },
    pros: [
      'Simplicidade de apuração federal',
      'Previsibilidade da carga tributária',
      !isServico ? `Aproveitamento de R$ ${icmsCredito.toLocaleString('pt-BR')} em créditos de ICMS` : '',
      !isServico ? 'Presunção de 8% favorável para comércio/indústria' : ''
    ].filter(Boolean),
    contras: [
      'SEM CRÉDITO de PIS/COFINS (regime cumulativo)',
      'Paga imposto mesmo com prejuízo real',
      isServico ? 'Presunção de 32% desfavorável para serviços' : '',
      'Aluguel e energia NÃO geram crédito de PIS/COFINS neste regime'
    ].filter(Boolean),
    observacoes: [
      `Presunção IRPJ: ${(presuncaoIRPJ * 100).toFixed(0)}%`,
      `ICMS Não-Cumulativo habilitado para este cálculo`,
      `PIS/COFINS Cumulativo: 3.65% s/ faturamento`
    ]
  };
}

// ============================================================================
// CÁLCULO: LUCRO REAL
// ============================================================================

export function calcularLucroReal(perfil: TaxProfile): TaxScenarioResult {
  const faturamentoAnual = perfil.faturamento_anual || perfil.faturamento_mensal * 12;
  const isServico = isServicoAltoPresuncao(perfil.cnae_principal);

  // Calcular despesas
  const despesasComCredito = calcularTotalDespesasComCredito(perfil);
  const despesasSemCredito = calcularTotalDespesasSemCredito(perfil);
  const despesasTotal = despesasComCredito + despesasSemCredito;

  // Lucro tributável
  const lucroContabil = perfil.lucro_liquido || (faturamentoAnual - despesasTotal);
  const adicoes = perfil.adicoes_lalur || 0;
  const exclusoes = perfil.exclusoes_lalur || 0;
  const lucroTributavel = Math.max(0, lucroContabil + adicoes - exclusoes);

  // IRPJ e CSLL sobre lucro real
  const irpjNormal = lucroTributavel * 0.15;
  const irpjAdicional = lucroTributavel > 240000 ? (lucroTributavel - 240000) * 0.10 : 0;
  const irpjTotal = irpjNormal + irpjAdicional;
  const csll = lucroTributavel * 0.09;

  // PIS/COFINS Não-Cumulativo
  // Débito: 1.65% + 7.6% = 9.25%
  const pisCofinsDebito = faturamentoAnual * 0.0925;
  // Crédito sobre despesas elegíveis (CMV, aluguel, energia, serviços, insumos)
  const pisCofinsCredito = despesasComCredito * 0.0925;
  const pisCofinsLiquido = Math.max(0, pisCofinsDebito - pisCofinsCredito);

  // ICMS (Não-Cumulativo) para comércio/indústria
  const icmsDebito = !isServico ? faturamentoAnual * 0.18 : 0;
  const icmsCredito = !isServico ? (perfil.despesas_com_credito.cmv * 12) * 0.12 : 0;
  const icmsLiquido = Math.max(0, icmsDebito - icmsCredito);

  // ISS para serviços
  const iss = isServico ? faturamentoAnual * 0.05 : 0;

  // Totais
  const impostoBruto = irpjTotal + csll + pisCofinsDebito + icmsDebito + iss;
  const totalCreditos = pisCofinsCredito + icmsCredito;
  const impostoLiquido = irpjTotal + csll + pisCofinsLiquido + icmsLiquido + iss;

  return {
    nome: 'Lucro Real',
    codigo: 'real',
    elegivel: true,
    imposto_bruto_anual: impostoBruto,
    creditos_aproveitados: totalCreditos, // PIS/COFINS + ICMS
    imposto_liquido_anual: impostoLiquido,
    carga_efetiva_percentual: faturamentoAnual > 0 ? (impostoLiquido / faturamentoAnual) * 100 : 0,
    detalhes: {
      consumo: pisCofinsLiquido + icmsLiquido,
      irpj: irpjTotal,
      csll: csll,
      iss_icms: iss + icmsLiquido
    },
    pros: [
      `Crédito de PIS/COFINS de R$ ${pisCofinsCredito.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      !isServico ? `Crédito de ICMS de R$ ${icmsCredito.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '',
      'Imposto sobre lucro real (paga menos se tiver prejuízo)',
      'Pode compensar prejuízos fiscais acumulados (até 30%)',
      'Aluguel, energia e CMV geram crédito de PIS/COFINS'
    ].filter(Boolean),
    contras: [
      'Maior complexidade contábil (ECD, ECF, LALUR)',
      'Necessita contabilidade completa e auditável',
      'Risco de glosas fiscais se documentação inadequada'
    ],
    observacoes: [
      `Lucro tributável: R$ ${lucroTributavel.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      `Base de crédito PIS/COFINS: R$ ${despesasComCredito.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      !isServico ? `Base de crédito ICMS (CMV): R$ ${(perfil.despesas_com_credito.cmv * 12).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : ''
    ].filter(Boolean)
  };
}

// ============================================================================
// CÁLCULO: REFORMA TRIBUTÁRIA (IBS/CBS)
// ============================================================================

export function calcularReforma(
  perfil: TaxProfile,
  ano: 2027 | 2033 = 2033
): TaxScenarioResult {
  const faturamentoAnual = perfil.faturamento_anual || perfil.faturamento_mensal * 12;

  // Despesas que geram crédito
  const despesasComCredito = calcularTotalDespesasComCredito(perfil);
  const despesasSemCredito = calcularTotalDespesasSemCredito(perfil);

  // Alíquota aplicável (considerando redução setorial)
  const reducaoSetorial = getReducaoSetorial(perfil.cnae_principal);
  const aliquotaEfetiva = ano === 2033
    ? ALIQUOTA_IBS_CBS_PADRAO * (1 - reducaoSetorial)
    : (TRANSICAO_REFORMA[ano].cbs + TRANSICAO_REFORMA[ano].ibs) * (1 - reducaoSetorial);

  // 1. DÉBITO (imposto sobre vendas)
  const debitoIbsCbs = faturamentoAnual * aliquotaEfetiva;

  // 2. CRÉDITO (recuperação sobre compras/despesas)
  // Na reforma, compra de Simples geram crédito reduzido (~7% vs 26.5%)
  const percSimples = (perfil.percentual_fornecedores_simples || 0) / 100;
  const percRegular = 1 - percSimples;
  const ratioSimples = 0.07 / ALIQUOTA_IBS_CBS_PADRAO; // ~27% do crédito cheio

  // Crédito ponderado: (Despesas * %Regular * AliqCheia) + (Despesas * %Simples * AliqCheia * Ratio)
  const fatorPonderacao = (percRegular * 1.0) + (percSimples * ratioSimples);

  const creditoIbsCbs = despesasComCredito * aliquotaEfetiva * fatorPonderacao;

  // 3. Imposto a pagar líquido
  const ibsCbsLiquido = Math.max(0, debitoIbsCbs - creditoIbsCbs);

  // IRPJ e CSLL continuam existindo (sobre lucro)
  const lucroEstimado = faturamentoAnual - despesasComCredito - despesasSemCredito;
  const isServico = isServicoAltoPresuncao(perfil.cnae_principal);
  const baseIR = isServico ? 0.32 : 0.08;
  const lucroTributavel = Math.max(0, lucroEstimado);

  const irpjNormal = lucroTributavel * 0.15;
  const irpjAdicional = lucroTributavel > 240000 ? (lucroTributavel - 240000) * 0.10 : 0;
  const csll = lucroTributavel * 0.09;

  const impostoBruto = debitoIbsCbs + irpjNormal + irpjAdicional + csll;
  const impostoLiquido = ibsCbsLiquido + irpjNormal + irpjAdicional + csll;

  const fase = ano === 2033 ? 'Regime Pleno' : 'Transição';

  return {
    nome: ano === 2033 ? 'Pós-Reforma (2033)' : `Transição Reforma (${ano})`,
    codigo: ano === 2033 ? 'reforma_2033' : 'reforma_2027',
    elegivel: true,
    imposto_bruto_anual: impostoBruto,
    creditos_aproveitados: creditoIbsCbs,
    imposto_liquido_anual: impostoLiquido,
    carga_efetiva_percentual: faturamentoAnual > 0 ? (impostoLiquido / faturamentoAnual) * 100 : 0,
    detalhes: {
      consumo: ibsCbsLiquido,
      irpj: irpjNormal + irpjAdicional,
      csll: csll,
      iss_icms: 0 // Extintos
    },
    pros: [
      `CRÉDITO INTEGRAL sobre aluguel: R$ ${((perfil.despesas_com_credito.aluguel || 0) * 12 * aliquotaEfetiva).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      `CRÉDITO INTEGRAL sobre energia: R$ ${((perfil.despesas_com_credito.energia_telecom || 0) * 12 * aliquotaEfetiva).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      `CRÉDITO sobre CMV: R$ ${((perfil.despesas_com_credito.cmv || 0) * 12 * aliquotaEfetiva).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      'Não-cumulatividade plena sobre TODAS as despesas com nota',
      'Fim da guerra fiscal (ICMS/ISS unificados)',
      reducaoSetorial > 0 ? `Setor beneficiado com redução de ${(reducaoSetorial * 100).toFixed(0)}%` : ''
    ].filter(Boolean),
    contras: [
      `Alíquota nominal alta: ${(aliquotaEfetiva * 100).toFixed(1)}%`,
      `Folha de pagamento (R$ ${despesasSemCredito.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}) NÃO gera crédito`,
      'Split payment: imposto retido automaticamente no pagamento',
      'Necessidade de gestão de créditos (prazo de 60 dias para ressarcimento)'
    ],
    observacoes: [
      `Fase: ${fase}`,
      `Alíquota efetiva: ${(aliquotaEfetiva * 100).toFixed(1)}%`,
      `Total de créditos: R$ ${creditoIbsCbs.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
    ]
  };
}

// ============================================================================
// COMPARAÇÃO COMPLETA
// ============================================================================

export function compararTodosRegimes(perfil: TaxProfile): TaxComparisonResult {
  const simples = calcularSimplesNacional(perfil);
  const presumido = calcularLucroPresumido(perfil);
  const real = calcularLucroReal(perfil);
  const reformaTransicao = calcularReforma(perfil, 2027);
  const reformaPlena = calcularReforma(perfil, 2033);

  // Encontrar melhor atual
  const regimesAtuais = [
    simples.elegivel ? { codigo: 'simples' as const, valor: simples.imposto_liquido_anual } : null,
    presumido.elegivel ? { codigo: 'presumido' as const, valor: presumido.imposto_liquido_anual } : null,
    { codigo: 'real' as const, valor: real.imposto_liquido_anual }
  ].filter(Boolean) as { codigo: 'simples' | 'presumido' | 'real'; valor: number }[];

  regimesAtuais.sort((a, b) => a.valor - b.valor);
  const melhorAtual = regimesAtuais[0].codigo;
  const menorImpostoAtual = regimesAtuais[0].valor;
  const economiaAtual = regimesAtuais.length > 1
    ? regimesAtuais[1].valor - menorImpostoAtual
    : 0;

  // Comparar com reforma
  const regimesPosReforma = [
    ...regimesAtuais,
    { codigo: 'reforma' as const, valor: reformaPlena.imposto_liquido_anual }
  ].sort((a, b) => a.valor - b.valor);

  const melhorPosReforma = regimesPosReforma[0].codigo;
  const economiaComReforma = reformaPlena.imposto_liquido_anual < menorImpostoAtual
    ? menorImpostoAtual - reformaPlena.imposto_liquido_anual
    : 0;

  // Gerar insights
  const insights = gerarInsights(perfil, simples, presumido, real, reformaPlena, melhorAtual, menorImpostoAtual);

  return {
    perfil,
    cenarios: {
      simples: simples.elegivel ? simples : undefined,
      presumido,
      real,
      reforma_transicao: reformaTransicao,
      reforma_plena: reformaPlena
    },
    melhor_atual: melhorAtual,
    melhor_pos_reforma: melhorPosReforma,
    economia_atual: economiaAtual,
    economia_com_reforma: economiaComReforma,
    insights
  };
}

// ============================================================================
// GERAÇÃO DE INSIGHTS
// ============================================================================

function gerarInsights(
  perfil: TaxProfile,
  simples: TaxScenarioResult,
  presumido: TaxScenarioResult,
  real: TaxScenarioResult,
  reforma: TaxScenarioResult,
  melhorAtual: 'simples' | 'presumido' | 'real',
  menorImpostoAtual: number
): TaxInsight[] {
  const insights: TaxInsight[] = [];
  const faturamentoAnual = perfil.faturamento_anual || perfil.faturamento_mensal * 12;
  const despesasComCredito = calcularTotalDespesasComCredito(perfil);
  const folhaAnual = (perfil.despesas_sem_credito.folha_pagamento + perfil.despesas_sem_credito.pro_labore) * 12;

  // Insight: Alto custo intermediário favorece não-cumulatividade
  const percentualDespesasCredito = (despesasComCredito / faturamentoAnual) * 100;
  if (percentualDespesasCredito > 40) {
    insights.push({
      tipo: 'positivo',
      titulo: 'Alto custo intermediário (Opex/CMV)',
      descricao: `Suas despesas creditáveis representam ${percentualDespesasCredito.toFixed(1)}% do faturamento. O Lucro Real e a Reforma são muito benéficos.`,
      impacto_financeiro: reforma.creditos_aproveitados,
      acao_sugerida: 'Considere migrar para Lucro Real para já aproveitar créditos de PIS/COFINS'
    });
  }

  // Insight: Empresa intensiva em mão de obra
  const percentualFolha = (folhaAnual / faturamentoAnual) * 100;
  if (percentualFolha > 30) {
    insights.push({
      tipo: 'alerta',
      titulo: 'Empresa intensiva em mão de obra',
      descricao: `Folha de pagamento representa ${percentualFolha.toFixed(1)}% do faturamento. Na Reforma, folha NÃO gera crédito de IBS/CBS.`,
      impacto_financeiro: -(folhaAnual * ALIQUOTA_IBS_CBS_PADRAO * 0), // Poderia gerar crédito mas não gera
      acao_sugerida: 'Avalie terceirização de atividades-meio (serviços de PJ geram crédito)'
    });
  }

  // Insight: Aluguel significativo
  const aluguelAnual = (perfil.despesas_com_credito.aluguel || 0) * 12;
  if (aluguelAnual > faturamentoAnual * 0.05) {
    const creditoAluguel = aluguelAnual * ALIQUOTA_IBS_CBS_PADRAO;
    insights.push({
      tipo: 'positivo',
      titulo: 'Crédito integral sobre aluguel na Reforma',
      descricao: `Hoje você paga aluguel de R$ ${aluguelAnual.toLocaleString('pt-BR')}/ano SEM crédito no Presumido. Na Reforma, terá crédito de R$ ${creditoAluguel.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}.`,
      impacto_financeiro: creditoAluguel,
      acao_sugerida: 'Esse é um benefício relevante que você ganha automaticamente com a Reforma'
    });
  }

  // Insight: Comparação Reforma vs MELHOR REGIME ATUAL (dinâmico)
  const nomeRegimeAtual = melhorAtual === 'simples' ? 'Simples Nacional' : melhorAtual === 'presumido' ? 'Lucro Presumido' : 'Lucro Real';
  const diferencaReforma = reforma.imposto_liquido_anual - menorImpostoAtual;
  if (diferencaReforma > 0) {
    insights.push({
      tipo: 'negativo',
      titulo: 'Reforma pode aumentar sua carga tributária',
      descricao: `No cenário pleno (2033), você pagará R$ ${Math.abs(diferencaReforma).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} a mais do que no ${nomeRegimeAtual} atual.`,
      impacto_financeiro: -diferencaReforma,
      acao_sugerida: 'Avalie aumentar despesas com fornecedores PJ para maximizar créditos'
    });
  } else {
    insights.push({
      tipo: 'positivo',
      titulo: 'Reforma pode reduzir sua carga tributária',
      descricao: `No cenário pleno (2033), você economizará R$ ${Math.abs(diferencaReforma).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} em relação ao ${nomeRegimeAtual} atual.`,
      impacto_financeiro: -diferencaReforma,
      acao_sugerida: 'Prepare sua contabilidade para gestão de créditos desde já'
    });
  }

  // Insight: Fator R para Simples
  if (simples.elegivel) {
    const fatorR = folhaAnual / faturamentoAnual;
    if (fatorR >= 0.28) {
      insights.push({
        tipo: 'positivo',
        titulo: 'Fator R beneficia seu Simples Nacional',
        descricao: `Com Fator R de ${(fatorR * 100).toFixed(1)}%, suas atividades do Anexo V tributam pelo Anexo III (alíquotas menores).`,
        acao_sugerida: 'Mantenha a folha de pagamento acima de 28% do faturamento'
      });
    } else if (fatorR > 0.20 && fatorR < 0.28) {
      insights.push({
        tipo: 'neutro',
        titulo: 'Fator R próximo do limite',
        descricao: `Seu Fator R é ${(fatorR * 100).toFixed(1)}%. Se aumentar para 28%, migrará do Anexo V para III.`,
        acao_sugerida: 'Considere aumentar pró-labore ou contratar para atingir o limite'
      });
    }
  }

  // Insight: Saldos Credores Legados
  if (perfil.saldo_credor_pis_cofins && perfil.saldo_credor_pis_cofins > 0) {
    insights.push({
      tipo: 'positivo',
      titulo: 'Compensação de PIS/COFINS acumulado',
      descricao: `Você possui R$ ${perfil.saldo_credor_pis_cofins.toLocaleString('pt-BR')} de PIS/COFINS. Este valor poderá ser usado para abater a CBS a partir de 2027.`,
      impacto_financeiro: perfil.saldo_credor_pis_cofins,
      acao_sugerida: 'Audite e homologue esses créditos antes da entrada da CBS'
    });
  }

  if (perfil.saldo_credor_icms && perfil.saldo_credor_icms > 0) {
    const parcelaMensal = perfil.saldo_credor_icms / 240;
    insights.push({
      tipo: 'alerta',
      titulo: 'Saldo Credor de ICMS (Regra 240 meses)',
      descricao: `Seu saldo de R$ ${perfil.saldo_credor_icms.toLocaleString('pt-BR')} de ICMS só poderá ser usado em 240 parcelas mensais de R$ ${parcelaMensal.toLocaleString('pt-BR')} a partir de 2033.`,
      impacto_financeiro: perfil.saldo_credor_icms,
      acao_sugerida: 'Tente monetizar ou usar esse saldo antes de 2033 para evitar a trava de 20 anos'
    });
  }

  // Insight: Mix de Fornecedores
  if (perfil.percentual_fornecedores_simples && perfil.percentual_fornecedores_simples > 30) {
    insights.push({
      tipo: 'alerta',
      titulo: 'Alto volume de compras do Simples Nacional',
      descricao: `${perfil.percentual_fornecedores_simples}% das suas compras vêm do Simples, o que gera crédito MUITO REDUZIDO (~7% vs 26.5%). Isso encarece seu custo final na Reforma.`,
      impacto_financeiro: (calcularTotalDespesasComCredito(perfil) * perSimplesMix(perfil)) * (ALIQUOTA_IBS_CBS_PADRAO - 0.07),
      acao_sugerida: 'Negocie descontos de ~18% com fornecedores do Simples ou migre para fornecedores do Regime Normal'
    });
  }

  return insights;
}

function perSimplesMix(p: TaxProfile) { return (p.percentual_fornecedores_simples || 0) / 100; }

// ============================================================================
// DADOS PARA GRÁFICOS
// ============================================================================

export function gerarDadosGraficoComparacao(resultado: TaxComparisonResult): ChartDataComparison[] {
  const dados: ChartDataComparison[] = [];

  if (resultado.cenarios.simples) {
    dados.push({
      regime: 'Simples Nacional',
      imposto_bruto: resultado.cenarios.simples.imposto_bruto_anual,
      creditos: resultado.cenarios.simples.creditos_aproveitados,
      imposto_liquido: resultado.cenarios.simples.imposto_liquido_anual,
      cor_debito: '#ef4444',
      cor_credito: '#22c55e'
    });
  }

  dados.push({
    regime: 'Lucro Presumido',
    imposto_bruto: resultado.cenarios.presumido.imposto_bruto_anual,
    creditos: resultado.cenarios.presumido.creditos_aproveitados,
    imposto_liquido: resultado.cenarios.presumido.imposto_liquido_anual,
    cor_debito: '#ef4444',
    cor_credito: '#22c55e'
  });

  dados.push({
    regime: 'Lucro Real',
    imposto_bruto: resultado.cenarios.real.imposto_bruto_anual,
    creditos: resultado.cenarios.real.creditos_aproveitados,
    imposto_liquido: resultado.cenarios.real.imposto_liquido_anual,
    cor_debito: '#ef4444',
    cor_credito: '#22c55e'
  });

  dados.push({
    regime: 'Reforma 2033',
    imposto_bruto: resultado.cenarios.reforma_plena.imposto_bruto_anual,
    creditos: resultado.cenarios.reforma_plena.creditos_aproveitados,
    imposto_liquido: resultado.cenarios.reforma_plena.imposto_liquido_anual,
    cor_debito: '#ef4444',
    cor_credito: '#22c55e'
  });

  return dados;
}

export function gerarDadosGraficoCreditos(perfil: TaxProfile): ChartDataCreditos[] {
  const aliquota = ALIQUOTA_IBS_CBS_PADRAO;
  const dados: ChartDataCreditos[] = [];
  const d = perfil.despesas_com_credito;

  const addCategoria = (nome: string, valor: number) => {
    if (valor > 0) {
      const anual = valor * 12;
      dados.push({
        categoria: nome,
        valor_despesa: anual,
        credito_gerado: anual * aliquota,
        percentual: aliquota * 100
      });
    }
  };

  addCategoria('CMV / Insumos', d.cmv || 0);
  addCategoria('Aluguel', d.aluguel || 0);
  addCategoria('Energia / Telecom', d.energia_telecom || 0);
  addCategoria('Serviços PJ', d.servicos_pj || 0);
  addCategoria('Transporte / Frete', d.transporte_frete || 0);
  addCategoria('Manutenção', d.manutencao || 0);
  addCategoria('Tarifas Bancárias', d.tarifas_bancarias || 0);
  addCategoria('Outros Insumos', d.outros_insumos || 0);

  return dados.sort((a, b) => b.credito_gerado - a.credito_gerado);
}

export function gerarDadosTimeline(perfil: TaxProfile): ChartDataTimeline[] {
  const faturamentoAnual = perfil.faturamento_anual || perfil.faturamento_mensal * 12;
  const despesasComCredito = calcularTotalDespesasComCredito(perfil);

  // Imposto atual (presumido como base)
  const presumido = calcularLucroPresumido(perfil);
  const impostoAtual = presumido.imposto_liquido_anual;

  const timeline: ChartDataTimeline[] = [];
  const reducaoSetorial = getReducaoSetorial(perfil.cnae_principal);

  for (const [ano, config] of Object.entries(TRANSICAO_REFORMA)) {
    const anoNum = parseInt(ano);
    const aliquotaIbsCbs = (config.cbs + config.ibs) * (1 - reducaoSetorial);

    const debitoNovo = faturamentoAnual * aliquotaIbsCbs;
    const creditoNovo = despesasComCredito * aliquotaIbsCbs;
    const impostoNovo = Math.max(0, debitoNovo - creditoNovo);

    const tributoAntigoReduzido = impostoAtual * (1 - config.reducao);

    timeline.push({
      ano: anoNum,
      tributos_antigos: tributoAntigoReduzido,
      ibs_cbs: impostoNovo,
      creditos: creditoNovo,
      total_liquido: tributoAntigoReduzido + impostoNovo,
      fase: config.reducao === 1 ? 'Pleno' : 'Transição'
    });
  }

  return timeline;
}
