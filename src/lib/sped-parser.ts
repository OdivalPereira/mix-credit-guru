/**
 * SPED Parser
 * Parser local para arquivos SPED Contábil (ECD) e Fiscal (ECF)
 * 
 * Este parser extrai dados relevantes para análise tributária
 * 100% local, sem custo de API.
 * 
 * Referências:
 * - Layout ECD: http://sped.rfb.gov.br/pasta/show/1569
 * - Layout ECF: http://sped.rfb.gov.br/pasta/show/1644
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SpedEmpresa {
    cnpj: string;
    razao_social: string;
    uf?: string;
    municipio?: string;
    cnae_principal?: string;
}

export interface SpedPeriodo {
    inicio: Date;
    fim: Date;
    ano: number;
}

export interface SpedDRE {
    receita_bruta: number;
    deducoes_receita: number;
    receita_liquida: number;
    cmv: number;
    lucro_bruto: number;
    despesas_operacionais: number;
    despesas_administrativas: number;
    despesas_pessoal: number;
    resultado_operacional: number;
    resultado_financeiro: number;
    lucro_antes_ir: number;
    irpj_csll: number;
    lucro_liquido: number;
}

export interface SpedBalanco {
    ativo_total: number;
    passivo_total: number;
    patrimonio_liquido: number;
}

export interface SpedTributos {
    pis_cofins_pagos: number;
    irpj_csll_pagos: number;
    icms_iss_pagos: number;
    simples_nacional?: number;
}

export interface SpedLALUR {
    lucro_contabil: number;
    adicoes: number;
    exclusoes: number;
    lucro_real_antes_compensacao: number;
    compensacao_prejuizos: number;
    lucro_real: number;
}

export interface SpedData {
    tipo: 'ECD' | 'ECF' | 'DESCONHECIDO';
    versao?: string;
    empresa: SpedEmpresa;
    periodo: SpedPeriodo;
    dre?: SpedDRE;
    balanco?: SpedBalanco;
    tributos?: SpedTributos;
    lalur?: SpedLALUR;
    folha_pagamento?: number;
    regime_tributario?: 'simples' | 'presumido' | 'real';
    observacoes: string[];
    linhasProcessadas: number;
    erros: string[];
}

interface RegistroSPED {
    tipo: string;
    campos: string[];
    linha: number;
}

// ============================================================================
// PARSER PRINCIPAL
// ============================================================================

/**
 * Parse de arquivo SPED (ECD ou ECF)
 * @param content Conteúdo do arquivo SPED (texto)
 * @returns Dados estruturados extraídos
 */
export function parseSpedFile(content: string): SpedData {
    const linhas = content.split(/\r?\n/).filter(l => l.trim());
    const result: SpedData = {
        tipo: 'DESCONHECIDO',
        empresa: { cnpj: '', razao_social: '' },
        periodo: { inicio: new Date(), fim: new Date(), ano: 0 },
        observacoes: [],
        linhasProcessadas: 0,
        erros: []
    };

    if (linhas.length === 0) {
        result.erros.push('Arquivo vazio');
        return result;
    }

    // Parse cada linha
    const registros = linhas.map((linha, index) => parseLinhaSpedSped(linha, index + 1));
    result.linhasProcessadas = registros.length;

    // Identificar tipo de arquivo (ECD ou ECF)
    const reg0000 = registros.find(r => r.tipo === '0000');
    if (reg0000) {
        const tipoArquivo = reg0000.campos[1]; // Campo 02 do registro 0000
        if (tipoArquivo === 'LECD') {
            result.tipo = 'ECD';
        } else if (tipoArquivo === 'LECF') {
            result.tipo = 'ECF';
        }
        result.versao = reg0000.campos[2];
    }

    // Extrair dados da empresa
    extractEmpresaData(registros, result);

    // Extrair período
    extractPeriodoData(registros, result);

    // Processar de acordo com o tipo
    if (result.tipo === 'ECD') {
        processECD(registros, result);
    } else if (result.tipo === 'ECF') {
        processECF(registros, result);
    } else {
        // Tentar processar como genérico
        processGenerico(registros, result);
    }

    return result;
}

