/**
 * Utilitários para processamento de arquivos no cliente
 */

/**
 * Lê um arquivo como texto com a codificação especificada
 */
export async function readFileAsText(file: File, encoding: string = 'latin1'): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file, encoding);
    });
}

/**
 * Extrai texto de um arquivo PDF usando a biblioteca pdf.js (carregada via CDN)
 */
export async function extractTextFromPDF(file: File): Promise<string> {
    // @ts-ignore - pdfjs carregado via CDN
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) {
        throw new Error('PDF.js não está carregado. Recarregue a página.');
    }

    console.log('[PDF Parser] Iniciando extração do PDF:', file.name);

    try {
        const arrayBuffer = await file.arrayBuffer();
        console.log('[PDF Parser] ArrayBuffer obtido, tamanho:', arrayBuffer.byteLength);

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        console.log('[PDF Parser] PDF carregado, páginas:', pdf.numPages);

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
            console.log(`[PDF Parser] Página ${i} processada, caracteres:`, pageText.length);
        }

        console.log('[PDF Parser] Extração completa, total de caracteres:', fullText.length);
        return fullText;
    } catch (error) {
        console.error('[PDF Parser] Erro ao extrair PDF:', error);
        throw new Error(`Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
}
