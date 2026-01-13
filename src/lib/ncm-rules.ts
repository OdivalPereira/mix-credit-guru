/**
 * Tabela de Regras NCM para Classificação Tributária
 * 
 * Esta tabela contém mapeamentos determinísticos de NCM para classificação tributária,
 * evitando dependência exclusiva da IA para classificações conhecidas.
 * 
 * Fontes:
 * - Lei Complementar 214/2025 (Reforma Tributária)
 * - Cesta Básica Nacional (Lei 194/2022)
 * - Tabela TIPI atualizada
 */

export interface NCMRule {
    /** Padrão NCM (pode ser prefixo, ex: "0201" para carnes bovinas) */
    ncmPattern: string;
    /** Setor tributário */
    setor: 'alimentos_basicos' | 'saude' | 'educacao' | 'agropecuaria' | 'comercio' | 'industria' | 'servicos' | 'outros';
    /** Pertence à Cesta Básica Nacional */
    cesta_basica: boolean;
    /** Redução na Reforma 2033: 0 = padrão, 0.6 = 60%, 1 = 100% (isento) */
    reducao_reforma: number;
    /** Anexo sugerido para Simples Nacional */
    anexo_simples_sugerido: 'I' | 'II' | 'III' | 'IV' | 'V';
    /** Descrição do grupo NCM */
    descricao: string;
}

/**
 * NCMs da Cesta Básica Nacional (100% isenção IBS/CBS)
 * Baseado na Lei Complementar 214/2025, Anexo I
 */
export const NCM_CESTA_BASICA: NCMRule[] = [
    // Carnes
    { ncmPattern: '0201', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Carnes bovinas frescas/refrigeradas' },
    { ncmPattern: '0202', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Carnes bovinas congeladas' },
    { ncmPattern: '0203', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Carnes suínas frescas/refrigeradas/congeladas' },
    { ncmPattern: '0207', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Carnes de aves (frango, peru)' },
    { ncmPattern: '0302', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Peixes frescos/refrigerados' },
    { ncmPattern: '0303', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Peixes congelados' },

    // Laticínios
    { ncmPattern: '0401', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Leite e creme de leite' },
    { ncmPattern: '0405', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Manteiga' },
    { ncmPattern: '0407', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Ovos' },

    // Legumes, Verduras, Frutas
    { ncmPattern: '07', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Hortícolas (legumes/verduras)' },
    { ncmPattern: '08', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Frutas' },

    // Cereais e Grãos
    { ncmPattern: '1006', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Arroz' },
    { ncmPattern: '0713', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Feijão e leguminosas secas' },
    { ncmPattern: '0901', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Café' },

    // Farinhas e derivados
    { ncmPattern: '1101', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Farinha de trigo' },
    { ncmPattern: '1102', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Outras farinhas de cereais' },
    { ncmPattern: '1106', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Farinha de mandioca' },

    // Óleos e gorduras
    { ncmPattern: '1507', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Óleo de soja' },
    { ncmPattern: '1517', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Margarina' },

    // Açúcar e Sal
    { ncmPattern: '1701', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Açúcar' },
    { ncmPattern: '2501', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Sal' },

    // Pão
    { ncmPattern: '1905', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Pães e produtos de padaria' },
];

/**
 * NCMs com Redução de 60% (Saúde, Educação, etc.)
 */
export const NCM_REDUCAO_60: NCMRule[] = [
    // Medicamentos
    { ncmPattern: '3003', setor: 'saude', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Medicamentos (misturas)' },
    { ncmPattern: '3004', setor: 'saude', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Medicamentos (dosados)' },
    { ncmPattern: '3005', setor: 'saude', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Curativos e material hospitalar' },
    { ncmPattern: '9018', setor: 'saude', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Instrumentos médicos/cirúrgicos' },
    { ncmPattern: '9021', setor: 'saude', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Próteses e órteses' },

    // Material Escolar
    { ncmPattern: '4820', setor: 'educacao', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Cadernos e material escolar' },
    { ncmPattern: '4901', setor: 'educacao', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Livros, folhetos e impressos' },
    { ncmPattern: '4903', setor: 'educacao', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Livros infantis' },

    // Insumos Agropecuários
    { ncmPattern: '31', setor: 'agropecuaria', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Adubos e fertilizantes' },
    { ncmPattern: '3808', setor: 'agropecuaria', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Inseticidas e defensivos agrícolas' },
];

/**
 * NCMs que NUNCA podem ser Cesta Básica ou ter redução
 * Usado para validação pós-IA
 */
export const NCM_EXCLUSOES: string[] = [
    '22', // Bebidas (exceto água)
    '24', // Tabaco
    '33', // Cosméticos e perfumaria
    '64', // Calçados
    '71', // Joias e bijuterias
    '84', // Máquinas e equipamentos mecânicos
    '85', // Equipamentos elétricos e eletrônicos
    '87', // Veículos
    '88', // Aeronaves
    '89', // Embarcações
    '91', // Relógios
    '93', // Armas e munições
    '95', // Brinquedos e artigos esportivos
    '97', // Objetos de arte
];

/**
 * Busca a regra NCM correspondente a um código NCM
 * Prioriza match mais específico (maior comprimento de pattern)
 */
export function buscarRegraNCM(ncm: string): NCMRule | null {
    const ncmLimpo = ncm.replace(/\D/g, ''); // Remove pontos/hífens

    // Combinar todas as regras
    const todasRegras = [...NCM_CESTA_BASICA, ...NCM_REDUCAO_60];

    // Buscar match mais específico (maior comprimento de pattern)
    let melhorMatch: NCMRule | null = null;
    let maiorComprimento = 0;

    for (const regra of todasRegras) {
        if (ncmLimpo.startsWith(regra.ncmPattern) && regra.ncmPattern.length > maiorComprimento) {
            melhorMatch = regra;
            maiorComprimento = regra.ncmPattern.length;
        }
    }

    return melhorMatch;
}

/**
 * Verifica se um NCM está na lista de exclusão (nunca pode ser isento)
 */
export function ncmEstaExcluido(ncm: string): boolean {
    const ncmLimpo = ncm.replace(/\D/g, '');
    return NCM_EXCLUSOES.some(prefixo => ncmLimpo.startsWith(prefixo));
}

/**
 * Retorna a classificação padrão para NCMs não mapeados
 */
export function getClassificacaoPadrao(): Omit<NCMRule, 'ncmPattern' | 'descricao'> {
    return {
        setor: 'comercio',
        cesta_basica: false,
        reducao_reforma: 0,
        anexo_simples_sugerido: 'I'
    };
}
