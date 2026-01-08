/**
 * Parser para Cartão CNPJ (PDF da Receita Federal)
 * 
 * Extrai dados estruturados do PDF do cartão CNPJ usando pdf.js
 * Todo o processamento ocorre no browser (client-side)
 */

import { CNPJData, ParseResult } from './types';

// Padrões regex para extração de campos
const PATTERNS = {
    cnpj: /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/,
    dataAbertura: /DATA DE ABER\s*TURA\s*(\d{2}\/\d{2}\/\d{4})/i,
    razaoSocial: /NOME EMPRESARIAL\s*\n\s*(.+?)(?=\s*\n\s*TÍTULO)/is,
    nomeFantasia: /TÍTULO DO EST\s*ABELECIMENT\s*O[^)]*\)\s*\n\s*(.+?)(?=POR\s*TE)/is,
    porte: /POR\s*TE\s*\n\s*(MEI|ME|EPP|DEMAIS)/i,
    cnaePrincipal: /ATIVIDADE ECONÔMICA\s*PRINCIP\s*AL\s*\n\s*(\d{2}\.\d{2}-\d-\d{2})\s*-\s*(.+?)(?=\s*\n\s*(?:CÓDIGO E DESCRIÇÃO DAS|$))/is,
    cnaesSecundarios: /ATIVIDADES ECONÔMICAS SECUNDÁRIAS\s*\n([\s\S]+?)(?=\s*\n\s*CÓDIGO E DESCRIÇÃO DA\s*NATUREZA)/i,
    naturezaJuridica: /NATUREZA\s*JURÍDICA\s*\n\s*(\d{3}-\d)\s*-\s*(.+?)(?=\s*\n)/i,
    logradouro: /LOGRADOURO\s*\n\s*(.+?)NÚMERO/is,
    numero: /NÚMERO\s*\n\s*(.+?)COMPLEMENT/is,
    complemento: /COMPLEMENT\s*O\s*\n\s*(.+?)(?=\s*\n\s*CEP)/is,
    cep: /CEP\s*\n\s*([\d.-]+)/i,
    bairro: /BAIRRO\/DISTRIT\s*O\s*\n\s*(.+?)MUNICÍPIO/is,
    municipio: /MUNICÍPIO\s*\n?\s*(.+?)UF/is,
    uf: /UF\s*\n\s*([A-Z]{2})/i,
    email: /ENDEREÇO ELETRÔNICO\s*\n\s*(.+?)TELEFONE/is,
    telefone: /TELEFONE\s*\n\s*\(?\d{2}\)?\s*[\d-]+/i,
    situacaoCadastral: /SITUAÇÃO CADASTRAL\s*\n\s*(ATIVA|BAIXADA|INAPTA|SUSPENSA|NULA)/i,
    dataSituacao: /DATA DA SITUAÇÃO CADASTRAL\s*\n\s*(\d{2}\/\d{2}\/\d{4})/i,
};

/**
 * Limpa texto extraído do PDF removendo espaços extras e quebras
 */
function cleanText(text: string): string {
    return text
        .replace(/\s+/g, ' ')
        .replace(/\s*\n\s*/g, '\n')
        .trim();
}

/**
 * Extrai um campo usando regex, retornando valor limpo ou string vazia
 */
function extractField(text: string, pattern: RegExp, group: number = 1): string {
    const match = text.match(pattern);
    return match ? cleanText(match[group]) : '';
}

/**
 * Extrai CNAEs secundários do texto
 */
