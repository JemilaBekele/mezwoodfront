/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
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
  ZoomIn,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { ISell, ISellItem, SaleStatus, ItemSaleStatus } from '@/models/Sell';
import { deliverSaleItems, getSellById } from '@/service/Sell';

export const normalizeImagePath = (path?: string) => {
  if (!path) return undefined;
  
  // Replace all backslashes with forward slashes
  const normalizedPath = path.replace(/\\/g, '/');
  
  // If it's already an absolute URL, return as is
  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return normalizedPath;
  }
  
  // Remove leading slashes to prevent double slashes
  const cleanPath = normalizedPath.replace(/^\/+/, '');
  
  // Construct the full URL  192.168.1.2
  const BACKEND_URL = 'http://rcf.ordere.net';
  return `${BACKEND_URL}/${cleanPath}`;
};

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
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    const fetchSale = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const saleData = await getSellById(id);
        setSale(saleData);
      } catch {
        toast.error('Failed to fetch sale details');
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id]);

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

            <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
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

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleDeliverClick = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one item to deliver');
      return;
    }
    setIsConfirmDialogOpen(true);
  };

const handleConfirmDelivery = async () => {
  if (!sale || !id) return;

  const itemsToDeliver = Array.from(selectedItems).map(itemId => {
    const sellItem = sale.items?.find(item => item.id === itemId);
    return {
      sellItemId: itemId,
      quantityDelivered: sellItem?.quantity || 0
    };
  });

  setIsSubmittingDelivery(true);
  try {
    const result = await deliverSaleItems(id, itemsToDeliver);
    
    setSale(result.sale);
    
    toast.success(
      result.summary.allItemsDelivered 
        ? 'All items delivered successfully!' 
        : 'Delivery processed successfully!'
    );
    
    setIsConfirmDialogOpen(false);
    setSelectedItems(new Set());
    
    // ADD THIS: Wait 1 second before refreshing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Refresh
    const refreshedSale = await getSellById(id);
    setSale(refreshedSale);
    
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to process delivery');
  } finally {
    setIsSubmittingDelivery(false);
  }
};

  const getItemStatusBadge = (status: ItemSaleStatus) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge variant="outline" className="bg-green-50 text-green-700"><Check className="mr-1 h-3 w-3" /> Delivered</Badge>;

      default:
        return <Badge variant="default">Pending</Badge>;
    }
  };

  const canDeliver = () => {
    if (!sale) return false;
    return sale.saleStatus !== 'CANCELLED' && 
           sale.saleStatus !== 'DELIVERED' &&
           sale.items?.some(item => item.itemSaleStatus !== 'DELIVERED');
  };

  const handleImageClick = (normalizedUrl: string, productName: string) => {
    setSelectedImage(normalizedUrl);
    setSelectedProductName(productName);
    setIsImageModalOpen(true);
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
  const balance = sale.balance || grandTotal;

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
                {canDeliver() && (
                  <Button
                    onClick={handleDeliverClick}
                    variant='default'
                    className='flex items-center gap-2'
                    disabled={selectedItems.size === 0}
                  >
                    <Truck className='h-4 w-4' />
                    Deliver Selected ({selectedItems.size})
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sale Items Table with Checkboxes and Images */}
          {sale.items && sale.items.length > 0 ? (
            <div className='space-y-4'>
              <h3 className='text-base font-semibold sm:text-lg'>Sale Items</h3>

              {/* Mobile Card View with Images */}
              <div className='space-y-3 sm:hidden'>
                {sale.items.map((item: ISellItem) => {
                  const isSelected = selectedItems.has(item.id);
                  const canSelect = item.itemSaleStatus !== 'DELIVERED';
                  const productImage = normalizeImagePath(item.item?.imageUrl);
                  return (
                    <Card 
                      key={item.id} 
                      className={`overflow-hidden transition-colors ${
                        isSelected && canSelect ? 'border-green-500 bg-green-50' : ''
                      }`}
                    >
                      <CardContent className='pt-4'>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 flex-1">
                            {canSelect && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleItemSelection(item.id)}
                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                              />
                            )}
                            <h4 className='font-semibold'>{item.item?.name || 'Unknown Product'}</h4>
                          </div>
                          {getItemStatusBadge(item.itemSaleStatus)}
                        </div>
                        
                        {/* Product Image */}
                        {productImage && (
                          <div className='mt-3 flex justify-center'>
                            <div 
                              className='relative cursor-pointer group'
                              onClick={() => handleImageClick(productImage, item.item?.name || 'Product')}
                            >
                              <div className='relative h-32 w-32'>
    <img 
      src={productImage} 
      alt={item.item?.name || 'Product'}
      className='w-12 h-12 object-contain rounded border shadow-sm hover:shadow-md transition-shadow bg-white'
      style={{ display: 'block' }}
    />
    <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center'>
      <ZoomIn className='h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
    </div>
                              </div>
                             
                            </div>
                          </div>
                        )}
                    
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

              {/* Desktop Table View with Images */}
            {/* Desktop Table View with Images */}
<div className='block overflow-x-auto'>  {/* Changed from 'hidden sm:block' to just 'block' */}
  <div className='inline-block min-w-full align-middle'>
    <div className='overflow-hidden border rounded-lg'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Select</TableHead>
            <TableHead>#</TableHead>
            <TableHead>Product Image</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className='text-center'>Quantity</TableHead>
            <TableHead className='text-right'>Unit Price</TableHead>
            <TableHead className='text-right'>Total Price</TableHead>
            <TableHead className='text-center'>Delivery Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sale.items.map((item: ISellItem, index: number) => {
            const isSelected = selectedItems.has(item.id);
            const canSelect = item.itemSaleStatus !== 'DELIVERED';
            const productImage = normalizeImagePath(item.item?.imageUrl);
            
            return (
              <TableRow 
                key={item.id}
                className={isSelected && canSelect ? 'bg-green-50' : ''}
              >
                <TableCell>
                  {canSelect && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItemSelection(item.id)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  )}
                </TableCell>
                <TableCell>{index + 1}</TableCell>
           <TableCell className="p-2">
  {productImage ? (
    <div
      className="relative cursor-pointer group w-14 h-14 overflow-hidden rounded-md border bg-white"
      onClick={() =>
        handleImageClick(productImage, item.item?.name || 'Product')
      }
    >
      <img
        src={productImage}
        alt={item.item?.name || 'Product'}
        className="w-full h-full object-cover"
        draggable={false}
        onError={(e) => {
          console.error('Image failed to load:', productImage);
          e.currentTarget.style.display = 'none';
        }}
      />

      {/* Hover only */}
      <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/20">
        <ZoomIn className="h-4 w-4 text-white" />
      </div>
    </div>
  ) : (
    <div className="h-14 w-14 bg-gray-100 rounded-md border flex items-center justify-center">
      <Package className="h-6 w-6 text-gray-400" />
    </div>
  )}
</TableCell>
                <TableCell className='font-medium'>
                  {item.item?.name || 'Unknown Product'}
                </TableCell>
                <TableCell className='text-center'>{item.quantity}</TableCell>
                <TableCell className='text-right'>{item.unitPrice.toFixed(2)}</TableCell>
                <TableCell className='text-right font-bold'>{item.totalPrice.toFixed(2)}</TableCell>
                <TableCell className='text-center'>{getItemStatusBadge(item.itemSaleStatus)}</TableCell>
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

      {/* Image Modal Dialog - Fixed with proper DialogTitle */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-auto h-auto p-0 overflow-hidden bg-black/95">
          <DialogHeader className="sr-only">
            <DialogTitle>Product Image: {selectedProductName}</DialogTitle>
          </DialogHeader>
          <div className="relative flex items-center justify-center min-h-100">
            {selectedImage && (
              <div className="relative w-full h-[85vh] min-h-100">
             <img
  src={selectedImage}
  alt={selectedProductName}
  className="object-contain w-full h-full"
/>
              </div>
            )}
            {/* Lightweight overlay for product name */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent text-white p-4 text-center">
              <p className="text-sm font-medium">{selectedProductName}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Confirm Delivery
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to deliver the following items?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-semibold mb-2">Items to deliver:</p>
              <ul className="space-y-1">
                {Array.from(selectedItems).map(itemId => {
                  const item = sale.items?.find(i => i.id === itemId);
                  return item ? (
                    <li key={itemId} className="text-sm flex justify-between">
                      <span>{item.item?.name || 'Unknown Product'}</span>
                      <span className="font-medium">{item.quantity} units</span>
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. Stock quantities will be updated immediately.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelivery}
              disabled={isSubmittingDelivery}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmittingDelivery ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirm Delivery
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SaleDetailPage;