/**
 * Parse de uma linha do arquivo SPED
 */
function parseLinhaSpedSped(linha: string, numeroLinha: number): RegistroSPED {
    // Formato SPED: |REG|CAMPO1|CAMPO2|...|
    const campos = linha.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
    const tipo = campos[0] || '';

    return {
        tipo,
        campos,
        linha: numeroLinha
    };
}

// ============================================================================
// EXTRAÇÃO DE DADOS
// ============================================================================

function extractEmpresaData(registros: RegistroSPED[], result: SpedData): void {
    // Registro 0000 - Abertura
    const reg0000 = registros.find(r => r.tipo === '0000');
    if (reg0000) {
        // ECD: Campo 06 = CNPJ, Campo 07 = Nome
        // ECF: Campo 05 = CNPJ, Campo 06 = Nome
        if (result.tipo === 'ECD') {
            result.empresa.cnpj = formatCNPJ(reg0000.campos[5] || '');
            result.empresa.razao_social = reg0000.campos[6] || '';
            result.empresa.uf = reg0000.campos[7] || '';
        } else {
            result.empresa.cnpj = formatCNPJ(reg0000.campos[4] || '');
            result.empresa.razao_social = reg0000.campos[5] || '';
            result.empresa.uf = reg0000.campos[6] || '';
        }
    }

    // Registro 0010 (ECF) - Parâmetros de tributação
    const reg0010 = registros.find(r => r.tipo === '0010');
    if (reg0010) {
        const formaApuracao = reg0010.campos[1];
        if (formaApuracao === 'T') {
            result.regime_tributario = 'real';
            result.observacoes.push('Regime: Lucro Real Trimestral');
        } else if (formaApuracao === 'A') {
            result.regime_tributario = 'real';
            result.observacoes.push('Regime: Lucro Real Anual (Estimativa)');
        } else if (formaApuracao === 'P') {
            result.regime_tributario = 'presumido';
            result.observacoes.push('Regime: Lucro Presumido');
        }
    }

    // Tentar extrair CNAE do registro 0020 (se existir)
    const reg0020 = registros.find(r => r.tipo === '0020');
    if (reg0020 && reg0020.campos[1]) {
        result.empresa.cnae_principal = formatCNAE(reg0020.campos[1]);
    }
}

function extractPeriodoData(registros: RegistroSPED[], result: SpedData): void {
    const reg0000 = registros.find(r => r.tipo === '0000');
    if (reg0000) {
        // Data início e fim no registro 0000
        const dataInicioStr = reg0000.campos[3] || reg0000.campos[2];
        const dataFimStr = reg0000.campos[4] || reg0000.campos[3];

        result.periodo.inicio = parseDataSPED(dataInicioStr);
        result.periodo.fim = parseDataSPED(dataFimStr);
        result.periodo.ano = result.periodo.fim.getFullYear();
    }
}

// ============================================================================
// PROCESSAMENTO ECD (Escrituração Contábil Digital)
// ============================================================================

