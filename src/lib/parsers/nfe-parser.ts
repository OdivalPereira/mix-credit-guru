/**
 * NF-e XML Parser (Modelo 55)
 * 
 * Extrai dados de produtos de arquivos XML de Nota Fiscal Eletrônica
 * para importação no catálogo de produtos.
 */

import type { Produto, Unit } from '@/types/domain';
import { generateId } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Dados do produto extraídos da NF-e
 */
export interface NFeProduto {
    // Identificação
    cProd: string;        // Código do produto do emitente
    cEAN: string;         // EAN/GTIN
    xProd: string;        // Descrição do produto
    NCM: string;          // NCM
    CEST?: string;        // CEST

    // Unidade e quantidade
    uCom: string;         // Unidade comercial
    qCom: number;         // Quantidade comercial
    vUnCom: number;       // Valor unitário comercial

    // Tributação
    CFOP: string;         // CFOP

    // ICMS
    orig: string;         // Origem da mercadoria (0-8)
    CST_ICMS?: string;    // CST ICMS (regime normal)
    CSOSN?: string;       // CSOSN (Simples Nacional)
    pICMS?: number;       // Alíquota ICMS
    vICMS?: number;       // Valor ICMS
    pRedBC?: number;      // Percentual de redução da base de cálculo

    // PIS
    CST_PIS?: string;     // CST PIS
    pPIS?: number;        // Alíquota PIS
    vPIS?: number;        // Valor PIS

    // COFINS
    CST_COFINS?: string;  // CST COFINS
    pCOFINS?: number;     // Alíquota COFINS
    vCOFINS?: number;     // Valor COFINS

    // IPI (se houver)
    CST_IPI?: string;     // CST IPI
    pIPI?: number;        // Alíquota IPI
    vIPI?: number;        // Valor IPI
}

/**
 * Dados da NF-e extraídos
 */
export interface NFeData {
    // Identificação da NF-e
    chave: string;
    numero: string;
    serie: string;
    dataEmissao: string;

    // Emitente
    emitente: {
        cnpj: string;
        razaoSocial: string;
        uf: string;
    };

    // Produtos
    produtos: NFeProduto[];
}

export interface NFeParseResult {
    success: boolean;
    data?: NFeData;
    error?: string;
    warnings?: string[];
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extrai texto de um elemento XML
 */
function getText(parent: Element, tagName: string): string {
    const el = parent.getElementsByTagName(tagName)[0];
    return el?.textContent?.trim() || '';
}

/**
 * Extrai número de um elemento XML
 */
function getNumber(parent: Element, tagName: string): number {
    const text = getText(parent, tagName);
    return parseFloat(text) || 0;
}

/**
 * Mapeia unidade da NF-e para Unit do sistema
 */
function mapUnidade(uCom: string): Unit {
    const u = uCom.toUpperCase().trim();

    const mapping: Record<string, Unit> = {
        'UN': 'un',
        'UNID': 'un',
        'UNIDADE': 'un',
        'PC': 'un',
        'PÇ': 'un',
        'PCT': 'un',
        'KG': 'kg',
        'G': 'g',
        'GR': 'g',
        'L': 'l',
        'LT': 'l',
        'LITRO': 'l',
        'ML': 'ml',
        'TON': 'ton',
        'T': 'ton',
    };

    return mapping[u] || 'un';
}

// ============================================================================
// PARSER
// ============================================================================

/**
 * Faz o parse de um XML de NF-e e extrai os produtos
 */
export function parseNFeXML(xmlContent: string): NFeParseResult {
    const warnings: string[] = [];

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlContent, 'text/xml');

        // Verificar erros de parse
        const parserError = doc.querySelector('parsererror');
        if (parserError) {
            return {
                success: false,
                error: 'XML inválido: ' + parserError.textContent,
            };
        }

        // Verificar se é uma NF-e
        const nfeProc = doc.getElementsByTagName('nfeProc')[0] || doc.getElementsByTagName('NFe')[0];
        if (!nfeProc) {
            return {
                success: false,
                error: 'Documento não parece ser uma NF-e válida',
            };
        }

        const infNFe = doc.getElementsByTagName('infNFe')[0];
        if (!infNFe) {
            return {
                success: false,
                error: 'Elemento infNFe não encontrado',
            };
        }

        // Extrair chave de acesso
        const chave = infNFe.getAttribute('Id')?.replace('NFe', '') || '';

        // Identificação
        const ide = doc.getElementsByTagName('ide')[0];
        const numero = getText(ide, 'nNF');
        const serie = getText(ide, 'serie');
        const dataEmissao = getText(ide, 'dhEmi').substring(0, 10);

        // Emitente
        const emit = doc.getElementsByTagName('emit')[0];
        const emitente = {
            cnpj: getText(emit, 'CNPJ'),
            razaoSocial: getText(emit, 'xNome'),
            uf: getText(emit.getElementsByTagName('enderEmit')[0], 'UF'),
        };

        // Produtos
        const dets = doc.getElementsByTagName('det');
        const produtos: NFeProduto[] = [];

