import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { IProduct } from '@/models/Product';

export const exportToExcel = (data: IProduct[], filename: string = 'products') => {
  // Transform data for Excel export
  const excelData = data.map(product => ({
    'Product ID': product.id,
    'Product Code': product.productCode,
    'Name': product.name,
    // 'Generic Name': product.generic || '',
    'Description': product.description || '',
    'Category': product.category?.name || '',
    'Sell Price': product.sellPrice,
    'Status': product.isActive ? 'Active' : 'Inactive',
    'Created Date': new Date(product.createdAt).toLocaleDateString(),
    'Updated Date': new Date(product.updatedAt).toLocaleDateString(),
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Download file
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToCSV = (data: IProduct[], filename: string = 'products') => {
  const excelData = data.map(product => ({
    'Product ID': product.id,
    'Product Code': product.productCode,
    'Name': product.name,
    // 'Generic Name': product.generic || '',
    'Category': product.category?.name || '',
    'Sell Price': product.sellPrice,
    'Status': product.isActive ? 'Active' : 'Inactive',
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
};