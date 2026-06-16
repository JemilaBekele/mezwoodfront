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
import { AlertModal } from '@/components/modal/alert-modal';

import { IItem } from '@/models/item';
import { deleteItem } from '@/service/item';

import { IconDotsVertical, IconEye, IconTrash } from '@tabler/icons-react';
import { Edit } from 'lucide-react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

interface CellActionProps {
  data: IItem;
}

export const ItemCellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const router = useRouter();

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Item ID is missing. Cannot delete.');
      return;
    }

    setLoading(true);
    try {
      await deleteItem(data.id);
      toast.success('Item deleted successfully');
      router.refresh();
      setOpenDeleteModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Error deleting item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Delete confirmation */}
      <AlertModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
      />



      {/* Actions dropdown */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <PermissionGuard requiredPermission={PERMISSIONS.PRODUCT.UPDATE.name}>
    <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/Item/${data.id}`)
              }
            >            <Edit className="mr-2 h-4 w-4" />
            Update
          </DropdownMenuItem></PermissionGuard>

                    <PermissionGuard requiredPermission={PERMISSIONS.PRODUCT.VIEW.name}>


   <DropdownMenuItem
              onClick={() => router.push(`/dashboard/Item/view?id=${data.id}`)}
            >
              <IconEye className='mr-2 h-4 w-4' /> View
            </DropdownMenuItem></PermissionGuard>

                      <PermissionGuard requiredPermission={PERMISSIONS.PRODUCT.DELETE.name}>

          <DropdownMenuItem onClick={() => setOpenDeleteModal(true)}>
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem></PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
