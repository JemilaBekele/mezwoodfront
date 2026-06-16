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
  ArrowRightLeft,
  Building2,
  Store,
  Circle,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { ITransfer, ITransferItem, TransferStatus, TransferEntityType } from '@/models/transfer';
import {
  getTransferId,
  completeTransfer,
  cancelTransfer
} from '@/service/transfer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { AlertModal } from '@/components/modal/alert-modal';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import { useAuthStore } from '@/stores/auth.store';
import { getUserById } from '@/service/user';
import { Imployee } from '@/models/employee';

type TransferViewProps = {
  id?: string;
};

const TransferDetailPage: React.FC<TransferViewProps> = ({ id }) => {
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hydrated = useAuthStore((state) => state._hydrated);
  
  const [transfer, setTransfer] = useState<ITransfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TransferStatus>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Imployee | null>(null);
  const [hasDestinationAccess, setHasDestinationAccess] = useState(false);

  // Fetch user profile to get showrooms and stores
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser) return;
      
      try {
        const profile = await getUserById();
        console.log('DEBUG - User Profile:', {
          id: profile.id,
          name: profile.name,
          store: profile.store?.name || null,
          storeId: profile.store?.id || null,
          showroom: profile.showroom?.name || null,
          showroomId: profile.showroom?.id || null
        });
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    if (authUser) {
      fetchUserProfile();
    }
  }, [authUser]);

  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        if (id) {
          console.log('Fetching transfer details for ID:', id);
          const transferData = await getTransferId(id);
          console.log('Transfer data received:', {
            id: transferData.id,
            destinationType: transferData.destinationType,
            destStore: transferData.destStore?.name,
            destStoreId: transferData.destStore?.id,
            destShowroom: transferData.destShowroom?.name,
            destShowroomId: transferData.destShowroom?.id
          });
          setTransfer(transferData);
          setSelectedStatus(transferData.status);
        }
      } catch (error) {
        console.error('Error fetching transfer:', error);
        toast.error('Failed to fetch transfer details');
      } finally {
        setLoading(false);
      }
    };

    if (id && authUser) {
      fetchTransfer();
    }
  }, [id, refreshTrigger, authUser]);

  // Check if user has access to the destination
  useEffect(() => {
    if (!transfer || !userProfile) {
      setHasDestinationAccess(false);
      return;
    }

    let hasAccess = false;

    if (transfer.destinationType === TransferEntityType.STORE) {
      // Check if user's assigned store matches the destination store
      const destStoreId = transfer.destStore?.id;
      const userStoreId = userProfile.store?.id;
      
      console.log('Checking store access:', {
        destStoreId,
        userStoreId,
        match: destStoreId === userStoreId
      });
      
      hasAccess = destStoreId === userStoreId;
    } else if (transfer.destinationType === TransferEntityType.SHOWROOM) {
      // Check if user's assigned showroom matches the destination showroom
      const destShowroomId = transfer.destShowroom?.id;
      const userShowroomId = userProfile.showroom?.id;
      
      console.log('Checking showroom access:', {
        destShowroomId,
        userShowroomId,
        match: destShowroomId === userShowroomId
      });
      
      hasAccess = destShowroomId === userShowroomId;
    }

    setHasDestinationAccess(hasAccess);
    console.log('User has destination access:', hasAccess);
  }, [transfer, userProfile]);

  const handleStatusUpdate = async (action: 'complete' | 'cancel') => {
    if (!id) return;

    // Check if user has access to destination before completing
    if (action === 'complete' && !hasDestinationAccess) {
      toast.error('You do not have access to the destination location. You can only complete transfers to your assigned store or showroom.');
      return;
    }

    setUpdating(true);
    try {
      let updatedTransfer;
      if (action === 'complete') {
        console.log('Completing transfer:', id);
        updatedTransfer = await completeTransfer(id);
        setSelectedStatus(TransferStatus.COMPLETED);
        setIsCompleteModalOpen(false);
        toast.success('Transfer completed successfully');
      } else {
        console.log('Cancelling transfer:', id);
        updatedTransfer = await cancelTransfer(id);
        setSelectedStatus(TransferStatus.CANCELLED);
        setIsCancelModalOpen(false);
        toast.success('Transfer cancelled successfully');
      }

      setTransfer((prevTransfer) => ({
        ...updatedTransfer,
        items: prevTransfer?.items || updatedTransfer.items || []
      }));

      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error(`Error ${action}ing transfer:`, error);
      toast.error(`Failed to ${action} transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };

  const openCompleteModal = () => {
    // Check access before opening modal
    if (!hasDestinationAccess) {
      toast.error('You do not have access to the destination location. You can only complete transfers to your assigned store or showroom.');
      return;
    }
    setIsCompleteModalOpen(true);
  };

  const openCancelModal = () => {
    setIsCancelModalOpen(true);
  };

  // Get location icon based on type
  const getLocationIcon = (type: TransferEntityType) => {
    return type === TransferEntityType.STORE ? 
      <Store className="h-4 w-4" /> : 
      <Building2 className="h-4 w-4" />;
  };

  // Get location display name
  const getLocationName = (transfer: ITransfer, isSource: boolean) => {
    if (isSource) {
      if (transfer.sourceType === TransferEntityType.STORE) {
        return transfer.sourceStore?.name || 'Unknown Store';
      } else {
        return transfer.sourceShowroom?.name || 'Unknown Showroom';
      }
    } else {
      if (transfer.destinationType === TransferEntityType.STORE) {
        return transfer.destStore?.name || 'Unknown Store';
      } else {
        return transfer.destShowroom?.name || 'Unknown Showroom';
      }
    }
  };

  // Show loading states
  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='mr-2 h-8 w-8 animate-spin' />
        <p>Loading transfer details...</p>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='mx-auto h-12 w-12 text-gray-400' />
          <p className='mt-2 text-lg font-semibold'>Transfer not found</p>
          <p className='text-sm text-gray-500'>The transfer you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        </div>
      </div>
    );
  }

  // Calculate total quantity
  const totalQuantity = transfer.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  // Check if transfer is completed or cancelled
  const isImmutable = transfer.status === TransferStatus.COMPLETED || transfer.status === TransferStatus.CANCELLED;

  // Determine if user can complete the transfer
  const canComplete = !isImmutable && hasDestinationAccess;

  return (
    <div className='container mx-auto space-y-6 p-4 md:p-8'>
      {/* Confirmation Modals */}
      <AlertModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        onConfirm={() => handleStatusUpdate('complete')}
        loading={updating}
        title='Complete Transfer'
        description={`Are you sure you want to complete this transfer to ${getLocationName(transfer, false)}? This will update inventory levels and cannot be undone.`}
        confirmText='Complete Transfer'
        cancelText='Cancel'
        variant='default'
      />

      <AlertModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={() => handleStatusUpdate('cancel')}
        loading={updating}
        title='Cancel Transfer'
        description='Are you sure you want to cancel this transfer? This action cannot be undone.'
        confirmText='Cancel Transfer'
        cancelText='Go Back'
        variant='destructive'
      />



      {/* Transfer Status Update Section */}
      {!isImmutable && (
        <Card className='shadow-lg'>
          <CardHeader>
            <CardTitle className='text-xl font-bold'>Update Transfer Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center'>
                <div className='flex w-full gap-2 sm:w-auto'>
                  {/* Complete Transfer Button */}
                  <PermissionGuard
                    requiredPermission={PERMISSIONS.TRANSFER.COMPLETE.name}
                  >
                    <Button
                      onClick={openCompleteModal}
                      disabled={updating || !canComplete}
                      className={`w-full sm:w-auto ${
                        canComplete 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                      title={!canComplete ? 'You do not have access to the destination location' : ''}
                    >
                      {updating ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Completing...
                        </>
                      ) : (
                        <>
                          <Check className='mr-2 h-4 w-4' />
                          Complete Transfer to {getLocationName(transfer, false)}
                        </>
                      )}
                    </Button>
                  </PermissionGuard>

                  {/* Cancel Transfer Button */}
                  <PermissionGuard
                    requiredPermission={PERMISSIONS.TRANSFER.CANCEL.name}
                  >
                    <Button
                      variant='destructive'
                      onClick={openCancelModal}
                      disabled={updating}
                      className='w-full sm:w-auto'
                    >
                      {updating ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <X className='mr-2 h-4 w-4' />
                          Cancel Transfer
                        </>
                      )}
                    </Button>
                  </PermissionGuard>
                </div>

                {selectedStatus && selectedStatus !== transfer.status && (
                  <Badge variant='outline' className='ml-2'>
                    Changing from {transfer.status} to {selectedStatus}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-2 text-2xl font-bold'>
            <ArrowRightLeft className='text-primary' />
            Transfer {transfer.reference || transfer.shortCode}
            <Badge
              variant={
                transfer.status === TransferStatus.COMPLETED
                  ? 'default'
                  : transfer.status === TransferStatus.CANCELLED
                    ? 'destructive'
                    : 'secondary'
              }
              className='ml-2'
            >
              {transfer.status === TransferStatus.COMPLETED ? (
                <>
                  <Check className='mr-1 h-3 w-3' /> {transfer.status}
                </>
              ) : transfer.status === TransferStatus.CANCELLED ? (
                <>
                  <X className='mr-1 h-3 w-3' /> {transfer.status}
                </>
              ) : (
                <>
                  <Circle className='mr-1 h-3 w-3' /> {transfer.status}
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {/* Transfer Details */}
            <div className='space-y-4'>
              <h3 className='flex items-center gap-2 text-lg font-semibold'>
                <Info className='text-primary h-5 w-5' />
                Transfer Information
              </h3>
              <div className='space-y-3'>
                <div className='flex items-start gap-2'>
                  <Package className='text-muted-foreground h-4 w-4 mt-0.5' />
                  <div>
                    <span className='font-medium'>Reference:</span>{' '}
                    {transfer.reference || transfer.shortCode || 'N/A'}
                  </div>
                </div>
                
                {/* Source Location */}
                <div className='flex items-start gap-2'>
                  {getLocationIcon(transfer.sourceType)}
                  <div>
                    <span className='font-medium'>Source:</span>{' '}
                    {getLocationName(transfer, true)}
                    <Badge variant="outline" className='ml-2 text-xs'>
                      {transfer.sourceType}
                    </Badge>
                  </div>
                </div>
                
                {/* Destination Location */}
                <div className='flex items-start gap-2'>
                  {getLocationIcon(transfer.destinationType)}
                  <div>
                    <span className='font-medium'>Destination:</span>{' '}
                    {getLocationName(transfer, false)}
                    <Badge variant="outline" className='ml-2 text-xs'>
                      {transfer.destinationType}
                    </Badge>
                    {!hasDestinationAccess && transfer.status === TransferStatus.PENDING && (
                      <Badge variant="destructive" className='ml-2 text-xs'>
                        No Access
                      </Badge>
                    )}
                    {hasDestinationAccess && transfer.status === TransferStatus.PENDING && (
                      <Badge variant="default" className='ml-2 text-xs bg-green-500'>
                        Has Access
                      </Badge>
                    )}
                  </div>
                </div>
                
                {transfer.createdBy && (
                  <div className='flex items-start gap-2'>
                    <User className='text-muted-foreground h-4 w-4 mt-0.5' />
                    <div>
                      <span className='font-medium'>Initiated By:</span>{' '}
                      {transfer.createdBy.name ?? 'Unknown Employee'}
                    </div>
                  </div>
                )}
                
                {transfer.updatedBy && transfer.status !== TransferStatus.PENDING && (
                  <div className='flex items-start gap-2'>
                    <User className='text-muted-foreground h-4 w-4 mt-0.5' />
                    <div>
                      <span className='font-medium'>
                        {transfer.status === TransferStatus.COMPLETED ? 'Completed By:' : 'Cancelled By:'}
                      </span>{' '}
                      {transfer.updatedBy.name ?? ''}
                    </div>
                  </div>
                )}
                
                {transfer.notes && (
                  <div className='flex items-start gap-2'>
                    <Info className='text-muted-foreground h-4 w-4 mt-0.5' />
                    <div>
                      <span className='font-medium'>Notes:</span>
                      <p className='text-muted-foreground mt-1'>{transfer.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date Details */}
            <div className='space-y-4'>
              <h3 className='flex items-center gap-2 text-lg font-semibold'>
                <Calendar className='text-primary h-5 w-5' />
                Date Details
              </h3>
              <div className='space-y-3'>
                <div>
                  <p className='font-medium'>Created At:</p>
                  <p className='text-muted-foreground'>
                    {formatDate(transfer.createdAt)}
                  </p>
                </div>
                <div>
                  <p className='font-medium'>Last Updated:</p>
                  <p className='text-muted-foreground'>
                    {formatDate(transfer.updatedAt)}
                  </p>
                </div>
                {transfer.movementDate && (
                  <div>
                    <p className='font-medium'>Movement Date:</p>
                    <p className='text-muted-foreground'>
                      {formatDate(transfer.movementDate)}
                    </p>
                  </div>
                )}
                <div className='pt-2 border-t'>
                  <div className='flex items-center gap-2'>
                    <Package className='text-muted-foreground h-4 w-4' />
                    <p>
                      <span className='font-medium'>Total Items:</span>{' '}
                      {transfer.items?.length || 0}
                    </p>
                  </div>
                  <div className='flex items-center gap-2 mt-1'>
                    <Package className='text-muted-foreground h-4 w-4' />
                    <p>
                      <span className='font-medium'>Total Quantity:</span>{' '}
                      {totalQuantity}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Items Table Section */}
          {transfer.items && transfer.items.length > 0 && (
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Transfer Items</h3>
              
              {/* Desktop Table */}
              <div className='hidden md:block overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Product/Material</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfer.items.map((item: ITransferItem) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant={item.ismaterial ? 'secondary' : 'default'}>
                            {item.ismaterial ? 'Material' : 'Item'}
                          </Badge>
                        </TableCell>
                        <TableCell className='font-medium'>
                          {item.ismaterial 
                            ? item.material?.name || 'Unknown Material'
                            : item.item?.name || 'Unknown Item'}
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          {item.ismaterial && item.material && (
                            <div>
                              {item.material.color && <span>Color: {item.material.color}</span>}
                              {item.material.size && <span className='ml-2'>Size: {item.material.size}</span>}
                              {item.material.materialType?.name && <span className='ml-2'>Type: {item.material.materialType.name}</span>}
                            </div>
                          )}
                          {!item.ismaterial && item.item && (
                            <div>
                              {item.item.color && <span>Color: {item.item.color}</span>}
                              {item.item.size?.name && <span className='ml-2'>Size: {item.item.size.name}</span>}
                              {item.item.category?.name && <span className='ml-2'>Category: {item.item.category.name}</span>}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className='font-semibold'>{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className='md:hidden space-y-3'>
                {transfer.items.map((item: ITransferItem) => (
                  <div 
                    key={item.id} 
                    className='bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-sm'
                  >
                    <div className='flex justify-between items-start mb-2'>
                      <Badge variant={item.ismaterial ? 'secondary' : 'default'}>
                        {item.ismaterial ? 'Material' : 'Item'}
                      </Badge>
                      <span className='font-semibold text-lg'>Qty: {item.quantity}</span>
                    </div>
                    <p className='font-medium text-base'>
                      {item.ismaterial 
                        ? item.material?.name || 'Unknown Material'
                        : item.item?.name || 'Unknown Item'}
                    </p>
                    {(item.ismaterial && item.material) && (
                      <div className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                        {item.material.color && <div>Color: {item.material.color}</div>}
                        {item.material.size && <div>Size: {item.material.size}</div>}
                        {item.material.materialType?.name && <div>Type: {item.material.materialType.name}</div>}
                      </div>
                    )}
                    {(!item.ismaterial && item.item) && (
                      <div className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                        {item.item.color && <div>Color: {item.item.color}</div>}
                        {item.item.size?.name && <div>Size: {item.item.size.name}</div>}
                        {item.item.category?.name && <div>Category: {item.item.category.name}</div>}
                      </div>
                    )}
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

export default TransferDetailPage;