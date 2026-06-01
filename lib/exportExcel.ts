import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface StockLedgerExportData {
  Date: string;
  Type: string;
  Batch: string;
  Location: string;
  Branch: string;
  In: string;
  Out: string;
  Balance: string;
  'Reference/Invoice': string;
  User: string;
  Notes: string;
}

export const exportToExcel = (
  data: StockLedgerExportData[],
  filename: string,
  finalBalance: string
) => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Format data for Excel
  const formattedData = data.map((item) => ({
    ...item,
    In: item.In === '-' ? '' : item.In,
    Out: item.Out === '-' ? '' : item.Out
  }));

  // Add summary row
  const summaryRow = {
    Date: '',
    Type: 'SUMMARY',
    Batch: '',
    Location: '',
    Branch: '',
    In: '',
    Out: '',
    Balance: finalBalance,
    'Reference/Invoice': 'Final Balance',
    User: '',
    Notes: ''
  };

  // Create worksheet from data
  const worksheetData = [...formattedData, summaryRow];
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  // Set column widths
  const colWidths = [
    { wch: 20 }, // Date
    { wch: 15 }, // Type
    { wch: 15 }, // Batch
    { wch: 20 }, // Location
    { wch: 15 }, // Branch
    { wch: 10 }, // In
    { wch: 10 }, // Out
    { wch: 15 }, // Balance
    { wch: 25 }, // Reference/Invoice
    { wch: 20 }, // User
    { wch: 30 } // Notes
  ];
  worksheet['!cols'] = colWidths;

  // Style the summary row
  const lastRow = worksheetData.length;
  const summaryCellRef = XLSX.utils.encode_cell({ r: lastRow - 1, c: 7 }); // Balance column
  if (!worksheet[summaryCellRef]) {
    worksheet[summaryCellRef] = { t: 's', v: finalBalance };
  }
  worksheet[summaryCellRef].s = {
    font: { bold: true, sz: 12 },
    fill: { fgColor: { rgb: 'FFFFE0' } } // Light yellow background
  };

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Ledger');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  // Save file
  saveAs(blob, `${filename}.xlsx`);
};

// Alternative simple export function
export const simpleExportToExcel = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[],
  filename: string,
  headers: string[]
) => {
  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  // Generate and save file
  XLSX.writeFile(wb, `${filename}.xlsx`);
};
