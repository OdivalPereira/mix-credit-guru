/**
 * Parser para Balancete Comparativo Mensal (TXT do SCI Sucessor)
 * 
 * Extrai dados estruturados do arquivo TXT exportado do sistema contábil
 * Foco na coluna "Média" para alimentar análises de DRE
 */

import { BalanceteData, ContaBalancete, ParseResult } from './types';

// Códigos das contas sintéticas relevantes para DRE
const CONTAS_DRE = {
    RECEITA_BRUTA: [2100, 2108, 2119], // Receita Bruta com Vendas e Serviços
    DEDUCOES: [2194, 2208, 2232], // Deduções das Receitas
    CMV: [2780, 2798], // Custos das Mercadorias Vendidas
    DESPESAS_OPERACIONAIS: [2933, 2941, 3085], // Despesas Operacionais
    DESPESAS_TRIBUTARIAS: [3514, 3522], // Despesas Tributárias
    DESPESAS_FINANCEIRAS: [3433, 3476], // Despesas Financeiras
    RECEITAS_FINANCEIRAS: [2330, 2372, 2429], // Receitas Financeiras
};

/**
 * Converte valor brasileiro para número
 * "1.234,56D" → -1234.56
 * "1.234,56C" → 1234.56
 * "1.234,56" → 1234.56
 */
function parseValorBR(valor: string): number {
    if (!valor || valor.trim() === '' || valor.trim() === '0,00') {
        return 0;
    }

    const trimmed = valor.trim();
    const isDebito = trimmed.endsWith('D');
    const isCredito = trimmed.endsWith('C');

    // Remove D/C do final e converte
    let numStr = trimmed.replace(/[DC]$/i, '');

    // Remove pontos de milhar e troca vírgula por ponto
    numStr = numStr.replace(/\./g, '').replace(',', '.');

    const num = parseFloat(numStr);
    if (isNaN(num)) return 0;

    // D (débito) = positivo para contas de resultado (despesas)
    // C (crédito) = positivo para receitas, negativo para despesas reversas
    // Para simplicidade, retornamos o valor absoluto e a natureza separadamente
    return isDebito ? num : (isCredito ? num : num);
}

/**
 * Extrai a natureza (D/C) do valor
 */
function extractNatureza(valor: string): 'D' | 'C' {
    const trimmed = valor.trim();
    if (trimmed.endsWith('D')) return 'D';
    if (trimmed.endsWith('C')) return 'C';
    return 'D'; // Default para débito
}

/**
 * Identifica se uma linha é cabeçalho
 */
function isHeaderLine(line: string): boolean {
    return line.includes('Código') && line.includes('Nome') &&
        (line.includes('Média') || line.includes('Jan/') || line.includes('Fev/'));
}

/**
 * Identifica se uma linha é rodapé
 */
function isFooterLine(line: string): boolean {
    return line.includes('contábil SCI') ||
        line.includes('Página:') ||
        /^\s*\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}\s*$/.test(line);
}

/**
 * Extrai meses do cabeçalho
 */
function extractMeses(headerLine: string): string[] {
    const meses: string[] = [];
    const pattern = /(Jan|Fev|Mar|Abr|Maio|Jun|Jul|Ago|Set|Out|Nov|Dez)\/\d{4}/g;
    let match;

    while ((match = pattern.exec(headerLine)) !== null) {
        meses.push(match[0]);
    }

    return meses;
}

/**
 * Parser de linha de conta do balancete
 * Formato aproximado (posições fixas):
 * [espaços][código][espaços][nome][valores mensais...][média]
 */
function parseContaLine(line: string, meses: string[]): ContaBalancete | null {
    // Regex para extrair código e nome
    const match = line.match(/^\s*(\d+)\s{2,}(.+?)(?=\s{2,}[\d,.-]+[DC]?\s|\s{2,}0,00\s)/);

    if (!match) return null;

    const codigo = parseInt(match[1]);
    const nome = match[2].trim();

    // Extrai todos os valores numéricos da linha
    const valoresMatch = line.match(/[\d.,]+[DC]?/g);
    if (!valoresMatch || valoresMatch.length === 0) return null;

    // Filtra apenas valores válidos (com vírgula decimal brasileira)
    const valores = valoresMatch.filter(v => v.includes(','));

    // O último valor é a média
    const mediaStr = valores[valores.length - 1] || '0,00';
    const media = parseValorBR(mediaStr);

    // Monta valores mensais
    const valoresMensais: Record<string, number> = {};
    for (let i = 0; i < meses.length && i < valores.length - 1; i++) {
        valoresMensais[meses[i]] = parseValorBR(valores[i]);
    }

    // Determina natureza pelo último valor não-zero
    let natureza: 'D' | 'C' = 'D';
    for (let i = valores.length - 1; i >= 0; i--) {
        const v = valores[i];
        if (v && parseValorBR(v) !== 0) {
            natureza = extractNatureza(v);
            break;
        }
    }

    return {
        codigo,
        nome,
        valoresMensais,
        media,
        natureza,
    };
}

/**
 * Encontra a conta mais específica para uma categoria
 */
