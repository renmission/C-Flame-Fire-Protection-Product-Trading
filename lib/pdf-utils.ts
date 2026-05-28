/**
 * Utility functions for generating PDF documents using pdf-lib.
 */

import { PDFDocument, PDFFont, rgb, StandardFonts } from "pdf-lib";

export function escapeHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return "";
  const str = String(text);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatMoney(amount: unknown): string {
  if (amount === null || amount === undefined) return "₱0.00";
  const num =
    typeof amount === "string" ? parseFloat(amount) : typeof amount === "number" ? amount : 0;
  return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: unknown): string {
  if (!date) return "";
  const d =
    typeof date === "string"
      ? new Date(date)
      : date instanceof Date
        ? date
        : new Date(String(date));
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(date: unknown): string {
  if (!date) return "";
  const d =
    typeof date === "string"
      ? new Date(date)
      : date instanceof Date
        ? date
        : new Date(String(date));
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  generatedAt: Date;
  filters?: Record<string, string | null | undefined>;
  data: Record<string, unknown>[];
  columns: Array<{
    key: string;
    label: string;
    format?: (value: unknown) => string;
    align?: "left" | "right" | "center";
    width?: number;
  }>;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  if (!text) return [""];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

export async function generateReportPdf(options: PdfReportOptions): Promise<Buffer> {
  const { title, subtitle, generatedAt, filters, data, columns } = options;

  const pdfDoc = await PDFDocument.create();
  let currentPage = pdfDoc.addPage([595, 842]); // A4
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const pageWidth = currentPage.getWidth() - margin * 2;
  let y = currentPage.getHeight() - margin;

  const drawText = (
    text: string,
    x: number,
    yPos: number,
    opts: {
      font?: PDFFont;
      size?: number;
      color?: ReturnType<typeof rgb>;
      align?: "left" | "center" | "right";
      maxWidth?: number;
    } = {}
  ) => {
    const {
      font = helveticaFont,
      size = 10,
      color = rgb(0, 0, 0),
      align = "left",
      maxWidth: mw = pageWidth,
    } = opts;

    let finalX = x;
    if (align === "center") {
      finalX = x + (mw - font.widthOfTextAtSize(text, size)) / 2;
    } else if (align === "right") {
      finalX = x + mw - font.widthOfTextAtSize(text, size);
    }

    currentPage.drawText(text, { x: finalX, y: yPos, size, font, color });
  };

  // Title
  drawText(title, margin, y, {
    font: helveticaBoldFont,
    size: 18,
    align: "center",
    maxWidth: pageWidth,
  });
  y -= 30;

  // Subtitle
  if (subtitle) {
    drawText(subtitle, margin, y, {
      size: 12,
      color: rgb(0.4, 0.4, 0.4),
      align: "center",
      maxWidth: pageWidth,
    });
    y -= 20;
  }

  // Filters
  if (filters && Object.keys(filters).length > 0) {
    const filterText = Object.entries(filters)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");
    drawText(filterText, margin, y, {
      size: 9,
      color: rgb(0.4, 0.4, 0.4),
      align: "center",
      maxWidth: pageWidth,
    });
    y -= 15;
  }

  // Generated date
  drawText(`Generated: ${formatDateTime(generatedAt)}`, margin, y, {
    size: 9,
    color: rgb(0.4, 0.4, 0.4),
    align: "right",
    maxWidth: pageWidth,
  });
  y -= 25;

  // Table
  if (data.length === 0) {
    drawText("No data available for this report.", margin, y, {
      size: 11,
      color: rgb(0.6, 0.6, 0.6),
      align: "center",
      maxWidth: pageWidth,
    });
  } else {
    const totalWidth = columns.reduce((sum, col) => sum + (col.width || 100), 0);
    const scale = (pageWidth - 20) / totalWidth;
    const colWidths = columns.map((col) => (col.width || 100) * scale - 5);

    const FONT_SIZE = 9;
    const LINE_HEIGHT = 12;
    const CELL_SIDE_PAD = 3;

    // Pre-wrap header labels to compute header height
    const headerLabelLines = columns.map((col, idx) =>
      wrapText(col.label.toUpperCase(), helveticaBoldFont, 8, colWidths[idx] - CELL_SIDE_PAD * 2)
    );
    const maxHeaderLines = Math.max(...headerLabelLines.map((l) => l.length));
    const headerHeight = maxHeaderLines * 11 + 10;

    const drawTableHeader = () => {
      currentPage.drawRectangle({
        x: margin,
        y: y - headerHeight,
        width: pageWidth,
        height: headerHeight,
        color: rgb(0.12, 0.16, 0.22),
      });
      let x = margin;
      columns.forEach((col, idx) => {
        headerLabelLines[idx].forEach((line, lineIdx) => {
          currentPage.drawText(line, {
            x: x + CELL_SIDE_PAD,
            y: y - 8 - lineIdx * 11,
            size: 8,
            font: helveticaBoldFont,
            color: rgb(1, 1, 1),
          });
        });
        x += colWidths[idx] + 5;
      });
      y -= headerHeight + 5;
    };

    drawTableHeader();

    data.forEach((row, rowIdx) => {
      // Pre-wrap all cells in this row
      const cellLines = columns.map((col, colIdx) => {
        const value = row[col.key];
        const text = col.format ? col.format(value) : String(value ?? "");
        return wrapText(text, helveticaFont, FONT_SIZE, colWidths[colIdx] - CELL_SIDE_PAD * 2);
      });

      const numLines = Math.max(...cellLines.map((l) => l.length));
      const rowHeight = numLines * LINE_HEIGHT + 8;

      // Page break: check before drawing
      if (y - rowHeight < margin + headerHeight + 20) {
        currentPage = pdfDoc.addPage([595, 842]);
        y = 842 - margin;
        drawTableHeader();
      }

      // Alternate row background
      if (rowIdx % 2 === 1) {
        currentPage.drawRectangle({
          x: margin,
          y: y - rowHeight,
          width: pageWidth,
          height: rowHeight,
          color: rgb(0.98, 0.98, 0.98),
        });
      }

      // Draw cell text line by line
      let x = margin;
      columns.forEach((col, colIdx) => {
        const lines = cellLines[colIdx];
        const colWidth = colWidths[colIdx];
        const align = col.align || "left";

        lines.forEach((line, lineIdx) => {
          let textX = x + CELL_SIDE_PAD;
          if (align === "right") {
            textX = x + colWidth - CELL_SIDE_PAD - helveticaFont.widthOfTextAtSize(line, FONT_SIZE);
          } else if (align === "center") {
            textX = x + (colWidth - helveticaFont.widthOfTextAtSize(line, FONT_SIZE)) / 2;
          }

          currentPage.drawText(line, {
            x: Math.max(x + CELL_SIDE_PAD, textX),
            y: y - 15 - lineIdx * LINE_HEIGHT,
            size: FONT_SIZE,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        });

        x += colWidth + 5;
      });

      // Row separator
      currentPage.drawLine({
        start: { x: margin, y: y - rowHeight },
        end: { x: margin + pageWidth, y: y - rowHeight },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.9),
      });

      y -= rowHeight;
    });
  }

  // Footer
  y -= 20;
  if (y < margin + 15) {
    currentPage = pdfDoc.addPage([595, 842]);
    y = 50;
  }
  drawText(`C'FLAME - Generated on ${formatDateTime(generatedAt)}`, margin, y, {
    size: 8,
    color: rgb(0.6, 0.6, 0.6),
    align: "center",
    maxWidth: pageWidth,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// Legacy HTML function for backward compatibility (if needed)
export function generateReportPdfHtml(options: PdfReportOptions): string {
  const { title, subtitle, generatedAt, filters, data, columns } = options;

  const filtersHtml = filters
    ? Object.entries(filters)
        .filter(([_, value]) => value)
        .map(
          ([key, value]) => `<div><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</div>`
        )
        .join("")
    : "";

  const tableRows = data
    .map((row) => {
      const cells = columns
        .map((col) => {
          const value = row[col.key];
          const formatted = col.format ? col.format(value) : escapeHtml(String(value ?? ""));
          const align = col.align || "left";
          return `<td style="text-align: ${align}">${formatted}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const tableHeaders = columns
    .map((col) => {
      const align = col.align || "left";
      return `<th style="text-align: ${align}">${escapeHtml(col.label)}</th>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    @media print {
      @page {
        margin: 15mm;
        size: A4;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1f2937;
      margin: 0;
      padding: 20px;
      background: white;
    }
    .header {
      margin-bottom: 24px;
      border-bottom: 2px solid #1f2937;
      padding-bottom: 16px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 8px 0;
      color: #1f2937;
    }
    .header .subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
      font-size: 11px;
      color: #6b7280;
    }
    .filters {
      margin: 16px 0;
      padding: 12px;
      background: #f9fafb;
      border-radius: 4px;
      font-size: 11px;
    }
    .filters div {
      margin: 4px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      font-size: 11px;
    }
    thead {
      background: #1f2937;
      color: white;
    }
    th {
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    tbody tr:hover {
      background: #f9fafb;
    }
    tbody tr:last-child td {
      border-bottom: none;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #6b7280;
    }
    .no-data {
      text-align: center;
      padding: 40px;
      color: #6b7280;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
    <div class="meta">
      <div>Generated: ${formatDateTime(generatedAt)}</div>
      <div>C'FLAME</div>
    </div>
    ${filtersHtml ? `<div class="filters">${filtersHtml}</div>` : ""}
  </div>
  
  ${
    data.length > 0
      ? `
  <table>
    <thead>
      <tr>${tableHeaders}</tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  `
      : `<div class="no-data">No data available for this report.</div>`
  }
  
  <div class="footer">
    <p>This report was generated by C'FLAME on ${formatDateTime(generatedAt)}</p>
  </div>
</body>
</html>`;
}
