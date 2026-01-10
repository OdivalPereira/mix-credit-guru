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
export function getCnaeInfo(cnae: string): CnaeInfo | null {
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
  // Sublimite para ICMS/ISS: 3.6M para a maioria dos estados, 1.8M para AC, AP, RR
  const sublimiteSN = ['AC', 'AP', 'RR'].includes(perfil.uf || '') ? 1800000 : 3600000;
  const faturamentoAnual = perfil.faturamento_anual || perfil.faturamento_mensal * 12;

  // 1. Verificação de Elegibilidade
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

  // Validar elegibilidade pelo CNAE
  if (cnaeInfo?.simples && !cnaeInfo.simples.permitido) {
    return {
      nome: 'Simples Nacional',
      codigo: 'simples',
      elegivel: false,
      motivo_inelegibilidade: `Atividade (CNAE ${perfil.cnae_principal}) impeditiva ao Simples Nacional: ${cnaeInfo.simples.motivo || 'Vedação legal'}`,
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

  // 2. Determinação do Anexo e Fator R
  const folhaAnual = (perfil.despesas_sem_credito.folha_pagamento + perfil.despesas_sem_credito.pro_labore) * 12;
  const fatorR = faturamentoAnual > 0 ? folhaAnual / faturamentoAnual : 0;

  let anexoAplicado = cnaeInfo?.simples?.anexo_padrao || (isServicoAltoPresuncao(perfil.cnae_principal) ? 'V' : 'I');
  const anexoAlternativo = cnaeInfo?.simples?.anexo_fator_r;
  const fatorRMinimo = cnaeInfo?.simples?.fator_r_minimo || 0.28;
  const sujeitoFatorR = !!anexoAlternativo;

  // Lógica do Fator R (Ex: Padrao V, se R >= 28% vai para III)
  if (sujeitoFatorR && anexoAlternativo && fatorR >= fatorRMinimo) {
    anexoAplicado = anexoAlternativo;
  }

  const anexoData = taxRules.simples_nacional.anexos[anexoAplicado];
  if (!anexoData) {
    return {
      nome: 'Simples Nacional',
      codigo: 'simples',
      elegivel: false,
      motivo_inelegibilidade: `Erro de configuração: Tabela do Anexo ${anexoAplicado} não encontrada`,
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

  // 3. Cálculo da Alíquota Efetiva
  let aliquotaNominal = 0;
  let deducao = 0;
  for (const faixa of anexoData.faixas) {
    if (faturamentoAnual <= faixa.limite) {
      aliquotaNominal = faixa.aliquota;
      deducao = faixa.deducao;
      break;
    }
    aliquotaNominal = faixa.aliquota;
    deducao = faixa.deducao;
  }

  const aliquotaEfetiva = faturamentoAnual > 0 ? Math.max(0, ((faturamentoAnual * aliquotaNominal) - deducao) / faturamentoAnual) : 0;

  // 4. Lógica de Sublimite (Simples Híbrido > 3.6M)
  const isHibrido = faturamentoAnual > sublimiteSN;
  let impostoSimplesFederal = 0;
  let impostoIcmsIssExterno = 0;
  let creditosExternos = 0;
  let icmsDebitoHibrido = 0;

  const dist = anexoData.distribuicao_tributos || { irpj: 0, csll: 0, cofins: 0, pis: 0, cpp: 0, icms: 0, iss: 0 };
  const shareIcmsIss = (dist.icms || 0) + (dist.iss || 0);
  const shareFederal = 1 - shareIcmsIss;

  if (isHibrido) {
    // Parte federal reduzida (remove ICMS/ISS da alíquota efetiva)
    const aliquotaFederal = aliquotaEfetiva * shareFederal;
    impostoSimplesFederal = faturamentoAnual * aliquotaFederal;

    const isServico = !!dist.iss;
    if (isServico) {
      const aliqIss = taxRules.iss.aliquota_maxima || 0.05;
      impostoIcmsIssExterno = faturamentoAnual * aliqIss;
    } else {
      const aliqIcms = taxRules.icms.aliquota_interna_media || 0.18;
      const aliqCredito = taxRules.icms.credito_estimado || 0.12;
      icmsDebitoHibrido = faturamentoAnual * aliqIcms;
      const icmsCredito = (perfil.despesas_com_credito.cmv * 12) * aliqCredito;
      impostoIcmsIssExterno = Math.max(0, icmsDebitoHibrido - icmsCredito);
      creditosExternos = icmsCredito;
    }
  } else {
    impostoSimplesFederal = faturamentoAnual * aliquotaEfetiva;
    impostoIcmsIssExterno = 0;
  }

  // 5. CPP Separado (Anexo IV)
  let cppSeparado = 0;
  if (anexoData.cpp_separado) {
    const aliquotaCpp = anexoData.cpp_aliquota || 0.20;
    cppSeparado = folhaAnual * aliquotaCpp;
  }

  const impostoTotalPagar = impostoSimplesFederal + impostoIcmsIssExterno + cppSeparado;

  // Breakdown para detalhes (Normalização do DAS para achar componentes)
  const totalDasBase = isHibrido ? (impostoSimplesFederal / shareFederal) : impostoSimplesFederal;

  const vConsumo = isHibrido
    ? (totalDasBase * (dist.pis + dist.cofins))
    : (impostoSimplesFederal * (dist.pis + dist.cofins));

  const vIrpj = totalDasBase * (dist.irpj || 0);
  const vCsll = totalDasBase * (dist.csll || 0);
  const vCppDas = totalDasBase * (dist.cpp || 0);
  const vIssIcms = isHibrido ? impostoIcmsIssExterno : (totalDasBase * shareIcmsIss);

  return {
    nome: isHibrido ? `Simples Nacional (Híbrido - Anexo ${anexoAplicado})` : `Simples Nacional (Anexo ${anexoAplicado})`,
    codigo: 'simples',
    elegivel: true,
    imposto_bruto_anual: impostoSimplesFederal + (isHibrido ? (icmsDebitoHibrido || impostoIcmsIssExterno) : (totalDasBase * shareIcmsIss)) + cppSeparado,
    creditos_aproveitados: creditosExternos,
    imposto_liquido_anual: impostoTotalPagar,
    carga_efetiva_percentual: (impostoTotalPagar / faturamentoAnual) * 100,
    detalhes: {
      consumo: vConsumo || 0,
      irpj: vIrpj || 0,
      csll: vCsll || 0,
      iss_icms: vIssIcms || 0,
      cpp: (vCppDas || 0) + cppSeparado
    },
    pros: [
      isHibrido ? 'Burocracia Reduzida na parte Federal' : 'Guia única (DAS) e simplicidade de gestão',
      sujeitoFatorR && fatorR >= fatorRMinimo ? `Fator R (${(fatorR * 100).toFixed(1)}%) permitiu enquadramento no Anexo ${anexoAplicado} (Menor Alíquota)` : '',
      anexoData.cpp_separado ? '' : 'CPP (INSS Patronal) já incluso na alíquota única',
      !isHibrido ? 'Isenção de cobrança de ICMS/ISS fora do DAS' : ''
    ].filter(Boolean),
    contras: [
      isHibrido ? 'Complexidade elevada: apuração de ICMS/ISS no regime normal (Débito/Crédito)' : 'Veda tomada de créditos de PIS/COFINS pelos clientes (desvantagem competitiva B2B)',
      anexoData.cpp_separado ? 'CPP (INSS Patronal) cobrada à parte (20% sobre folha) - Anexo IV' : '',
      sujeitoFatorR && fatorR < fatorRMinimo ? `Fator R baixo (${(fatorR * 100).toFixed(1)}%) forçou tributação pelo Anexo ${anexoAplicado} (Mais caro). Aumente sua folha.` : ''
    ].filter(Boolean) as string[],
    observacoes: [
      `Anexo ${anexoAplicado} | Alíquota Nominal: ${(aliquotaNominal * 100).toFixed(2)}% | Efetiva: ${(aliquotaEfetiva * 100).toFixed(2)}%`,
      `Fator R: ${(fatorR * 100).toFixed(2)}% (Folha: R$ ${folhaAnual.toLocaleString('pt-BR')})`,
      isHibrido ? `Sublimite Excedido (R$ 3.6M). ICMS/ISS recolhidos fora do DAS.` : null,
      cppSeparado > 0 ? `Adicional CPP (Anexo IV): R$ ${cppSeparado.toLocaleString('pt-BR')}` : null
    ].filter(Boolean) as string[]
  };
}

// ============================================================================
// CÁLCULO: LUCRO PRESUMIDO
// ============================================================================

export function calcularLucroPresumido(perfil: TaxProfile): TaxScenarioResult {
  const limiteLP = taxRules.lucro_presumido.limite_faturamento_anual || 78000000;
  const faturamentoAnual = perfil.faturamento_anual || perfil.faturamento_mensal * 12;

  // 1. Verificação de Elegibilidade
  if (faturamentoAnual > limiteLP) {
    return {
      nome: 'Lucro Presumido',
      codigo: 'presumido',
      elegivel: false,
      motivo_inelegibilidade: `Faturamento (R$ ${faturamentoAnual.toLocaleString('pt-BR')}) excede limite de R$ 78 milhões`,
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

  // 2. Determinação das Alíquotas de Presunção
  let presuncaoIRPJ = 0.32;
  let presuncaoCSLL = 0.32;

  if (cnaeInfo?.lucro_presumido) {
    presuncaoIRPJ = cnaeInfo.lucro_presumido.presuncao_irpj;
    presuncaoCSLL = cnaeInfo.lucro_presumido.presuncao_csll;
  } else {
    // Fallback baseado no setor ou primeiro dígito
    const isService = isServicoAltoPresuncao(perfil.cnae_principal);
    presuncaoIRPJ = isService ? 0.32 : 0.08;
    presuncaoCSLL = isService ? 0.32 : 0.12;
  }

  // 3. Cálculo de IRPJ e CSLL
  const baseIRPJ = faturamentoAnual * presuncaoIRPJ;
  const baseCSLL = faturamentoAnual * presuncaoCSLL;

  const aliqIRPJ = taxRules.lucro_presumido.aliquotas.irpj;
  const irpjNormal = baseIRPJ * aliqIRPJ.normal;

  // Adicional de IRPJ: Aplicável sobre a parcela do lucro presumido que exceder R$ 20k/mês (R$ 60k/trimestre)
  // Como estamos projetando anualizado, usamos R$ 240k/ano.
  const irpjAdicional = baseIRPJ > (aliqIRPJ.base_adicional_anual || 240000)
    ? (baseIRPJ - (aliqIRPJ.base_adicional_anual || 240000)) * aliqIRPJ.adicional
    : 0;
  const irpjTotal = irpjNormal + irpjAdicional;

  const csll = baseCSLL * taxRules.lucro_presumido.aliquotas.csll;

  // 4. PIS e COFINS (Regime Cumulativo)
  const aliqPis = taxRules.lucro_presumido.aliquotas.pis.aliquota || 0.0065;
  const aliqCofins = taxRules.lucro_presumido.aliquotas.cofins.aliquota || 0.03;
  const pis = faturamentoAnual * aliqPis;
  const cofins = faturamentoAnual * aliqCofins;
  const vConsumoFederal = pis + cofins;

  // 5. ISS e ICMS
  const isServico = presuncaoIRPJ >= 0.16; // Aproximação: transporte passageiro ou serviço
  const iss = isServico ? faturamentoAnual * (taxRules.iss.aliquota_padrao || 0.05) : 0;

  const icmsDebito = !isServico ? faturamentoAnual * (taxRules.icms.aliquota_interna_media || 0.18) : 0;
  const icmsCredito = !isServico ? (perfil.despesas_com_credito.cmv * 12) * (taxRules.icms.credito_estimado || 0.12) : 0;
  const icmsLiquido = Math.max(0, icmsDebito - icmsCredito);

  // 6. INSS Patronal (CPP) - Fora do DAS no Lucro Presumido
  const folhaAnual = (perfil.despesas_sem_credito.folha_pagamento + perfil.despesas_sem_credito.pro_labore) * 12;
  const inssConfig = taxRules.outros_tributos.inss_patronal;
  const aliqRat = inssConfig.rat?.grau_2 || 0.02; // Grau de risco médio (2%)
  const aliqTerceiros = (inssConfig.terceiros?.salario_educacao || 0.025)
    + (inssConfig.terceiros?.incra || 0.002)
    + (inssConfig.terceiros?.sesi_senai || 0.015)
    + (inssConfig.terceiros?.outras || 0.016); // Total terceiros ~5.8%
  const aliqCppTotal = (inssConfig.aliquota_padrao || 0.20) + aliqRat + aliqTerceiros;

  const cppTotal = folhaAnual * aliqCppTotal;

  // Totais
  const impostoBruto = irpjTotal + csll + vConsumoFederal + icmsDebito + iss + cppTotal;
  const impostoLiquido = irpjTotal + csll + vConsumoFederal + icmsLiquido + iss + cppTotal;

  return {
    nome: 'Lucro Presumido',
    codigo: 'presumido',
    elegivel: true,
    imposto_bruto_anual: impostoBruto,
    creditos_aproveitados: icmsCredito,
    imposto_liquido_anual: impostoLiquido,
    carga_efetiva_percentual: faturamentoAnual > 0 ? (impostoLiquido / faturamentoAnual) * 100 : 0,
    detalhes: {
      consumo: vConsumoFederal + icmsLiquido,
      irpj: irpjTotal,
      csll: csll,
      iss_icms: iss + icmsLiquido,
      cpp: cppTotal
    },
    pros: [
      'Alíquotas de PIS/COFINS reduzidas (3.65% total)',
      'Simplicidade na apuração sem necessidade de controle rigoroso de créditos federais',
      !isServico ? `Crédito de ICMS de R$ ${icmsCredito.toLocaleString('pt-BR')} (Regime Não-Cumulativo)` : 'Isento de IPI em diversas atividades de serviços',
      presuncaoIRPJ < 0.32 ? 'Presunção de lucro reduzida (8% a 16%) para o setor' : ''
    ].filter(Boolean),
    contras: [
      'Impossibilidade de creditamento de PIS/COFINS sobre insumos, aluguel e energia',
      'INSS Patronal (CPP) integral de ~28% sobre a folha (Sem desoneração)',
      'Tributação sobre margem presumida mesmo se a empresa tiver prejuízo real',
      presuncaoIRPJ === 0.32 ? 'Alta carga tributária para serviços (32% de presunção)' : ''
    ].filter(Boolean),
    observacoes: [
      `Base Presumida: IRPJ ${(presuncaoIRPJ * 100).toFixed(1)}% | CSLL ${(presuncaoCSLL * 100).toFixed(1)}%`,
      `PIS/COFINS Cumulativo: ${(aliqPis * 100).toFixed(2)}% e ${(aliqCofins * 100).toFixed(2)}%`,
      `CPP (INSS Patronal) de R$ ${cppTotal.toLocaleString('pt-BR')} inclusa no cálculo`
    ]
  };
}

// ============================================================================
// CÁLCULO: LUCRO REAL
// ============================================================================

export function calcularLucroReal(perfil: TaxProfile): TaxScenarioResult {
  const faturamentoAnual = perfil.faturamento_anual || perfil.faturamento_mensal * 12;
  const isServico = isServicoAltoPresuncao(perfil.cnae_principal);

  // 1. Calcular Lucro Fiscal (LALUR)
  const despesasComCredito = calcularTotalDespesasComCredito(perfil);
  const despesasSemCredito = calcularTotalDespesasSemCredito(perfil);
  const despesasTotal = despesasComCredito + despesasSemCredito;

  const lucroContabil = perfil.lucro_liquido || (faturamentoAnual - despesasTotal);
  const adicoes = perfil.adicoes_lalur || 0;
  const exclusoes = perfil.exclusoes_lalur || 0;
  const lucroTributavelAntesCompensacao = lucroContabil + adicoes - exclusoes;

  // Regra de compensação de prejuízo: Limite de 30% do lucro real
  // Mas aqui estamos projetando: se lucroTrib < 0, vira prejuízo acumulado não utilizado neste ano.
  const lucroReal = Math.max(0, lucroTributavelAntesCompensacao);

  // 2. IRPJ e CSLL (Lucro Real Anual)
  const aliqIRPJ = taxRules.lucro_real.aliquotas.irpj;
  const irpjNormal = lucroReal * aliqIRPJ.normal;

  // Adicional: Excedente de 240k anuais
  const irpjAdicional = lucroReal > (aliqIRPJ.base_adicional_anual || 240000)
    ? (lucroReal - (aliqIRPJ.base_adicional_anual || 240000)) * aliqIRPJ.adicional
    : 0;
  const irpjTotal = irpjNormal + irpjAdicional;

  const csll = lucroReal * taxRules.lucro_real.aliquotas.csll;

  // 3. PIS e COFINS (Não-Cumulativo)
  const aliqPis = taxRules.lucro_real.aliquotas.pis.aliquota || 0.0165;
  const aliqCofins = taxRules.lucro_real.aliquotas.cofins.aliquota || 0.076;

  const pisDebito = faturamentoAnual * aliqPis;
  const cofinsDebito = faturamentoAnual * aliqCofins;

  // Crédito PIS/COFINS: Aplica-se sobre despesas elegíveis (Insumos, energia, aluguel, etc.)
  // Assumindo que 'despesasComCredito' engloba esses conceitos conforme interface
  const pisCredito = despesasComCredito * aliqPis;
  const cofinsCredito = despesasComCredito * aliqCofins;

  const pisLiquido = Math.max(0, pisDebito - pisCredito);
  const cofinsLiquido = Math.max(0, cofinsDebito - cofinsCredito);
  const vConsumoFederal = pisLiquido + cofinsLiquido;

  // 4. ICMS e ISS
  const iss = isServico ? faturamentoAnual * (taxRules.iss.aliquota_padrao || 0.05) : 0;

  const icmsDebito = !isServico ? faturamentoAnual * (taxRules.icms.aliquota_interna_media || 0.18) : 0;
  const icmsCredito = !isServico ? (perfil.despesas_com_credito.cmv * 12) * (taxRules.icms.credito_estimado || 0.12) : 0;
  const icmsLiquido = Math.max(0, icmsDebito - icmsCredito);

  // 5. INSS Patronal (CPP) - Base Folha
  const folhaAnual = (perfil.despesas_sem_credito.folha_pagamento + perfil.despesas_sem_credito.pro_labore) * 12;
  const inssConfig = taxRules.outros_tributos.inss_patronal;
  const aliqRat = inssConfig.rat?.grau_2 || 0.02;
  const aliqTerceiros = (inssConfig.terceiros?.salario_educacao || 0.025)
    + (inssConfig.terceiros?.incra || 0.002)
    + (inssConfig.terceiros?.sesi_senai || 0.015)
    + (inssConfig.terceiros?.outras || 0.016);
  const aliqCppTotal = (inssConfig.aliquota_padrao || 0.20) + aliqRat + aliqTerceiros;

  const cppTotal = folhaAnual * aliqCppTotal;

  // Totais
  const impostoBruto = irpjTotal + csll + pisDebito + cofinsDebito + icmsDebito + iss + cppTotal;
  const totalCreditos = pisCredito + cofinsCredito + icmsCredito;
  const impostoLiquido = irpjTotal + csll + vConsumoFederal + icmsLiquido + iss + cppTotal;

  return {
    nome: 'Lucro Real',
    codigo: 'real',
    elegivel: true,
    imposto_bruto_anual: impostoBruto,
    creditos_aproveitados: totalCreditos,
    imposto_liquido_anual: impostoLiquido,
    carga_efetiva_percentual: faturamentoAnual > 0 ? (impostoLiquido / faturamentoAnual) * 100 : 0,
    detalhes: {
      consumo: vConsumoFederal + icmsLiquido,
      irpj: irpjTotal,
      csll: csll,
      iss_icms: iss + icmsLiquido,
      cpp: cppTotal
    },
    pros: [
      `Aproveitamento de R$ ${(pisCredito + cofinsCredito).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} em créditos de PIS/COFINS`,
      !isServico ? `Aproveitamento de R$ ${icmsCredito.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} em créditos de ICMS` : '',
      'Tributação justa baseada no lucro efetivo (ideal para margens baixas)',
      lucroContabil < 0 ? 'Não paga IRPJ/CSLL em caso de prejuízo (apenas consumo e folha)' : '',
      'Possibilidade de compensar prejuízos fiscais em exercícios futuros (trava de 30%)'
    ].filter(Boolean),
    contras: [
      'Alta complexidade contábil e obrigatoriedade de SPEDs detalhados',
      'Alíquotas nominais de PIS/COFINS mais altas (9.25%)',
      `Custo elevado de Folha (CPP de aprox. ${(aliqCppTotal * 100).toFixed(1)}%) sem desoneração`,
      'Risco elevado de autuação fiscal por inconsistência de créditos'
    ].filter(Boolean),
    observacoes: [
      `Lucro Real Tributável: R$ ${lucroReal.toLocaleString('pt-BR')}`,
      `PIS/COFINS Não-Cumulativo (1.65% + 7.60%)`,
      `Base de créditos PIS/COFINS: R$ ${despesasComCredito.toLocaleString('pt-BR')}`
    ]
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

  // Percentual de compras que efetivamente geram crédito (default 100%)
  const percCreditaveis = (perfil.percentual_compras_creditaveis ?? 100) / 100;

  // Crédito ponderado: (Despesas * %Regular * AliqCheia) + (Despesas * %Simples * AliqCheia * Ratio)
  // Multiplicado pelo percentual de compras que geram crédito
  const fatorPonderacao = ((percRegular * 1.0) + (percSimples * ratioSimples)) * percCreditaveis;

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
