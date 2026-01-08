/**
 * Excel Parser
 * Parser local para planilhas de despesas e dados financeiros
 * 
 * Este parser extrai e categoriza despesas de planilhas Excel
 * 100% local, sem custo de API.
 * 
 * Usa a biblioteca SheetJS (xlsx) para leitura do arquivo.
 */

import * as XLSX from 'xlsx';

// ============================================================================
// TYPES
// ============================================================================

export interface DespesaItem {
    data?: Date;
    descricao: string;
    valor: number;
    categoria: string;
    subcategoria?: string;
    fornecedor?: string;
    documento?: string;
    linha: number;
}

export interface DespesasPorCategoria {
    pessoal: number;
    fornecedores: number;
    servicos: number;
    aluguel: number;
    energia: number;
    telecomunicacoes: number;
    transporte: number;
    marketing: number;
    impostos: number;
    financeiras: number;
    administrativas: number;
    outras: number;
}

export interface ExcelParseResult {
    sucesso: boolean;
    arquivo: string;
    planilhas: string[];
    planilhaUsada: string;
    totalLinhas: number;
    linhasProcessadas: number;
    despesas: DespesaItem[];
    totaisPorCategoria: DespesasPorCategoria;
    total: number;
    periodo?: {
        inicio: Date;
        fim: Date;
    };
    colunasDetectadas: {
        data?: string;
        descricao?: string;
        valor?: string;
        categoria?: string;
    };
    observacoes: string[];
    erros: string[];
}

interface ColunaMapping {
    data?: number;
    descricao?: number;
    valor?: number;
    categoria?: number;
    fornecedor?: number;
    documento?: number;
}

// ============================================================================
// KEYWORDS PARA CATEGORIZAÇÃO
// ============================================================================

const CATEGORIA_KEYWORDS: Record<string, string[]> = {
    pessoal: [
        'salario', 'salário', 'folha', 'fgts', 'inss', 'ferias', 'férias',
        '13', 'decimo', 'décimo', 'rescisao', 'rescisão', 'vale transporte',
        'vt', 'vr', 'vale refeicao', 'vale refeição', 'plano saude', 'plano saúde',
        'funcionario', 'funcionário', 'colaborador', 'pro labore', 'prolabore',
        'beneficio', 'benefício', 'contribuicao', 'contribuição', 'patronal'
    ],
    fornecedores: [
        'mercadoria', 'estoque', 'fornecedor', 'compra', 'materia prima',
        'matéria prima', 'insumo', 'produto', 'revenda', 'cmv', 'custo'
    ],
    servicos: [
        'servico', 'serviço', 'consultoria', 'assessoria', 'terceiro',
        'manutencao', 'manutenção', 'reparo', 'conserto', 'tecnico', 'técnico',
        'software', 'sistema', 'licenca', 'licença', 'assinatura', 'mensalidade'
    ],
    aluguel: [
        'aluguel', 'locacao', 'locação', 'condominio', 'condomínio',
        'iptu', 'imovel', 'imóvel', 'sala', 'escritorio', 'escritório',
        'galpao', 'galpão', 'loja'
    ],
    energia: [
        'energia', 'luz', 'eletrica', 'elétrica', 'celesc', 'cemig', 'cpfl',
        'light', 'eletropaulo', 'copel', 'energisa', 'kwh'
    ],
    telecomunicacoes: [
        'telefone', 'celular', 'internet', 'banda larga', 'fibra',
        'vivo', 'tim', 'claro', 'oi', 'telecom', 'voip', 'ramal'
    ],
    transporte: [
        'transporte', 'frete', 'combustivel', 'combustível', 'gasolina',
        'diesel', 'etanol', 'uber', '99', 'taxi', 'táxi', 'pedagio', 'pedágio',
        'estacionamento', 'veiculo', 'veículo', 'carro', 'moto', 'viagem',
        'passagem', 'aerea', 'aérea', 'hotel', 'hospedagem'
    ],
    marketing: [
        'marketing', 'publicidade', 'propaganda', 'anuncio', 'anúncio',
        'google ads', 'facebook', 'instagram', 'midia', 'mídia', 'outdoor',
        'brinde', 'evento', 'patrocinio', 'patrocínio', 'promocao', 'promoção',
        'design', 'criacao', 'criação', 'arte'
    ],
    impostos: [
        'imposto', 'tributo', 'taxa', 'simples nacional', 'das', 'irpj',
        'csll', 'pis', 'cofins', 'icms', 'iss', 'issqn', 'multa fiscal',
        'gnre', 'darf', 'gps', 'fgts', 'inss empresa'
    ],
    financeiras: [
        'juro', 'juros', 'tarifa', 'iof', 'ted', 'doc', 'pix', 'boleto',
        'cartao', 'cartão', 'anuidade', 'emprestimo', 'empréstimo',
        'financiamento', 'banco', 'bradesco', 'itau', 'itaú', 'santander',
        'caixa', 'bb', 'safra', 'btg', 'nubank', 'inter', 'taxa bancaria'
    ],
    administrativas: [
        'escritorio', 'escritório', 'material', 'papel', 'caneta',
        'impressora', 'toner', 'cartorio', 'cartório', 'registro', 'certidao',
        'certidão', 'contador', 'contabilidade', 'advocacia', 'juridico',
        'jurídico', 'seguro', 'documentacao', 'documentação'
    ]
};

