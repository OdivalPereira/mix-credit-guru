/**
 * Parser para Plano de Contas (CSV do SCI Sucessor)
 * 
 * Extrai a estrutura hierárquica do plano de contas para
 * auxiliar na classificação e análise do balancete
 */

import { PlanoContasData, ContaPlano, ParseResult } from './types';

/**
 * Determina o nível hierárquico pela classificação
 * "01" → 1, "01.1" → 2, "01.1.2" → 3, etc.
 */
function calcularNivel(classificacao: string): number {
    if (!classificacao) return 0;
    return classificacao.split('.').length;
}

/**
 * Determina o tipo de conta pela classificação
 */
function determinarTipo(classificacao: string): ContaPlano['tipo'] {
    if (!classificacao) return 'ATIVO';

    const primeiroDigito = classificacao.split('.')[0];

    switch (primeiroDigito) {
        case '01':
            return 'ATIVO';
        case '02':
            // Verifica se é custo ou despesa
            if (classificacao.startsWith('02.1')) return 'CUSTO';
            if (classificacao.startsWith('02.2')) return 'DESPESA';
            return 'DESPESA';
        case '03':
            return 'RECEITA';
        case '04':
            return 'PASSIVO';
        case '05':
            return 'PATRIMONIO_LIQUIDO';
        default:
            return 'ATIVO';
    }
}

/**
 * Parse de uma linha do CSV
 */
function parseLine(line: string): ContaPlano | null {
    // Remove BOM se presente
    const cleanLine = line.replace(/^\uFEFF/, '').trim();

    if (!cleanLine) return null;

    // Split por ponto-e-vírgula (separador brasileiro)
    const parts = cleanLine.split(';');

    if (parts.length < 3) return null;

    const codigo = parseInt(parts[0]);
    if (isNaN(codigo)) return null;

    const classificacao = parts[1]?.trim() || '';
    const nome = parts[2]?.trim() || '';
    const apelido = parts[3]?.trim() || '';

    // Pula linha de cabeçalho
    if (nome.toLowerCase() === 'nome' || classificacao.toLowerCase() === 'classificação') {
        return null;
    }

    // Campos opcionais
    const relatorio = parts[5]?.trim() || '';
    const conciliaAutomatico = parts[6]?.toUpperCase() === 'SIM';
    const contaObrigatoria = parts[7]?.toUpperCase() === 'SIM';

    return {
        codigo,
        classificacao,
        nome,
        apelido,
        relatorio,
        conciliaAutomatico,
        contaObrigatoria,
        nivel: calcularNivel(classificacao),
        tipo: determinarTipo(classificacao),
    };
}

/**
 * Parser principal do plano de contas
 */
export function parsePlanoContas(content: string): ParseResult<PlanoContasData> {
    const warnings: string[] = [];

    try {
        const lines = content.split('\n');
        const contas: ContaPlano[] = [];
        const contasPorCodigo = new Map<number, ContaPlano>();
        const contasPorClassificacao = new Map<string, ContaPlano>();

        // Extrai nome da empresa do título (se presente)
        let empresa = '';
        for (const line of lines.slice(0, 5)) {
            if (line.includes('Consulta do plano de contas')) {
                const match = line.match(/contas\s+\d+\s*-\s*(.+?)(?:\s*-\s*\d+|$)/i);
                if (match) {
                    empresa = match[1].trim();
                }
                break;
            }
        }

        // Parse das contas
        for (const line of lines) {
            const conta = parseLine(line);
            if (conta) {
                contas.push(conta);
                contasPorCodigo.set(conta.codigo, conta);
                if (conta.classificacao) {
                    contasPorClassificacao.set(conta.classificacao, conta);
                }
            }
        }

        if (contas.length === 0) {
            return {
                success: false,
                error: 'Nenhuma conta encontrada no plano',
                details: 'O arquivo pode não estar no formato CSV esperado',
            };
        }

        const data: PlanoContasData = {
            empresa: empresa || 'Empresa não identificada',
            contas,
            contasPorCodigo,
            contasPorClassificacao,
        };

        return {
            success: true,
            data,
            warnings: warnings.length > 0 ? warnings : undefined,
        };

    } catch (error) {
        return {
            success: false,
            error: 'Erro ao processar o plano de contas',
            details: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Filtra contas por tipo
 */
export function filterContasPorTipo(
    plano: PlanoContasData,
    tipo: ContaPlano['tipo']
): ContaPlano[] {
    return plano.contas.filter(c => c.tipo === tipo);
}

/**
 * Filtra contas por relatório (DRE, Balanço, etc.)
 */
export function filterContasPorRelatorio(
    plano: PlanoContasData,
    relatorio: string
): ContaPlano[] {
    return plano.contas.filter(c =>
        c.relatorio.toLowerCase().includes(relatorio.toLowerCase())
    );
}

/**
 * Busca conta por código
 */
export function findContaByCodigo(
    plano: PlanoContasData,
    codigo: number
): ContaPlano | undefined {
    return plano.contasPorCodigo.get(codigo);
}

/**
 * Busca conta por classificação
 */
export function findContaByClassificacao(
    plano: PlanoContasData,
    classificacao: string
): ContaPlano | undefined {
    return plano.contasPorClassificacao.get(classificacao);
}

/**
 * Retorna a hierarquia de uma conta (todas as contas-pai)
 */
export function getHierarquia(
    plano: PlanoContasData,
    classificacao: string
): ContaPlano[] {
    const hierarquia: ContaPlano[] = [];
    const parts = classificacao.split('.');

    let currentClass = '';
    for (const part of parts) {
        currentClass = currentClass ? `${currentClass}.${part}` : part;
        const conta = plano.contasPorClassificacao.get(currentClass);
        if (conta) {
            hierarquia.push(conta);
        }
    }

    return hierarquia;
}

/**
 * Retorna as contas-filhas diretas de uma conta
 */
export function getContasFilhas(
    plano: PlanoContasData,
    classificacaoPai: string
): ContaPlano[] {
    const nivelPai = calcularNivel(classificacaoPai);

    return plano.contas.filter(c =>
        c.classificacao.startsWith(classificacaoPai + '.') &&
        c.nivel === nivelPai + 1
    );
}