        for (let i = 0; i < dets.length; i++) {
            const det = dets[i];
            const prod = det.getElementsByTagName('prod')[0];
            const imposto = det.getElementsByTagName('imposto')[0];

            if (!prod) continue;

            // Dados do produto
            const produto: NFeProduto = {
                cProd: getText(prod, 'cProd'),
                cEAN: getText(prod, 'cEAN'),
                xProd: getText(prod, 'xProd'),
                NCM: getText(prod, 'NCM'),
                CEST: getText(prod, 'CEST') || undefined,
                uCom: getText(prod, 'uCom'),
                qCom: getNumber(prod, 'qCom'),
                vUnCom: getNumber(prod, 'vUnCom'),
                CFOP: getText(prod, 'CFOP'),
                orig: '0',
            };

            // ICMS
            if (imposto) {
                const icms = imposto.getElementsByTagName('ICMS')[0];
                if (icms) {
                    // Tentar diferentes grupos de ICMS
                    const icmsGroups = ['ICMS00', 'ICMS10', 'ICMS20', 'ICMS30', 'ICMS40',
                        'ICMS51', 'ICMS60', 'ICMS70', 'ICMS90',
                        'ICMSSN101', 'ICMSSN102', 'ICMSSN201', 'ICMSSN202',
                        'ICMSSN500', 'ICMSSN900'];

                    for (const groupName of icmsGroups) {
                        const group = icms.getElementsByTagName(groupName)[0];
                        if (group) {
                            produto.orig = getText(group, 'orig');
                            produto.CST_ICMS = getText(group, 'CST') || undefined;
                            produto.CSOSN = getText(group, 'CSOSN') || undefined;
                            produto.pICMS = getNumber(group, 'pICMS') || undefined;
                            produto.vICMS = getNumber(group, 'vICMS') || undefined;
                            produto.pRedBC = getNumber(group, 'pRedBC') || undefined;
                            break;
                        }
                    }
                }

                // PIS
                const pis = imposto.getElementsByTagName('PIS')[0];
                if (pis) {
                    const pisGroups = ['PISAliq', 'PISQtde', 'PISNT', 'PISOutr'];
                    for (const groupName of pisGroups) {
                        const group = pis.getElementsByTagName(groupName)[0];
                        if (group) {
                            produto.CST_PIS = getText(group, 'CST') || undefined;
                            produto.pPIS = getNumber(group, 'pPIS') || undefined;
                            produto.vPIS = getNumber(group, 'vPIS') || undefined;
                            break;
                        }
                    }
                }

                // COFINS
                const cofins = imposto.getElementsByTagName('COFINS')[0];
                if (cofins) {
                    const cofinsGroups = ['COFINSAliq', 'COFINSQtde', 'COFINSNT', 'COFINSOutr'];
                    for (const groupName of cofinsGroups) {
                        const group = cofins.getElementsByTagName(groupName)[0];
                        if (group) {
                            produto.CST_COFINS = getText(group, 'CST') || undefined;
                            produto.pCOFINS = getNumber(group, 'pCOFINS') || undefined;
                            produto.vCOFINS = getNumber(group, 'vCOFINS') || undefined;
                            break;
                        }
                    }
                }

                // IPI
                const ipi = imposto.getElementsByTagName('IPI')[0];
                if (ipi) {
                    const ipiTrib = ipi.getElementsByTagName('IPITrib')[0];
                    const ipiNT = ipi.getElementsByTagName('IPINT')[0];
                    const ipiGroup = ipiTrib || ipiNT;
                    if (ipiGroup) {
                        produto.CST_IPI = getText(ipiGroup, 'CST') || undefined;
                        produto.pIPI = getNumber(ipiGroup, 'pIPI') || undefined;
                        produto.vIPI = getNumber(ipiGroup, 'vIPI') || undefined;
                    }
                }
            }

            produtos.push(produto);
        }

        if (produtos.length === 0) {
            return {
                success: false,
                error: 'Nenhum produto encontrado na NF-e',
            };
        }

        return {
            success: true,
            data: {
                chave,
                numero,
                serie,
                dataEmissao,
                emitente,
                produtos,
            },
            warnings: warnings.length > 0 ? warnings : undefined,
        };

    } catch (error) {
        return {
            success: false,
            error: 'Erro ao processar XML: ' + (error instanceof Error ? error.message : String(error)),
        };
    }
}

/**
 * Converte produtos da NF-e para o formato do catálogo
 */
export function nfeProdutosToCatalogo(nfeProdutos: NFeProduto[]): Produto[] {
    return nfeProdutos.map(nfe => ({
        id: generateId('prod'),
        descricao: nfe.xProd,
        ncm: nfe.NCM,
        unidadePadrao: mapUnidade(nfe.uCom),
        categoria: '',
        cest: nfe.CEST || '',
        codigoInterno: nfe.cProd,
        ativo: true,
        flags: {
            refeicao: false,
            cesta: false,
            reducao: (nfe.pRedBC ?? 0) > 0,
            is: false,
        },
        componentes: [],
    }));
}
