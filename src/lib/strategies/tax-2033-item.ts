/**
 * Calculadora de Impostos por Item - Multi-Regime
 * 
 * Calcula impostos sobre produtos para todos os regimes tributários:
 * - Simples Nacional (por Anexo e faixa)
 * - Lucro Presumido (PIS/COFINS cumulativo + ICMS/ISS)
 * - Lucro Real (PIS/COFINS não-cumulativo + ICMS/ISS)
 * - Reforma 2033 (IBS/CBS)
 */

// ============================================================================
// CONSTANTES
// ============================================================================

/** Alíquota padrão IBS/CBS na Reforma (CBS 8.5% + IBS 17% = 25.5%) */
export const ALIQUOTA_IBS_CBS_PADRAO = 0.255;

/** Alíquotas Simples Nacional por Anexo (usando média das faixas) */
export const SIMPLES_ALIQUOTAS = {
    I: { // Comércio
        faixas: [
            { limite: 180000, aliquota: 0.04, deducao: 0 },
            { limite: 360000, aliquota: 0.073, deducao: 5940 },
            { limite: 720000, aliquota: 0.095, deducao: 13860 },
            { limite: 1800000, aliquota: 0.107, deducao: 22500 },
            { limite: 3600000, aliquota: 0.143, deducao: 87300 },
            { limite: 4800000, aliquota: 0.19, deducao: 378000 },
        ],
        descricao: 'Comércio'
    },
    II: { // Indústria
        faixas: [
            { limite: 180000, aliquota: 0.045, deducao: 0 },
            { limite: 360000, aliquota: 0.078, deducao: 5940 },
            { limite: 720000, aliquota: 0.10, deducao: 13860 },
            { limite: 1800000, aliquota: 0.112, deducao: 22500 },
            { limite: 3600000, aliquota: 0.147, deducao: 85500 },
            { limite: 4800000, aliquota: 0.30, deducao: 720000 },
        ],
        descricao: 'Indústria'
    },
    III: { // Serviços (favorecido)
        faixas: [
            { limite: 180000, aliquota: 0.06, deducao: 0 },
            { limite: 360000, aliquota: 0.112, deducao: 9360 },
            { limite: 720000, aliquota: 0.135, deducao: 17640 },
            { limite: 1800000, aliquota: 0.16, deducao: 35640 },
            { limite: 3600000, aliquota: 0.21, deducao: 125640 },
            { limite: 4800000, aliquota: 0.33, deducao: 648000 },
        ],
        descricao: 'Serviços'
    },
    IV: { // Serviços (construção, advocacia, etc.)
        faixas: [
            { limite: 180000, aliquota: 0.045, deducao: 0 },
            { limite: 360000, aliquota: 0.09, deducao: 8100 },
            { limite: 720000, aliquota: 0.102, deducao: 12420 },
            { limite: 1800000, aliquota: 0.14, deducao: 39780 },
            { limite: 3600000, aliquota: 0.22, deducao: 183780 },
            { limite: 4800000, aliquota: 0.33, deducao: 828000 },
        ],
        descricao: 'Serviços (CPP à parte)'
    },
    V: { // Serviços (Fator R < 28%)
        faixas: [
            { limite: 180000, aliquota: 0.155, deducao: 0 },
            { limite: 360000, aliquota: 0.18, deducao: 4500 },
            { limite: 720000, aliquota: 0.195, deducao: 9900 },
            { limite: 1800000, aliquota: 0.205, deducao: 17100 },
            { limite: 3600000, aliquota: 0.23, deducao: 62100 },
            { limite: 4800000, aliquota: 0.305, deducao: 540000 },
        ],
        descricao: 'Serviços (Fator R)'
    }
};

/** Alíquotas Lucro Presumido (regime cumulativo) */
export const PRESUMIDO_ALIQUOTAS = {
    pis: 0.0065,
    cofins: 0.03,
    icms_medio: 0.18,
    iss_padrao: 0.05
};

/** Alíquotas Lucro Real (regime não-cumulativo) */
export const REAL_ALIQUOTAS = {
    pis: 0.0165,
    cofins: 0.076,
    icms_medio: 0.18,
    iss_padrao: 0.05
};

