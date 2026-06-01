'use client';

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

import {
  IconEdit,
  IconDotsVertical,
  IconTrash,
  IconEye
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { IStockCorrection } from '@/models/StockCorrection';
import { deleteStockCorrection } from '@/service/StockCorrection';

interface StockCorrectionCellActionProps {
  data: IStockCorrection;
}

export const StockCorrectionCellAction: React.FC<
  StockCorrectionCellActionProps
> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    if (!data?.id) {
      toast.error('Stock Correction ID is missing. Cannot delete record.');
      return;
    }

    setLoading(true);
    try {
      await deleteStockCorrection(data.id);
      setOpen(false);
      router.refresh();
      toast.success('Stock correction deleted successfully');
    } catch  {
      toast.error('Error deleting stock correction. Please try again.');
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
          {data.status !== 'APPROVED' && (
            <>
            <PermissionGuard
              requiredPermission={PERMISSIONS.STOCK_CORRECTION.UPDATE.name}
            >
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/StockCorrection/${data.id}`)
                }
              >
                <IconEdit className='mr-2 h-4 w-4' /> Update
              </DropdownMenuItem>
</PermissionGuard>
               <PermissionGuard
              requiredPermission={PERMISSIONS.STOCK_CORRECTION.VIEW.name}
            >
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/StockCorrection/view?id=${data.id}`)
                }
              >
                <IconEye className='mr-2 h-4 w-4' /> View
              </DropdownMenuItem>
            </PermissionGuard></>
          )}
          <PermissionGuard
            requiredPermission={PERMISSIONS.STOCK_CORRECTION.DELETE.name}
          >
            <DropdownMenuItem onClick={() => setOpen(true)}>
              <IconTrash className='mr-2 h-4 w-4' /> Delete
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