function extractCnaesSecundarios(text: string): Array<{ codigo: string; descricao: string }> {
    const cnaes: Array<{ codigo: string; descricao: string }> = [];
    const section = extractField(text, PATTERNS.cnaesSecundarios);

    if (!section) return cnaes;

    // Regex para cada CNAE: código - descrição
    const cnaePattern = /(\d{2}\.\d{2}-\d-\d{2})\s*-\s*([^(\n]+)/g;
    let match;

    while ((match = cnaePattern.exec(section)) !== null) {
        cnaes.push({
            codigo: match[1].trim(),
            descricao: cleanText(match[2]),
        });
    }

    return cnaes;
}

/**
 * Extrai telefone do texto
 */
function extractTelefone(text: string): string {
    const match = text.match(/TELEFONE\s*\n?\s*(\(?\d{2}\)?\s*[\d-]+)/i);
    return match ? match[1].replace(/\s+/g, '') : '';
}

/**
 * Determina o porte da empresa
 */
function parsePorte(porte: string): CNPJData['porte'] {
    const p = porte.toUpperCase().trim();
    if (p === 'MEI') return 'MEI';
    if (p === 'ME') return 'ME';
    if (p === 'EPP') return 'EPP';
    return 'DEMAIS';
}

/**
 * Parser principal do cartão CNPJ
 */
export function parseCNPJCard(pdfText: string): ParseResult<CNPJData> {
    const warnings: string[] = [];

    try {
        // Normaliza o texto
        const text = pdfText.replace(/\r\n/g, '\n');

        // Extrai CNPJ (campo obrigatório)
        const cnpj = extractField(text, PATTERNS.cnpj);
        if (!cnpj) {
            return {
                success: false,
                error: 'CNPJ não encontrado no documento',
                details: 'O documento não parece ser um cartão CNPJ válido da Receita Federal',
            };
        }

        // Extrai demais campos
        const razaoSocial = extractField(text, PATTERNS.razaoSocial);
        if (!razaoSocial) warnings.push('Razão social não encontrada');

        const nomeFantasiaRaw = extractField(text, PATTERNS.nomeFantasia);
        const nomeFantasia = nomeFantasiaRaw.replace(/POR\s*TE.*$/i, '').trim();

        const porteRaw = extractField(text, PATTERNS.porte);
        const porte = parsePorte(porteRaw);

        const dataAbertura = extractField(text, PATTERNS.dataAbertura);

        // CNAE Principal
        const cnaePrincipalMatch = text.match(PATTERNS.cnaePrincipal);
        const cnaePrincipal = cnaePrincipalMatch
            ? { codigo: cnaePrincipalMatch[1], descricao: cleanText(cnaePrincipalMatch[2]) }
            : { codigo: '', descricao: '' };

        if (!cnaePrincipal.codigo) warnings.push('CNAE principal não encontrado');

        // CNAEs Secundários
        const cnaesSecundarios = extractCnaesSecundarios(text);

        // Natureza Jurídica
        const naturezaMatch = text.match(PATTERNS.naturezaJuridica);
        const naturezaJuridica = naturezaMatch
            ? { codigo: naturezaMatch[1], descricao: cleanText(naturezaMatch[2]) }
            : { codigo: '', descricao: '' };

        // Endereço
        const endereco = {
            logradouro: extractField(text, PATTERNS.logradouro).replace(/NÚMERO.*$/i, '').trim(),
            numero: extractField(text, PATTERNS.numero).replace(/COMPLEMENT.*$/i, '').trim(),
            complemento: extractField(text, PATTERNS.complemento).replace(/\*+/g, '').trim(),
            bairro: extractField(text, PATTERNS.bairro).replace(/MUNICÍPIO.*$/i, '').trim(),
            municipio: extractField(text, PATTERNS.municipio).replace(/UF.*$/i, '').trim(),
            uf: extractField(text, PATTERNS.uf),
            cep: extractField(text, PATTERNS.cep),
        };

        // Contato
        const contato = {
            email: extractField(text, PATTERNS.email).replace(/TELEFONE.*$/i, '').trim().toLowerCase(),
            telefone: extractTelefone(text),
        };

        // Situação Cadastral
        const situacaoStatus = extractField(text, PATTERNS.situacaoCadastral).toUpperCase();
        const situacaoCadastral = {
            status: (situacaoStatus || 'ATIVA') as CNPJData['situacaoCadastral']['status'],
            data: extractField(text, PATTERNS.dataSituacao),
        };

        const data: CNPJData = {
            cnpj,
            razaoSocial,
            nomeFantasia,
            dataAbertura,
            porte,
            naturezaJuridica,
            cnaePrincipal,
            cnaesSecundarios,
            endereco,
            contato,
            situacaoCadastral,
        };

        return {
            success: true,
            data,
            warnings: warnings.length > 0 ? warnings : undefined,
        };

    } catch (error) {
        return {
            success: false,
            error: 'Erro ao processar o documento',
            details: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Valida um CNPJ (dígitos verificadores)
 */
export function validateCNPJ(cnpj: string): boolean {
    // Remove caracteres não numéricos
    const numbers = cnpj.replace(/\D/g, '');

    if (numbers.length !== 14) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numbers)) return false;

    // Validação dos dígitos verificadores
    const calcDigit = (base: string, weights: number[]): number => {
        let sum = 0;
        for (let i = 0; i < weights.length; i++) {
            sum += parseInt(base[i]) * weights[i];
        }
        const remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    };

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const digit1 = calcDigit(numbers.substring(0, 12), weights1);
    const digit2 = calcDigit(numbers.substring(0, 12) + digit1, weights2);

    return numbers.endsWith(`${digit1}${digit2}`);
}

/**
 * Formata CNPJ para exibição
 */
export function formatCNPJ(cnpj: string): string {
    const numbers = cnpj.replace(/\D/g, '');
    return numbers.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
    );
}
