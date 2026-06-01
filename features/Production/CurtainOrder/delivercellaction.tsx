/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';


import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import { IconDotsVertical, IconEdit } from '@tabler/icons-react';
import { IconCheck, IconRotateClockwise } from '@tabler/icons-react';

import { ICurtainOrder, CurtainStatus } from '@/models/curtainType';
import { updateCurtainOrderStatus } from '@/service/Curtain';

interface CurtainOrderCellActionProps {
  data: ICurtainOrder;
  onStatusUpdate?: () => void;
}

export const DeliverCurtainOrderCellAction: React.FC<CurtainOrderCellActionProps> = ({
  data,
  onStatusUpdate
}) => {
  const [openFinishModal, setOpenFinishModal] = useState(false);
  const [openReturnModal, setOpenReturnModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();


  const handleUpdateStatus = async (status: CurtainStatus) => {
    if (!data?.id) return;

    // Validation for FINISHED status
    if (status === 'FINISHED') {
      if (!data.measurements || data.measurements.length === 0) {
        toast.error('Cannot mark as finished without measurements');
        return;
      }
      
   
    
    }

    // Validation for RETURNED status
    if (status === 'RETURNED' && !statusNote.trim()) {
      toast.error('Please provide a reason for returning the order');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        curtainStatus: status,
      };
      
      if (statusNote) {
        payload.curtainstatusnote = statusNote;
      }
      
      await updateCurtainOrderStatus(data.id, payload);
      toast.success(`Order marked as ${status.toLowerCase()} successfully`);
      
      // Reset form
      setStatusNote('');
      
      // Close modal
      if (status === 'FINISHED') {
        setOpenFinishModal(false);
      } else if (status === 'RETURNED') {
        setOpenReturnModal(false);
      }
      
      // Refresh data
      if (onStatusUpdate) {
        onStatusUpdate();
      }
      router.refresh();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || `Failed to update status to ${status.toLowerCase()}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Check if order can be finished (not already finished or returned)
  const canFinish = data.curtainStatus !== 'FINISHED' && data.curtainStatus !== 'RETURNED';
  const canReturn = data.curtainStatus !== 'FINISHED' && data.curtainStatus !== 'RETURNED' && data.curtainStatus !== 'CANCELLED';

  return (
    <>
  
      {/* Finish Modal */}
      <Modal
        isOpen={openFinishModal}
        onClose={() => {
          setOpenFinishModal(false);
          setStatusNote('');
        }}
        title="Mark as Finished"
        description="Confirm that this order is complete and ready"
        size="md"
      >
        <div className="space-y-4 py-4">
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-900/40">
            <p className="text-sm text-green-700 dark:text-green-300">
              This action will mark the order as FINISHED. This means all work has been completed and the order is ready for delivery or pickup.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="finishNote">Note (Optional)</Label>
            <Textarea
              id="finishNote"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Add any notes about the completion..."
              rows={3}
              className="text-sm"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setOpenFinishModal(false);
                setStatusNote('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleUpdateStatus('FINISHED')} 
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <IconCheck className="mr-2 h-4 w-4" />
                  Mark as Finished
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={openReturnModal}
        onClose={() => {
          setOpenReturnModal(false);
          setStatusNote('');
        }}
        title="Mark as Returned"
        description="Provide a reason for returning this order"
        size="md"
      >
        <div className="space-y-4 py-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900/40">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This action will mark the order as RETURNED. Please provide a reason for the return.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="returnReason">Return Reason <span className="text-red-500">*</span></Label>
            <Textarea
              id="returnReason"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Please explain why this order is being returned..."
              rows={4}
              className="text-sm"
              required
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setOpenReturnModal(false);
                setStatusNote('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleUpdateStatus('RETURNED')} 
              disabled={submitting || !statusNote.trim()}
              variant="destructive"
            >
              {submitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <IconRotateClockwise className="mr-2 h-4 w-4" />
                  Mark as Returned
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Actions Dropdown */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

      

          <PermissionGuard requiredPermission={PERMISSIONS.CURTAIN_ORDER.VIEW.name}>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/CurtainOrder/view?id=${data.id}`)
              }
            >
              <IconEdit className='mr-2 h-4 w-4' /> View
            </DropdownMenuItem>
          </PermissionGuard>

          {/* Finish Action */}
          {canFinish && (
            <PermissionGuard requiredPermission={PERMISSIONS.CURTAIN_ORDER.UPDATE.name}>
              <DropdownMenuItem 
                onClick={() => setOpenFinishModal(true)}
                className="text-green-600 focus:text-green-600"
              >
                <IconCheck className='mr-2 h-4 w-4' />
                Finish
              </DropdownMenuItem>
            </PermissionGuard>
          )}

          {/* Return Action */}
          {canReturn && (
            <PermissionGuard requiredPermission={PERMISSIONS.CURTAIN_ORDER.UPDATE.name}>
              <DropdownMenuItem 
                onClick={() => setOpenReturnModal(true)}
                className="text-amber-600 focus:text-amber-600"
              >
                <IconRotateClockwise className='mr-2 h-4 w-4' />
                Return
              </DropdownMenuItem>
            </PermissionGuard>
          )}

        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};