function processECD(registros: RegistroSPED[], result: SpedData): void {
    result.dre = {
        receita_bruta: 0,
        deducoes_receita: 0,
        receita_liquida: 0,
        cmv: 0,
        lucro_bruto: 0,
        despesas_operacionais: 0,
        despesas_administrativas: 0,
        despesas_pessoal: 0,
        resultado_operacional: 0,
        resultado_financeiro: 0,
        lucro_antes_ir: 0,
        irpj_csll: 0,
        lucro_liquido: 0
    };

    result.balanco = {
        ativo_total: 0,
        passivo_total: 0,
        patrimonio_liquido: 0
    };

    // J100 - Balanço Patrimonial
    const regsJ100 = registros.filter(r => r.tipo === 'J100');
    for (const reg of regsJ100) {
        const codigoConta = reg.campos[2] || '';
        const descricao = (reg.campos[3] || '').toUpperCase();
        const valor = parseValorSPED(reg.campos[5] || reg.campos[4]);
        const indicador = reg.campos[4] || 'D'; // D = Devedor, C = Credor

        // Identificar contas pelo código ou descrição
        if (descricao.includes('ATIVO') && descricao.includes('TOTAL')) {
            result.balanco.ativo_total = valor;
        } else if (descricao.includes('PASSIVO') && descricao.includes('TOTAL')) {
            result.balanco.passivo_total = valor;
        } else if (descricao.includes('PATRIMONIO') || descricao.includes('PATRIMÔNIO')) {
            result.balanco.patrimonio_liquido = valor;
        }
    }

    // J150 - Demonstração do Resultado do Exercício (DRE)
    const regsJ150 = registros.filter(r => r.tipo === 'J150');
    for (const reg of regsJ150) {
        const codigoConta = reg.campos[2] || '';
        const descricao = (reg.campos[3] || '').toUpperCase();
        const valor = parseValorSPED(reg.campos[5] || reg.campos[4]);

        // Mapear contas da DRE
        if (descricao.includes('RECEITA BRUTA') || descricao.includes('RECEITAS BRUTAS')) {
            result.dre.receita_bruta += Math.abs(valor);
        } else if (descricao.includes('DEDUCOES') || descricao.includes('DEDUÇÕES')) {
            result.dre.deducoes_receita += Math.abs(valor);
        } else if (descricao.includes('RECEITA LIQUIDA') || descricao.includes('RECEITA LÍQUIDA')) {
            result.dre.receita_liquida = Math.abs(valor);
        } else if (descricao.includes('CUSTO') && (descricao.includes('MERCADORIA') || descricao.includes('VENDA'))) {
            result.dre.cmv += Math.abs(valor);
        } else if (descricao.includes('LUCRO BRUTO') || descricao.includes('RESULTADO BRUTO')) {
            result.dre.lucro_bruto = valor;
        } else if (descricao.includes('DESPESA') && descricao.includes('PESSOAL')) {
            result.dre.despesas_pessoal += Math.abs(valor);
        } else if (descricao.includes('DESPESA') && descricao.includes('ADMINISTRA')) {
            result.dre.despesas_administrativas += Math.abs(valor);
        } else if (descricao.includes('DESPESA') && descricao.includes('OPERACION')) {
            result.dre.despesas_operacionais += Math.abs(valor);
        } else if (descricao.includes('RESULTADO') && descricao.includes('FINANCEIRO')) {
            result.dre.resultado_financeiro = valor;
        } else if (descricao.includes('LUCRO ANTES') || descricao.includes('LAIR')) {
            result.dre.lucro_antes_ir = valor;
        } else if (descricao.includes('IRPJ') || descricao.includes('CSLL')) {
            result.dre.irpj_csll += Math.abs(valor);
        } else if (descricao.includes('LUCRO LIQUIDO') || descricao.includes('LUCRO LÍQUIDO') || descricao.includes('RESULTADO DO EXERCICIO')) {
            result.dre.lucro_liquido = valor;
        }
    }

    // Calcular receita líquida se não encontrada
    if (result.dre.receita_liquida === 0 && result.dre.receita_bruta > 0) {
        result.dre.receita_liquida = result.dre.receita_bruta - result.dre.deducoes_receita;
    }

    // Estimar folha de pagamento baseado em despesas de pessoal
    if (result.dre.despesas_pessoal > 0) {
        result.folha_pagamento = result.dre.despesas_pessoal;
        result.observacoes.push(`Folha de pagamento estimada: R$ ${result.folha_pagamento.toLocaleString('pt-BR')}`);
    }
}

// ============================================================================
// PROCESSAMENTO ECF (Escrituração Contábil Fiscal)
// ============================================================================

