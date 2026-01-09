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
      #pdf-export-container {
        color: #1f2937;
        background: #ffffff;
      }
      #pdf-export-container h1 { 
        color: #1e3a8a; 
        font-size: 20pt; 
        margin-top: 24px;
        margin-bottom: 12px;
        border-bottom: 2px solid #1e3a8a;
        padding-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      #pdf-export-container h2 { 
        color: #1e40af; 
        font-size: 16pt; 
        margin-top: 20px;
        margin-bottom: 10px;
        border-left: 4px solid #1e40af;
        padding-left: 10px;
      }
      #pdf-export-container h3 { 
        color: #3b82f6; 
        font-size: 13pt;
        margin-top: 16px; 
        margin-bottom: 8px;
        font-weight: 700;
      }
      #pdf-export-container p { margin: 10px 0; line-height: 1.6; }
      #pdf-export-container ul { margin: 10px 0; padding-left: 25px; list-style-type: none; }
      #pdf-export-container li { margin: 6px 0; position: relative; }
      #pdf-export-container li::before {
        content: "•";
        color: #3b82f6;
        font-weight: bold;
        display: inline-block; 
        width: 1em;
        margin-left: -1em;
      }
      
      /* Tabelas Profissionais */
      #pdf-export-container table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 20px 0;
        font-size: 10pt;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      #pdf-export-container th { 
        background: #1e3a8a; 
        color: white;
        font-weight: 600;
        padding: 12px 10px;
        text-align: left;
        text-transform: uppercase;
      }
      #pdf-export-container td { 
        border-bottom: 1px solid #e5e7eb; 
        padding: 10px;
        text-align: left;
      }
      #pdf-export-container tr:nth-child(even) {
        background: #f8fafc;
      }
      
      /* Boxes de Destaque */
      .box {
        padding: 15px;
        margin: 15px 0;
        border-radius: 8px;
        border-left: 5px solid #ccc;
      }
      .box-info { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
      .box-success { background: #f0fdf4; border-color: #22c55e; color: #166534; }
      .box-warning { background: #fffbeb; border-color: #f59e0b; color: #92400e; }
      .box-danger { background: #fef2f2; border-color: #ef4444; color: #991b1b; }
      .box-title { font-weight: 700; margin-bottom: 5px; display: block; text-transform: uppercase; font-size: 9pt; }

      #pdf-export-container .header {
        background: #1e3a8a;
        color: white;
        margin: -20mm -20mm 20mm -20mm;
        padding: 20px 20mm;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #pdf-export-container .header h1 {
        border: none;
        margin: 0;
        padding: 0;
        color: white;
        font-size: 18pt;
      }
      #pdf-export-container .header p {
        color: rgba(255,255,255,0.8);
        font-size: 9pt;
      }
      #pdf-export-container .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #e5e7eb;
        font-size: 9pt;
        color: #6b7280;
        text-align: center;
      }
      
      /* Utilitários */
      .text-right { text-align: right; }
      .font-bold { font-weight: bold; }
      .highlight { color: #1e40af; font-weight: 700; }
    </style>
    
    <div class="header">
      <div class="header-left">
        <h1>MIX CREDIT GURU</h1>
        <p>Relatório de Planejamento Tributário</p>
      </div>
      <div class="header-right" style="text-align: right;">
        <p><strong>${companyName || 'Empresa'}</strong></p>
        <p>Gerado em: ${new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })}</p>
      </div>
    </div>
    
    <div class="content">
      ${convertMarkdownToHTML(content)}
    </div>
    
    <div class="footer">
      <p>Este documento é uma análise consultiva gerada por Inteligência Artificial (Gemini Pro).</p>
      <p>As projeções financeiras dependem da acurácia dos dados fornecidos e da legislação fiscal vigente.</p>
      <p><strong>Mix Credit Guru &copy; 2026 - Todos os direitos reservados.</strong></p>
    </div>
  `;

  return container;
}

/**
 * Enhanced Markdown to HTML converter for professional PDF
 */
function convertMarkdownToHTML(markdown: string): string {
  let html = markdown;

  // 1. Tables (Markdown Table syntax)
  // Handle | col1 | col2 |
  html = html.replace(/\n(\|.*\|)\n(\|[-: |]*\|)\n((?:\|.*\|\n?)*)/g, (match, header, divider, rows) => {
    const parseRow = (row: string) => row.split('|').filter(c => c.trim() !== '').map(c => `<td>${c.trim()}</td>`).join('');
    const headerCells = header.split('|').filter((c: string) => c.trim() !== '').map((c: string) => `<th>${c.trim()}</th>`).join('');
    const bodyRows = rows.split('\n').filter((r: string) => r.trim() !== '').map((r: string) => `<tr>${parseRow(r)}</tr>`).join('');

    return `\n<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>\n`;
  });

  // 2. Headings
  html = html
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 3. Highlight Boxes (Custom syntax or interpreting emojis)
  // [!] Box Danger, [?] Box Info, [OK] Box Success, [i] Box Info
  const boxPatterns = [
    { pattern: /\[!\] (.*)/gim, class: 'box-danger', title: 'Atenção / Risco' },
    { pattern: /\[\?\] (.*)/gim, class: 'box-info', title: 'Insight / Dica' },
    { pattern: /\[OK\] (.*)/gim, class: 'box-success', title: 'Recomendação' },
    { pattern: /\[i\] (.*)/gim, class: 'box-info', title: 'Informação' },
    { pattern: /\[DICA\] (.*)/gim, class: 'box-info', title: 'Sugestão Estratégica' },
    { pattern: /\[AVISO\] (.*)/gim, class: 'box-warning', title: 'Ponto de Atenção' }
  ];

  boxPatterns.forEach(bp => {
    html = html.replace(bp.pattern, `<div class="box ${bp.class}"><span class="box-title">${bp.title}</span>$1</div>`);
  });

  // 4. Basic Markdown
  html = html
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Unordered lists
    .replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');

  // 5. Cleanup Structure
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*<\/li>)(\s*<li>)/gim, '$1$2');
  html = html.replace(/(<li>.*<\/li>)/gis, (match) => `<ul>${match}</ul>`);
  html = html.replace(/<\/ul>\s*<ul>/gim, '');

  // Paragraphs and breaks
  html = html.replace(/\n\n/gim, '</p><p>');
  html = html.replace(/\n/gim, '<br/>');

  // Wrap generic text in paragraphs but avoid wrapping tags like div, table, h1-3
  html = html.replace(/^(?!<(?:[h]|div|table|ul|li|p|tr|thead|tbody|br))/gim, '<p>');
  html = html.replace(/(?<!>)$/gim, '</p>');

  // Clean up
  html = html.replace(/<p>\s*<\/p>/gim, '');
  html = html.replace(/<p><br\/><\/p>/gim, '');

  // 6. Emojis Styling
  html = html.replace(/([\u{1F300}-\u{1F9FF}])/gu, '<span style="font-size: 1.1em; margin-right: 4px;">$1</span>');

  return html;
}