// ============================================================================
// PARSER PRINCIPAL
// ============================================================================

/**
 * Parse de arquivo Excel (xlsx, xls)
 * @param file Arquivo Excel (File ou ArrayBuffer)
 * @param filename Nome do arquivo para referência
 * @returns Dados estruturados extraídos
 */
export async function parseExcelFile(
    file: File | ArrayBuffer,
    filename: string = 'planilha.xlsx'
): Promise<ExcelParseResult> {
    const result: ExcelParseResult = {
        sucesso: false,
        arquivo: filename,
        planilhas: [],
        planilhaUsada: '',
        totalLinhas: 0,
        linhasProcessadas: 0,
        despesas: [],
        totaisPorCategoria: {
            pessoal: 0,
            fornecedores: 0,
            servicos: 0,
            aluguel: 0,
            energia: 0,
            telecomunicacoes: 0,
            transporte: 0,
            marketing: 0,
            impostos: 0,
            financeiras: 0,
            administrativas: 0,
            outras: 0
        },
        total: 0,
        colunasDetectadas: {},
        observacoes: [],
        erros: []
    };

    try {
        // Ler arquivo
        let arrayBuffer: ArrayBuffer;
        if (file instanceof File) {
            arrayBuffer = await file.arrayBuffer();
        } else {
            arrayBuffer = file;
        }

        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
        result.planilhas = workbook.SheetNames;

        if (result.planilhas.length === 0) {
            result.erros.push('Arquivo não contém planilhas');
            return result;
        }

        // Escolher a melhor planilha (primeira com dados ou a que parece ter despesas)
        const sheetName = findBestSheet(workbook);
        result.planilhaUsada = sheetName;

        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (data.length < 2) {
            result.erros.push('Planilha sem dados suficientes');
            return result;
        }

        result.totalLinhas = data.length;

        // Detectar colunas
        const header = data[0] as string[];
        const mapping = detectColumns(header);

        result.colunasDetectadas = {
            data: mapping.data !== undefined ? header[mapping.data] : undefined,
            descricao: mapping.descricao !== undefined ? header[mapping.descricao] : undefined,
            valor: mapping.valor !== undefined ? header[mapping.valor] : undefined,
            categoria: mapping.categoria !== undefined ? header[mapping.categoria] : undefined
        };

        if (mapping.valor === undefined && mapping.descricao === undefined) {
            // Tentar detectar automaticamente por tipo de dados
            const autoMapping = autoDetectColumns(data);
            Object.assign(mapping, autoMapping);
            result.observacoes.push('Colunas detectadas automaticamente por tipo de dados');
        }

        if (mapping.valor === undefined) {
            result.erros.push('Não foi possível identificar a coluna de valores');
            return result;
        }

        // Processar linhas
        let dataInicio: Date | undefined;
        let dataFim: Date | undefined;

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            const despesa = parseRow(row, mapping, i + 1);

            if (despesa && Math.abs(despesa.valor) > 0.01) {
                result.despesas.push(despesa);
                result.linhasProcessadas++;
                result.total += Math.abs(despesa.valor);

                // Acumular por categoria
                const cat = despesa.categoria as keyof DespesasPorCategoria;
                if (cat in result.totaisPorCategoria) {
                    result.totaisPorCategoria[cat] += Math.abs(despesa.valor);
                }

                // Rastrear período
                if (despesa.data) {
                    if (!dataInicio || despesa.data < dataInicio) dataInicio = despesa.data;
                    if (!dataFim || despesa.data > dataFim) dataFim = despesa.data;
                }
            }
        }

        if (dataInicio && dataFim) {
            result.periodo = { inicio: dataInicio, fim: dataFim };
        }

        result.sucesso = result.despesas.length > 0;
        result.observacoes.push(`${result.linhasProcessadas} despesas processadas de ${result.totalLinhas} linhas`);

    } catch (error) {
        result.erros.push(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return result;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function findBestSheet(workbook: XLSX.WorkBook): string {
    const names = workbook.SheetNames;

    // Palavras-chave que indicam planilha de despesas
    const keywords = ['despesa', 'gasto', 'custo', 'pagamento', 'saida', 'saída', 'extrato', 'lancamento', 'lançamento'];

    for (const name of names) {
        const nameLower = name.toLowerCase();
        if (keywords.some(kw => nameLower.includes(kw))) {
            return name;
        }
    }

    // Retornar a primeira com mais dados
    let bestSheet = names[0];
    let maxRows = 0;

    for (const name of names) {
        const sheet = workbook.Sheets[name];
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
        const rows = range.e.r - range.s.r + 1;
        if (rows > maxRows) {
            maxRows = rows;
            bestSheet = name;
        }
    }

    return bestSheet;
}

function detectColumns(header: string[]): ColunaMapping {
    const mapping: ColunaMapping = {};

    const patterns = {
        data: /^(data|date|dt|dia|emissao|emissão|vencimento|pagamento)/i,
        descricao: /^(descri[cç][aã]o|historico|histórico|nome|item|detalhe|observa[cç][aã]o|memo)/i,
        valor: /^(valor|value|vlr|montante|quantia|total|preco|preço|custo|amount)$/i,
        categoria: /^(categoria|tipo|class|grupo|natureza|centro.*custo)/i,
        fornecedor: /^(fornecedor|supplier|vendor|credor|beneficiario|beneficiário|favorecido)/i,
        documento: /^(documento|doc|nota|nf|numero|número|comprovante|recibo)/i
    };

    for (let i = 0; i < header.length; i++) {
        const col = (header[i] || '').toString().trim();

        for (const [key, pattern] of Object.entries(patterns)) {
            if (pattern.test(col) && mapping[key as keyof ColunaMapping] === undefined) {
                mapping[key as keyof ColunaMapping] = i;
            }
        }
    }

    // Se não encontrou valor, procurar por colunas que terminam com "R$" ou similar
    if (mapping.valor === undefined) {
        for (let i = 0; i < header.length; i++) {
            const col = (header[i] || '').toString().trim();
            if (/r\$|reais|brl/i.test(col)) {
                mapping.valor = i;
                break;
            }
        }
    }

    return mapping;
}

function autoDetectColumns(data: any[][]): ColunaMapping {
    const mapping: ColunaMapping = {};

    if (data.length < 3) return mapping;

    // Analisar algumas linhas para detectar tipos
    const sampleRows = data.slice(1, Math.min(20, data.length));
    const numCols = Math.max(...sampleRows.map(r => r?.length || 0));

    const columnTypes: Array<{ numbers: number; dates: number; strings: number }> = [];

    for (let col = 0; col < numCols; col++) {
        columnTypes[col] = { numbers: 0, dates: 0, strings: 0 };

        for (const row of sampleRows) {
            if (!row || row[col] === undefined || row[col] === null) continue;

            const val = row[col];

            if (val instanceof Date) {
                columnTypes[col].dates++;
            } else if (typeof val === 'number' || (typeof val === 'string' && /^-?[\d.,]+$/.test(val.trim()))) {
                columnTypes[col].numbers++;
            } else if (typeof val === 'string' && val.trim().length > 0) {
                columnTypes[col].strings++;
            }
        }
    }

    // Encontrar coluna de data (maioria datas)
    let maxDates = 0;
    for (let i = 0; i < columnTypes.length; i++) {
        if (columnTypes[i].dates > maxDates) {
            maxDates = columnTypes[i].dates;
            mapping.data = i;
        }
    }

    // Encontrar coluna de valor (maioria números, não é data)
    let maxNumbers = 0;
    for (let i = 0; i < columnTypes.length; i++) {
        if (i === mapping.data) continue;
        if (columnTypes[i].numbers > maxNumbers) {
            maxNumbers = columnTypes[i].numbers;
            mapping.valor = i;
        }
    }

    // Encontrar coluna de descrição (maioria strings, mais longa em média)
    let maxStrings = 0;
    for (let i = 0; i < columnTypes.length; i++) {
        if (i === mapping.data || i === mapping.valor) continue;
        if (columnTypes[i].strings > maxStrings) {
            maxStrings = columnTypes[i].strings;
            mapping.descricao = i;
        }
    }

    return mapping;
}

function parseRow(row: any[], mapping: ColunaMapping, lineNumber: number): DespesaItem | null {
    try {
        // Extrair descrição
        let descricao = '';
        if (mapping.descricao !== undefined) {
            descricao = String(row[mapping.descricao] || '').trim();
        }

        // Extrair valor
        let valor = 0;
        if (mapping.valor !== undefined) {
            valor = parseValor(row[mapping.valor]);
        }

        if (!descricao && valor === 0) return null;

        // Extrair data
        let data: Date | undefined;
        if (mapping.data !== undefined) {
            data = parseData(row[mapping.data]);
        }

        // Determinar categoria
        let categoria = 'outras';
        if (mapping.categoria !== undefined && row[mapping.categoria]) {
            categoria = normalizarCategoria(String(row[mapping.categoria]));
        } else if (descricao) {
            categoria = inferirCategoria(descricao);
        }

        // Extrair fornecedor
        let fornecedor: string | undefined;
        if (mapping.fornecedor !== undefined && row[mapping.fornecedor]) {
            fornecedor = String(row[mapping.fornecedor]).trim();
        }

        // Extrair documento
        let documento: string | undefined;
        if (mapping.documento !== undefined && row[mapping.documento]) {
            documento = String(row[mapping.documento]).trim();
        }

        return {
            data,
            descricao: descricao || `Linha ${lineNumber}`,
            valor,
            categoria,
            fornecedor,
            documento,
            linha: lineNumber
        };

    } catch {
        return null;
    }
}

function parseValor(val: any): number {
    if (typeof val === 'number') return val;
    if (val === null || val === undefined) return 0;

    let str = String(val).trim();

    // Detectar valores negativos entre parênteses: (1.234,56)
    const isNegative = str.startsWith('(') && str.endsWith(')') || str.startsWith('-');

    // Limpar string
    str = str.replace(/[()R$\s]/gi, '');

    // Detectar formato brasileiro (1.234,56) vs americano (1,234.56)
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');

    if (lastComma > lastDot) {
        // Formato brasileiro: trocar . por nada e , por .
        str = str.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma) {
        // Formato americano: remover vírgulas
        str = str.replace(/,/g, '');
    }

    str = str.replace(/[^\d.-]/g, '');

    const num = parseFloat(str);
    if (isNaN(num)) return 0;

    return isNegative && num > 0 ? -num : num;
}

function parseData(val: any): Date | undefined {
    if (val instanceof Date && !isNaN(val.getTime())) {
        return val;
    }

    if (typeof val === 'number') {
        // Excel serial date
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const date = new Date(excelEpoch.getTime() + val * 24 * 60 * 60 * 1000);
        if (!isNaN(date.getTime())) return date;
    }

    if (typeof val === 'string') {
        const str = val.trim();

        // Tentar formatos comuns
        const patterns = [
            /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
            /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
            /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
            /^(\d{2})\/(\d{2})\/(\d{2})$/, // DD/MM/YY
        ];

        for (const pattern of patterns) {
            const match = str.match(pattern);
            if (match) {
                let dia: number, mes: number, ano: number;

                if (pattern.source.startsWith('^(\\d{4})')) {
                    // YYYY-MM-DD
                    [, ano, mes, dia] = match.map(Number);
                } else {
                    [, dia, mes, ano] = match.map(Number);
                    if (ano < 100) ano += 2000;
                }

                const date = new Date(ano, mes - 1, dia);
                if (!isNaN(date.getTime())) return date;
            }
        }
    }

    return undefined;
}

function normalizarCategoria(categoria: string): string {
    const lower = categoria.toLowerCase().trim();

    // Mapeamento direto
    const mapeamento: Record<string, string> = {
        'folha': 'pessoal',
        'salarios': 'pessoal',
        'pessoal': 'pessoal',
        'fornecedor': 'fornecedores',
        'compras': 'fornecedores',
        'mercadorias': 'fornecedores',
        'servico': 'servicos',
        'terceiros': 'servicos',
        'aluguel': 'aluguel',
        'locacao': 'aluguel',
        'energia': 'energia',
        'luz': 'energia',
        'telefone': 'telecomunicacoes',
        'internet': 'telecomunicacoes',
        'frete': 'transporte',
        'combustivel': 'transporte',
        'marketing': 'marketing',
        'publicidade': 'marketing',
        'imposto': 'impostos',
        'tributo': 'impostos',
        'banco': 'financeiras',
        'tarifa': 'financeiras',
        'administrativo': 'administrativas',
        'escritorio': 'administrativas'
    };

    for (const [key, value] of Object.entries(mapeamento)) {
        if (lower.includes(key)) return value;
    }

    return 'outras';
}

function inferirCategoria(descricao: string): string {
    const lower = descricao.toLowerCase();

    for (const [categoria, keywords] of Object.entries(CATEGORIA_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lower.includes(keyword)) {
                return categoria;
            }
        }
    }

    return 'outras';
}

// ============================================================================
// EXPORTS ADICIONAIS
// ============================================================================

/**
 * Retorna resumo das despesas para preview
 */
export function getExcelSummary(result: ExcelParseResult): string {
    if (!result.sucesso) {
        return result.erros.join(', ') || 'Falha ao processar';
    }

    return `${result.linhasProcessadas} despesas | Total: R$ ${result.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

/**
 * Retorna as top N categorias por valor
 */
export function getTopCategorias(result: ExcelParseResult, n: number = 5): Array<{ categoria: string; valor: number; percentual: number }> {
    const entries = Object.entries(result.totaisPorCategoria)
        .filter(([_, valor]) => valor > 0)
        .map(([categoria, valor]) => ({
            categoria,
            valor,
            percentual: result.total > 0 ? (valor / result.total) * 100 : 0
        }))
        .sort((a, b) => b.valor - a.valor);

    return entries.slice(0, n);
}