function processECF(registros: RegistroSPED[], result: SpedData): void {
    result.dre = {
        receita_bruta: 0,
        deducoes_receita: 0,
        receita_liquida: 0,
        cmv: 0,
        lucro_bruto: 0,
        despesas_operacionais: 0,
        despesas_administrativas: 0,
        despesas_pessoal: 0,
        resultado_operacional: 0,
        resultado_financeiro: 0,
        lucro_antes_ir: 0,
        irpj_csll: 0,
        lucro_liquido: 0
    };

    result.tributos = {
        pis_cofins_pagos: 0,
        irpj_csll_pagos: 0,
        icms_iss_pagos: 0
    };

    result.lalur = {
        lucro_contabil: 0,
        adicoes: 0,
        exclusoes: 0,
        lucro_real_antes_compensacao: 0,
        compensacao_prejuizos: 0,
        lucro_real: 0
    };

    // L100 - Balanço (ECF)
    const regsL100 = registros.filter(r => r.tipo === 'L100');
    for (const reg of regsL100) {
        const codigo = reg.campos[1];
        const valor = parseValorSPED(reg.campos[3] || reg.campos[2]);

        // Códigos do L100 - Balanço
        if (codigo === '1') result.balanco = { ...result.balanco!, ativo_total: valor };
        if (codigo === '2') result.balanco = { ...result.balanco!, passivo_total: valor };
    }

    // L200 - Informações para cálculo do IRPJ/CSLL Lucro Presumido
    const regsL200 = registros.filter(r => r.tipo === 'L200');
    for (const reg of regsL200) {
        const codigo = reg.campos[1];
        const valor = parseValorSPED(reg.campos[3] || reg.campos[2]);

        if (codigo === '1') {
            result.dre.receita_bruta = valor;
        }
    }

    // L300 - DRE
    const regsL300 = registros.filter(r => r.tipo === 'L300');
    for (const reg of regsL300) {
        const codigo = reg.campos[1];
        const descricao = (reg.campos[2] || '').toUpperCase();
        const valor = parseValorSPED(reg.campos[4] || reg.campos[3]);

        // Mapear códigos da DRE do ECF
        if (codigo === '3.01.01.01') {
            result.dre.receita_bruta = valor;
        } else if (codigo?.startsWith('3.01.01.02')) {
            result.dre.deducoes_receita += Math.abs(valor);
        } else if (codigo === '3.01.01') {
            result.dre.receita_liquida = valor;
        } else if (codigo?.startsWith('3.01.02')) {
            result.dre.cmv += Math.abs(valor);
        } else if (codigo === '3.01') {
            result.dre.lucro_bruto = valor;
        } else if (codigo === '3.11') {
            result.dre.lucro_antes_ir = valor;
        } else if (codigo?.startsWith('3.12')) {
            result.dre.irpj_csll += Math.abs(valor);
        } else if (codigo === '3.13' || codigo === '3') {
            result.dre.lucro_liquido = valor;
        }
    }

    // M300 - LALUR (Parte A)
    const regsM300 = registros.filter(r => r.tipo === 'M300');
    for (const reg of regsM300) {
        const codigo = reg.campos[1];
        const valor = parseValorSPED(reg.campos[3] || reg.campos[2]);

        if (codigo === '1') result.lalur!.lucro_contabil = valor;
        if (codigo === '2') result.lalur!.adicoes = valor;
        if (codigo === '3') result.lalur!.exclusoes = valor;
        if (codigo === '4') result.lalur!.lucro_real_antes_compensacao = valor;
        if (codigo === '5') result.lalur!.compensacao_prejuizos = valor;
        if (codigo === '6') result.lalur!.lucro_real = valor;
    }

    // N620/N630 - Apuração IRPJ/CSLL
    const regsN620 = registros.filter(r => r.tipo === 'N620' || r.tipo === 'N630');
    for (const reg of regsN620) {
        const codigo = reg.campos[1];
        const valor = parseValorSPED(reg.campos[3] || reg.campos[2]);

        if (codigo === '12' || codigo === '13') { // IRPJ ou CSLL a pagar
            result.tributos!.irpj_csll_pagos += valor;
        }
    }

    // Y520 - Pagamentos PIS/COFINS (se disponível)
    const regsY520 = registros.filter(r => r.tipo === 'Y520');
    for (const reg of regsY520) {
        const valor = parseValorSPED(reg.campos[2] || reg.campos[1]);
        result.tributos!.pis_cofins_pagos += valor;
    }

    // Se não encontrou DRE específica, tentar calcular
    if (result.dre.receita_liquida === 0 && result.dre.receita_bruta > 0) {
        result.dre.receita_liquida = result.dre.receita_bruta - result.dre.deducoes_receita;
    }

    if (result.dre.receita_bruta > 0) {
        result.observacoes.push(`Receita bruta extraída: R$ ${result.dre.receita_bruta.toLocaleString('pt-BR')}`);
    }

    if (result.lalur && result.lalur.lucro_real !== 0) {
        result.observacoes.push(`Lucro Real apurado: R$ ${result.lalur.lucro_real.toLocaleString('pt-BR')}`);
    }
}