function findContaForCategory(contas: ContaBalancete[], codigos: number[]): number {
    for (const codigo of codigos) {
        const conta = contas.find(c => c.codigo === codigo);
        if (conta && conta.media !== 0) {
            // Retorna com sinal correto baseado na natureza
            return conta.natureza === 'D' ? conta.media : -conta.media;
        }
    }
    return 0;
}

/**
 * Calcula o resumo DRE a partir das contas
 */
function calcularResumoDRE(contas: ContaBalancete[]): BalanceteData['resumoDRE'] {
    // Receita Bruta (Crédito = positivo)
    const receitaBruta = Math.abs(findContaForCategory(contas, CONTAS_DRE.RECEITA_BRUTA));

    // Deduções (Débito = valor a subtrair)
    const deducoes = Math.abs(findContaForCategory(contas, CONTAS_DRE.DEDUCOES));

    // Receita Líquida
    const receitaLiquida = receitaBruta - deducoes;

    // CMV (Débito = custo)
    const cmv = Math.abs(findContaForCategory(contas, CONTAS_DRE.CMV));

    // Lucro Bruto
    const lucroBruto = receitaLiquida - cmv;

    // Despesas
    const despesasOperacionais = Math.abs(findContaForCategory(contas, CONTAS_DRE.DESPESAS_OPERACIONAIS));
    const despesasTributarias = Math.abs(findContaForCategory(contas, CONTAS_DRE.DESPESAS_TRIBUTARIAS));
    const despesasFinanceiras = Math.abs(findContaForCategory(contas, CONTAS_DRE.DESPESAS_FINANCEIRAS));

    // Receitas Financeiras
    const receitasFinanceiras = Math.abs(findContaForCategory(contas, CONTAS_DRE.RECEITAS_FINANCEIRAS));

    // Resultado Operacional
    const resultadoOperacional = lucroBruto - despesasOperacionais - despesasTributarias -
        despesasFinanceiras + receitasFinanceiras;

    return {
        receitaBruta,
        deducoes,
        receitaLiquida,
        cmv,
        lucroBruto,
        despesasOperacionais,
        despesasTributarias,
        despesasFinanceiras,
        receitasFinanceiras,
        resultadoOperacional,
    };
}

/**
 * Parser principal do balancete
 */
export function parseBalancete(content: string): ParseResult<BalanceteData> {
    const warnings: string[] = [];

    try {
        const lines = content.split('\n');

        // Extrai nome da empresa (primeira linha com conteúdo)
        let empresa = '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.includes('Página:') && !trimmed.includes('Comparativo')) {
                empresa = trimmed;
                break;
            }
        }

        // Extrai período (linha com "Comparativo do movimento")
        let periodoInicio = '';
        let periodoFim = '';
        for (const line of lines) {
            const match = line.match(/Comparativo do movimento\s+de\s+(\d{2}\/\d{2}\/\d{4})\s+a\s+(\d{2}\/\d{2}\/\d{4})/i);
            if (match) {
                periodoInicio = match[1];
                periodoFim = match[2];
                break;
            }
        }

        // Encontra cabeçalho e extrai meses
        let meses: string[] = [];
        for (const line of lines) {
            if (isHeaderLine(line)) {
                meses = extractMeses(line);
                if (meses.length > 0) break;
            }
        }

        if (meses.length === 0) {
            warnings.push('Meses não identificados no cabeçalho');
        }

        // Parse das contas
        const contas: ContaBalancete[] = [];
        const codigosVistos = new Set<number>();

        for (const line of lines) {
            // Pula linhas de cabeçalho/rodapé
            if (isHeaderLine(line) || isFooterLine(line) || !line.trim()) {
                continue;
            }

            const conta = parseContaLine(line, meses);
            if (conta && !codigosVistos.has(conta.codigo)) {
                contas.push(conta);
                codigosVistos.add(conta.codigo);
            }
        }

        if (contas.length === 0) {
            return {
                success: false,
                error: 'Nenhuma conta encontrada no balancete',
                details: 'O arquivo pode não estar no formato esperado do SCI Sucessor',
            };
        }

        // Calcula resumo DRE
        const resumoDRE = calcularResumoDRE(contas);

        const data: BalanceteData = {
            empresa: empresa || 'Empresa não identificada',
            periodo: {
                inicio: periodoInicio,
                fim: periodoFim,
            },
            meses,
            contas,
            resumoDRE,
        };

        return {
            success: true,
            data,
            warnings: warnings.length > 0 ? warnings : undefined,
        };

    } catch (error) {
        return {
            success: false,
            error: 'Erro ao processar o balancete',
            details: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Filtra apenas contas sintéticas relevantes para análise
 */
export function filterContasSinteticas(contas: ContaBalancete[]): ContaBalancete[] {
    // Contas sintéticas geralmente têm códigos menores e nomes em maiúsculas
    // ou são as contas-mãe (sem filhas específicas)

    const codigosRelevantes = [
        // Receitas
        2089, 2097, 2100, 2119, 2160, 2194, 2330,
        // Custos
        2763, 2771, 2780, 2798,
        // Despesas
        2925, 2933, 2941, 3026, 3085, 3433, 3514,
    ];

    return contas.filter(c =>
        codigosRelevantes.includes(c.codigo) ||
        c.nome === c.nome.toUpperCase() // Nome todo em maiúsculas = sintética
    );
}
