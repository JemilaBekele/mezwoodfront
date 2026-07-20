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
  Calendar,
  User,
  Info,
  Check,
  X,
  DollarSign,
  FileText,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { IPurchase, PaymentStatus, PurchaseItem } from '@/models/purchase';
import {
  getPurchaseId,
  acceptPurchase,
  getStockCorrectionsByPurchaseId
} from '@/service/purchase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { IStockCorrection } from '@/models/StockCorrection';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { deleteStockCorrection } from '@/service/StockCorrection';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';

type PurchaseViewProps = {
  id?: string;
};

const PurchasedetailPage: React.FC<PurchaseViewProps> = ({ id }) => {
  const [purchase, setPurchase] = useState<IPurchase | null>(null);
  const [stockCorrections, setStockCorrections] = useState<IStockCorrection[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [loadingCorrections, setLoadingCorrections] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PaymentStatus | null>(null);

  useEffect(() => {
    const fetchPurchaseData = async () => {
      try {
        if (id) {
          const purchaseData = await getPurchaseId(id);
          setPurchase(purchaseData);
          setSelectedStatus(purchaseData.paymentStatus);

          // Fetch stock corrections for this purchase
          await fetchStockCorrections(id);
        }
      } catch (error) {
        toast.error('Failed to fetch purchase details');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseData();
  }, [id, refreshTrigger]);

  const fetchStockCorrections = async (purchaseId: string) => {
    setLoadingCorrections(true);
    try {
      const corrections = await getStockCorrectionsByPurchaseId(purchaseId);
      setStockCorrections(corrections);
    } catch (error) {
      toast.error('Failed to load stock corrections');
    } finally {
      setLoadingCorrections(false);
    }
  };

  const handleStatusChange = (value: PaymentStatus) => {
    // If the selected status is the same as current, don't do anything
    if (value === purchase?.paymentStatus) {
      return;
    }
    
    // Set the selected status and show confirmation dialog
    setSelectedStatus(value);
    setPendingStatus(value);
    setShowStatusAlert(true);
  };

  const handleStatusUpdateConfirm = async () => {
    if (!id || !pendingStatus || pendingStatus === purchase?.paymentStatus) {
      setShowStatusAlert(false);
      setPendingStatus(null);
      return;
    }

    setUpdating(true);
    try {
      const updatedPurchase = await acceptPurchase(id, pendingStatus);

      // Preserve the existing items when updating the purchase
      setPurchase((prevPurchase) => ({
        ...updatedPurchase,
        items: prevPurchase?.items || updatedPurchase.items || []
      }));

      setSelectedStatus(pendingStatus);
      toast.success(`Payment status updated to ${pendingStatus} successfully`);

      // If status was changed to APPROVED, trigger a refresh
      if (pendingStatus === PaymentStatus.APPROVED) {
        // Force a refresh of the data
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      toast.error('Failed to update payment status');
      // Reset the selected status to the original if update fails
      if (purchase) {
        setSelectedStatus(purchase.paymentStatus);
      }
    } finally {
      setUpdating(false);
      setShowStatusAlert(false);
      setPendingStatus(null);
    }
  };

  const handleStatusUpdateCancel = () => {
    // Reset the selected status back to the original purchase status
    if (purchase) {
      setSelectedStatus(purchase.paymentStatus);
    }
    setShowStatusAlert(false);
    setPendingStatus(null);
  };

  const handleDeleteStockCorrection = async (correctionId: string) => {
    setDeletingId(correctionId);
    try {
      await deleteStockCorrection(correctionId);
      toast.success('Stock correction deleted successfully');

      // Refresh the stock corrections list
      if (id) {
        await fetchStockCorrections(id);
      }
    } catch (error) {
      toast.error('Failed to delete stock correction');
    } finally {
      setDeletingId(null);
    }
  };

  const refreshStockCorrections = async () => {
    if (id) {
      await fetchStockCorrections(id);
    }
  };

  const getStatusAlertMessage = () => {
    if (!pendingStatus || !purchase) return { title: '', description: '' };
    
    const currentStatus = purchase.paymentStatus;
    const newStatus = pendingStatus;
    
    if (newStatus === PaymentStatus.APPROVED) {
      return {
        title: 'Confirm Approval',
        description: `Are you sure you want to approve this purchase? This will update inventory and ${currentStatus === PaymentStatus.PENDING ? 'process' : 'reprocess'} stock movements. This action cannot be undone.`
      };
    } else if (newStatus === PaymentStatus.REJECTED) {
      return {
        title: 'Confirm Rejection',
        description: `Are you sure you want to reject this purchase? This will ${currentStatus === PaymentStatus.APPROVED ? 'reverse any inventory updates and' : ''} mark the purchase as rejected. This action cannot be undone.`
      };
    } else if (newStatus === PaymentStatus.PENDING) {
      return {
        title: 'Confirm Pending Status',
        description: `Are you sure you want to change the status back to PENDING? This will ${currentStatus === PaymentStatus.APPROVED ? 'reverse inventory updates and' : ''} set the purchase back to pending.`
      };
    }
    
    return {
      title: 'Confirm Status Change',
      description: `Are you sure you want to change the payment status from ${currentStatus} to ${newStatus}?`
    };
  };

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin' />
        <p>Loading purchase details...</p>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p>Purchase not found</p>
      </div>
    );
  }

  // Calculate financial details safely
  const subtotal =
    purchase.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;

  const grandTotal = purchase.grandTotal || subtotal;

  return (
    <div className='container mx-auto space-y-6 p-4 md:p-8'>
      {/* Status Update Alert Dialog */}
      <AlertDialog open={showStatusAlert} onOpenChange={setShowStatusAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getStatusAlertMessage().title}</AlertDialogTitle>
            <AlertDialogDescription>
              {getStatusAlertMessage().description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStatusUpdateCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusUpdateConfirm}
              className={
                pendingStatus === PaymentStatus.REJECTED
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : pendingStatus === PaymentStatus.APPROVED
                  ? 'bg-green-600 hover:bg-green-700'
                  : ''
              }
            >
              {updating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Updating...
                </>
              ) : (
                `Confirm ${pendingStatus}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Status Update Section */}
      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle className='text-xl font-bold'>
            Update Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center'>
            <PermissionGuard
              requiredPermission={PERMISSIONS.PURCHASE.ACCEPT.name}
            >
              <Select
                value={selectedStatus}
                onValueChange={handleStatusChange}
                disabled={updating}
              >
                <SelectTrigger className='w-full sm:w-50'>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentStatus.APPROVED}>
                    APPROVED
                  </SelectItem>
                  <SelectItem value={PaymentStatus.REJECTED}>
                    REJECTED
                  </SelectItem>
                  <SelectItem value={PaymentStatus.PENDING}>
                    PENDING
                  </SelectItem>
                </SelectContent>
              </Select>

              {updating && (
                <div className='flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  <span className='text-sm text-muted-foreground'>
                    Updating status...
                  </span>
                </div>
              )}

              {selectedStatus &&
                selectedStatus !== purchase.paymentStatus &&
                !updating && (
                  <Badge variant='outline' className='ml-2'>
                    Changing from {purchase.paymentStatus} to {selectedStatus}
                  </Badge>
                )}
            </PermissionGuard>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Details Card */}
      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-2xl font-bold'>
            <Package className='text-primary' />
            Purchase {purchase.invoiceNo || purchase.id}
            <Badge
              variant={
                purchase.paymentStatus === PaymentStatus.APPROVED
                  ? 'default'
                  : purchase.paymentStatus === PaymentStatus.REJECTED
                    ? 'destructive'
                    : 'secondary'
              }
              className='ml-2'
            >
              {purchase.paymentStatus === PaymentStatus.APPROVED ? (
                <>
                  <Check className='mr-1 h-3 w-3' /> {purchase.paymentStatus}
                </>
              ) : purchase.paymentStatus === PaymentStatus.REJECTED ? (
                <>
                  <X className='mr-1 h-3 w-3' /> {purchase.paymentStatus}
                </>
              ) : (
                <>{purchase.paymentStatus}</>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {/* Purchase Details */}
            <div className='space-y-4'>
              <h3 className='flex items-center gap-2 text-lg font-semibold'>
                <Info className='text-primary h-5 w-5' />
                Purchase Information
              </h3>
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <FileText className='text-muted-foreground h-4 w-4' />
                  <p>
                    <span className='font-medium'>Invoice Number:</span>{' '}
                    {purchase.invoiceNo}
                  </p>
                </div>
                {purchase.supplier && (
                  <div className='flex items-center gap-2'>
                    <User className='text-muted-foreground h-4 w-4' />
                    <p>
                      <span className='font-medium'>Supplier:</span>{' '}
                      {purchase.supplier.name ?? 'Unknown Supplier'}
                    </p>
                  </div>
                )}
                {purchase.createdBy && (
                  <div className='flex items-center gap-2'>
                    <User className='text-muted-foreground h-4 w-4' />
                    <p>
                      <span className='font-medium'>Created By:</span>{' '}
                      {purchase.createdBy.name ?? 'Unknown Employee'}
                    </p>
                  </div>
                )}
                {purchase.updatedBy && (
                  <div className='flex items-center gap-2'>
                    <User className='text-muted-foreground h-4 w-4' />
                    <p>
                      <span className='font-medium'>Approved By:</span>{' '}
                      {purchase.updatedBy.name ?? 'Unknown Employee'}
                    </p>
                  </div>
                )}
                {purchase.notes && (
                  <div>
                    <p className='font-medium'>Notes:</p>
                    <p className='text-muted-foreground'>{purchase.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial and Date Details */}
            <div className='space-y-4'>
              <h3 className='flex items-center gap-2 text-lg font-semibold'>
                <Calendar className='text-primary h-5 w-5' />
                Financial Details
              </h3>
              <div className='space-y-2'>
                <div>
                  <p className='font-medium'>Purchase Date:</p>
                  <p className='text-muted-foreground'>
                    {formatDate(purchase.purchaseDate)}
                  </p>
                </div>

                <div className='flex items-center gap-2'>
                  <DollarSign className='text-muted-foreground h-4 w-4' />
                  <p>
                    <span className='font-medium'> Total:</span>{' '}
                    {grandTotal.toFixed(2)}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <Package className='text-muted-foreground h-4 w-4' />
                  <p>
                    <span className='font-medium'>Total Products:</span>{' '}
                    {purchase.totalProducts || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Purchased Items Table Section */}
          {purchase.items?.length > 0 && (
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Purchased Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.items.map((item: PurchaseItem, index) => (
                    <TableRow key={item.id || item.materialId || index}>
                      <TableCell className='font-medium'>
                        {item.material?.name || 'Unknown Material'}
                      </TableCell>
                      <TableCell>
                        {item?.unitOfMeasure?.name || 'Unknown Unit'}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{(item.unitPrice || 0).toFixed(2)}</TableCell>
                      <TableCell>{(item.totalPrice || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Corrections Section */}
      <Card className='shadow-lg'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div className='flex flex-col space-y-2'>
            <CardTitle className='flex items-center gap-2 text-xl font-bold'>
              <AlertTriangle className='text-amber-500' />
              Stock Corrections
              {stockCorrections.length > 0 && (
                <Badge variant='secondary' className='ml-2'>
                  {stockCorrections.length}
                </Badge>
              )}
            </CardTitle>
            <div>
              <Link href={`/dashboard/purchase/StockCorrection/create?id=${id}`}>
                <Button variant='outline' size='sm'>
                  Add Stock Correction
                </Button>
              </Link>
            </div>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={refreshStockCorrections}
            disabled={loadingCorrections}
          >
            {loadingCorrections ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <RefreshCw className='h-4 w-4' />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {loadingCorrections ? (
            <div className='flex items-center justify-center py-4'>
              <Loader2 className='mr-2 h-6 w-6 animate-spin' />
              <p>Loading stock corrections...</p>
            </div>
          ) : stockCorrections.length === 0 ? (
            <div className='text-muted-foreground py-6 text-center'>
              <p>No stock corrections found for this purchase</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {stockCorrections.map((correction) => (
                <Card
                  key={correction.id}
                  className='border-l-4 border-l-amber-500'
                >
                  <CardContent className='pt-4'>
                    <div className='mb-4 flex items-start justify-between'>
                      <div>
                        <h4 className='font-semibold'>
                          Stock Correction #{correction.shortCode || correction.id.slice(-6)}
                        </h4>
                        <div className='mt-2 flex flex-wrap gap-4'>
                          <Badge variant='outline' className='capitalize'>
                            Reason: {correction.reason.toLowerCase()}
                          </Badge>
                          <Badge
                            variant={
                              correction.status === 'APPROVED'
                                ? 'default'
                                : correction.status === 'REJECTED'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className='capitalize'
                          >
                            Status: {correction.status.toLowerCase()}
                          </Badge>
                        </div>
                      </div>
                      {correction.reference && (
                        <div className='text-right text-sm'>
                          <p className='font-medium'>Reference:</p>
                          <p className='text-muted-foreground'>
                            {correction.reference}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <div>
                        <p className='text-muted-foreground text-sm'>
                          <span className='font-medium'>Created:</span>{' '}
                          {formatDate(correction.createdAt)}
                          {correction.createdBy &&
                            ` by ${correction.createdBy.name}`}
                        </p>
                      </div>
                      <div>
                        {correction.purchase && (
                          <p className='text-muted-foreground text-sm'>
                            <span className='font-medium'>Purchase:</span>{' '}
                            {correction.purchase.invoiceNo}
                          </p>
                        )}
                      </div>
                    </div>

                    {correction.notes && (
                      <div className='bg-muted mb-4 rounded-md p-3'>
                        <p className='text-sm font-medium'>Notes:</p>
                        <p className='text-muted-foreground text-sm'>
                          {correction.notes}
                        </p>
                      </div>
                    )}

                    <div className='mb-4 flex gap-2'>
                      <Link
                        href={`/dashboard/purchase/StockCorrection/${correction.id}?purchaseId=${id}`}
                      >
                        <Button variant='outline' size='sm'>
                          Edit Stock Correction
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='destructive'
                            size='sm'
                            disabled={deletingId === correction.id}
                          >
                            {deletingId === correction.id ? (
                              <Loader2 className='mr-1 h-4 w-4 animate-spin' />
                            ) : (
                              <Trash2 className='mr-1 h-4 w-4' />
                            )}
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the stock correction and remove
                              it from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDeleteStockCorrection(correction.id)
                              }
                              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <div className='mt-4'>
                      <h5 className='mb-2 font-medium'>Correction Items:</h5>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {correction.items &&
                            correction.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {item.material?.name || 'Unknown Material'}
                                </TableCell>
                                <TableCell>
                                  <span className={item.quantity < 0 ? 'text-red-500 font-medium' : 'text-green-500 font-medium'}>
                                    {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {item.material?.unitOfMeasure?.name || ''}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchasedetailPage;