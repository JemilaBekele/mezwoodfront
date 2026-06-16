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

import {
  deleteMaterialCategory, IMaterialCategory
} from '@/service/materialcatagory'; // updated service
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import { IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { IconEdit } from '@tabler/icons-react';
import MaterialCategoryForm from '../form';

interface MaterialCategoryCellActionProps {
  data: IMaterialCategory;
}

export const MaterialCategoryCellAction: React.FC<MaterialCategoryCellActionProps> = ({
  data
}) => {
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const router = useRouter();

  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Category ID is missing. Cannot delete category.');
      return;
    }

    setLoading(true);
    try {
      await deleteMaterialCategory(data.id);
      toast.success('Material category deleted successfully');
      router.refresh();
      setOpenDeleteModal(false);
    } catch {
      toast.error('Error deleting material category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Delete confirmation modal */}
      <AlertModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
      />

      {/* Edit category modal */}
      <Modal
        title='Edit Material Category'
        description='Update the material category details below.'
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <MaterialCategoryForm
          initialData={data}
          isEdit={true}
          closeModal={() => setOpenEditModal(false)}
        />
      </Modal>

      {/* Action dropdown */}
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
            requiredPermission={PERMISSIONS.MATERIAL_CATEGORY.UPDATE.name}
          >
            <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
              <IconEdit className='mr-2 h-4 w-4' /> Update
            </DropdownMenuItem>
          </PermissionGuard>
          <PermissionGuard
            requiredPermission={PERMISSIONS.MATERIAL_CATEGORY.DELETE.name}
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
