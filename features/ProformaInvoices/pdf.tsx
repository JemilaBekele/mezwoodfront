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

      // --- REUSABLE HEADER RENDERING FUNCTION ---
      const drawPageHeader = (pdfDoc: jsPDF) => {
        // Logo
        if (logoImage) {
          pdfDoc.addImage(logoImage as string, 'JPEG', 15, 10, 42, 24);
        }
        
        // Vertical Divider
        pdfDoc.setDrawColor(BRAND_BROWN[0], BRAND_BROWN[1], BRAND_BROWN[2]);
        pdfDoc.setLineWidth(1.2);
        pdfDoc.line(64, 11, 64, 32);

        // Company Title
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.setFontSize(21);
        pdfDoc.setTextColor(0, 0, 0);
        pdfDoc.text(company.name || 'Rosewood Custom Furniture PLC', 69, 18);
        
        // Contact Banner Background
        pdfDoc.setFillColor(BRAND_BROWN[0], BRAND_BROWN[1], BRAND_BROWN[2]);
        pdfDoc.rect(10, 36, 190, 24, 'F');
        pdfDoc.setTextColor(255, 255, 255);
        pdfDoc.setFontSize(11);
        pdfDoc.setFont('helvetica', 'normal');

        // TikTok Icon circle placeholder
        pdfDoc.setDrawColor(255, 255, 255);
        pdfDoc.setLineWidth(0.3);
        pdfDoc.circle(17, 41, 2, 'D');
        pdfDoc.setFontSize(8);
        pdfDoc.text('d', 16.3, 41.7);
        
        // Left Banner info
        pdfDoc.setFontSize(11);
        pdfDoc.text(company.tiktok || '@rosewood.furniture', 22, 42);
        pdfDoc.text(`+ ${company.phone || '251 905 84 85 86'}`, 22, 49);
        pdfDoc.text(company.email || 'rosewoodcf@gmail.com', 22, 56);

        // Right Banner Info
        pdfDoc.text(company.address || 'Ayat round about road to tafo', 105, 42);
        pdfDoc.text(company.addressTow || 'Ayertena round about infront of Shewa supermarket', 105, 49, { maxWidth: 90 });

        // Client Metadata Banner Block
        const customerData = (invoice as any).customer || {};
        pdfDoc.setTextColor(0, 0, 0);
        pdfDoc.setFontSize(11);
        pdfDoc.setFont('helvetica', 'normal');
        pdfDoc.text(`To:${customerData.companyName || customerData.name || 'Rad'}`, 10, 71);
        pdfDoc.text(formatDate(invoice.createdAt), 200, 71, { align: 'right' });
        
        pdfDoc.setDrawColor(0, 0, 0);
        pdfDoc.setLineWidth(0.8);
        pdfDoc.line(10, 73, 200, 73);

        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.setTextColor(TEXT_BROWN[0], TEXT_BROWN[1], TEXT_BROWN[2]);
        pdfDoc.text('PROFORMA INVOCE', 10, 78);
        pdfDoc.text('To:', 130, 78);
      };

      // Draw Header on Page 1 initial view
      drawPageHeader(doc);

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
        startY: 82,
        head: [['#', 'Item', 'Item description', 'Unit price', 'Qty/sq', 'Total']],
        body: tableData,
        theme: 'plain',
        rowPageBreak: 'avoid', // Prevent rows containing images from splitting across pages
        margin: { left: 10, right: 10, top: 82, bottom: 25 }, // CRITICAL: Sets top buffer limit for dynamic pages
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
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const item = itemsWithImages[data.row.index];
            if (item && item.loadedImage) {
              const text = data.cell.text.join(' ');
              const textLines = doc.splitTextToSize(text, data.column.width);
              const calculatedTextHeight = textLines.length * (data.cell.styles.fontSize / 2.3);
              
              // Pad space cleanly to support text layout alongside image dimensions natively
              data.cell.styles.minCellHeight = calculatedTextHeight + 42; 
            }
          }
        },
        willDrawCell: (data) => {
          // Native border handling avoiding unmeasured layout breaks
          if (data.section === 'head' || data.section === 'body') {
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.8);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
            if (data.section === 'head') {
              doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
            }
          }
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const item = itemsWithImages[data.row.index];
            if (item && item.loadedImage) {
              const textLines = data.cell.text || [];
              const textHeight = textLines.length * (data.cell.styles.fontSize / 2.3);
              const imageY = data.cell.y + textHeight + 3;

              // Keep image within the boundaries of column 2
              doc.addImage(item.loadedImage, 'JPEG', data.cell.x, imageY, 55, 33);
            }
          }
        },
        didDrawPage: (data) => {
          // When table breaks over to subsequent pages, force the header structure onto them
          if (data.pageNumber > 1) {
            drawPageHeader(doc);
          }
        }
      });

      let yPosition = (doc as any).lastAutoTable.finalY + 12;

      // --- SIGNATURE AND INVOICE TOTALS SUMMARY ---
      if (yPosition > doc.internal.pageSize.height - 45) {
        doc.addPage();
        drawPageHeader(doc);
        yPosition = 90; 
      }

      const subtotalValue = invoice.subtotal || totalPrice;
      const vatValue = invoice.vat || (subtotalValue * 0.15);
      const grandTotalValue = invoice.total || (subtotalValue + vatValue);

      doc.setFontSize(10.5);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      const preparerName = invoice.preparedBy?.name || 'System Admin';
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