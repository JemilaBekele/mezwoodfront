'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { deleteProformaInvoice } from '@/service/ProformaInvoice';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import { Eye, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { IProformaInvoice } from '@/models/ProformaInvoice';

interface ProformaInvoiceCellActionProps {
  data: IProformaInvoice;
}

export const ProformaInvoiceCellAction: React.FC<ProformaInvoiceCellActionProps> = ({
  data
}) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    if (!data?.id) {
      toast.error('Proforma Invoice ID is missing. Cannot delete.');
      return;
    }

    setLoading(true);
    try {
      await deleteProformaInvoice(data.id);
      setOpen(false);
      router.refresh();
      toast.success('Proforma Invoice deleted successfully');
    } catch {
      toast.error('Error deleting Proforma Invoice. Please try again.');
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
          <Button variant='ghost' className='h-7 w-7 p-0 data-[state=open]:bg-muted'>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4 text-muted-foreground' />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end' className='w-36'>
          <PermissionGuard requiredPermission={PERMISSIONS.PROFORMA_INVOICE.VIEW.name}>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/ProformaInvoice/view?id=${data.id}`)}
              className='gap-2 text-sm'
            >
              <Eye className='h-3.5 w-3.5 text-muted-foreground' />
              View
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard requiredPermission={PERMISSIONS.PROFORMA_INVOICE.UPDATE.name}>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/ProformaInvoice/${data.id}`)}
              className='gap-2 text-sm'
            >
              <Pencil className='h-3.5 w-3.5 text-muted-foreground' />
              Edit
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard requiredPermission={PERMISSIONS.PROFORMA_INVOICE.DELETE.name}>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setOpen(true)}
              className='gap-2 text-sm text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400'
            >
              <Trash2 className='h-3.5 w-3.5' />
              Delete
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
