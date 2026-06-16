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

import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';


import { IconDotsVertical, IconTrash, IconEdit } from '@tabler/icons-react';
import ProductCategoryForm from '../form';
import { IProductCategory } from '@/models/productConfiguration';
import { deleteCategory } from '@/service/productConfiguration';

interface ProductCategoryCellActionProps {
  data: IProductCategory;
}

export const ProductCategoryCellAction: React.FC<
  ProductCategoryCellActionProps
> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const router = useRouter();

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Product Category ID is missing.');
      return;
    }

    setLoading(true);
    try {
      await deleteCategory(data.id);
      toast.success('Product category deleted successfully');
      router.refresh();
      setOpenDeleteModal(false);
    } catch {
      toast.error('Error deleting product category');
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
        title='Edit Product Category'
        description='Update product category details.'
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <ProductCategoryForm
          initialData={data}
          isEdit={true}
          closeModal={() => setOpenEditModal(false)}
        />
      </Modal>

      {/* Dropdown */}
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
            requiredPermission={PERMISSIONS.PRODUCT_CATEGORY.UPDATE.name}
          >
            <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
              <IconEdit className='mr-2 h-4 w-4' /> Update
            </DropdownMenuItem>
          </PermissionGuard>

          <PermissionGuard
            requiredPermission={PERMISSIONS.PRODUCT_CATEGORY.DELETE.name}
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