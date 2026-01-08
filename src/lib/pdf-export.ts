/**
 * PDF Export Utility
 * 
 * Generates PDF documents from HTML content using jspdf + html2canvas.
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
    title?: string;
    filename?: string;
    orientation?: 'portrait' | 'landscape';
    format?: 'a4' | 'letter';
    margin?: number;
}

const DEFAULT_OPTIONS: PDFExportOptions = {
    title: 'Relatório Consultivo',
    filename: 'relatorio-tributario',
    orientation: 'portrait',
    format: 'a4',
    margin: 10,
};

/**
 * Exports an HTML element to PDF
 */
export async function exportToPDF(
    element: HTMLElement,
    options: PDFExportOptions = {}
): Promise<void> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
        // Capture HTML element as canvas
        const canvas = await html2canvas(element, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');

        // Create PDF
        const pdf = new jsPDF({
            orientation: opts.orientation,
            unit: 'mm',
            format: opts.format,
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = opts.margin || 10;

        const contentWidth = pdfWidth - (margin * 2);
        const contentHeight = (canvas.height * contentWidth) / canvas.width;

        // Add pages if content is taller than one page
        const position = margin;
        const pageHeight = pdfHeight - (margin * 2);

        if (contentHeight <= pageHeight) {
            // Single page
            pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
        } else {
            // Multiple pages - need to slice the canvas
            let remainingHeight = contentHeight;
            let sourceY = 0;
            const sourceHeight = canvas.height;
            const scaleFactor = contentWidth / canvas.width;

            while (remainingHeight > 0) {
                const sliceHeight = Math.min(pageHeight, remainingHeight);
                const sourceSliceHeight = sliceHeight / scaleFactor;

                // Create a temporary canvas for this slice
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = sourceSliceHeight;
                const ctx = sliceCanvas.getContext('2d');

                if (ctx) {
                    ctx.drawImage(
                        canvas,
                        0, sourceY, canvas.width, sourceSliceHeight,
                        0, 0, canvas.width, sourceSliceHeight
                    );

                    const sliceData = sliceCanvas.toDataURL('image/png');
                    pdf.addImage(sliceData, 'PNG', margin, margin, contentWidth, sliceHeight);
                }

                remainingHeight -= pageHeight;
                sourceY += sourceSliceHeight;

                if (remainingHeight > 0) {
                    pdf.addPage();
                }
            }
        }

        // Save the PDF
        const timestamp = new Date().toISOString().slice(0, 10);
        pdf.save(`${opts.filename}-${timestamp}.pdf`);

    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Falha ao gerar PDF. Tente novamente.');
    }
}

/**
 * Generates a styled container for PDF export
 * This creates a hidden element with proper styling for PDF rendering
 */
export function createPDFContainer(
    content: string,
    companyName?: string
): HTMLElement {
    const container = document.createElement('div');
    container.id = 'pdf-export-container';
    container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 210mm;
    padding: 20mm;
    background: white;
    color: black;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    font-size: 11pt;
    line-height: 1.6;
  `;

    // Build PDF content with header and styling
    container.innerHTML = `
    <style>
      #pdf-export-container h1 { 
        color: #1e40af; 
        font-size: 18pt; 
        margin-bottom: 8px;
        border-bottom: 2px solid #1e40af;
        padding-bottom: 8px;
      }
      #pdf-export-container h2 { 
        color: #1e3a8a; 
        font-size: 14pt; 
        margin-top: 16px;
        margin-bottom: 8px;
      }
      #pdf-export-container h3 { 
        color: #374151; 
        font-size: 12pt;
        margin-top: 12px; 
      }
      #pdf-export-container p { margin: 8px 0; }
      #pdf-export-container ul { margin: 8px 0; padding-left: 20px; }
      #pdf-export-container li { margin: 4px 0; }
      #pdf-export-container table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 12px 0;
      }
      #pdf-export-container th, #pdf-export-container td { 
        border: 1px solid #ddd; 
        padding: 8px;
        text-align: left;
      }
      #pdf-export-container th { 
        background: #f3f4f6; 
        font-weight: 600;
      }
      #pdf-export-container .header {
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 3px solid #1e40af;
      }
      #pdf-export-container .header h1 {
        border: none;
        margin: 0;
        padding: 0;
      }
      #pdf-export-container .header p {
        color: #6b7280;
        font-size: 10pt;
      }
      #pdf-export-container .footer {
        margin-top: 30px;
        padding-top: 15px;
        border-top: 1px solid #ddd;
        font-size: 9pt;
        color: #6b7280;
        text-align: center;
      }
    </style>
    
    <div class="header">
      <h1>📊 Relatório Consultivo Tributário</h1>
      <p><strong>${companyName || 'Empresa'}</strong></p>
      <p>Análise de Impacto da Reforma Tributária (IBS/CBS)</p>
      <p>Gerado em: ${new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })}</p>
    </div>
    
    <div class="content">
      ${convertMarkdownToHTML(content)}
    </div>
    
    <div class="footer">
      <p>Este relatório foi gerado automaticamente com auxílio de Inteligência Artificial.</p>
      <p>As projeções são estimativas baseadas nos dados informados e na legislação vigente.</p>
      <p>Consulte um especialista antes de tomar decisões tributárias.</p>
    </div>
  `;

    return container;
}

/**
 * Simple Markdown to HTML converter for PDF
 */
function convertMarkdownToHTML(markdown: string): string {
    return markdown
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        // Unordered lists
        .replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>')
        // Wrap consecutive <li> in <ul>
        .replace(/(<li>.*<\/li>)(\s*<li>)/gim, '$1$2')
        .replace(/(<li>.*<\/li>)/gis, (match) => `<ul>${match}</ul>`)
        // Fix nested ULs
        .replace(/<\/ul>\s*<ul>/gim, '')
        // Line breaks
        .replace(/\n\n/gim, '</p><p>')
        .replace(/\n/gim, '<br/>')
        // Wrap in paragraphs
        .replace(/^(?!<[hup]|<li|<ul)/gim, '<p>')
        .replace(/(?<!>)$/gim, '</p>')
        // Clean up empty paragraphs
        .replace(/<p>\s*<\/p>/gim, '')
        .replace(/<p><br\/><\/p>/gim, '')
        // Emojis (keep them)
        .replace(/([\u{1F300}-\u{1F9FF}])/gu, '<span style="font-size: 1.2em;">$1</span>');
}