// ============================================================================
// TYPES
// ============================================================================

export interface ClassificacaoProduto {
    setor: string;
    cesta_basica: boolean;
    reducao_reforma: number; // 0 = padrão, 0.6 = 60% redução, 1 = isento
    icms_substituicao: boolean;
    anexo_simples_sugerido: 'I' | 'II' | 'III' | 'IV' | 'V';
    sugestao_economia?: string;
    motivo?: string;
}

export interface TaxResultItem {
    id: string;
    descricao: string;
    ncm: string;
    valorCompra: number;
    margemLucro: number;
    valorVenda: number;
    classificacao?: ClassificacaoProduto;
    regimes: {
        simples: {
            anexo: string;
            aliquotaNominal: number;
            aliquotaEfetiva: number;
            imposto: number;
        };
        presumido: {
            aliquotaPisCofins: number;
            aliquotaIcmsIss: number;
            imposto: number;
        };
        real: {
            aliquotaPisCofins: number;
            aliquotaIcmsIss: number;
            imposto: number;
        };
        reforma2033: {
            aliquotaPadrao: number;
            reducao: number;
            aliquotaEfetiva: number;
            imposto: number;
            classificacao: string;
        };
    };
}

export type RegimeTributario = 'simples' | 'presumido' | 'real' | 'reforma2033';

// ============================================================================
// CÁLCULOS
// ============================================================================

/**
 * Calcula alíquota efetiva do Simples Nacional
 */
export function calcularAliquotaSimplesEfetiva(
    faturamentoAnual: number,
    anexo: keyof typeof SIMPLES_ALIQUOTAS = 'I'
): { aliquotaNominal: number; aliquotaEfetiva: number } {
    const tabela = SIMPLES_ALIQUOTAS[anexo];

    let aliquotaNominal = 0;
    let deducao = 0;

    for (const faixa of tabela.faixas) {
        if (faturamentoAnual <= faixa.limite) {
            aliquotaNominal = faixa.aliquota;
            deducao = faixa.deducao;
            break;
        }
        aliquotaNominal = faixa.aliquota;
        deducao = faixa.deducao;
    }

    const aliquotaEfetiva = faturamentoAnual > 0
        ? Math.max(0, ((faturamentoAnual * aliquotaNominal) - deducao) / faturamentoAnual)
        : aliquotaNominal;

    return { aliquotaNominal, aliquotaEfetiva };
}

/**
 * Calcula imposto de um item no Simples Nacional
 */
export function calcularImpostoSimplesItem(
    valorItem: number,
    faturamentoAnual: number,
    anexo: keyof typeof SIMPLES_ALIQUOTAS = 'I'
): { anexo: string; aliquotaNominal: number; aliquotaEfetiva: number; imposto: number } {
    const { aliquotaNominal, aliquotaEfetiva } = calcularAliquotaSimplesEfetiva(faturamentoAnual, anexo);

    return {
        anexo: `Anexo ${anexo} - ${SIMPLES_ALIQUOTAS[anexo].descricao}`,
        aliquotaNominal,
        aliquotaEfetiva,
        imposto: valorItem * aliquotaEfetiva
    };
}

/**
 * Calcula imposto de um item no Lucro Presumido (cumulativo)
 */
export function calcularImpostoPresumidoItem(
    valorItem: number,
    isServico: boolean = false
): { aliquotaPisCofins: number; aliquotaIcmsIss: number; imposto: number } {
    const pisCofins = valorItem * (PRESUMIDO_ALIQUOTAS.pis + PRESUMIDO_ALIQUOTAS.cofins);
    const icmsIss = isServico
        ? valorItem * PRESUMIDO_ALIQUOTAS.iss_padrao
        : valorItem * PRESUMIDO_ALIQUOTAS.icms_medio;

    return {
        aliquotaPisCofins: PRESUMIDO_ALIQUOTAS.pis + PRESUMIDO_ALIQUOTAS.cofins,
        aliquotaIcmsIss: isServico ? PRESUMIDO_ALIQUOTAS.iss_padrao : PRESUMIDO_ALIQUOTAS.icms_medio,
        imposto: pisCofins + icmsIss
    };
}

