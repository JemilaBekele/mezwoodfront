// lib/export.ts
import { IProduct } from '@/models/Product';
import * as XLSX from 'xlsx';

/**
 * Export data to Excel
 * @param data - Array of data to export
 * @param sheetName - Name of the Excel sheet
 * @param fileName - Name of the exported file
 * @param worksheetName - Optional worksheet name
 */
export const exportToExcel = async (
  data: unknown[],
  sheetName: string,
  fileName: string,
  worksheetName?: string
): Promise<void> => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName || sheetName);
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
};

/**
 * Format data for Excel export with specific columns
 */
export const formatProductDataForExcel = (products: IProduct[]) => {
  return products.map((product) => ({
    'Product Code': product.productCode,
    'Product Name': product.name,
    'Description': product.description || 'N/A',
    'Category': product.category?.name || 'N/A',
    'Status': product.isActive ? 'Active' : 'Inactive',
    'Created Date': new Date(product.createdAt).toLocaleDateString('en-US'),
  }));
};