// ============================================================================
// PROCESSAMENTO GENÉRICO
// ============================================================================

function processGenerico(registros: RegistroSPED[], result: SpedData): void {
    result.observacoes.push('Arquivo processado em modo genérico');

    // Tentar extrair qualquer valor monetário significativo
    let maiorValor = 0;

    for (const reg of registros) {
        for (const campo of reg.campos) {
            const valor = parseValorSPED(campo);
            if (valor > maiorValor && valor < 1e12) { // Evitar lixo
                maiorValor = valor;
            }
        }
    }

    if (maiorValor > 0) {
        result.observacoes.push(`Maior valor encontrado: R$ ${maiorValor.toLocaleString('pt-BR')}`);
    }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function parseDataSPED(dataStr: string): Date {
    if (!dataStr || dataStr.length !== 8) {
        return new Date();
    }

    // Formato DDMMAAAA
    const dia = parseInt(dataStr.substring(0, 2));
    const mes = parseInt(dataStr.substring(2, 4)) - 1;
    const ano = parseInt(dataStr.substring(4, 8));

    return new Date(ano, mes, dia);
}

function parseValorSPED(valorStr: string): number {
    if (!valorStr) return 0;

    // Formato SPED: número com vírgula como separador decimal
    // Pode ter sinal no final (D para débito/devedor, C para crédito/credor)
    let str = valorStr.trim();
    let multiplicador = 1;

    if (str.endsWith('D')) {
        str = str.slice(0, -1);
    } else if (str.endsWith('C')) {
        str = str.slice(0, -1);
        multiplicador = -1; // Créditos são negativos na DRE
    }

    // Remover pontos de milhar e converter vírgula para ponto
    str = str.replace(/\./g, '').replace(',', '.');

    const valor = parseFloat(str);
    return isNaN(valor) ? 0 : valor * multiplicador;
}

function formatCNPJ(cnpj: string): string {
    const numeros = cnpj.replace(/\D/g, '');
    if (numeros.length !== 14) return cnpj;

    return numeros.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
    );
}

function formatCNAE(cnae: string): string {
    const numeros = cnae.replace(/\D/g, '');
    if (numeros.length !== 7) return cnae;

    return `${numeros.substring(0, 4)}-${numeros.substring(4, 5)}/${numeros.substring(5, 7)}`;
}

// ============================================================================
// EXPORTS ADICIONAIS
// ============================================================================

/**
 * Verifica se um arquivo é SPED pelo conteúdo
 */
export function isSpedFile(content: string): boolean {
    const firstLine = content.split(/\r?\n/)[0] || '';
    return firstLine.startsWith('|0000|');
}

/**
 * Extrai resumo rápido para preview
 */
export function getSpedSummary(data: SpedData): string {
    const parts: string[] = [];

    if (data.empresa.razao_social) {
        parts.push(`Empresa: ${data.empresa.razao_social}`);
    }

    if (data.periodo.ano) {
        parts.push(`Ano: ${data.periodo.ano}`);
    }

    if (data.tipo !== 'DESCONHECIDO') {
        parts.push(`Tipo: ${data.tipo}`);
    }

    if (data.dre?.receita_bruta) {
        parts.push(`Receita: R$ ${data.dre.receita_bruta.toLocaleString('pt-BR')}`);
    }

    return parts.join(' | ');
}
