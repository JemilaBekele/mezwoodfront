'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import { IconEdit, IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { deletePurchase } from '@/service/purchase';
import { IPurchase } from '@/models/purchase';
import { Edit } from 'lucide-react';

interface CellActionProps {
  data: IPurchase;
}

export const PurchaseCellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    if (!data?.id) {
      toast.error('Purchase ID is missing. Cannot delete.');
      return;
    }

    setLoading(true);
    try {
      await deletePurchase(data.id);
      setOpen(false);
      router.refresh();
      toast.success('Purchase deleted successfully');
    } catch  {
      toast.error('Error deleting purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {data.paymentStatus !== 'APPROVED' && (
            <PermissionGuard
              requiredPermission={PERMISSIONS.PURCHASE.UPDATE.name}
            >
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/purchase/${data.id}`)}
              >
                <IconEdit className='mr-2 h-4 w-4' /> Update
              </DropdownMenuItem>
            </PermissionGuard>
          )}

          <DropdownMenuItem
            onClick={() =>
              router.push(`/dashboard/purchase/view?id=${data.id}`)
            }
          >
            <Edit className='mr-2 h-4 w-4' /> View
          </DropdownMenuItem>
          {data.paymentStatus === 'APPROVED' && (
            <PermissionGuard
              requiredPermission={PERMISSIONS.STOCK_CORRECTION.CREATE.name}
            >
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/dashboard/purchase/StockCorrection?id=${data.id}`
                  )
                }
              >
                <Edit className='mr-2 h-4 w-4' /> Stock Correction
              </DropdownMenuItem>
            </PermissionGuard>
          )}
          {data.paymentStatus !== 'APPROVED' && (
            <PermissionGuard
              requiredPermission={PERMISSIONS.PURCHASE.DELETE.name}
            >
              <DropdownMenuItem onClick={() => setOpen(true)}>
                <IconTrash className='mr-2 h-4 w-4' /> Delete
              </DropdownMenuItem>
            </PermissionGuard>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
