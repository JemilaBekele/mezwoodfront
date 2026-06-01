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

import { IconEdit, IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ITransfer } from '@/models/transfer';
import { deleteTransfer } from '@/service/transfer';
import { Edit } from 'lucide-react';

interface TransferCellActionProps {
  data: ITransfer;
}

export const TransferCellAction: React.FC<TransferCellActionProps> = ({
  data
}) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    if (!data?.id) {
      toast.error('Transfer ID is missing. Cannot delete transfer.');
      return;
    }

    setLoading(true);
    try {
      await deleteTransfer(data.id);
      setOpen(false);
      router.refresh();
      toast.success('Transfer deleted successfully');
    } catch {
      toast.error('Error deleting transfer. Please try again.');
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
          {data.status !== 'COMPLETED' && (
            <PermissionGuard
              requiredPermission={PERMISSIONS.TRANSFER.UPDATE.name}
            >
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/Transfer/${data.id}`)}
              >
                <IconEdit className='mr-2 h-4 w-4' /> Update
              </DropdownMenuItem>
            </PermissionGuard>
          )}

          <DropdownMenuItem
            onClick={() =>
              router.push(`/dashboard/Transfer/view?id=${data.id}`)
            }
          >
            <Edit className='mr-2 h-4 w-4' /> View
          </DropdownMenuItem>
          {data.status !== 'COMPLETED' && (
            <PermissionGuard
              requiredPermission={PERMISSIONS.TRANSFER.DELETE.name}
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
