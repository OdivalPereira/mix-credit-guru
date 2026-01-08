/**
 * Parsers de Documentos Contábeis
 * 
 * Módulo para extração de dados de documentos contábeis brasileiros
 * Todo o processamento ocorre no browser (client-side)
 */

// Tipos
export * from './types';

// Parsers
export { parseCNPJCard, validateCNPJ, formatCNPJ } from './cnpj-parser';
export { parseBalancete, filterContasSinteticas } from './balancete-parser';
export {
    parsePlanoContas,
    filterContasPorTipo,
    filterContasPorRelatorio,
    findContaByCodigo,
    findContaByClassificacao,
    getHierarquia,
    getContasFilhas,
} from './plano-contas-parser';

// Mappers e Utilitários
export { extractTextFromPDF, readFileAsText } from './utils';
// Mapper para integração com Planejamento Tributário
export {
    balanceteToTaxProfile,
    saveProfileToLocalStorage,
    loadProfileFromLocalStorage,
    clearProfileFromLocalStorage,
} from './tax-profile-mapper';
