/**
 * Tipos para os parsers de documentos contábeis
 */

// ============================================================================
// CARTÃO CNPJ
// ============================================================================

export interface CNPJData {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string;
    dataAbertura: string;
    porte: 'MEI' | 'ME' | 'EPP' | 'DEMAIS';
    naturezaJuridica: {
        codigo: string;
        descricao: string;
    };
    cnaePrincipal: {
        codigo: string;
        descricao: string;
    };
    cnaesSecundarios: Array<{
        codigo: string;
        descricao: string;
    }>;
    endereco: {
        logradouro: string;
        numero: string;
        complemento: string;
        bairro: string;
        municipio: string;
        uf: string;
        cep: string;
    };
    contato: {
        email: string;
        telefone: string;
    };
    situacaoCadastral: {
        status: 'ATIVA' | 'BAIXADA' | 'INAPTA' | 'SUSPENSA' | 'NULA';
        data: string;
        motivo?: string;
    };
}

// ============================================================================
// BALANCETE COMPARATIVO
// ============================================================================

export interface ContaBalancete {
    codigo: number;
    nome: string;
    valoresMensais: Record<string, number>; // { "Jan/2025": 1234.56, ... }
    media: number;
    natureza: 'D' | 'C'; // Débito ou Crédito (baseado no último valor não-zero)
}

export interface BalanceteData {
    empresa: string;
    periodo: {
        inicio: string;
        fim: string;
    };
    meses: string[]; // ["Jan/2025", "Fev/2025", ...]
    contas: ContaBalancete[];
    // Contas sintéticas relevantes para DRE
    resumoDRE: {
        receitaBruta: number;
        deducoes: number;
        receitaLiquida: number;
        cmv: number;
        lucroBruto: number;
        despesasOperacionais: number;
        despesasTributarias: number;
        despesasFinanceiras: number;
        receitasFinanceiras: number;
        resultadoOperacional: number;
    };
}

// ============================================================================
// PLANO DE CONTAS
// ============================================================================

export interface ContaPlano {
    codigo: number;
    classificacao: string;
    nome: string;
    apelido: string;
    relatorio: 'Balanço patrimonial' | 'DRE' | 'DLPA' | string;
    conciliaAutomatico: boolean;
    contaObrigatoria: boolean;
    nivel: number; // Calculado pela classificação (01.1.2 = nível 3)
    tipo: 'ATIVO' | 'PASSIVO' | 'RECEITA' | 'CUSTO' | 'DESPESA' | 'PATRIMONIO_LIQUIDO';
}

export interface PlanoContasData {
    empresa: string;
    contas: ContaPlano[];
    // Índice para busca rápida
    contasPorCodigo: Map<number, ContaPlano>;
    contasPorClassificacao: Map<string, ContaPlano>;
}

// ============================================================================
// RESULTADO DO PARSER
// ============================================================================

export type ParseResult<T> =
    | { success: true; data: T; warnings?: string[] }
    | { success: false; error: string; details?: string };

export interface DocumentParserOptions {
    encoding?: string;
    strict?: boolean; // Se true, falha em qualquer erro; se false, tenta recuperar
}
