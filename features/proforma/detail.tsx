/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import {
  Package,
  User,
  Info,
  Check,
  X,
  DollarSign,
  FileText,
  Loader2,
  Box,
  PackageOpen,
  Eye,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Calendar,
  Building2,
  Receipt,
  Printer,
  CreditCard
} from 'lucide-react';
import {
  ProformaStatus,
  IProforma
} from '@/models/proforma';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import Image from 'next/image';
import { normalizeImagePath } from '@/lib/norm';
import { approveProforma, convertProformaToSale, getProformaById, rejectProforma } from '@/service/proforma';

type ProformaViewProps = {
  id?: string;
};

const ProformaDetailPage: React.FC<ProformaViewProps> = ({ id }) => {
  const [proforma, setProforma] = useState<IProforma | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ProformaStatus>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [showAttachedFiles, setShowAttachedFiles] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Normalize image and document URLs
  const normalizedImageUrl = normalizeImagePath(proforma?.imageUrl);
  const normalizedDocumentUrl = normalizeImagePath(proforma?.documentUrl);

  const hasAttachedFiles = !!(normalizedImageUrl || normalizedDocumentUrl);

  useEffect(() => {
    const fetchProformaData = async () => {
      try {
        if (id) {
          const proformaData = await getProformaById(id);
          setProforma(proformaData);
          setSelectedStatus(proformaData.status);
          setImageError(false);
          
          if (proformaData?.imageUrl || proformaData?.documentUrl) {
            setShowAttachedFiles(false);
          }
        }
      } catch {
        toast.error('Failed to fetch proforma details');
      } finally {
        setLoading(false);
      }
    };

    fetchProformaData();
  }, [id, refreshTrigger]);

  const handleStatusUpdate = async () => {
    if (!id || !selectedStatus || selectedStatus === proforma?.status) {
      return;
    }

    setUpdating(true);
    try {
      if (selectedStatus === ProformaStatus.APPROVED) {
        await approveProforma(id);
        toast.success('Proforma approved successfully');
        setRefreshTrigger((prev) => prev + 1);
      } else if (selectedStatus === ProformaStatus.REJECTED) {
        await rejectProforma(id);
        toast.success('Proforma rejected successfully');
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update proforma status');
    } finally {
      setUpdating(false);
    }
  };

  const handleConvertToSale = async () => {
    if (!id) return;

    setUpdating(true);
    try {
      const result = await convertProformaToSale(id);
      toast.success(result.message || 'Proforma converted to sale successfully');
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to convert to sale');
    } finally {
      setUpdating(false);
    }
  };

  const generateProformaHTML = () => {
    if (!proforma) return '';

    const formatDateFunc = (dateString: any) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB');
    };

    const formatNumber = (num: number) => {
      return (num || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
    };

    const getUnitSymbol = (item: any) => {
      if (item.isBox) return 'Box';
      return item.product?.unitOfMeasure?.symbol || 'Pc';
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proforma - ${proforma.proformaNo || ''}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @media print {
              @page { 
                margin: 0.3in;
                size: auto;
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
                page-break-inside: avoid;
              }
              
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
                  <strong>Date</strong> <span class="input-line" style="min-width: 100px; text-align: center;">${formatDateFunc(proforma.proformaDate)}</span>
                </div>
                <div style="margin-top: 8px;">
                  <strong><span style="text-decoration: underline;">No.</span> <span style="font-size: 16px;">${proforma.proformaNo || '________'}</span></strong>
                </div>
              </div>
            </div>

            <div class="buyer-section">
              <div style="margin-bottom: 8px;">
                <span style="font-weight: bold;">ለ/To</span> 
                <span class="input-line">${proforma.customer?.name || ''}</span>
              </div>
              <div>
                <span style="font-weight: bold;">የታክስ ከፋይ መ.ቁ:</span><br>
                <span style="font-size: 11px;">Buyers TIN No.</span> 
                <span class="input-line">${proforma.customer?.tinNumber || ''}</span>
              </div>
            </div>

            ${(proforma.tax || 0) > 0 ? '<div class="watermark">Price Includes VAT</div>' : ''}

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
                ${proforma.items?.map((item: any, index: number) => {
                  const product = item?.product || {};
                  const unitMeasure = getUnitSymbol(item);
                  const price = item?.unitPrice || 0;
                  const total = item?.totalPrice || 0;
                  
                  return `
                    <tr>
                      <td class="col-no">${String(index + 1).padStart(2, '0')}</td>
                      <td class="col-desc">${product.name || ''} </td>
                      <td class="col-unit">${unitMeasure}</td>
                      <td class="col-qty">${item?.quantity || 0}</td>
                      <td class="col-price">${formatNumber(price)}</td>
                      <td class="col-total">${formatNumber(total)}</td>
                    </tr>
                  `;
                }).join('') || '<tr><td colspan="6" style="text-align: center;">No items</td></tr>'}
                
                <tr>
                  <td colspan="4" style="border: none; border-right: 1px solid #000;"></td>
                  <td class="totals-label">
                    <div class="th-am">ጠቅላላ ድምር / Total</div>
                  </td>
                  <td class="totals-value">${formatNumber(proforma.subTotal || 0)}</td>
                </tr>
                <tr>
                  <td colspan="4" style="border: none; border-right: 1px solid #000;"></td>
                  <td class="totals-label">
                    <div class="th-am">ተ.እ.ታ / VAT (15%)</div>
                  </td>
                  <td class="totals-value">${formatNumber(proforma.tax || 0)}</td>
                </tr>
                <tr>
                  <td colspan="4" style="border: none; border-right: 1px solid #000;"></td>
                  <td class="totals-label">
                    <div class="th-am" style="font-size: 10px;">በ/ዋጋ ተ.እ.ታ ጨምሮ/ Total (Incl. VAT)</div>
                  </td>
                  <td class="totals-value" style="font-weight: bold;">${formatNumber(proforma.grandTotal || 0)}</td>
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

  // Same-page print function (no new window)
  const handlePrint = () => {
    setIsPrinting(true);
    try {
      const printContent = generateProformaHTML();
      
      // Create temporary div for print
      const printContainer = document.createElement('div');
      printContainer.id = 'print-container-temp';
      printContainer.innerHTML = printContent;
      
      document.body.appendChild(printContainer);
      
      // Add styles for printing
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
      
      // Trigger print
      window.print();
      
      // Clean up after print
      setTimeout(() => {
        if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }, 100);
      
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to generate print preview');
    } finally {
      setIsPrinting(false);
    }
  };

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin' />
        <p>Loading proforma details...</p>
      </div>
    );
  }

  if (!proforma) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p>Proforma not found</p>
      </div>
    );
  }

  const isEditable = proforma.status === ProformaStatus.PENDING;
  const isConverted = proforma.status === ProformaStatus.CONVERTED;
  const isApproved = proforma.status === ProformaStatus.APPROVED;

  return (
    <div className='container mx-auto space-y-4 p-3 md:space-y-6 md:p-6 lg:p-8'>
      {/* Print Button at Top */}
      <div className='flex justify-end'>
        <Button
          onClick={handlePrint}
          disabled={isPrinting}
          variant="outline"
          size="sm"
          className='gap-2'
        >
          <Printer className='h-4 w-4' />
          {isPrinting ? 'Preparing...' : 'Print Proforma'}
        </Button>
      </div>

      {/* Status Update Section - Only show if pending */}
      {isEditable && (
        <Card className='shadow-lg'>
          <CardHeader className='p-4 md:p-6'>
            <CardTitle className='text-lg font-bold md:text-xl'>
              Update Proforma Status
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 pt-0 md:p-6 md:pt-0'>
            <PermissionGuard fallback="hide">
              <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                <div className='w-full sm:w-auto sm:flex-1'>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value: ProformaStatus) =>
                      setSelectedStatus(value)
                    }
                  >
                    <SelectTrigger className='w-full sm:w-45 lg:w-50'>
                      <SelectValue placeholder='Select status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ProformaStatus.APPROVED}>
                        APPROVED
                      </SelectItem>
                      <SelectItem value={ProformaStatus.REJECTED}>
                        REJECTED
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex w-full flex-col gap-2 sm:flex-row sm:w-auto sm:items-center'>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={
                      updating ||
                      !selectedStatus ||
                      selectedStatus === proforma.status
                    }
                    className='w-full sm:w-auto'
                    size="sm"
                  >
                    {updating ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        <span className='hidden sm:inline'>Updating...</span>
                        <span className='sm:hidden'>Update</span>
                      </>
                    ) : (
                      <>
                        <span className='hidden sm:inline'>Update Status</span>
                        <span className='sm:hidden'>Update</span>
                      </>
                    )}
                  </Button>

                  {selectedStatus &&
                    selectedStatus !== proforma.status && (
                      <Badge variant='outline' className='w-full justify-center sm:w-auto sm:ml-2'>
                        <span className='truncate'>
                          {proforma.status} → {selectedStatus}
                        </span>
                      </Badge>
                    )}
                </div>
              </div>
            </PermissionGuard>
          </CardContent>
        </Card>
      )}

      {/* Convert to Sale Button - Only show if approved and not converted */}
      {isApproved && !isConverted && (
        <Card className='shadow-lg border-green-200 bg-green-50 dark:bg-green-900/20'>
          <CardContent className='p-4 md:p-6'>
            <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
              <div>
                <h3 className='text-base font-semibold text-green-700 dark:text-green-300'>
                  Proforma Approved
                </h3>
                <p className='text-sm text-green-600 dark:text-green-400'>
                  This proforma has been approved. You can now convert it to a sale.
                </p>
              </div>
              <Button
                onClick={handleConvertToSale}
                disabled={updating}
                variant="default"
                className='bg-green-600 hover:bg-green-700'
              >
                {updating ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <DollarSign className='mr-2 h-4 w-4' />
                )}
                Convert to Sale
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Already Converted Message */}
      {isConverted && (
        <Card className='shadow-lg border-blue-200 bg-blue-50 dark:bg-blue-900/20'>
          <CardContent className='p-4 md:p-6'>
            <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
              <div>
                <h3 className='text-base font-semibold text-blue-700 dark:text-blue-300'>
                  Converted to Sale
                </h3>
                <p className='text-sm text-blue-600 dark:text-blue-400'>
                  This proforma has been converted to a sale. View the sale record for more details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proforma Details Card */}
      <Card className='shadow-lg'>
        <CardHeader className='p-4 md:p-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <CardTitle className='flex flex-col items-start gap-2 text-lg font-bold md:flex-row md:items-center md:text-2xl'>
              <div className='flex items-center gap-2'>
                <Receipt className='text-primary h-5 w-5' />
                <span className='truncate'>
                  Proforma {proforma.proformaNo || proforma.id}
                </span>
              </div>
              <Badge
                variant={
                  proforma.status === ProformaStatus.APPROVED
                    ? 'default'
                    : proforma.status === ProformaStatus.REJECTED
                      ? 'destructive'
                      : proforma.status === ProformaStatus.CONVERTED
                        ? 'default'
                        : 'secondary'
                }
                className='mt-1 md:mt-0 md:ml-2'
              >
                {proforma.status === ProformaStatus.APPROVED ? (
                  <>
                    <Check className='mr-1 h-3 w-3' />
                    <span className='hidden sm:inline'>{proforma.status}</span>
                    <span className='sm:hidden'>Approved</span>
                  </>
                ) : proforma.status === ProformaStatus.REJECTED ? (
                  <>
                    <X className='mr-1 h-3 w-3' />
                    <span className='hidden sm:inline'>{proforma.status}</span>
                    <span className='sm:hidden'>Rejected</span>
                  </>
                ) : proforma.status === ProformaStatus.CONVERTED ? (
                  <>
                    <DollarSign className='mr-1 h-3 w-3' />
                    <span>{proforma.status}</span>
                  </>
                ) : proforma.status === ProformaStatus.EXPIRED ? (
                  <>
                    <Calendar className='mr-1 h-3 w-3' />
                    <span>{proforma.status}</span>
                  </>
                ) : (
                  <span>{proforma.status}</span>
                )}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        
        {/* Rest of your CardContent remains the same */}
        <CardContent className='space-y-4 p-4 md:space-y-6 md:p-6'>
          {/* ... keep all your existing CardContent JSX ... */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6'>
            {/* Proforma Details */}
            <div className='space-y-3 md:space-y-4'>
              <h3 className='flex items-center gap-2 text-base font-semibold md:text-lg'>
                <Info className='text-primary h-4 w-4 md:h-5 md:w-5' />
                Proforma Information
              </h3>
              <div className='space-y-2'>
                <div className='flex items-start gap-2'>
                  <FileText className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Proforma Number:</p>
                    <p className='text-muted-foreground text-sm truncate'>
                      {proforma.proformaNo}
                    </p>
                  </div>
                </div>
                
                {proforma.customer && (
                  <div className='flex items-center gap-2'>
                    <User className='text-muted-foreground h-4 w-4 shrink-0' />
                    <div>
                      <p className='font-medium text-sm'>Customer:</p>
                      <p className='text-muted-foreground text-sm'>
                        {proforma.customer.name ?? 'Unknown Customer'}
                      </p>
                    </div>
                  </div>
                )}
                
                {proforma.shop && (
                  <div className='flex items-center gap-2'>
                    <Building2 className='text-muted-foreground h-4 w-4 shrink-0' />
                    <div>
                      <p className='font-medium text-sm'>Shop:</p>
                      <p className='text-muted-foreground text-sm'>
                        {proforma.shop.name ?? 'Unknown Shop'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className='flex items-start gap-2'>
                  <Calendar className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Proforma Date:</p>
                    <p className='text-muted-foreground text-sm'>
                      {formatDate(proforma.proformaDate)}
                    </p>
                  </div>
                </div>

                {proforma.validUntil && (
                  <div className='flex items-start gap-2'>
                    <Calendar className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <div>
                      <p className='font-medium text-sm'>Valid Until:</p>
                      <p className='text-muted-foreground text-sm'>
                        {formatDate(proforma.validUntil)}
                      </p>
                    </div>
                  </div>
                )}
                
                {proforma.notes && (
                  <div>
                    <p className='font-medium text-sm'>Notes:</p>
                    <p className='text-muted-foreground text-sm'>
                      {proforma.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Details */}
            <div className='space-y-3 md:space-y-4'>
              <h3 className='flex items-center gap-2 text-base font-semibold md:text-lg'>
                <CreditCard className='text-primary h-4 w-4 md:h-5 md:w-5' />
                Financial Details
              </h3>
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <Package className='text-muted-foreground h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Sub Total:</p>
                    <p className='text-muted-foreground text-sm'>
                      {proforma.subTotal?.toFixed(2) || '0.00'} ETB
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <Package className='text-muted-foreground h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Discount:</p>
                    <p className='text-muted-foreground text-sm'>
                      {proforma.discount?.toFixed(2) || '0.00'} ETB
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <Package className='text-muted-foreground h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Tax:</p>
                    <p className='text-muted-foreground text-sm'>
                      {proforma.tax?.toFixed(2) || '0.00'} ETB
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <Package className='text-primary h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Grand Total:</p>
                    <p className='text-primary font-bold text-sm'>
                      {proforma.grandTotal?.toFixed(2) || '0.00'} ETB
                    </p>
                  </div>
                </div>
                
                <div className='flex items-center gap-2'>
                  <Package className='text-muted-foreground h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Total Products:</p>
                    <p className='text-muted-foreground text-sm'>
                      {proforma.totalProducts || 0}
                    </p>
                  </div>
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
                         className='flex w-full items-center justify-between p-4'
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
                           {normalizedImageUrl && !imageError && (
                             <Card className='overflow-hidden'>
                               <CardHeader className='pb-2'>
                                 <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                                   <ImageIcon className='h-4 w-4' />
                                   Proforma Image
                                 </CardTitle>
                               </CardHeader>
                               <CardContent className='pt-0'>
                                 <div className='relative h-48 w-full rounded-lg overflow-hidden border'>
                                   <Image
                                     src={normalizedImageUrl}
                                     alt={`Proforma ${proforma.proformaNo} image`}
                                     fill
                                     className='object-contain'
                                     onError={() => {
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
                                   Proforma Document
                                 </CardTitle>
                               </CardHeader>
                               <CardContent className='pt-0'>
                                 <div className='flex items-center justify-between p-3 rounded-lg border'>
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
         
                   {/* Proforma Items Table Section */}
                   {proforma.items?.length > 0 && (
                     <div className='space-y-3 md:space-y-4'>
                       <h3 className='text-base font-semibold md:text-lg'>Proforma Items</h3>
                       
                       {/* Mobile View - Stacked Cards */}
                       <div className='space-y-3 md:hidden'>
                         {proforma.items.map((item, index) => (
                           <div 
                             key={item.id || item.productId || index} 
                             className='rounded-lg border p-4 dark:border-gray-700'
                           >
                             <div className='space-y-3'>
                               {/* Product Info */}
                               <div>
                                 <div className='flex justify-between'>
                                   <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>Product</span>
                                   <span className='text-right text-sm font-medium'>
                                     {item.product?.name || 'Unknown Product'}
                                   </span>
                                 </div>
                               </div>
                               
                               {/* Box/Piece Info */}
                               <div className='flex justify-between'>
                                 <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>Type</span>
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
                               </div>
                               
                               {/* Quantity & Unit Price */}
                               <div className='grid grid-cols-2 gap-4'>
                                 <div>
                                   <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>Qty</span>
                                   <div className='mt-1 text-sm font-medium'>
                                     {item.quantity}
                                   </div>
                                 </div>
                                 
                                 <div>
                                   <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>Unit Price</span>
                                   <div className='mt-1 text-sm font-medium'>
                                     {item.unitPrice?.toFixed(2) || '0.00'} ETB
                                   </div>
                                 </div>
                               </div>
                               
                           
                               
                               {/* Total Price */}
                               <div className='pt-2 border-t border-gray-100 dark:border-gray-700'>
                                 <div className='flex justify-between'>
                                   <span className='text-sm font-medium'>Total</span>
                                   <span className='text-sm font-bold text-primary'>
                                     {item.totalPrice?.toFixed(2) || '0.00'} ETB
                                   </span>
                                 </div>
                               </div>
                             </div>
                           </div>
                         ))}
                         
                         {/* Summary on Mobile */}
                         <div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-800'>
                           <div className='space-y-2'>
                             <div className='flex justify-between text-sm'>
                               <span>Subtotal</span>
                               <span>{proforma.subTotal?.toFixed(2) || '0.00'} ETB</span>
                             </div>
                             <div className='flex justify-between text-sm'>
                               <span>Discount</span>
                               <span>-{proforma.discount?.toFixed(2) || '0.00'} ETB</span>
                             </div>
                             <div className='flex justify-between text-sm'>
                               <span>Tax</span>
                               <span>{proforma.tax?.toFixed(2) || '0.00'} ETB</span>
                             </div>
                             <div className='flex justify-between text-sm font-bold pt-2 border-t'>
                               <span>Grand Total</span>
                               <span className='text-primary'>
                                 {proforma.grandTotal?.toFixed(2) || '0.00'} ETB
                               </span>
                             </div>
                           </div>
                         </div>
                       </div>
                       
                       {/* Desktop View - Table */}
                       <div className='hidden overflow-x-auto md:block'>
                         <Table>
                           <TableHeader>
                             <TableRow>
                               <TableHead className='whitespace-nowrap text-xs md:text-sm'>Product</TableHead>
                               <TableHead className='whitespace-nowrap text-xs md:text-sm'>Type</TableHead>
                               <TableHead className='whitespace-nowrap text-xs md:text-sm'>Unit</TableHead>
                               <TableHead className='whitespace-nowrap text-xs md:text-sm'>Quantity</TableHead>
                               <TableHead className='whitespace-nowrap text-xs md:text-sm'>Unit Price</TableHead>
                               <TableHead className='whitespace-nowrap text-xs md:text-sm'>Total</TableHead>
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             {proforma.items.map((item, index) => (
                               <TableRow key={item.id || item.productId || index}>
                                 <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                                   <div className='font-medium'>
                                     {item.product?.name || 'Unknown Product'}
                                   </div>
                                 </TableCell>
                                 <TableCell className='whitespace-nowrap text-xs md:text-sm'>
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
                                 <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                                   <div className='text-sm text-muted-foreground'>
                                     {item.product?.unitOfMeasure?.symbol || ''}
                                   </div>
                                 </TableCell>
                                 <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                                   <div className='font-medium'>
                                     {item.quantity}
                                   </div>
                                 </TableCell>
                                 <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                                   <div className='font-medium'>
                                     {item.unitPrice?.toFixed(2) || '0.00'} ETB
                                   </div>
                                 </TableCell>
                            
                                 <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                                   <div className='font-bold text-primary'>
                                     {item.totalPrice?.toFixed(2) || '0.00'} ETB
                                   </div>
                                 </TableCell>
                               </TableRow>
                             ))}
                             
                             {/* Summary Row */}
                             <TableRow className='bg-gray-50 dark:bg-gray-800'>
                               <TableCell colSpan={5} className='text-right text-sm font-semibold'>
                                 Subtotal
                               </TableCell>
                               <TableCell colSpan={2} className='text-sm font-semibold'>
                                 {proforma.subTotal?.toFixed(2) || '0.00'} ETB
                               </TableCell>
                             </TableRow>
                             <TableRow className='bg-gray-50 dark:bg-gray-800'>
                               <TableCell colSpan={5} className='text-right text-sm'>
                                 Discount
                               </TableCell>
                               <TableCell colSpan={2} className='text-sm text-green-600'>
                                 -{proforma.discount?.toFixed(2) || '0.00'} ETB
                               </TableCell>
                             </TableRow>
                             <TableRow className='bg-gray-50 dark:bg-gray-800'>
                               <TableCell colSpan={5} className='text-right text-sm'>
                                 Tax
                               </TableCell>
                               <TableCell colSpan={2} className='text-sm'>
                                 {proforma.tax?.toFixed(2) || '0.00'} ETB
                               </TableCell>
                             </TableRow>
                             <TableRow className='bg-primary/5 dark:bg-primary/10'>
                               <TableCell colSpan={5} className='text-right text-base font-bold'>
                                 Grand Total
                               </TableCell>
                               <TableCell colSpan={2} className='text-base font-bold text-primary'>
                                 {proforma.grandTotal?.toFixed(2) || '0.00'} ETB
                               </TableCell>
                             </TableRow>
                           </TableBody>
                         </Table>
                       </div>
                     </div>
                   )}
                 </CardContent>
               </Card>
             </div>
           );
         };
         
         export default ProformaDetailPage;