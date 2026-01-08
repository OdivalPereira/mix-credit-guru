/**
 * Mapper entre dados do Balancete e TaxProfile
 * 
 * Transforma os dados extraídos do balancete do SCI Sucessor
 * para o formato esperado pelo módulo de Planejamento Tributário
 */

import type { BalanceteData, CNPJData } from './types';
import type { TaxProfile, DespesasComCredito, DespesasSemCredito } from '@/types/tax-planning';

/**
 * Mapeamento de códigos de contas do balancete para categorias do TaxProfile
 * 
 * Baseado na estrutura típica do plano de contas:
 * - 2xxx = Contas de Resultado (Receitas, Custos, Despesas)
 * - 3xxx = Despesas Operacionais
 */
const MAPEAMENTO_CONTAS = {
    // Receitas
    receita_bruta: [2100, 2108, 2119, 2160], // Receita Bruta com Vendas e Serviços

    // Custos (geram crédito)
    cmv: [2780, 2798, 4243], // CMV, Compras de Mercadorias

    // Despesas que GERAM crédito
    aluguel: [3107], // Aluguel
    energia_telecom: [3115, 3123, 3301], // Água, Energia, Telefone/Internet
    servicos_pj: [3271, 4235, 6408], // Serviços de terceiros, Honorários, Consultoria
    transporte_frete: [3239], // Fretes e Carretos
    manutencao: [3247], // Manutenção
    combustiveis: [3182], // Combustíveis

    // Despesas que NÃO geram crédito
    folha_pagamento: [2950, 2968, 2984, 2992, 3000], // Salários, Pró-labore, Férias, 13º, Rescisão
    encargos: [3026, 3034, 3042], // INSS, FGTS
    despesas_financeiras: [3433, 3476, 3484, 3492, 5576], // Juros, Descontos, IOF, Despesas Bancárias
    tributos: [3514, 3522, 3530], // Impostos, IOF
};

/**
 * Encontra o valor de uma conta no balancete pela lista de códigos possíveis
 */
function findContaValor(contas: BalanceteData['contas'], codigos: number[]): number {
    for (const codigo of codigos) {
        const conta = contas.find(c => c.codigo === codigo);
        if (conta && conta.media !== 0) {
            return Math.abs(conta.media);
        }
    }
    return 0;
}

/**
 * Soma valores de múltiplas contas
 */
function sumContasValores(contas: BalanceteData['contas'], codigos: number[]): number {
    let total = 0;
    for (const codigo of codigos) {
        const conta = contas.find(c => c.codigo === codigo);
        if (conta) {
            total += Math.abs(conta.media);
        }
    }
    return total;
}

/**
 * Converte dados do Balancete para formato TaxProfile
 */
export function balanceteToTaxProfile(
    balancete: BalanceteData,
    cnpjData?: CNPJData
): Partial<TaxProfile> {
    const { contas, resumoDRE } = balancete;

    // Usar resumoDRE se disponível, senão calcular das contas
    const receitaBruta = resumoDRE.receitaBruta ||
        findContaValor(contas, MAPEAMENTO_CONTAS.receita_bruta);

    // Despesas que geram crédito (média mensal)
    const despesas_com_credito: DespesasComCredito = {
        cmv: resumoDRE.cmv || findContaValor(contas, MAPEAMENTO_CONTAS.cmv),
        aluguel: findContaValor(contas, MAPEAMENTO_CONTAS.aluguel),
        energia_telecom: sumContasValores(contas, MAPEAMENTO_CONTAS.energia_telecom),
        servicos_pj: sumContasValores(contas, MAPEAMENTO_CONTAS.servicos_pj),
        outros_insumos: findContaValor(contas, MAPEAMENTO_CONTAS.combustiveis),
        transporte_frete: findContaValor(contas, MAPEAMENTO_CONTAS.transporte_frete),
        manutencao: findContaValor(contas, MAPEAMENTO_CONTAS.manutencao),
        tarifas_bancarias: 0, // Geralmente não tem conta específica no balancete
    };

    // Despesas que NÃO geram crédito (média mensal)
    const despesas_sem_credito: DespesasSemCredito = {
        folha_pagamento: sumContasValores(contas, MAPEAMENTO_CONTAS.folha_pagamento),
        pro_labore: 0, // Já incluso na folha se não separado
        despesas_financeiras: sumContasValores(contas, MAPEAMENTO_CONTAS.despesas_financeiras),
        tributos: sumContasValores(contas, MAPEAMENTO_CONTAS.tributos),
        uso_pessoal: 0,
        outras: resumoDRE.despesasOperacionais -
            sumContasValores(contas, [...MAPEAMENTO_CONTAS.folha_pagamento, ...MAPEAMENTO_CONTAS.encargos]),
    };

    // Corrige valores negativos
    if (despesas_sem_credito.outras < 0) {
        despesas_sem_credito.outras = 0;
    }

    // Monta o perfil
    const profile: Partial<TaxProfile> = {
        faturamento_mensal: receitaBruta,
        faturamento_anual: receitaBruta * 12,
        despesas_com_credito,
        despesas_sem_credito,
        lucro_liquido: resumoDRE.resultadoOperacional,
    };

    // Adiciona dados do CNPJ se disponível
    if (cnpjData) {
        profile.razao_social = cnpjData.razaoSocial;
        profile.cnpj = cnpjData.cnpj;
        profile.cnae_principal = cnpjData.cnaePrincipal.codigo;
        profile.uf = cnpjData.endereco.uf;
        profile.municipio = cnpjData.endereco.municipio;
    }

    return profile;
}

/**
 * Salva o TaxProfile no localStorage para ser carregado pelo Planejamento Tributário
 */
export function saveProfileToLocalStorage(profile: Partial<TaxProfile>): void {
    const existingProfile = localStorage.getItem('tax_profile');
    const merged = existingProfile
        ? { ...JSON.parse(existingProfile), ...profile }
        : profile;

    localStorage.setItem('tax_profile', JSON.stringify(merged));
    localStorage.setItem('tax_profile_updated_at', new Date().toISOString());
}

/**
 * Carrega o TaxProfile do localStorage
 */
export function loadProfileFromLocalStorage(): Partial<TaxProfile> | null {
    const saved = localStorage.getItem('tax_profile');
    return saved ? JSON.parse(saved) : null;
}

/**
 * Limpa o TaxProfile do localStorage
 */
export function clearProfileFromLocalStorage(): void {
    localStorage.removeItem('tax_profile');
    localStorage.removeItem('tax_profile_updated_at');
}
