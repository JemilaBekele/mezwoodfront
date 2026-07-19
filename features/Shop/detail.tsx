/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
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

  Eye,
  FileText,
  ChevronUp,
  ChevronDown,
  ImageIcon,

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
import { ISell, ISellItem, SaleStatus } from '@/models/Sell';
import { cancelSale, getSellById, updateSaleStatus } from '@/service/Sell';
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
import { normalizeImagePath } from '@/lib/norm';
import Image from 'next/image';


type SaleViewProps = {
  id?: string;
};

interface PrintableSaleData {
  sale: ISell;
  printedAt: string;
}



const SaleDetailPage: React.FC<SaleViewProps> = ({ id }) => {
  const [sale, setSale] = useState<ISell | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [open, setOpen] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SaleStatus | null>(null);
  const [, setImageError] = useState(false);
  const [showAttachedFiles, setShowAttachedFiles] = useState(false);


  // Normalize image and document URLs
  const normalizedImageUrl = normalizeImagePath(sale?.imageUrl);
  const normalizedDocumentUrl = normalizeImagePath(sale?.documentUrl);

  const hasAttachedFiles = !!(normalizedImageUrl || normalizedDocumentUrl);


  useEffect(() => {
    const fetchSale = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const saleData = await getSellById(id);
        setSale(saleData);
        setImageError(false);
        // Auto-expand if there are attached files
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
    printDocument(printHTML);
  };



  const printDocument = (html: string) => {
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container-temp';
    printContainer.innerHTML = html;
    document.body.appendChild(printContainer);

    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #print-container-temp, #print-container-temp * { visibility: visible; }
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



  const generatePrintHTML = (data: PrintableSaleData) => {
    const { sale, printedAt } = data;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sale Invoice - ${sale.invoiceNo}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @media print {
              @page { margin: 0.3in; }
              body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.3; }
              .print-container { max-width: 100%; margin: 0; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #000; padding: 5px 6px; text-align: left; }
              th { background-color: #f0f0f0; font-weight: bold; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .bold { font-weight: bold; }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 22px; font-weight: bold;">SALE INVOICE</div>
              <div><strong>Invoice No:</strong> ${sale.invoiceNo} | <strong>Date:</strong> ${formatDate(sale.saleDate || sale.createdAt)}</div>
              <div><strong>Status:</strong> ${sale.saleStatus}</div>
            </div>

            <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd;">
              <div><strong>Customer:</strong> ${sale.customer?.name || 'Walk-in Customer'}</div>
              ${sale.customer?.tinNumber ? `<div><strong>TIN Number:</strong> ${sale.customer.tinNumber}</div>` : ''}
              ${sale.customer?.phone1 ? `<div><strong>Phone:</strong> ${sale.customer.phone1}</div>` : ''}
              ${sale.createdBy ? `<div><strong>Processed By:</strong> ${sale.createdBy.name}</div>` : ''}
            </div>

            <table>
              <thead>
                <tr><th>#</th><th>Product</th><th class="text-center">Qty</th><th class="text-right">Unit Price</th><th class="text-right">Total</th></tr>
              </thead>
              <tbody>
                ${sale.items?.map((item, index) => `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${item.item?.name || 'Unknown Product'}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${item.unitPrice.toFixed(2)}</td>
                    <td class="text-right">${item.totalPrice.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
              <div style="width: 300px;">
                <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>${(sale.subTotal || 0).toFixed(2)}</span></div>
                ${sale.discount > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Discount:</span><span>-${sale.discount.toFixed(2)}</span></div>` : ''}
                ${sale.vat > 0 ? `<div style="display: flex; justify-content: space-between;"><span>VAT:</span><span>${sale.vat.toFixed(2)}</span></div>` : ''}
                <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #000; margin-top: 5px; padding-top: 5px;">
                  <span>Grand Total:</span><span>${(sale.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            ${sale.notes ? `<div style="margin-top: 20px;"><strong>Notes:</strong> ${sale.notes}</div>` : ''}

            <div style="margin-top: 40px; text-align: center; font-size: 10px;">
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
      toast.error(error.response?.data?.message || 'Failed to cancel sale');
    } finally {
      setUpdating(false);
      setOpen(false);
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

  const getPaymentStatusVariant = (
    status: string
  ): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (status) {
      case 'PAID':
        return 'default';
      case 'PARTIAL':
        return 'secondary';
      case 'PENDING':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const grandTotal = sale.grandTotal || 0;
  const totalPaid = sale.totalPaid || 0;
const balance = sale?.balance !== undefined && sale?.balance !== null 
    ? sale.balance 
    : grandTotal;
  // Check for attached files

  return (
    <div className='container mx-auto space-y-6 p-4 md:p-8'>
      <div className='flex flex-wrap justify-end gap-2'>
      
        <Button
          onClick={handlePrint}
          variant='outline'
          className='flex items-center gap-2'
        >
          <Printer className='h-4 w-4' />
          Print Invoice
        </Button>
       
      </div>


      {/* Cancel Alert Modal */}
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirmCancel}
        loading={updating}
        title='Cancel Sale'
        description='Are you sure you want to cancel this sale? This action cannot be undone.'
      />

      {/* Status Update Dialog */}
      <AlertDialog open={statusUpdateDialog} onOpenChange={setStatusUpdateDialog}>
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
            <AlertDialogAction onClick={confirmStatusUpdate} disabled={updating}>
              {updating ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Update Card */}
      {!isImmutable && (
        <Card className='shadow-lg'>
          <CardHeader>
            <CardTitle className='text-xl font-bold'>Update Sale Status</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center'>
              <div className='flex w-full flex-col gap-2 sm:flex-row'>
                <div className='flex-1'>
                  <Select
                    value={sale.saleStatus}
                    onValueChange={(value: SaleStatus) => handleStatusUpdate(value)}
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
                  <Button variant='destructive' onClick={handleCancelSale} disabled={updating}>
                    Cancel Sale
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Sale Details Card */}
      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle className='flex flex-col gap-2 text-xl font-bold sm:flex-row sm:items-center sm:gap-2 sm:text-2xl'>
            <div className='flex items-center gap-2'>
              <ShoppingCart className='text-primary h-5 w-5 sm:h-6 sm:w-6' />
              <span className='truncate'>Sale {sale.invoiceNo}</span>
            </div>
            <div className='flex flex-wrap gap-2 ml-0 mt-1 sm:ml-2 sm:mt-0'>
              <Badge variant={getStatusVariant(sale.saleStatus)}>
                {sale.saleStatus === SaleStatus.DELIVERED ? (
                  <><Check className='mr-1 h-3 w-3' /> {sale.saleStatus}</>
                ) : sale.saleStatus === SaleStatus.CANCELLED ? (
                  <><X className='mr-1 h-3 w-3' /> {sale.saleStatus}</>
                ) : sale.saleStatus === SaleStatus.PARTIALLY_DELIVERED ? (
                  <><Truck className='mr-1 h-3 w-3' /> {sale.saleStatus}</>
                ) : (
                  <>{sale.saleStatus}</>
                )}
              </Badge>
              <Badge variant={getPaymentStatusVariant(sale.paymentStatus)}>
                <CreditCard className='mr-1 h-3 w-3' />
                {sale.paymentStatus}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {/* Sale Information */}
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
                {sale.customer && (
                  <div className='flex items-start gap-2'>
                    <User className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <div>
                      <p><span className='font-medium'>Customer:</span> {sale.customer.name}</p>
                      {sale.customer.phone1 && (
                        <p className='text-sm text-muted-foreground'>📞 {sale.customer.phone1}</p>
                      )}
                      {sale.customer.tinNumber && (
                        <p className='text-sm text-muted-foreground'>TIN: {sale.customer.tinNumber}</p>
                      )}
                    </div>
                  </div>
                )}
                 {sale.deliveryDate && (
                                                  <div className='flex items-start gap-2'>
                                                                      <Calendar className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />

                                                     <p>
                                    <span className='font-medium'>Delivery Date:</span>{' '}
                                    {formatDate(sale.deliveryDate || '')}
                                  </p>
                                                  </div>
                                                )}
                {sale.createdBy && (
                  <div className='flex items-start gap-2'>
                    <User className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <p><span className='font-medium'>Created By:</span> {sale.createdBy.name}</p>
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

            {/* Financial Details */}
            <div className='space-y-4'>
              <h3 className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
                <CreditCard className='text-primary h-4 w-4 sm:h-5 sm:w-5' />
                Financial Details
              </h3>
              <div className='space-y-3'>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <p className='font-medium text-sm'>Sub Total:</p>
                    <p className='text-muted-foreground'>{(sale.subTotal || 0).toFixed(2)}</p>
                  </div>
                  {sale.discount > 0 && (
                    <div>
                      <p className='font-medium text-sm'>Discount:</p>
                      <p className='text-red-600'>-{(sale.discount || 0).toFixed(2)}</p>
                    </div>
                  )}
                  {sale.vat > 0 && (
                    <div>
                      <p className='font-medium text-sm'>VAT (15%):</p>
                      <p className='text-muted-foreground'>{(sale.vat || 0).toFixed(2)}</p>
                    </div>
                  )}
                </div>

                <div className='border-t pt-2'>
                  <div className='flex justify-between'>
                    <span className='font-bold'>Grand Total:</span>
                    <span className='font-bold text-lg'>{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className='bg-muted/50 rounded-lg p-3 space-y-1'>
                  <div className='flex justify-between text-sm'>
                    <span>Total Paid:</span>
                    <span className='text-green-600 font-medium'>{totalPaid.toFixed(2)}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span>Balance Due:</span>
                    <span className={`font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {balance.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className='flex items-start gap-2 pt-2'>
                  <Calendar className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <p>
                    <span className='font-medium'>Sale Date:</span>{' '}
                    {formatDate(sale.saleDate || sale.createdAt)}
                  </p>
                </div>
                <div className='flex items-start gap-2'>
                  <Package className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <p>
                    <span className='font-medium'>Total Products:</span>{' '}
                    {sale.totalProducts}
                  </p>
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
    <h3 className='text-base font-semibold sm:text-lg'>Sale Products</h3>

    {/* Mobile Card View */}
    <div className='space-y-3 sm:hidden'>
      {sale.items.map((item: ISellItem, index: number) => {
        // Get location display
        const getLocationDisplay = () => {
          if (item.store && item.showroom) {
            return `${item.store.name} → ${item.showroom.name}`;
          } else if (item.store) {
            return item.store.name;
          } else if (item.showroom) {
            return item.showroom.name;
          }
          return 'No Location';
        };

        // Get location icon
        const getLocationIcon = () => {
          if (item.store && item.showroom) return '🏪';
          if (item.store) return '🏬';
          if (item.showroom) return '🏪';
          return '📍';
        };

        return (
          <Card key={item.id} className='overflow-hidden'>
            <CardContent className='pt-4'>
              <h4 className='font-semibold'>{item.item?.name || 'Unknown Product'}</h4>
              
              {/* Location Badge */}
              <div className='mt-1'>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  item.store 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : item.showroom
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  <span>{getLocationIcon()}</span>
                  <span>{getLocationDisplay()}</span>
                </span>
              </div>

              <div className='mt-3 grid grid-cols-2 gap-2'>
                <div>
                  <p className='text-xs text-muted-foreground'>Quantity</p>
                  <p className='font-medium'>{item.quantity}</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Unit Price</p>
                  <p className='font-medium'>{item.unitPrice.toFixed(2)}</p>
                </div>
              </div>
              <div className='mt-2 flex justify-between items-center border-t pt-2'>
                <span className='text-sm font-medium'>Total:</span>
                <span className='font-bold'>{item.totalPrice.toFixed(2)}</span>
              </div>
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
                <TableHead>#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className='text-center'>Quantity</TableHead>
                <TableHead className='text-right'>Unit Price</TableHead>
                <TableHead className='text-right'>Total Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item: ISellItem, index: number) => {
                // Get location display
                const getLocationDisplay = () => {
                  if (item.store && item.showroom) {
                    return `${item.store.name} → ${item.showroom.name}`;
                  } else if (item.store) {
                    return item.store.name;
                  } else if (item.showroom) {
                    return item.showroom.name;
                  }
                  return 'No Location';
                };

                // Get location icon and color
                const getLocationStyle = () => {
                  if (item.store && item.showroom) {
                    return {
                      icon: '🏪',
                      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
                      textColor: 'text-purple-700 dark:text-purple-300',
                      borderColor: 'border-purple-200 dark:border-purple-800'
                    };
                  } else if (item.store) {
                    return {
                      icon: '🏬',
                      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                      textColor: 'text-blue-700 dark:text-blue-300',
                      borderColor: 'border-blue-200 dark:border-blue-800'
                    };
                  } else if (item.showroom) {
                    return {
                      icon: '🏪',
                      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
                      textColor: 'text-purple-700 dark:text-purple-300',
                      borderColor: 'border-purple-200 dark:border-purple-800'
                    };
                  }
                  return {
                    icon: '📍',
                    bgColor: 'bg-gray-50 dark:bg-gray-800',
                    textColor: 'text-gray-500 dark:text-gray-400',
                    borderColor: 'border-gray-200 dark:border-gray-700'
                  };
                };

                const locationStyle = getLocationStyle();

                return (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className='font-medium'>
                      {item.item?.name || 'Unknown Product'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${locationStyle.bgColor} ${locationStyle.textColor} border ${locationStyle.borderColor}`}>
                        <span>{locationStyle.icon}</span>
                        <span>{getLocationDisplay()}</span>
                      </span>
                    </TableCell>
                    <TableCell className='text-center'>{item.quantity}</TableCell>
                    <TableCell className='text-right'>{item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className='text-right font-bold'>{item.totalPrice.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
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

