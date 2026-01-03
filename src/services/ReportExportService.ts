/**
 * Report Export Service
 * Handles PDF and Excel export functionality for all reports
 */

export interface ExportOptions {
  filename: string;
  title: string;
  data: any[];
  columns: Array<{ key: string; label: string }>;
}

export class ReportExportService {
  /**
   * Export data to CSV format
   */
  static exportToCSV(options: ExportOptions): void {
    const { filename, title, data, columns } = options;

    // Create CSV header
    const headers = columns.map(col => `"${col.label}"`).join(',');
    
    // Create CSV rows
    const rows = data.map(item =>
      columns.map(col => {
        const value = this.getNestedValue(item, col.key);
        const stringValue = String(value || '');
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',')
    );

    // Combine header and rows
    const csv = [headers, ...rows].join('\n');

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, `${filename}.csv`);
  }

  /**
   * Export data to Excel format (using CSV as fallback)
   * For true Excel support, integrate with xlsx library
   */
  static exportToExcel(options: ExportOptions): void {
    const { filename, title, data, columns } = options;

    // Create HTML table
    let html = `
      <table>
        <thead>
          <tr>
            <th colspan="${columns.length}" style="font-size: 16px; font-weight: bold; padding: 10px;">${title}</th>
          </tr>
          <tr>
            ${columns.map(col => `<th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0;">${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(item => `
            <tr>
              ${columns.map(col => {
                const value = this.getNestedValue(item, col.key);
                return `<td style="border: 1px solid #000; padding: 8px;">${value || ''}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Create blob and download
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    this.downloadFile(blob, `${filename}.xls`);
  }

  /**
   * Generate PDF content (returns HTML string for printing)
   */
  static generatePDFContent(options: ExportOptions): string {
    const { title, data, columns } = options;
    const timestamp = new Date().toLocaleString();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .page-break { page-break-after: always; }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              color: #0F172A;
            }
            .header p {
              margin: 5px 0;
              font-size: 12px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #0F172A;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              border: 1px solid #ddd;
            }
            td {
              padding: 10px;
              border: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: right;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Generated on ${timestamp}</p>
            <p>Total Records: ${data.length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  ${columns.map(col => {
                    const value = this.getNestedValue(item, col.key);
                    return `<td>${value || '-'}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This is a confidential report. Please handle with care.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Trigger browser print dialog
   */
  static printReport(htmlContent: string): void {
    const printWindow = window.open('', '', 'width=900,height=600');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  /**
   * Download file helper
   */
  private static downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get nested object value by dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }
}
