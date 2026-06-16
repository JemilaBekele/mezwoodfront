/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  AlertTriangle,
  Hash,
  Store,
  Building2,
  Box
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
  approveStockCorrection,
  getStockCorrectionId,
  rejectStockCorrection
} from '@/service/StockCorrection';
import {
  IStockCorrection,
  IStockCorrectionItem,
  StockCorrectionReason,
  StockCorrectionStatus
} from '@/models/StockCorrection';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
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
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';

type StockCorrectionViewProps = {
  id?: string;
};

const StockCorrectionDetailPage: React.FC<StockCorrectionViewProps> = ({
  id
}) => {
  const [stockCorrection, setStockCorrection] =
    useState<IStockCorrection | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showApproveAlert, setShowApproveAlert] = useState(false);
  const [showRejectAlert, setShowRejectAlert] = useState(false);

  const fetchStockCorrection = useCallback(
    async () => {
      try {
        if (id) {
          const stockCorrectionData = await getStockCorrectionId(id);
          console.log('Fetched stock correction data:', stockCorrectionData);
          setStockCorrection(stockCorrectionData);
        }
      } catch (error) {
        toast.error('Failed to fetch stock correction details');
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchStockCorrection();
  }, [fetchStockCorrection, id]);

  const handleApproveConfirm = async () => {
    if (!id) return;

    setUpdating(true);
    try {
      const updatedStockCorrection = await approveStockCorrection(id);
      setStockCorrection(updatedStockCorrection);
      toast.success('Stock correction approved successfully');
      await fetchStockCorrection();
    } catch (error: any) {
      console.error('Backend error:', error);
      
      // Check for specific error messages
      if (error?.message?.includes('Insufficient stock')) {
        toast.error('Insufficient stock available. Please check stock levels.');
      } else if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to approve stock correction');
      }
    } finally {
      setUpdating(false);
      setShowApproveAlert(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!id) return;

    setUpdating(true);
    try {
      const updatedStockCorrection = await rejectStockCorrection(id);
      setStockCorrection(updatedStockCorrection);
      toast.success('Stock correction rejected successfully');

      // Refresh the data to ensure we have the latest state
      await fetchStockCorrection();
    } catch (error) {
      toast.error('Failed to reject stock correction');
    } finally {
      setUpdating(false);
      setShowRejectAlert(false);
    }
  };

  const handleApproveClick = () => {
    setShowApproveAlert(true);
  };

  const handleRejectClick = () => {
    setShowRejectAlert(true);
  };

  // Calculate total impact of stock correction
  const getTotalImpact = () => {
    if (!stockCorrection?.items) return { positive: 0, negative: 0, total: 0 };
    
    const positive = stockCorrection.items
      .filter(item => item.quantity > 0)
      .reduce((sum, item) => sum + item.quantity, 0);
    
    const negative = stockCorrection.items
      .filter(item => item.quantity < 0)
      .reduce((sum, item) => sum + Math.abs(item.quantity), 0);
    
    return {
      positive,
      negative,
      total: positive - negative
    };
  };

  const getItemsSummary = () => {
    if (!stockCorrection?.items) return '';
    const items = stockCorrection.items.length;
    const impact = getTotalImpact();
    const itemType = stockCorrection.ismaterial ? 'material(s)' : 'item(s)';
    
    if (impact.total > 0) {
      return `This will add a total of ${impact.total} units to inventory across ${items} ${itemType}.`;
    } else if (impact.total < 0) {
      return `This will remove a total of ${Math.abs(impact.total)} units from inventory across ${items} ${itemType}.`;
    }
    return `This will affect ${items} ${itemType} in inventory.`;
  };

  // Get location display
  const getLocationDisplay = () => {
    if (stockCorrection?.storeId) {
      return {
        type: 'Store',
        name: stockCorrection.store?.name || 'Unknown Store',
        icon: <Store className="h-4 w-4" />
      };
    } else if (stockCorrection?.showroomId) {
      return {
        type: 'Showroom',
        name: stockCorrection.showroom?.name || 'Unknown Showroom',
        icon: <Building2 className="h-4 w-4" />
      };
    }
    return null;
  };

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin' />
        <p>Loading stock correction details...</p>
      </div>
    );
  }

  if (!stockCorrection) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p>Stock correction not found</p>
      </div>
    );
  }

  // Check if stock correction is approved or rejected
  const isImmutable =
    stockCorrection.status === StockCorrectionStatus.APPROVED ||
    stockCorrection.status === StockCorrectionStatus.REJECTED;

  // Get badge variant based on status
  const getStatusVariant = (status: StockCorrectionStatus) => {
    switch (status) {
      case StockCorrectionStatus.APPROVED:
        return 'default';
      case StockCorrectionStatus.REJECTED:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Get reason display text
  const getReasonText = (reason: StockCorrectionReason) => {
    switch (reason) {
      case 'PURCHASE_ERROR':
        return 'Purchase Error';
      case 'EXPIRED':
        return 'Expired';
      case 'DAMAGED':
        return 'Damaged';
      case 'MANUAL_ADJUSTMENT':
        return 'Manual Adjustment';
      default:
        return reason;
    }
  };

  const impact = getTotalImpact();
  const location = getLocationDisplay();

  return (
    <div className='container mx-auto space-y-4 p-3 md:space-y-6 md:p-6 lg:p-8'>
      {/* Approve Confirmation Alert Dialog */}
      <AlertDialog open={showApproveAlert} onOpenChange={setShowApproveAlert}>
        <AlertDialogContent className='max-w-md md:max-w-lg'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Check className='h-5 w-5 text-green-600' />
              Approve Stock Correction
            </AlertDialogTitle>
            <AlertDialogDescription className='space-y-3'>
              <p>
                Are you sure you want to approve this stock correction?
              </p>
              
              <Alert>
                <AlertTitle className='text-sm font-semibold'>
                  {getItemsSummary()}
                </AlertTitle>
              </Alert>
              
              {stockCorrection.reason === 'PURCHASE_ERROR' && (
                <Alert variant='destructive' className='mt-3'>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertTitle>Purchase Error Correction</AlertTitle>
                  <AlertDescription>
                    This correction is related to a purchase error. Approving will adjust inventory to fix the purchase discrepancy.
                  </AlertDescription>
                </Alert>
              )}

              {stockCorrection.reason === 'DAMAGED' && (
                <Alert className='mt-3 bg-red-50 border-red-200'>
                  <AlertTriangle className='h-4 w-4 text-red-600' />
                  <AlertTitle className='text-red-800 font-semibold'>
                    Damaged Goods
                  </AlertTitle>
                  <AlertDescription className='text-red-700'>
                    This will write off damaged goods from inventory. Ensure this has been properly documented.
                  </AlertDescription>
                </Alert>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveConfirm}
              disabled={updating}
              className='bg-green-600 hover:bg-green-700 focus:ring-green-600'
            >
              {updating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Approving...
                </>
              ) : (
                <>
                  <Check className='mr-2 h-4 w-4' />
                  Yes, Approve
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Alert Dialog */}
      <AlertDialog open={showRejectAlert} onOpenChange={setShowRejectAlert}>
        <AlertDialogContent className='max-w-md md:max-w-lg'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2 text-destructive'>
              <X className='h-5 w-5' />
              Reject Stock Correction
            </AlertDialogTitle>
            <AlertDialogDescription className='space-y-3'>
              <p>
                Are you sure you want to reject this stock correction?
              </p>
              
              <Alert>
                <AlertTitle className='text-sm font-semibold'>
                  {getItemsSummary()}
                </AlertTitle>
              </Alert>

              {stockCorrection.reason === 'MANUAL_ADJUSTMENT' && (
                <Alert className='mt-3'>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertTitle>Manual Adjustment Request</AlertTitle>
                  <AlertDescription>
                    This is a manual adjustment request. Please ensure you have reviewed all details before rejecting.
                  </AlertDescription>
                </Alert>
              )}

              <p className='text-sm text-muted-foreground mt-3'>
                This action is final and cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              disabled={updating}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {updating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className='mr-2 h-4 w-4' />
                  Yes, Reject
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stock Correction Status Update Section - Only show if pending */}
      {!isImmutable && (
        <Card className='shadow-lg'>
          <CardHeader className='p-4 md:p-6'>
            <CardTitle className='text-lg font-bold md:text-xl'>
              Review Stock Correction
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 pt-0 md:p-6 md:pt-0'>
            <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
              <div className='flex w-full flex-col gap-2 sm:flex-row sm:w-auto'>
                <PermissionGuard
                  requiredPermission={PERMISSIONS.STOCK_CORRECTION.APPROVE.name}
                >
                  <Button
                    onClick={handleApproveClick}
                    disabled={updating}
                    className='w-full sm:w-auto bg-green-600 hover:bg-green-700'
                    size="sm"
                  >
                    {updating ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className='mr-2 h-4 w-4' />
                        Approve
                      </>
                    )}
                  </Button>
                </PermissionGuard>
                <PermissionGuard
                  requiredPermission={PERMISSIONS.STOCK_CORRECTION.REJECT.name}
                >
                  <Button
                    variant='destructive'
                    onClick={handleRejectClick}
                    disabled={updating}
                    className='w-full sm:w-auto'
                    size="sm"
                  >
                    {updating ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <X className='mr-2 h-4 w-4' />
                        Reject
                      </>
                    )}
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Correction Details Card */}
      <Card className='shadow-lg'>
        <CardHeader className='p-4 md:p-6'>
          <CardTitle className='flex flex-col items-start gap-2 text-lg font-bold md:flex-row md:items-center md:text-2xl'>
            <div className='flex items-center gap-2'>
              <AlertTriangle className='text-primary h-5 w-5' />
              <span className='truncate'>
                Stock Correction {stockCorrection.shortCode || stockCorrection.reference || ''}
              </span>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Badge
                variant={getStatusVariant(stockCorrection.status)}
                className='mt-1 md:mt-0'
              >
                {stockCorrection.status === StockCorrectionStatus.APPROVED ? (
                  <>
                    <Check className='mr-1 h-3 w-3' /> 
                    <span className='hidden sm:inline'>{stockCorrection.status}</span>
                    <span className='sm:hidden'>Approved</span>
                  </>
                ) : stockCorrection.status === StockCorrectionStatus.REJECTED ? (
                  <>
                    <X className='mr-1 h-3 w-3' />
                    <span className='hidden sm:inline'>{stockCorrection.status}</span>
                    <span className='sm:hidden'>Rejected</span>
                  </>
                ) : (
                  <span>{stockCorrection.status}</span>
                )}
              </Badge>
              <Badge variant="outline" className='mt-1 md:mt-0'>
                <Box className='mr-1 h-3 w-3' />
                {stockCorrection.ismaterial ? 'Materials' : 'Items'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 p-4 md:space-y-6 md:p-6'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6'>
            {/* Stock Correction Details */}
            <div className='space-y-3 md:space-y-4'>
              <h3 className='flex items-center gap-2 text-base font-semibold md:text-lg'>
                <Info className='text-primary h-4 w-4 md:h-5 md:w-5' />
                Correction Information
              </h3>
              <div className='space-y-2'>
                <div className='flex items-start gap-2'>
                  <Hash className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Short Code:</p>
                    <p className='text-muted-foreground text-sm'>
                      {stockCorrection.shortCode || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-2'>
                  <Package className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Reference:</p>
                    <p className='text-muted-foreground text-sm truncate'>
                      {stockCorrection.reference || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-2'>
                  <AlertTriangle className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Reason:</p>
                    <p className='text-muted-foreground text-sm'>
                      {getReasonText(stockCorrection.reason)}
                    </p>
                  </div>
                </div>

                {location && (
                  <div className='flex items-start gap-2'>
                    {location.icon}
                    <div>
                      <p className='font-medium text-sm'>{location.type}:</p>
                      <p className='text-muted-foreground text-sm'>
                        {location.name}
                      </p>
                    </div>
                  </div>
                )}

                {stockCorrection.purchaseId && (
                  <div className='flex items-center gap-2'>
                    <Package className='text-muted-foreground h-4 w-4 shrink-0' />
                    <div>
                      <p className='font-medium text-sm'>Purchase:</p>
                      <p className='text-muted-foreground text-sm truncate'>
                        {stockCorrection.purchase?.invoiceNo || stockCorrection.purchaseId}
                      </p>
                    </div>
                  </div>
                )}

                {stockCorrection.createdBy && (
                  <div className='flex items-center gap-2'>
                    <User className='text-muted-foreground h-4 w-4 shrink-0' />
                    <div>
                      <p className='font-medium text-sm'>Created By:</p>
                      <p className='text-muted-foreground text-sm'>
                        {stockCorrection.createdBy.name ?? 'Unknown User'}
                      </p>
                    </div>
                  </div>
                )}

                {stockCorrection.updatedBy && (
                  <div className='flex items-center gap-2'>
                    <User className='text-muted-foreground h-4 w-4 shrink-0' />
                    <div>
                      <p className='font-medium text-sm'>Updated By:</p>
                      <p className='text-muted-foreground text-sm'>
                        {stockCorrection.updatedBy.name ?? 'Unknown User'}
                      </p>
                    </div>
                  </div>
                )}

                {stockCorrection.notes && (
                  <div>
                    <p className='font-medium text-sm'>Notes:</p>
                    <p className='text-muted-foreground text-sm'>
                      {stockCorrection.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Date Details */}
            <div className='space-y-3 md:space-y-4'>
              <h3 className='flex items-center gap-2 text-base font-semibold md:text-lg'>
                <Calendar className='text-primary h-4 w-4 md:h-5 md:w-5' />
                Date Details
              </h3>
              <div className='space-y-2'>
                <div>
                  <p className='font-medium text-sm'>Created At:</p>
                  <p className='text-muted-foreground text-sm'>
                    {formatDate(stockCorrection.createdAt)}
                  </p>
                </div>
                <div>
                  <p className='font-medium text-sm'>Updated At:</p>
                  <p className='text-muted-foreground text-sm'>
                    {formatDate(stockCorrection.updatedAt)}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <Package className='text-muted-foreground h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Total Items:</p>
                    <p className='text-muted-foreground text-sm'>
                      {stockCorrection.items?.length || 0}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <AlertTriangle className='text-muted-foreground h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium text-sm'>Net Impact:</p>
                    <p className={`text-sm font-semibold ${impact.total > 0 ? 'text-green-600' : impact.total < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {impact.total > 0 ? `+${impact.total}` : impact.total}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Correction Items Table Section */}
          {stockCorrection.items?.length > 0 && (
            <div className='space-y-3 md:space-y-4'>
              <h3 className='text-base font-semibold md:text-lg'>
                Correction {stockCorrection.ismaterial ? 'Materials' : 'Items'}
              </h3>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='whitespace-nowrap text-xs md:text-sm'>
                        {stockCorrection.ismaterial ? 'Material' : 'Item'}
                      </TableHead>
                      <TableHead className='whitespace-nowrap text-xs md:text-sm'>Details</TableHead>
                      <TableHead className='whitespace-nowrap text-xs md:text-sm'>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockCorrection.items.map((item: IStockCorrectionItem) => (
                      <TableRow key={item.id}>
                        <TableCell className='whitespace-nowrap text-xs md:text-sm font-medium'>
                          {stockCorrection.ismaterial 
                            ? (item.material?.name || 'Unknown Material')
                            : (item.item?.name || 'Unknown Item')}
                        </TableCell>
                        <TableCell className='text-xs md:text-sm text-muted-foreground'>
                          {stockCorrection.ismaterial ? (
                            <>
                              {item.material?.color && <div>Color: {item.material.color}</div>}
                              {item.material?.size && <div>Size: {item.material.size}</div>}
                              {item.material?.materialType?.name && <div>Type: {item.material.materialType.name}</div>}
                            </>
                          ) : (
                            <>
                              {item.item?.color && <div>Color: {item.item.color}</div>}
                              {item.item?.size?.name && <div>Size: {item.item.size.name}</div>}
                              {item.item?.category?.name && <div>Category: {item.item.category.name}</div>}
                            </>
                          )}
                        </TableCell>
                        <TableCell className='whitespace-nowrap text-xs md:text-sm'>
                          <div className={`flex items-center font-semibold ${item.quantity < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile view */}
              <div className='md:hidden space-y-3'>
                {stockCorrection.items.map((item: IStockCorrectionItem) => (
                  <div key={item.id} className='bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-sm'>
                    <div className='flex justify-between items-start mb-2'>
                      <p className='font-medium text-base'>
                        {stockCorrection.ismaterial 
                          ? (item.material?.name || 'Unknown Material')
                          : (item.item?.name || 'Unknown Item')}
                      </p>
                      <Badge variant={item.quantity < 0 ? 'destructive' : 'default'}>
                        {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                      </Badge>
                    </div>
                    <div className='text-sm text-gray-600 dark:text-gray-400'>
                      {stockCorrection.ismaterial ? (
                        <>
                          {item.material?.color && <div>Color: {item.material.color}</div>}
                          {item.material?.size && <div>Size: {item.material.size}</div>}
                          {item.material?.materialType?.name && <div>Type: {item.material.materialType.name}</div>}
                        </>
                      ) : (
                        <>
                          {item.item?.color && <div>Color: {item.item.color}</div>}
                          {item.item?.size?.name && <div>Size: {item.item.size.name}</div>}
                          {item.item?.category?.name && <div>Category: {item.item.category.name}</div>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockCorrectionDetailPage;