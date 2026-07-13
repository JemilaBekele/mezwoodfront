/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IProformaInvoice, IProformaInvoiceItem } from '@/models/ProformaInvoice';
import { getCompanies } from '@/service/companyService';
import { normalizeImagePath } from './detail';

interface ICompany {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  addressTow?: string;
  tiktok?: string;
  logo?: string | File;
  socials?: string;
}

interface PDFGeneratorProps {
  invoice: IProformaInvoice;
  items: IProformaInvoiceItem[];
  totalPrice: number;
}

export const ProformaInvoicePDFGenerator: React.FC<PDFGeneratorProps> = ({
  invoice,
  items,
  totalPrice,
}) => {
  const [company, setCompany] = useState<ICompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const BRAND_BROWN = [164, 90, 42] as [number, number, number];
  const TEXT_BROWN = [170, 70, 35] as [number, number, number];

  const fetchCompanies = async () => {
    try {
      const data = await getCompanies();
      if (data && data.length > 0) {
        setCompany(data[0]);
      } else {
        setError('No company data found');
      }
    } catch (err) {
      setError('Failed to load companies');
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return 'Jan,2026';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    }).replace(' ', ',');
  };

  const loadImageData = async (url: string): Promise<string> => {
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
        img.src = url;
      });
    } catch (err) {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      return await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
  };

  const generatePDF = async () => {
    if (!company) {
      toast.error('Company information not available');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      let yPosition = 12;

      // --- PRE-LOAD IMAGES ---
      let logoImage = null;
      if (company.logo && typeof company.logo === 'string') {
        try {
          logoImage = await loadImageData(normalizeImagePath(company.logo));
        } catch (err) { console.error('Error loading logo', err); }
      }

      const itemsWithImages = await Promise.all(
        items.map(async (item) => {
          let loadedImage = null;
          if (item.images && item.images.length > 0) {
            try {
              loadedImage = await loadImageData(normalizeImagePath(item.images[0].imageUrl));
            } catch (err) { console.error('Error loading item image', err); }
          }
          return { ...item, loadedImage };
        })
      );

      // --- HEADER ---
      if (logoImage) {
        doc.addImage(logoImage as string, 'JPEG', 15, 10, 42, 24);
      }
      
      // Vertical Brown Divider Line
      doc.setDrawColor(BRAND_BROWN[0], BRAND_BROWN[1], BRAND_BROWN[2]);
      doc.setLineWidth(1.2);
      doc.line(64, 11, 64, 32);

      // Company Titles
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(21);
      doc.setTextColor(0, 0, 0);
      doc.text(company.name || 'Rosewood Custom Furniture PLC', 69, 18);
      
      doc.setFontSize(16);
      doc.text('', 69, 27);
      
      yPosition = 36;

      // --- CONTACT BANNER ---
      doc.setFillColor(BRAND_BROWN[0], BRAND_BROWN[1], BRAND_BROWN[2]);
      doc.rect(10, yPosition, 190, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.3);
      doc.circle(17, yPosition + 5, 2, 'D');
      doc.setFontSize(8);
      doc.text('d', 16.3, yPosition + 5.7);
      
      doc.setFontSize(11);
      doc.text(company.tiktok || '@rosewood.furniture', 22, yPosition + 6);
      doc.text(`+ ${company.phone || '251 905 84 85 86'}`, 22, yPosition + 13);
      doc.text(company.email || 'rosewoodcf@gmail.com', 22, yPosition + 20);

      doc.text(company.address || 'Ayat round about road to tafo', 105, yPosition + 6);
      doc.text(company.addressTow || 'Ayertena round about infront of Shewa supermarket', 105, yPosition + 13, { maxWidth: 90 });

      yPosition += 35;

      // --- CLIENT META BANNER ---
      const customerData = (invoice as any).customer || {};
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`To:${customerData.companyName || customerData.name || 'Amsal Resort (Hosana)'}`, 10, yPosition);
      doc.text(formatDate(invoice.createdAt), 200, yPosition, { align: 'right' });
      
      yPosition += 2;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(10, yPosition, 200, yPosition);

      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(TEXT_BROWN[0], TEXT_BROWN[1], TEXT_BROWN[2]);
      doc.text('PROFORMA INVOCE', 10, yPosition);
      doc.text('To:', 130, yPosition);
      
      yPosition += 2;

      // --- AUTO-TABLE SPECIFICATION ---
      const tableData = itemsWithImages.map((item, index) => [
        (index + 1).toString(),
        (item.item?.name || 'ITEM').toUpperCase(),
        item.description || item.size || 'No description provided',
        formatCurrency(item.unitPrice),
        item.quantity.toString(),
        formatCurrency(item.amount || (item.unitPrice * item.quantity)),
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Item', 'Item description', 'Unit price', 'Qty/sq', 'Total']],
        body: tableData,
        theme: 'plain',
        headStyles: { 
          textColor: TEXT_BROWN, 
          fontStyle: 'bold', 
          fontSize: 11,
          cellPadding: { top: 3, bottom: 3 }
        },
        bodyStyles: { 
          fontSize: 11, 
          textColor: [0, 0, 0], 
          valign: 'top',
          cellPadding: { top: 4, bottom: 4 }
        },
        columnStyles: {
          0: { cellWidth: 8 }, 
          1: { cellWidth: 32, fontStyle: 'bold' },
          2: { cellWidth: 68, textColor: TEXT_BROWN }, 
          3: { cellWidth: 26, halign: 'right' },
          4: { cellWidth: 24, halign: 'center' }, 
          5: { cellWidth: 32, halign: 'right' },
        },
        margin: { left: 10, right: 10 },
      didParseCell: (data) => {
  // Add data.section === 'body' check so it skips the header row
  if (data.section === 'body' && data.column.index === 2) {
    const item = itemsWithImages[data.row.index];
    if (item && item.loadedImage) {
      const text = data.cell.text.join(' ');
      const textLines = doc.splitTextToSize(text, data.column.width);
      const calculatedTextHeight = textLines.length * (data.cell.styles.fontSize / 2.3);
      
      data.cell.styles.minCellHeight = calculatedTextHeight + 40; 
    }
  }
},
        willDrawCell: (data) => {
          doc.setDrawColor(0, 0, 0);
          if (data.section === 'head') {
            doc.setLineWidth(0.8);
            doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          } else if (data.section === 'body') {
            doc.setLineWidth(0.8);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const item = itemsWithImages[data.row.index];
            if (item.loadedImage) {
              const textLines = data.cell.text || [];
              const textHeight = textLines.length * (data.cell.styles.fontSize / 2.3);
              
              const paddingBelowText = 3; 
              const imageY = data.cell.y + textHeight + paddingBelowText;

              // Anchor image perfectly within cell content spacing boundaries
              doc.addImage(item.loadedImage, 'JPEG', data.cell.x, imageY, 60, 36);
            }
          }
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 12;

      // --- SIGNATURE AND INVOICE TOTALS SUMMARY ---
      if (yPosition > doc.internal.pageSize.height - 45) {
        doc.addPage();
        yPosition = 20;
      }

      const subtotalValue = invoice.subtotal || totalPrice;
      const vatValue = invoice.vat || (subtotalValue * 0.15);
      const grandTotalValue = invoice.total || (subtotalValue + vatValue);

      doc.setFontSize(10.5);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      const preparerName = invoice.preparedBy?.name || 'Mukerem (Gm)';
      doc.text(`Prepared by : ${preparerName}`, 12, yPosition + 6);
      doc.text(`${invoice.preparedBy?.phone || '0905 848586'}`, 12, yPosition + 13);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bolditalic');
      doc.text('Sub Total', 135, yPosition);
      
      doc.setTextColor(100, 100, 100);
      doc.text('15 % VAT', 135, yPosition + 8);
      doc.text('Grand Total', 135, yPosition + 16);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(formatCurrency(subtotalValue), 200, yPosition, { align: 'right' });
      
      doc.setTextColor(100, 100, 100);
      doc.text(formatCurrency(vatValue), 200, yPosition + 8, { align: 'right' });
      doc.text(formatCurrency(grandTotalValue), 200, yPosition + 16, { align: 'right' });

      doc.save(`Proforma_Invoice_${invoice.piNumber || 'export'}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) return <Button variant="outline" size="sm" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</Button>;
  if (error || !company) return <Button variant="outline" size="sm" onClick={() => toast.error('Company data incomplete')}><Download className="mr-2 h-4 w-4" />Data Missing</Button>;

  return <Button variant="outline" size="sm" onClick={generatePDF}><Download className="mr-2 h-4 w-4" />Download PDF</Button>;
};