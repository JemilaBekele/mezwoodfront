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
import { AlertModal } from '@/components/modal/alert-modal';

import { deleteType } from '@/service/productConfiguration';
import { IProductType } from '@/models/productConfiguration';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import { IconDotsVertical, IconTrash, IconEdit } from '@tabler/icons-react';
import ProductTypeForm from '../form';

interface ProductTypeCellActionProps {
  data: IProductType;
}

export const ProductTypeCellAction: React.FC<
  ProductTypeCellActionProps
> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const router = useRouter();

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Product Type ID is missing.');
      return;
    }

    setLoading(true);
    try {
      await deleteType(data.id);
      toast.success('Product type deleted successfully');
      router.refresh();
      setOpenDeleteModal(false);
    } catch {
      toast.error('Error deleting product type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Delete Modal */}
      <AlertModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
      />

      {/* Edit Modal */}
      <Modal
        title='Edit Product Type'
        description='Update the product type details below.'
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <ProductTypeForm
          initialData={data}
          isEdit={true}
          closeModal={() => setOpenEditModal(false)}
        />
      </Modal>

      {/* Actions */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <PermissionGuard
            requiredPermission={PERMISSIONS.PRODUCT_TYPE.UPDATE.name}
          >
            <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
              <IconEdit className='mr-2 h-4 w-4' /> Update
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard
            requiredPermission={PERMISSIONS.PRODUCT_TYPE.DELETE.name}
          >
            <DropdownMenuItem onClick={() => setOpenDeleteModal(true)}>
              <IconTrash className='mr-2 h-4 w-4' /> Delete
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};