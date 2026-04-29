/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import {
  Package,
  Calendar,
  User,
  Info,
  Check,
  X,
  Loader2,
  ShoppingCart,
  Truck,
  CreditCard,
  Printer,
  DollarSign,
  Tag,
  Scale,

  Box,
  PackageOpen,
  Eye,
  FileText,
  ChevronUp,
  ChevronDown,
  ImageIcon
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ISell, ISellItem, SaleStatus, ItemSaleStatus } from '@/models/Sell';
import { cancelSale, getSellId, updateSaleStatus } from '@/service/Sell';
import { AlertModal } from '@/components/modal/alert-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { normalizeImagePath } from '@/lib/norm';
import Image from 'next/image';
import { getProductByShops } from '@/service/Product';

type SaleViewProps = {
  id?: string;
};

interface PrintableSaleData {
  sale: ISell;
  printedAt: string;
}

interface PriceAnalysis {
  productId: string;
  productName: string;
  sellPrice: number;
  isBox: boolean; // Add this
  additionalPrices: Array<{
    label: string;
    price: number;
    shopId: string | null;
    isMatch: boolean;
    difference: number;
    isBox: boolean; // Add this
  }>;
  hasMatchingPrice: boolean;
}

const SaleDetailPage: React.FC<SaleViewProps> = ({ id }) => {
  const [sale, setSale] = useState<ISell | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [open, setOpen] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SaleStatus | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [priceAnalysisModalOpen, setPriceAnalysisModalOpen] = useState(false);
  const [priceAnalysis, setPriceAnalysis] = useState<PriceAnalysis[]>([]);
  const [loadingPriceAnalysis, setLoadingPriceAnalysis] = useState(false);
  const [, setImageError] = useState(false);

    const [showAttachedFiles, setShowAttachedFiles] = useState(false);
      // Normalize image and document URLs
      const normalizedImageUrl = normalizeImagePath(sale?.imageUrl);
      const normalizedDocumentUrl = normalizeImagePath(sale?.documentUrl);
    
    const hasAttachedFiles = !!(normalizedImageUrl || normalizedDocumentUrl);

// Function to analyze prices with isBox/Type information
const analyzePrices = async () => {
  if (!sale || !sale.items) return;

  setLoadingPriceAnalysis(true);
  try {
    const analysis: PriceAnalysis[] = [];

    for (const item of sale.items) {
      if (!item.product?.id || !item.shop || !item.shop.id) continue;

  

      try {
        // Fetch product availability with shops and additional prices (same as ShopBatchModal)
        const response = await getProductByShops(item.product.id);
   

        // Find the specific shop's data (same logic as ShopBatchModal)
        const shopData = response.shops?.find(
          (shop: any) => shop.shopId === item.shop?.id
        );

        if (!shopData) {
          analysis.push({
            productId: item.product.id,
            productName: item.product.name,
            sellPrice: item.unitPrice,
            isBox: item.isBox,
            additionalPrices: [],
            hasMatchingPrice: false
          });
          continue;
        }

        // Get additional prices from the shop data (same as ShopBatchModal)
        const additionalPrices = shopData.additionalPrices || [];
        
   
    

        // Filter additional prices that match the item's isBox type (same as ShopBatchModal)
        const matchingTypePrices = additionalPrices.filter(
          (ap: { isBox: boolean }) => ap.isBox === item.isBox
        );

        console.log(`✅ Matching type prices (same isBox = ${item.isBox ? 'BOX' : 'PIECE'}): ${matchingTypePrices.length}`);
        
        const shopId = item.shop?.id ?? '';

        // Compare sell price with additional prices of the same type
        const priceComparisons = matchingTypePrices.map(
          (ap: { price: number; label: string; id: string; isBox: boolean }) => {
            const isMatch = Math.abs(ap.price - item.unitPrice) < 0.01;
            const difference = item.unitPrice - ap.price;

            console.log(`   Price comparison: ${ap.price} vs ${item.unitPrice} = ${isMatch ? '✓ MATCH' : '✗ NO MATCH'} (difference: ${difference.toFixed(4)})`);

            return {
              label: ap.label || (ap.isBox ? 'Box Price' : 'Piece Price'),
              price: ap.price,
              shopId,
              isMatch,
              difference,
              isBox: ap.isBox
            };
          }
        );

        // Also show other type prices for reference (different isBox)
        const otherTypePrices = additionalPrices.filter(
          (ap: { isBox: boolean }) => ap.isBox !== item.isBox
        );

        console.log(`⚠️ Other type prices (different isBox): ${otherTypePrices.length}`);

        const otherTypeComparisons = otherTypePrices.map(
          (ap: { price: number; label: string; id: string; isBox: boolean }) => ({
            label: ap.label || (ap.isBox ? 'Box Price' : 'Piece Price'),
            price: ap.price,
            shopId,
            isMatch: false,
            difference: item.unitPrice - ap.price,
            isBox: ap.isBox
          })
        );

        // Combine both
        const allComparisons = [...priceComparisons, ...otherTypeComparisons];
        const hasMatchingPrice = priceComparisons.some((ap: { isMatch: any; }) => ap.isMatch);


        analysis.push({
          productId: item.product.id,
          productName: item.product.name,
          sellPrice: item.unitPrice,
          isBox: item.isBox,
          additionalPrices: allComparisons,
          hasMatchingPrice: hasMatchingPrice
        });
      } catch (error) {
        console.error(`❌ Error fetching data for product ${item.product.name}:`, error);
        analysis.push({
          productId: item.product.id,
          productName: item.product.name,
          sellPrice: item.unitPrice,
          isBox: item.isBox,
          additionalPrices: [],
          hasMatchingPrice: false
        });
      }
    }


    setPriceAnalysis(analysis);
    setPriceAnalysisModalOpen(true);
  } catch (error) {
    console.error('❌ Price analysis failed:', error);
    toast.error('Failed to analyze prices');
  } finally {
    setLoadingPriceAnalysis(false);
  }
};
  useEffect(() => {
    const fetchSale = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const saleData = await getSellId(id);
        setSale(saleData);
        setImageError(false);

         if (saleData?.imageUrl || saleData?.documentUrl) {
          setShowAttachedFiles(false);
        }
      } catch {
        toast.error('Failed to fetch sale details');
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id, refreshTrigger]);

  const handlePrint = () => {
    if (!sale) return;

    const printableData: PrintableSaleData = {
      sale,
      printedAt: new Date().toLocaleString()
    };

    const printHTML = generatePrintHTML(printableData);

    const printContainer = document.createElement('div');
    printContainer.id = 'print-container-temp';
    printContainer.innerHTML = printHTML;

    document.body.appendChild(printContainer);

    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #print-container-temp, #print-container-temp * {
          visibility: visible;
        }
        #print-container-temp {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);

    window.print();

    setTimeout(() => {
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
      document.head.removeChild(style);
    }, 100);
  };
   const handleProrma= () => {
    if (!sale) return;

    const printableData: PrintableSaleData = {
      sale,
      printedAt: new Date().toLocaleString()
    };

    const printHTML = generatePerformaHTML(printableData);

    const printContainer = document.createElement('div');
    printContainer.id = 'print-container-temp';
    printContainer.innerHTML = printHTML;

    document.body.appendChild(printContainer);

    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #print-container-temp, #print-container-temp * {
          visibility: visible;
        }
        #print-container-temp {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);

    window.print();

    setTimeout(() => {
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
      document.head.removeChild(style);
    }, 100);
  };
  const generatePerformaHTML = (data: any) => {
  const { sale, printedAt } = data;

  const formatDate = (dateString: any) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB'); 
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Proforma - ${sale.invoiceNo || ''}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @media print {
            @page { 
              margin: 0.3in; /* Reduced margin */
              size: auto; /* Prevents forcing a second blank page */
            }
            body { 
              font-family: 'Times New Roman', serif; 
              font-size: 13px; 
              line-height: 1.4; 
              color: #000; 
              margin: 0; 
              padding: 0;
            }
            .print-container { 
              max-width: 100%; 
              margin: 0 auto;
              page-break-inside: avoid; /* Keeps content together */
            }
            
            /* Header Section */
            .header-main {
              text-align: center;
              margin-bottom: 20px;
            }
            .company-am, .company-en {
              font-weight: bold;
              font-size: 16px;
            }
            .company-tel {
              font-weight: bold;
              font-size: 14px;
            }

            /* Meta Info Section */
            .meta-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              position: relative;
            }
            .meta-left div, .meta-right div {
              margin-bottom: 3px;
            }
            .proforma-title {
              text-align: center;
              position: absolute;
              width: 100%;
              top: 30px;
              z-index: -1;
            }
            .proforma-am {
              font-weight: bold;
              font-size: 15px;
            }
            .proforma-en {
              font-weight: bold;
              font-size: 18px;
              text-decoration: underline;
            }
            
            /* Buyer Section */
            .buyer-section {
              margin-top: 40px;
              margin-bottom: 15px;
            }
            .input-line {
              border-bottom: 1px solid #000;
              display: inline-block;
              min-width: 250px;
              padding: 0 5px;
            }
            
            /* Table Section */
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 10px; 
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 6px; 
            }
            th { 
              text-align: center;
              font-weight: normal;
              font-size: 12px;
            }
            .th-am {
              font-weight: bold;
            }
            td {
              font-size: 13px;
            }
            .col-no { width: 5%; text-align: center; }
            .col-desc { width: 45%; }
            .col-unit { width: 8%; text-align: center; }
            .col-qty { width: 8%; text-align: center; }
            .col-price { width: 15%; text-align: right; }
            .col-total { width: 19%; text-align: right; }

            /* Table Footer (Totals) */
            .totals-row td {
              border-top: none;
              border-bottom: none;
            }
            .totals-label {
              text-align: right;
              font-size: 12px;
              border: 1px solid #000;
              padding-right: 5px;
            }
            .totals-value {
              text-align: right;
              border: 1px solid #000;
            }

            /* Bottom Signatures & Details */
            .bottom-details {
              margin-top: 20px;
              font-size: 13px;
            }
            .bottom-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
            }
            .bottom-row > div {
              width: 48%;
            }
            .inline-label {
              display: flex;
              align-items: flex-end;
            }
            .inline-label .line {
              flex-grow: 1;
              border-bottom: 1px solid #000;
              margin-left: 10px;
              min-height: 18px;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-30deg);
              font-size: 40px;
              color: rgba(0, 0, 100, 0.1);
              white-space: nowrap;
              z-index: -1;
              pointer-events: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          
          <div class="header-main">
            <div class="company-am">ኤም ኤም የሞተር ዘይት እና ቅባቶች አስመጪ እና ጅምላከፋፋይ</div>
            <div class="company-en">M M Engine Oils and lubricants Import and Wholesale</div>
            <div class="company-tel">Tel - 0911224507/0922174869</div>
          </div>

          <div class="meta-section">
            <div class="meta-left">
              <div>
                <span style="font-size: 11px;">Jebril mohammed:</span> <br>
                <span style="font-weight: bold;">የታክስ ከፋይ መ.ቁ:</span> 0088411751<br>
                <span style="font-size: 11px;">Supplier's TIN No.</span>
              </div>
              <div style="margin-top: 8px;">
                <span style="font-weight: bold;">የተ.እ.ታ ቁጥር:</span> 27523540819<br>
                <span style="font-size: 11px;">Supplier's VAT Reg. No</span>
              </div>
            </div>

            <div class="proforma-title">
              <div class="proforma-am">የዋጋ ማቅረቢያ</div>
              <div class="proforma-en">PROFORMA</div>
            </div>

            <div class="meta-right">
              <div>
                <span style="font-weight: bold;">ቀን</span><br>
                <strong>Date</strong> <span class="input-line" style="min-width: 100px; text-align: center;">${formatDate(sale.saleDate || sale.createdAt)}</span>
              </div>
              <div style="margin-top: 8px;">
                <strong><span style="text-decoration: underline;">No.</span> <span style="font-size: 16px;">${sale.invoiceNo || '________'}</span></strong>
              </div>
            </div>
          </div>

          <div class="buyer-section">
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold;">ለ/To</span> 
              <span class="input-line">${sale.customer?.name || ''}</span>
            </div>
            <div>
              <span style="font-weight: bold;">የታክስ ከፋይ መ.ቁ:</span><br>
              <span style="font-size: 11px;">Buyers TIN No.</span> 
              <span class="input-line">${sale.customer?.tinNumber || ''}</span>
            </div>
          </div>

          ${sale.vat > 0 ? '<div class="watermark">Price Includes VAT</div>' : ''}

          <table>
            <thead>
              <tr>
                <th class="col-no">
                  <div class="th-am">ተ.ቁ</div>
                  <div>No</div>
                </th>
                <th class="col-desc">
                  <div class="th-am">የእቃው አይነት</div>
                  <div>Description</div>
                </th>
                <th class="col-unit">
                  <div class="th-am">መስፈሪያ</div>
                  <div>Unit</div>
                </th>
                <th class="col-qty">
                  <div class="th-am">ብዛት</div>
                  <div>Qty</div>
                </th>
                <th class="col-price">
                  <div class="th-am">ያንዱ ዋጋ</div>
                  <div>Unit Price</div>
                </th>
                <th class="col-total">
                  <div class="th-am">ጠቅላላ ዋጋ</div>
                  <div>Total Amount</div>
                </th>
              </tr>
            </thead>
            <tbody>
              ${sale.items?.map((item: any, index: any) => {
                // Safe fallback to prevent TypeScript / undefined errors
                const product = item?.product || {};
                const unitMeasure = product?.unitOfMeasure?.symbol || (item?.isBox ? 'Box' : 'Pc');
                const price = item?.unitPrice || 0;
                const total = item?.totalPrice || 0;
                
                return `
                <tr>
                  <td class="col-no">${String(index + 1).padStart(2, '0')}</td>
                  <td class="col-desc">${product.name || ''} </td>
                  <td class="col-unit">${unitMeasure}</td>
                  <td class="col-qty">${item?.quantity || 0}</td>
                  <td class="col-price">${price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td class="col-total">${total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
                `;
              }).join('') || '<tr><td colspan="6" style="text-align: center;">No items</td></tr>'}
              
              <tr>
                <td colspan="4" style="border: none; border-right: 1px solid #000;"></td>
                <td class="totals-label">
                  <div class="th-am">ጠቅላላ ድምር / Total</div>
                </td>
                <td class="totals-value">${(sale.subTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td colspan="4" style="border: none; border-right: 1px solid #000;"></td>
                <td class="totals-label">
                  <div class="th-am">ተ.እ.ታ / VAT (15%)</div>
                </td>
                <td class="totals-value">${(sale.vat || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td colspan="4" style="border: none; border-right: 1px solid #000;"></td>
                <td class="totals-label">
                  <div class="th-am" style="font-size: 10px;">በ/ዋጋ ተ.እ.ታ ጨምሮ/ Total (Incl. VAT)</div>
                </td>
                <td class="totals-value" style="font-weight: bold;">${(sale.grandTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>

          <div class="bottom-details">
            <div class="inline-label" style="margin-bottom: 20px;">
              <div>
                <span style="font-weight: bold;">በፊደል</span><br>
                <strong>In Words</strong>
              </div>
              <div class="line"></div>
            </div>

            <div class="bottom-row">
              <div class="inline-label">
                <div>
                  <span style="font-weight: bold;">የማስረከቢያ ቀን</span><br>
                  <strong>Delivery Date</strong>
                </div>
                <div class="line"></div>
              </div>
              <div class="inline-label">
                <div>
                  <span style="font-weight: bold;">የሚቆይበት ጊዜ</span><br>
                  <strong>Validity Date</strong>
                </div>
                <div class="line"></div>
              </div>
            </div>

            <div class="bottom-row">
              <div class="inline-label">
                <div>
                  <span style="font-weight: bold;">የአከፋፈል ሁኔታ</span><br>
                  <strong>Terms Of Payment</strong>
                </div>
                <div class="line"></div>
              </div>
              <div class="inline-label">
                <div>
                  <span style="font-weight: bold;">ያዘጋጀው ስምና ፊርማ</span><br>
                  <strong>Prepared by Name & Sig</strong>
                </div>
                <div class="line"></div>
              </div>
            </div>
          </div>

        </div>
      </body>
    </html>
  `;
};
const generatePrintHTML = (data: PrintableSaleData) => {
  const { sale, printedAt } = data;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sale Invoice - ${sale.invoiceNo}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @media print {
            @page { 
              margin: 0.3in; 
              size: letter;
            }
            body { 
              font-family: 'Arial', sans-serif; 
              font-size: 12px; 
              line-height: 1.3; 
              color: #000; 
              margin: 0; 
              padding: 0;
            }
            .print-container { 
              max-width: 100%; 
              margin: 0; 
              padding: 0;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #000; 
              padding-bottom: 8px; 
              margin-bottom: 15px; 
            }
            .invoice-title { 
              font-size: 22px; 
              font-weight: bold; 
              margin: 5px 0; 
            }
            .section { 
              margin-bottom: 15px; 
              page-break-inside: avoid; 
            }
            .section-title { 
              font-size: 14px; 
              font-weight: bold; 
              border-bottom: 1px solid #000; 
              padding-bottom: 4px; 
              margin-bottom: 8px; 
            }
            .grid-2 { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 15px; 
              margin-bottom: 10px; 
            }
            .grid-3 { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 15px; 
              margin-bottom: 10px; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 5px 0; 
            }
            th, td { 
              border: 1px solid #000; 
              padding: 5px 6px; 
              text-align: left; 
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold; 
              font-size: 11px;
            }
            td {
              font-size: 11px;
            }
            .text-right { 
              text-align: right; 
            }
            .text-center { 
              text-align: center; 
            }
            .bold { 
              font-weight: bold; 
            }
            .footer { 
              margin-top: 20px; 
              padding-top: 8px; 
              border-top: 1px solid #000; 
              text-align: center; 
              font-size: 9px; 
              color: #666; 
            }
            p {
              margin: 3px 0;
            }
            .compact {
              margin: 0;
              padding: 0;
            }
            .customer-info {
              background-color: #f9f9f9;
              padding: 8px;
              border: 1px solid #ddd;
              border-radius: 4px;
              margin-bottom: 10px;
            }
          }
          
          /* Prevent page breaks inside rows */
          tr {
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          
          /* Ensure table doesn't break awkwardly */
          table {
            page-break-inside: avoid;
          }
          
          /* Compact spacing for product code */
          .product-code {
            font-size: 10px;
            color: #666;
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            <div class="invoice-title">SALE INVOICE</div>
            <div class="grid-2">
              <div><strong>Invoice No:</strong> ${sale.invoiceNo}</div>
              <div><strong>Date:</strong> ${formatDate(sale.saleDate || sale.createdAt)}</div>
              <div><strong>Status:</strong> ${sale.saleStatus}</div>
            </div>
          </div>

          <!-- Customer Information Section -->
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="customer-info">
              <div class="grid-2">
                <div>
                  <p><strong>Customer Name:</strong> ${sale.customer?.name || 'Walk-in Customer'}</p>
                  ${sale.customer?.tinNumber ? `<p><strong>TIN Number:</strong> ${sale.customer.tinNumber}</p>` : ''}
              
                </div>
                <div>
                  ${sale.customer?.address ? `<p><strong>Address:</strong> ${sale.customer.address}</p>` : ''}
                  ${sale.createdBy ? `<p><strong>Processed By:</strong> ${sale.createdBy.name || 'N/A'}</p>` : ''}
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Sale Items</div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Shop</th>
                  <th>Type</th>
                  <th>Unit</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${sale.items?.map((item) => {
                  const unitMeasure = `${item.product?.numberunitOfMeasure || ''} ${item.product?.unitOfMeasure?.symbol || ''}`.trim();
                  const itemType = item.isBox ? 'Box' : 'Pc';
                  
                  return `
                  <tr>
                    <td>
                      ${item.product?.name || 'Unknown Product'}
                      ${item.product?.productCode ? `<div class="product-code">${item.product.productCode}</div>` : ''}
                    </td>
                    <td>${item.shop?.name || 'N/A'}</td>
                    <td class="text-center">${itemType}</td>
                    <td class="text-center">${unitMeasure || '-'}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">${item.unitPrice.toFixed(2)}</td>
                    <td class="text-right">${item.totalPrice.toFixed(2)}</td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="grid-2">
              <div>
                <p><strong>Sub Total:</strong> ${(sale.subTotal || 0).toFixed(2)}</p>
                ${sale.discount > 0 ? `<p><strong>Discount:</strong> -${sale.discount.toFixed(2)}</p>` : ''}
                ${sale.vat > 0 ? `<p><strong>VAT:</strong> ${sale.vat.toFixed(2)}</p>` : ''}
                <p><strong>Grand Total:</strong> ${(sale.grandTotal || 0).toFixed(2)}</p>
              </div>
              <div>
                ${sale.notes ? `<p><strong>Notes:</strong> ${sale.notes}</p>` : ''}
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Printed on: ${printedAt}</p>
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
  const handleStatusUpdate = async (newStatus: SaleStatus) => {
    if (!id) return;

    setSelectedStatus(newStatus);
    setStatusUpdateDialog(true);
  };

  const confirmStatusUpdate = async () => {
    if (!id || !selectedStatus) return;

    setUpdating(true);
    try {
      const updatedSale = await updateSaleStatus(id, selectedStatus);
      setSale(updatedSale);
      toast.success(`Sale status updated to ${selectedStatus}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          `Failed to update sale status to ${selectedStatus}`
      );
    } finally {
      setUpdating(false);
      setStatusUpdateDialog(false);
      setSelectedStatus(null);
    }
  };

  const handleCancelSale = async () => {
    if (!id) return;
    setOpen(true);
  };

  const onConfirmCancel = async () => {
    if (!id) return;

    setUpdating(true);
    try {
      const updatedSale = await cancelSale(id);
      setSale(updatedSale);
      toast.success('Sale cancelled successfully');
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to cancel sale'
      );
    } finally {
      setUpdating(false);
      setOpen(false);
    }
  };

  const handleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (!sale?.items) return;

    const undeliveredItemIds = sale.items
      .filter((item) => item.itemSaleStatus !== ItemSaleStatus.DELIVERED)
      .map((item) => item.id);

    if (selectedItems.length === undeliveredItemIds.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(undeliveredItemIds);
    }
  };

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin' />
        <p>Loading sale details...</p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p>Sale not found</p>
      </div>
    );
  }

  const isImmutable = [SaleStatus.DELIVERED, SaleStatus.CANCELLED].includes(
    sale.saleStatus
  );
  const hasUndeliveredItems = sale.items?.some(
    (item) => item.itemSaleStatus !== ItemSaleStatus.DELIVERED
  );
  const undeliveredItemsCount =
    sale.items?.filter(
      (item) => item.itemSaleStatus !== ItemSaleStatus.DELIVERED
    ).length || 0;

  const getStatusVariant = (
    status: SaleStatus
  ): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (status) {
      case SaleStatus.APPROVED:
      case SaleStatus.PARTIALLY_DELIVERED:
        return 'secondary';
      case SaleStatus.CANCELLED:
        return 'destructive';
      case SaleStatus.DELIVERED:
        return 'outline';
      default:
        return 'default';
    }
  };

  const grandTotal = sale.grandTotal || 0;

return (
    <div className='container mx-auto space-y-6 p-4 md:p-8'>
      <div className='flex justify-end gap-2'>
        <Button
          onClick={analyzePrices}
          variant='outline'
          className='flex items-center gap-2'
          disabled={loadingPriceAnalysis}
        >
          {loadingPriceAnalysis ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Scale className='h-4 w-4' />
          )}
          Price Analysis
        </Button>
        <Button
          onClick={handlePrint}
          variant='outline'
          className='flex items-center gap-2'
        >
          <Printer className='h-4 w-4' />
          Print Invoice
        </Button>
             <Button
          onClick={handleProrma}
          variant='outline'
          className='flex items-center gap-2'
        >
          <Printer className='h-4 w-4' />
          Print PROFORMA
        </Button>
      </div>

  <Dialog
  open={priceAnalysisModalOpen}
  onOpenChange={setPriceAnalysisModalOpen}
>
  <DialogContent className='max-h-[80vh] max-w-4xl overflow-y-auto'>
    <DialogHeader>
      <DialogTitle className='flex items-center gap-2'>
        <Scale className='h-5 w-5' />
        Price Analysis
      </DialogTitle>
      <DialogDescription>
        Comparison between sell prices and additional prices for each
        product in this sale. Shows matching prices based on Box/Piece type.
      </DialogDescription>
    </DialogHeader>

    <div className='space-y-4'>
      {priceAnalysis.map((analysis) => (
        <Card
          key={analysis.productId}
          className='border-l-4 border-l-blue-500'
        >
          <CardContent className='pt-4'>
            <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
              <div>
                <div className='flex items-center gap-2'>
                  <h4 className='text-lg font-semibold'>
                    {analysis.productName}
                  </h4>
                  <Badge variant={analysis.isBox ? 'default' : 'secondary'} className='text-xs'>
                    {analysis.isBox ? (
                      <>
                        <Box className='mr-1 h-3 w-3' />
                        Box
                      </>
                    ) : (
                      <>
                        <PackageOpen className='mr-1 h-3 w-3' />
                        Piece
                      </>
                    )}
                  </Badge>
                </div>
                <p className='text-muted-foreground'>
                  Sell Price:{' '}
                  <span className='text-primary font-bold'>
                    {analysis.sellPrice.toFixed(2)} ETB
                  </span>
                  {' '}per {analysis.isBox ? 'box' : 'piece'}
                </p>
              </div>
              <Badge
                variant={
                  analysis.hasMatchingPrice ? 'default' : 'secondary'
                }
                className={`w-fit ${
                  analysis.hasMatchingPrice
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : ''
                }`}
              >
                {analysis.hasMatchingPrice ? (
                  <Check className='mr-1 h-3 w-3' />
                ) : (
                  <X className='mr-1 h-3 w-3' />
                )}
                {analysis.hasMatchingPrice
                  ? 'Price Match Found'
                  : 'No Match'}
              </Badge>
            </div>

            {analysis.additionalPrices.length > 0 ? (
              <div className='space-y-2'>
                <h5 className='text-muted-foreground text-sm font-medium'>
                  Additional Prices:
                </h5>
                <div className='grid gap-2'>
                  {analysis.additionalPrices.map((ap, index) => (
                    <div
                      key={index}
                      className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
                        ap.isMatch && ap.isBox === analysis.isBox
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                          : ap.isBox === analysis.isBox
                          ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <div
                          className={`rounded p-1 ${
                            ap.isMatch && ap.isBox === analysis.isBox
                              ? 'bg-green-100 dark:bg-green-800'
                              : ap.isBox === analysis.isBox
                              ? 'bg-yellow-100 dark:bg-yellow-800'
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}
                        >
                          {ap.isBox ? (
                            <Box
                              className={`h-4 w-4 ${
                                ap.isMatch && ap.isBox === analysis.isBox
                                  ? 'text-green-600 dark:text-green-300'
                                  : ap.isBox === analysis.isBox
                                  ? 'text-yellow-600 dark:text-yellow-300'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                            />
                          ) : (
                            <PackageOpen
                              className={`h-4 w-4 ${
                                ap.isMatch && ap.isBox === analysis.isBox
                                  ? 'text-green-600 dark:text-green-300'
                                  : ap.isBox === analysis.isBox
                                  ? 'text-yellow-600 dark:text-yellow-300'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                            />
                          )}
                        </div>
                        <div>
                          <p className='font-medium'>
                            {ap.label || (ap.isBox ? 'Box Price' : 'Piece Price')}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            {ap.shopId ? 'Shop-specific' : 'Global'} • {ap.isBox ? 'Box' : 'Piece'} price
                          </p>
                        </div>
                      </div>
                      <div className='text-left sm:text-right'>
                        <p
                          className={`font-bold ${
                            ap.isMatch && ap.isBox === analysis.isBox
                              ? 'text-green-600 dark:text-green-300'
                              : ap.isBox === analysis.isBox
                              ? 'text-yellow-600 dark:text-yellow-300'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {ap.price.toFixed(2)} ETB
                          {ap.isBox === analysis.isBox && (
                            <span className='ml-1 text-xs font-normal text-muted-foreground'>
                              per {ap.isBox ? 'box' : 'piece'}
                            </span>
                          )}
                        </p>
                        {!ap.isMatch && ap.isBox === analysis.isBox && (
                          <p
                            className={`text-xs ${
                              ap.difference > 0
                                ? 'text-red-500'
                                : 'text-blue-500'
                            }`}
                          >
                            {ap.difference > 0 ? '+' : ''}
                            {ap.difference.toFixed(2)} ETB difference
                          </p>
                        )}
                        {ap.isBox !== analysis.isBox && (
                          <p className='text-xs text-muted-foreground'>
                            Different type ({ap.isBox ? 'Box' : 'Piece'})
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className='text-muted-foreground py-4 text-center'>
                <Tag className='mx-auto mb-2 h-8 w-8 opacity-50' />
                <p>No additional prices found for this product</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  </DialogContent>
</Dialog>

      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirmCancel}
        loading={updating}
        title='Cancel Sale'
        description='Are you sure you want to cancel this sale? This action cannot be undone.'
      />

      <AlertDialog
        open={statusUpdateDialog}
        onOpenChange={setStatusUpdateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update the sale status to{' '}
              <strong>{selectedStatus}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusUpdate}
              disabled={updating}
            >
              {updating ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!isImmutable && (
        <Card className='shadow-lg'>
          <CardHeader>
            <CardTitle className='text-xl font-bold'>
              Update Sale Status
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center'>
              <div className='flex w-full flex-col gap-2 sm:flex-row'>
                <div className='flex-1'>
                  <Select
                    value={sale.saleStatus}
                    onValueChange={(value: SaleStatus) =>
                      handleStatusUpdate(value)
                    }
                    disabled={updating || isImmutable}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Sale Status' />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        SaleStatus.APPROVED,
                        SaleStatus.CANCELLED,
                        SaleStatus.NOT_APPROVED
                      ].map((status) => (
                        <SelectItem
                          key={status}
                          value={status}
                          disabled={status === sale.saleStatus}
                        >
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {sale.saleStatus !== SaleStatus.CANCELLED && (
                  <Button
                    variant='destructive'
                    onClick={handleCancelSale}
                    disabled={updating}
                  >
                    Cancel Sale
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle className='flex flex-col gap-2 text-xl font-bold sm:flex-row sm:items-center sm:gap-2 sm:text-2xl'>
            <div className='flex items-center gap-2'>
              <ShoppingCart className='text-primary h-5 w-5 sm:h-6 sm:w-6' />
              <span className='truncate'>Sale {sale.invoiceNo}</span>
            </div>
            <Badge 
              variant={getStatusVariant(sale.saleStatus)} 
              className='ml-0 mt-1 w-fit sm:ml-2 sm:mt-0'
            >
              {sale.saleStatus === SaleStatus.DELIVERED ? (
                <>
                  <Check className='mr-1 h-3 w-3' /> {sale.saleStatus}
                </>
              ) : sale.saleStatus === SaleStatus.CANCELLED ? (
                <>
                  <X className='mr-1 h-3 w-3' /> {sale.saleStatus}
                </>
              ) : sale.saleStatus === SaleStatus.PARTIALLY_DELIVERED ? (
                <>
                  <Truck className='mr-1 h-3 w-3' /> {sale.saleStatus}
                </>
              ) : (
                <>{sale.saleStatus}</>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div className='space-y-4'>
              <h3 className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
                <Info className='text-primary h-4 w-4 sm:h-5 sm:w-5' />
                Sale Information
              </h3>
              <div className='space-y-3'>
                <div className='flex items-start gap-2'>
                  <ShoppingCart className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <p>
                    <span className='font-medium'>Invoice No:</span>{' '}
                    <span className='break-all'>{sale.invoiceNo}</span>
                  </p>
                </div>
                {sale.branch && (
                  <div className='flex items-start gap-2'>
                    <Package className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <p>
                      <span className='font-medium'>Branch:</span>{' '}
                      {sale.branch.name}
                    </p>
                  </div>
                )}
                {sale.customer && (
                  <div className='flex items-start gap-2'>
                    <User className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <p>
                      <span className='font-medium'>Customer:</span>{' '}
                      {sale.customer.name}
                    </p>
                  </div>
                )}
                {sale.createdBy && (
                  <div className='flex items-start gap-2'>
                    <User className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <p>
                      <span className='font-medium'>Created By:</span>{' '}
                      {sale.createdBy.name}
                    </p>
                  </div>
                )}
                {sale.updatedBy && (
                  <div className='flex items-start gap-2'>
                    <User className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <p>
                      <span className='font-medium'>Updated By:</span>{' '}
                      {sale.updatedBy.name}
                    </p>
                  </div>
                )}
                {sale.notes && (
                  <div>
                    <p className='font-medium'>Notes:</p>
                    <p className='text-muted-foreground wrap-break-word'>{sale.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className='space-y-4'>
              <h3 className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
                <CreditCard className='text-primary h-4 w-4 sm:h-5 sm:w-5' />
                Financial Details
              </h3>
              <div className='space-y-3'>
                <div className='grid grid-cols-2 gap-2'>
                  {sale.subTotal > 0 && (
                    <div>
                      <p className='font-medium text-sm sm:text-base'>Sub Total:</p>
                      <p className='text-muted-foreground text-sm sm:text-base'>
                        {(sale.subTotal || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {sale.discount > 0 && (
                    <div>
                      <p className='font-medium text-sm sm:text-base'>Discount:</p>
                      <p className='text-muted-foreground text-sm sm:text-base'>
                        -{(sale.discount || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {sale.vat > 0 && (
                    <div>
                      <p className='font-medium text-sm sm:text-base'>VAT:</p>
                      <p className='text-muted-foreground text-sm sm:text-base'>
                        {(sale.vat || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div className='col-span-2 border-t pt-2'>
                    <p className='font-medium text-sm sm:text-base'>Grand Total:</p>
                    <p className='text-muted-foreground text-base font-bold sm:text-lg'>
                      {grandTotal.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className='space-y-2 pt-2'>
                  <div className='flex items-start gap-2'>
                    <Calendar className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <p>
                      <span className='font-medium'>Sale Date:</span>{' '}
                      {formatDate(sale.saleDate || sale.createdAt)}
                    </p>
                  </div>
                  <div className='flex items-start gap-2'>
                    <Package className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <p>
                      <span className='font-medium'>Total Items:</span>{' '}
                      {sale.totalProducts}
                    </p>
                  </div>
                  {hasUndeliveredItems && (
                    <div className='flex items-start gap-2'>
                      <Truck className='mt-0.5 h-4 w-4 shrink-0 text-amber-500' />
                      <p className='font-medium text-amber-600'>
                        Undelivered Items: {undeliveredItemsCount}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Attached Files Section - Collapsible */}
          {hasAttachedFiles && (
            <div className='space-y-4'>
              <Button
                variant='ghost'
                onClick={() => setShowAttachedFiles(!showAttachedFiles)}
                className='flex w-full items-center justify-between p-4 hover:bg-gray-50'
              >
                <div className='flex items-center gap-2'>
                  <Eye className='text-primary h-5 w-5' />
                  <h3 className='text-base font-semibold'>Attached Files</h3>
                  <Badge variant='secondary' className='ml-2'>
                    {normalizedImageUrl && normalizedDocumentUrl ? '2' : '1'} file(s)
                  </Badge>
                </div>
                {showAttachedFiles ? (
                  <ChevronUp className='h-5 w-5' />
                ) : (
                  <ChevronDown className='h-5 w-5' />
                )}
              </Button>

              {showAttachedFiles && (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  {/* Image Display */}
                  {normalizedImageUrl && (
                    <Card className='overflow-hidden'>
                      <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                          <ImageIcon className='h-4 w-4' />
                          Invoice Image
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <div className='relative h-48 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50'>
                          <Image
                            src={normalizedImageUrl}
                            alt={`Invoice ${sale.invoiceNo} image`}
                            fill
                            className='object-contain'
                            onError={(e) => {
                              console.error('Failed to load image:', normalizedImageUrl);
                              setImageError(true);
                            }}
                          />
                        </div>
                        <a
                          href={normalizedImageUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline'
                        >
                          <Eye className='h-3 w-3' />
                          View full size
                        </a>
                      </CardContent>
                    </Card>
                  )}

                  {/* Document Display */}
                  {normalizedDocumentUrl && (
                    <Card>
                      <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                          <FileText className='h-4 w-4' />
                          Invoice Document
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border'>
                          <div className='flex items-center gap-2'>
                            <FileText className='h-8 w-8 text-blue-500' />
                            <div>
                              <p className='text-sm font-medium'>Supporting Document</p>
                              <p className='text-xs text-muted-foreground'>
                                Click to view or download
                              </p>
                            </div>
                          </div>
                          <a
                            href={normalizedDocumentUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90'
                          >
                            <Eye className='h-3 w-3' />
                            View
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Sale Items Table */}
          {sale.items && sale.items.length > 0 ? (
            <div className='space-y-4'>
              <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                <h3 className='text-base font-semibold sm:text-lg'>Sale Items</h3>
                {hasUndeliveredItems && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleSelectAll}
                    disabled={updating}
                    className='w-full sm:w-auto'
                  >
                    {selectedItems.length === undeliveredItemsCount
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                )}
              </div>

              {/* Mobile Card View */}
              <div className='space-y-3 sm:hidden'>
                {sale.items.map((item: ISellItem) => {
                  const isSelected = selectedItems.includes(item.id);
                  const isDelivered = item.itemSaleStatus === ItemSaleStatus.DELIVERED;
                  const remainingQty = item.remainingQuantity || item.quantity;
                  const givenQty = item.givenQuantity || 0;
                  const unitMeasure = `${item.product?.numberunitOfMeasure || ''} ${item.product?.unitOfMeasure?.symbol || ''}`.trim();
                  
                  return (
                    <Card
                      key={item.id}
                      className={`border ${isSelected ? 'border-primary ring-1 ring-primary' : ''} ${
                        isDelivered ? 'opacity-80' : ''
                      }`}
                    >
                      <CardContent className='pt-4'>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='flex-1'>
                            <h4 className='font-semibold leading-tight'>
                              {item.product?.name || 'Unknown Product'}
                            </h4>
                            {item.product?.productCode && (
                              <p className='text-xs text-muted-foreground'>
                                Code: {item.product.productCode}
                              </p>
                            )}
                          </div>
                          {hasUndeliveredItems && !isDelivered && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleItemSelection(item.id)}
                              disabled={updating || isDelivered}
                              className='mt-0.5'
                            />
                          )}
                        </div>

                        <div className='mt-3 space-y-2'>
                          {/* Row 1: Shop and Type/Unit combined */}
                          <div className='grid grid-cols-2 gap-2'>
                            <div className='space-y-1'>
                              <p className='text-xs text-muted-foreground'>Shop</p>
                              <p className='text-sm font-medium truncate'>
                                {item.shop?.name || 'Unknown'}
                              </p>
                            </div>
                            <div className='space-y-1'>
                              <p className='text-xs text-muted-foreground'>Type / Unit</p>
                              <div className='flex flex-col gap-1'>
                                <Badge variant={item.isBox ? 'default' : 'secondary'} className='text-xs w-fit'>
                                  {item.isBox ? (
                                    <>
                                      <Box className='mr-1 h-3 w-3' />
                                      Box
                                    </>
                                  ) : (
                                    <>
                                      <PackageOpen className='mr-1 h-3 w-3' />
                                      Piece
                                    </>
                                  )}
                                </Badge>
                                {unitMeasure && (
                                  <p className='text-sm font-medium text-muted-foreground'>
                                    {unitMeasure}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Row 2: Quantity, Given, Remaining */}
                          <div className='grid grid-cols-3 gap-2'>
                            <div className='space-y-1'>
                              <p className='text-xs text-muted-foreground'>Quantity</p>
                              <p className='text-sm font-medium'>{item.quantity}</p>
                            </div>
                            <div className='space-y-1'>
                              <p className='text-xs text-muted-foreground'>Given</p>
                              <p className='text-sm font-medium text-green-600'>{givenQty}</p>
                            </div>
                            <div className='space-y-1'>
                              <p className='text-xs text-muted-foreground'>Remaining</p>
                              <p className='text-sm font-medium text-orange-600'>{remainingQty}</p>
                            </div>
                          </div>
                        </div>

                        <div className='mt-3 flex items-center justify-between border-t pt-3'>
                          <div className='space-y-1'>
                            <p className='text-xs text-muted-foreground'>Unit Price</p>
                            <p className='text-sm font-semibold'>
                              {item.unitPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className='space-y-1'>
                            <p className='text-xs text-muted-foreground'>Total Price</p>
                            <p className='text-sm font-bold'>
                              {item.totalPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className='space-y-1'>
                            <p className='text-xs text-muted-foreground text-center'>Status</p>
                            <Badge
                              variant={
                                item.itemSaleStatus === ItemSaleStatus.DELIVERED
                                  ? 'default'
                                  : item.itemSaleStatus === ItemSaleStatus.PENDING
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className='capitalize'
                            >
                              {item.itemSaleStatus.toLowerCase()}
                            </Badge>
                          </div>
                        </div>

                        {isDelivered && (
                          <div className='mt-2 flex items-center gap-1 text-xs text-muted-foreground'>
                            <Check className='h-3 w-3' />
                            <span>Already delivered</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className='hidden sm:block overflow-x-auto'>
                <div className='inline-block min-w-full align-middle'>
                  <div className='overflow-hidden border rounded-lg'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {hasUndeliveredItems && (
                            <TableHead className='w-12 px-3'>
                              <Checkbox
                                checked={
                                  selectedItems.length === undeliveredItemsCount &&
                                  undeliveredItemsCount > 0
                                }
                                onCheckedChange={handleSelectAll}
                                disabled={updating}
                              />
                            </TableHead>
                          )}
                          <TableHead className='min-w-40'>Product</TableHead>
                          <TableHead className='min-w-28'>Shop</TableHead>
                          <TableHead className='min-w-24'>Type</TableHead>
                          <TableHead className='min-w-24'>Unit</TableHead>
                          <TableHead className='min-w-20'>Quantity</TableHead>
                          <TableHead className='min-w-28'>Given</TableHead>
                          <TableHead className='min-w-28'>Remaining</TableHead>
                          <TableHead className='min-w-28'>Unit Price</TableHead>
                          <TableHead className='min-w-28'>Total Price</TableHead>
                          <TableHead className='min-w-32'>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sale.items.map((item: ISellItem) => {
                          const isDelivered = item.itemSaleStatus === ItemSaleStatus.DELIVERED;
                          const remainingQty = item.remainingQuantity || item.quantity;
                          const givenQty = item.givenQuantity || 0;
                          const unitMeasure = `${item.product?.numberunitOfMeasure || ''} ${item.product?.unitOfMeasure?.symbol || ''}`.trim();

                          return (
                            <TableRow
                              key={item.id}
                              className={`
                                ${selectedItems.includes(item.id) ? 'bg-primary/5' : ''}
                                ${isDelivered ? 'opacity-80' : ''}
                              `}
                            >
                              {hasUndeliveredItems && (
                                <TableCell className='px-3'>
                                  <Checkbox
                                    checked={selectedItems.includes(item.id)}
                                    onCheckedChange={() =>
                                      handleItemSelection(item.id)
                                    }
                                    disabled={
                                      updating ||
                                      isDelivered
                                    }
                                  />
                                </TableCell>
                              )}
                              <TableCell className='font-medium'>
                                <div className='flex flex-col'>
                                  <span className='font-medium'>
                                    {item.product?.name || 'Unknown Product'}
                                  </span>
                                  {item.product?.productCode && (
                                    <span className='text-xs text-muted-foreground'>
                                      {item.product.productCode}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.shop?.name || 'Unknown Shop'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={item.isBox ? 'default' : 'secondary'} className='text-xs'>
                                  {item.isBox ? (
                                    <>
                                      <Box className='mr-1 h-3 w-3' />
                                      Box
                                    </>
                                  ) : (
                                    <>
                                      <PackageOpen className='mr-1 h-3 w-3' />
                                      Piece
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className='text-sm text-muted-foreground'>
                                  {unitMeasure || 'N/A'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className='font-medium'>{item.quantity}</span>
                              </TableCell>
                              <TableCell>
                                <span className='font-medium text-green-600'>{givenQty}</span>
                              </TableCell>
                              <TableCell>
                                <span className='font-medium text-orange-600'>{remainingQty}</span>
                              </TableCell>
                              <TableCell>
                                <span className='font-medium'>{item.unitPrice.toFixed(2)}</span>
                              </TableCell>
                              <TableCell>
                                <span className='font-bold'>{item.totalPrice.toFixed(2)}</span>
                              </TableCell>
                              <TableCell>
                                <div className='flex items-center gap-2'>
                                  <Badge
                                    variant={
                                      isDelivered
                                        ? 'default'
                                        : item.itemSaleStatus === ItemSaleStatus.PENDING
                                          ? 'destructive'
                                          : 'secondary'
                                    }
                                    className='capitalize'
                                  >
                                    {item.itemSaleStatus.toLowerCase()}
                                  </Badge>
                                  {isDelivered && (
                                    <Check className='h-3 w-3 text-muted-foreground' />
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Summary for mobile */}
              <div className='sm:hidden'>
                <Card>
                  <CardContent className='pt-4'>
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>Total Items:</span>
                        <span className='font-semibold'>{sale.items.length}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>Undelivered:</span>
                        <span className='font-semibold text-amber-600'>
                          {undeliveredItemsCount}
                        </span>
                      </div>
                      {hasUndeliveredItems && selectedItems.length > 0 && (
                        <div className='flex items-center justify-between border-t pt-2'>
                          <span className='text-sm font-medium'>Selected:</span>
                          <span className='font-bold text-primary'>
                            {selectedItems.length} items
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className='text-muted-foreground py-8 text-center'>
              <Package className='mx-auto h-12 w-12 opacity-20' />
              <p className='mt-2'>No items found in this sale</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SaleDetailPage;