/**
 * Calcula imposto de um item no Lucro Real (não-cumulativo)
 * Nota: Para simplificar, considera débito integral sem créditos específicos
 */
export function calcularImpostoRealItem(
    valorItem: number,
    isServico: boolean = false
): { aliquotaPisCofins: number; aliquotaIcmsIss: number; imposto: number } {
    const pisCofins = valorItem * (REAL_ALIQUOTAS.pis + REAL_ALIQUOTAS.cofins);
    const icmsIss = isServico
        ? valorItem * REAL_ALIQUOTAS.iss_padrao
        : valorItem * REAL_ALIQUOTAS.icms_medio;

    return {
        aliquotaPisCofins: REAL_ALIQUOTAS.pis + REAL_ALIQUOTAS.cofins,
        aliquotaIcmsIss: isServico ? REAL_ALIQUOTAS.iss_padrao : REAL_ALIQUOTAS.icms_medio,
        imposto: pisCofins + icmsIss
    };
}

/**
 * Calcula imposto de um item na Reforma 2033 (IBS/CBS)
 */
export function calcularImpostoReformaItem(
    valorItem: number,
    reducaoSetorial: number = 0
): { aliquotaPadrao: number; reducao: number; aliquotaEfetiva: number; imposto: number; classificacao: string } {
    const aliquotaEfetiva = ALIQUOTA_IBS_CBS_PADRAO * (1 - reducaoSetorial);

    let classificacao = 'Padrão';
    if (reducaoSetorial === 1) {
        classificacao = 'Isento (Cesta Básica)';
    } else if (reducaoSetorial >= 0.6) {
        classificacao = 'Reduzida 60%';
    } else if (reducaoSetorial > 0) {
        classificacao = `Reduzida ${(reducaoSetorial * 100).toFixed(0)}%`;
    }

    return {
        aliquotaPadrao: ALIQUOTA_IBS_CBS_PADRAO,
        reducao: reducaoSetorial,
        aliquotaEfetiva,
        imposto: valorItem * aliquotaEfetiva,
        classificacao
    };
}

/**
 * Calcula impostos de um item em todos os regimes
 */
export function calcularImpostosItem(
    id: string,
    descricao: string,
    ncm: string,
    valorCompra: number,
    faturamentoAnual: number,
    margemLucro: number = 50, // 50% padrão
    classificacao?: ClassificacaoProduto,
    isServico: boolean = false
): TaxResultItem {
    const anexo = classificacao?.anexo_simples_sugerido || 'I';
    const reducaoReforma = classificacao?.reducao_reforma || 0;

    // Cálculo do Preço de Venda
    const valorVenda = valorCompra * (1 + (margemLucro / 100));

    return {
        id,
        descricao,
        ncm,
        valorCompra,
        margemLucro,
        valorVenda,
        classificacao,
        regimes: {
            simples: calcularImpostoSimplesItem(valorVenda, faturamentoAnual, anexo),
            presumido: calcularImpostoPresumidoItem(valorVenda, isServico),
            real: calcularImpostoRealItem(valorVenda, isServico),
            reforma2033: calcularImpostoReformaItem(valorVenda, reducaoReforma)
        }
    };
}

/**
 * Calcula totais de uma lista de itens para um regime específico
 */
export function calcularTotaisRegime(
    itens: TaxResultItem[],
    regime: RegimeTributario
): { valorTotalVenda: number; impostoTotal: number; cargaEfetiva: number } {
    const valorTotalVenda = itens.reduce((acc, item) => acc + item.valorVenda, 0);

    const impostoTotal = itens.reduce((acc, item) => {
        switch (regime) {
            case 'simples':
                return acc + item.regimes.simples.imposto;
            case 'presumido':
                return acc + item.regimes.presumido.imposto;
            case 'real':
                return acc + item.regimes.real.imposto;
            case 'reforma2033':
                return acc + item.regimes.reforma2033.imposto;
            default:
                return acc;
        }
    }, 0);

    const cargaEfetiva = valorTotalVenda > 0 ? (impostoTotal / valorTotalVenda) * 100 : 0;

    return { valorTotalVenda, impostoTotal, cargaEfetiva };
}
