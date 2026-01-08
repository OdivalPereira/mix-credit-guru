export interface CnaeSimples {
    permitido: boolean;
    anexo_padrao: string | null;
    anexo_fator_r?: string | null;
    fator_r_minimo?: number | null;
    nota?: string;
    motivo?: string;
}

export interface CnaeLucroPresumido {
    presuncao_irpj: number;
    presuncao_csll: number;
    nota?: string;
}

export interface CnaeIss {
    lista_servicos: string;
    aliquota_minima: number;
    aliquota_maxima: number;
}

export interface CnaeIcms {
    substituicao_tributaria: boolean;
    aliquota_interna_media: number;
}

export interface CnaeMei {
    permitido: boolean;
    motivo?: string;
    limite_faturamento?: number;
}

export interface CnaeReformaTributaria {
    reducao_aliquota: number;
    nota?: string;
}

export interface CnaeInfo {
    descricao: string;
    divisao: string;
    grupo: string;
    classe: string;
    simples?: CnaeSimples;
    lucro_presumido?: CnaeLucroPresumido;
    iss?: CnaeIss;
    icms?: CnaeIcms;
    mei?: CnaeMei;
    tipo_atividade: "servicos" | "comercio" | "misto" | "industria";
    setor: string;
    reforma_tributaria?: CnaeReformaTributaria;
    observacoes: string[];
}

export interface CnaeDatabase {
    metadata: {
        version: string;
        updated_at: string;
        description: string;
        source: string;
    };
    cnaes: Record<string, CnaeInfo>;
}
