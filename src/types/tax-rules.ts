export interface SimplesNacionalFaixa {
    limite: number;
    aliquota: number;
    deducao: number;
}

export interface SimplesNacionalAnexo {
    nome: string;
    faixas: SimplesNacionalFaixa[];
    distribuicao_tributos: Record<string, number>;
    cpp_separado?: boolean;
    cpp_aliquota?: number;
    fator_r?: {
        limite_migracao: number;
        anexo_destino: string;
        descricao: string;
    };
    nota?: string;
}

export interface TaxRules {
    metadata: {
        version: string;
        updated_at: string;
        description: string;
        fonte_legal: string;
    };
    simples_nacional: {
        limite_faturamento_anual: number;
        limite_faturamento_mensal: number;
        limite_mei: number;
        anexos: Record<string, SimplesNacionalAnexo>;
    };
    lucro_presumido: {
        limite_faturamento_anual: number;
        aliquotas: {
            irpj: {
                normal: number;
                adicional: number;
                base_adicional_anual: number;
            };
            csll: number;
            pis: { aliquota: number };
            cofins: { aliquota: number };
        };
        presuncao: Record<string, { irpj: number; csll: number }>;
    };
    reforma_tributaria: {
        transicao: Record<string, {
            cbs: number;
            ibs: number;
            reducao_tributos_atuais: number;
        }>;
        aliquotas_plenas_2033: {
            cbs_federal: number;
            ibs_estadual_municipal: number;
            aliquota_padrao_total: number;
        };
    };
}
